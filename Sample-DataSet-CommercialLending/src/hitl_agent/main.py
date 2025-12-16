"""
HITL (Human-in-the-Loop) Agent - Manages approval of mapping candidates.
Refactored to support both web-based (Firestore) and CLI-based approval.
Enhanced with detailed logging for debugging and monitoring.
Supports confidence threshold filtering - only low-confidence mappings require approval.
"""

import os
import time
from typing import Optional, List, Tuple
from src.core_tools.logger import AgentLogger
from src.core_tools.vertex_ai import VertexAI

# Initialize logger
logger = AgentLogger("HITLAgent")

# Default confidence threshold (mappings below this require human approval)
DEFAULT_CONFIDENCE_THRESHOLD = 0.95


def _generate_llm_rationale(mapping: dict) -> str:
    """
    Generate a rationale for a mapping using LLM based on column descriptions.

    Args:
        mapping: Mapping candidate with source/target descriptions

    Returns:
        LLM-generated rationale explaining the mapping
    """
    try:
        # Get column descriptions
        source_col = mapping.get("source_column", "")
        source_desc = mapping.get("source_description", "")
        target_col = mapping.get("target_column", "")
        target_desc = mapping.get("target_description", "")

        # If descriptions are missing, return a basic rationale
        if not source_desc and not target_desc:
            return "Mapping based on semantic column name similarity."

        # Create prompt for LLM
        prompt = f"""Analyze the following column mapping and explain why it makes sense (or doesn't) based on the column descriptions.

Source Column: {source_col}
Source Description: {source_desc if source_desc else "No description provided"}

Target Column: {target_col}
Target Description: {target_desc if target_desc else "No description provided"}

Provide a concise 1-2 sentence explanation of why this mapping is appropriate or what concerns exist. Focus on the semantic meaning and business logic based on the descriptions."""

        # Initialize Vertex AI
        project_id = os.getenv("GCP_PROJECT_ID")
        region = os.getenv("GCP_REGION", "us-central1")
        vertex_ai = VertexAI(project_id=project_id, location=region)

        # Generate rationale using LLM
        rationale = vertex_ai.generate_text(prompt)

        logger.debug(f"Generated LLM rationale for {source_col} -> {target_col}")
        return rationale.strip()

    except Exception as e:
        logger.warning(f"Failed to generate LLM rationale: {str(e)}")
        # Fallback to basic rationale
        return f"Mapping based on semantic similarity between {mapping.get('source_column', 'source')} and {mapping.get('target_column', 'target')}."


def run_hitl(run_id: str, mapping_candidates: list, hitl_store=None, websocket_broadcast=None):
    """
    Manages the Human-in-the-Loop validation process.
    Supports both web-based approval (via Firestore) and CLI fallback.
    Only mappings below the confidence threshold require human approval.

    Args:
        run_id: The unique identifier for this workflow run.
        mapping_candidates: The list of mapping candidates from the Mapper Agent.
        hitl_store: HITLStateStore instance for web-based approval (optional).
        websocket_broadcast: Function to broadcast messages via WebSocket (optional).

    Returns:
        A list of approved mappings.
    """
    logger.set_run_id(run_id)
    start_time = time.time()
    
    # Get confidence threshold from environment
    confidence_threshold = float(os.getenv("HITL_CONFIDENCE_THRESHOLD", str(DEFAULT_CONFIDENCE_THRESHOLD)))
    
    logger.header("HITL AGENT")
    logger.info("Starting Human-in-the-Loop validation process", data={
        "candidates": len(mapping_candidates),
        "confidence_threshold": f"{confidence_threshold:.0%}",
        "web_mode": hitl_store is not None
    })

    if not mapping_candidates:
        logger.warning("No mapping candidates to review - returning empty list")
        return []

    # Split mappings into auto-approved (high confidence) and needs-review (low confidence)
    auto_approved, needs_review = _filter_by_confidence(mapping_candidates, confidence_threshold)
    
    logger.info(f"Confidence filtering results", data={
        "auto_approved": len(auto_approved),
        "needs_review": len(needs_review),
        "threshold": f"{confidence_threshold:.0%}"
    })

    # If no mappings need review, return all auto-approved
    if not needs_review:
        logger.success("All mappings above confidence threshold - auto-approved")
        return auto_approved + needs_review  # Just return all

    # Generate LLM rationales for mappings that need review
    logger.info("Generating LLM rationales for low-confidence mappings...")
    for mapping in needs_review:
        # Generate LLM-based rationale using column descriptions
        llm_rationale = _generate_llm_rationale(mapping)
        mapping['rationale'] = llm_rationale

        logger.info(f"Requires review: {mapping.get('source_column')} -> {mapping.get('target_column')}", data={
            "confidence": f"{mapping.get('confidence', 0):.2%}",
            "rationale": llm_rationale[:100] + "..." if len(llm_rationale) > 100 else llm_rationale
        })

    # Determine approval method for low-confidence mappings
    if hitl_store:
        logger.info("Using web-based approval via Firestore")
        reviewed_mappings = _wait_for_web_approvals(run_id, needs_review, hitl_store, websocket_broadcast)
    else:
        logger.info("Using CLI-based approval (fallback mode)")
        reviewed_mappings = _cli_approval(run_id, needs_review)

    # Combine auto-approved and human-reviewed approved mappings
    result = auto_approved + reviewed_mappings

    duration_ms = int((time.time() - start_time) * 1000)
    logger.separator()
    logger.success("HITL process completed", data={
        "auto_approved": len(auto_approved),
        "human_approved": len(reviewed_mappings),
        "total_approved": len(result),
        "total_rejected": len(needs_review) - len(reviewed_mappings),
        "duration_ms": duration_ms
    })
    
    return result


def _filter_by_confidence(mappings: list, threshold: float) -> Tuple[List[dict], List[dict]]:
    """
    Filter mappings by confidence threshold.
    
    Args:
        mappings: List of mapping candidates
        threshold: Confidence threshold (0.0 - 1.0)
    
    Returns:
        Tuple of (auto_approved_list, needs_review_list)
    """
    auto_approved = []
    needs_review = []
    
    for mapping in mappings:
        confidence = mapping.get("confidence", 0.0)
        if confidence >= threshold:
            auto_approved.append(mapping)
            logger.debug(f"Auto-approved: {mapping.get('source_column')} (confidence: {confidence:.2%})")
        else:
            needs_review.append(mapping)
            logger.debug(f"Needs review: {mapping.get('source_column')} (confidence: {confidence:.2%})")
    
    return auto_approved, needs_review


def _wait_for_web_approvals(run_id: str, mapping_candidates: list, hitl_store, websocket_broadcast=None, timeout: int = 3600):
    """
    Wait for web-based approvals via Firestore.
    Polls Firestore every 2 seconds until all mappings are reviewed or timeout.
    Broadcasts waiting status and mappings via WebSocket for UI display.

    Args:
        run_id: Workflow run identifier
        mapping_candidates: List of mapping candidates requiring review
        hitl_store: HITLStateStore instance
        websocket_broadcast: Function to broadcast messages via WebSocket
        timeout: Maximum wait time in seconds (default: 1 hour)

    Returns:
        List of approved mappings
    """
    logger.info(f"Waiting for web-based approval", data={
        "mappings": len(mapping_candidates),
        "timeout_seconds": timeout,
        "timeout_minutes": timeout // 60
    })

    # Store mappings in Firestore for web-based approval
    hitl_store.store_hitl_mappings(run_id, mapping_candidates)
    logger.info(f"Stored {len(mapping_candidates)} mappings in Firestore for approval")

    # Broadcast to UI that we're waiting for approval
    if websocket_broadcast:
        # Add mapping_id to each candidate for tracking
        mappings_with_ids = []
        for idx, mapping in enumerate(mapping_candidates):
            mapping_with_id = {
                **mapping,
                "mapping_id": str(idx),
                "status": "pending"
            }
            mappings_with_ids.append(mapping_with_id)
        
        websocket_broadcast({
            "type": "hitl_approval_required",
            "step": "hitl",
            "status": "waiting_for_approval",
            "message": f"⚠️ {len(mapping_candidates)} mapping(s) require human approval (confidence below threshold)",
            "data": {
                "mappings": mappings_with_ids,
                "count": len(mapping_candidates),
                "timeout_seconds": timeout
            }
        })
        logger.info("Broadcasted HITL approval request to UI")

    elapsed_time = 0
    poll_interval = 2  # Poll every 2 seconds
    last_pending_count = len(mapping_candidates)

    while elapsed_time < timeout:
        # Check if all mappings have been reviewed
        if hitl_store.all_mappings_reviewed(run_id):
            logger.success("All mappings have been reviewed!")
            if websocket_broadcast:
                websocket_broadcast({
                    "type": "hitl_approval_complete",
                    "step": "hitl",
                    "status": "completed",
                    "message": "All mappings have been reviewed!"
                })
            break

        # Wait before next poll
        time.sleep(poll_interval)
        elapsed_time += poll_interval

        # Check progress every 10 seconds
        if elapsed_time % 10 == 0:
            pending = hitl_store.get_pending_mappings(run_id)
            pending_count = len(pending)
            
            if pending_count != last_pending_count:
                reviewed = last_pending_count - pending_count
                logger.info(f"Progress update: {reviewed} mapping(s) reviewed", data={
                    "pending": pending_count,
                    "elapsed_seconds": elapsed_time
                })
                
                # Broadcast progress update
                if websocket_broadcast:
                    websocket_broadcast({
                        "type": "hitl_progress",
                        "step": "hitl",
                        "status": "in_progress",
                        "message": f"{reviewed} mapping(s) reviewed, {pending_count} remaining",
                        "data": {"pending": pending_count, "reviewed": reviewed}
                    })
                
                last_pending_count = pending_count
            elif elapsed_time % 30 == 0:
                logger.debug(f"Still waiting for approvals", data={
                    "pending": pending_count,
                    "elapsed_seconds": elapsed_time
                })

    # Check timeout
    if elapsed_time >= timeout:
        logger.warning(f"Timeout reached after {timeout} seconds")
        logger.warning("Proceeding with currently approved mappings")
        if websocket_broadcast:
            websocket_broadcast({
                "type": "hitl_timeout",
                "step": "hitl",
                "status": "timeout",
                "message": f"Timeout reached after {timeout // 60} minutes. Proceeding with approved mappings."
            })

    # Retrieve approved mappings
    logger.info("Retrieving approved mappings from Firestore")
    approved_mappings_data = hitl_store.get_approved_mappings(run_id)

    # Convert back to original format
    approved_mappings = []
    for mapping_data in approved_mappings_data:
        approved_mappings.append({
            "source_table": mapping_data.get("source_table", ""),
            "source_column": mapping_data.get("source_column", ""),
            "target_table": mapping_data.get("target_table", ""),
            "target_column": mapping_data.get("target_column", ""),
            "confidence": mapping_data.get("confidence", 0.0),
            "rationale": mapping_data.get("rationale", "")
        })

    logger.success(f"Retrieved {len(approved_mappings)} approved mappings")
    return approved_mappings


def _cli_approval(run_id: str, mapping_candidates: list):
    """
    CLI-based approval (fallback mode).
    Interactive terminal-based approval process.

    Args:
        run_id: Workflow run identifier
        mapping_candidates: List of mapping candidates

    Returns:
        List of approved mappings
    """
    logger.info("Starting interactive CLI approval process")
    print("\n" + "=" * 60)
    print("HUMAN-IN-THE-LOOP APPROVAL")
    print("=" * 60)
    print("Please review the following mapping candidates.")
    print("Enter 'y' to approve or 'n' to reject.\n")

    approved_mappings = []
    approved_count = 0
    rejected_count = 0

    for idx, mapping in enumerate(mapping_candidates, 1):
        source = mapping.get('source_column', 'unknown')
        target = mapping.get('target_column', 'unknown')
        confidence = mapping.get('confidence', 0.0)
        rationale = mapping.get('rationale', 'No rationale provided')

        logger.info(f"Presenting mapping {idx}/{len(mapping_candidates)}", data={
            "source": source,
            "target": target,
            "confidence": f"{confidence:.2%}"
        })

        # Present the mapping to the user
        print(f"\n{'=' * 60}")
        print(f"Mapping {idx}/{len(mapping_candidates)}")
        print(f"{'=' * 60}")
        print(f"  Source: {source}")
        print(f"  Target: {target}")
        print(f"  Confidence: {confidence:.2%}")
        print(f"  Rationale: {rationale}")
        print(f"{'=' * 60}")

        prompt = "Approve? (y/n): "

        while True:
            user_input = input(prompt).lower().strip()
            if user_input in ['y', 'yes']:
                approved_mappings.append(mapping)
                approved_count += 1
                logger.success(f"Mapping approved: {source} -> {target}")
                print(f"✓ Approved mapping from {source} to {target}")
                break
            elif user_input in ['n', 'no']:
                rejected_count += 1
                logger.info(f"Mapping rejected: {source} -> {target}")
                print(f"✗ Rejected mapping from {source} to {target}")
                break
            else:
                print("Invalid input. Please enter 'y' or 'n'.")

    print(f"\n{'=' * 60}")
    print(f"HITL APPROVAL COMPLETE")
    print(f"Approved: {approved_count} | Rejected: {rejected_count}")
    print(f"{'=' * 60}\n")

    logger.info("CLI approval completed", data={
        "approved": approved_count,
        "rejected": rejected_count
    })

    return approved_mappings


if __name__ == '__main__':
    # Example usage for testing CLI mode
    print("Testing HITL Agent in CLI mode...\n")

    test_candidates = [
        {
            "source_table": "borrower",
            "source_column": "borrower.borrower_id",
            "target_table": "dim_borrower",
            "target_column": "dim_borrower.borrower_key",
            "confidence": 0.95,
            "rationale": "High confidence semantic match based on column name similarity"
        },
        {
            "source_table": "loan",
            "source_column": "loan.loan_amount",
            "target_table": "fact_loan_snapshot",
            "target_column": "fact_loan_snapshot.outstanding_principal",
            "confidence": 0.88,
            "rationale": "Strong match - both represent monetary loan values"
        },
        {
            "source_table": "guarantor",
            "source_column": "guarantor.guarantor_name",
            "target_table": "dim_guarantor",
            "target_column": "dim_guarantor.guarantor_name",
            "confidence": 0.92,
            "rationale": "Exact name match with high semantic similarity"
        },
    ]

    approved = run_hitl("run_test_interactive", test_candidates, hitl_store=None)
    print(f"\nFinal result: {len(approved)} mappings approved")
