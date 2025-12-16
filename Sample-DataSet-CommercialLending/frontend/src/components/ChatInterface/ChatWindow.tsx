// Main Chat Window Component

import React, { useRef, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  RocketLaunch as PipelineIcon,
} from '@mui/icons-material';
import { useChatStore } from '../../stores/chatStore';
import { useWebSocket } from '../../hooks/useWebSocket';
import type { WorkflowUpdate } from '../../types';
import { QueryInput } from '../QueryInterface/QueryInput';
import { PipelineStarter } from '../Workflow/PipelineStarter';
import { ETLProgressCard } from '../Workflow/ETLProgressCard';
import { HITLApprovalCard } from '../Workflow/HITLApprovalCard';
import { LandingPage } from '../Landing/LandingPage';

// Interface for HITL mapping
interface HITLMapping {
  mapping_id: string;
  source_table: string;
  source_column: string;
  target_table: string;
  target_column: string;
  confidence: number;
  rationale: string;
  status: 'pending' | 'approved' | 'rejected';
}

export const ChatWindow: React.FC = () => {
  const {
    currentRun,
    etlSteps,
    setCurrentRun,
    updateCurrentRun,
    updateETLStep,
    resetETLSteps,
  } = useChatStore();
  const [pipelineDialogOpen, setPipelineDialogOpen] = useState(false);
  const [hitlMappings, setHitlMappings] = useState<HITLMapping[]>([]);
  const [showHitlApproval, setShowHitlApproval] = useState(false);
  const [hitlReady, setHitlReady] = useState(false); // Only show after mappings are fully loaded
  const [workflowCompleted, setWorkflowCompleted] = useState(false); // Track if workflow_complete was received
  const [workflowMappings, setWorkflowMappings] = useState<any[]>([]); // Store all mappings for dropdown
  const [workflowTransformations, setWorkflowTransformations] = useState<any[]>([]); // Store all transformations for dropdown
  const workflowCompletedRef = useRef(false); // Synchronous ref to prevent race conditions

  // WebSocket connection for real-time updates
  useWebSocket(currentRun?.run_id || null, (update: WorkflowUpdate) => {
    // Update progress
    if (currentRun) {
      // PRIORITY 1: Handle workflow_complete FIRST - before any other logic
      if (update.type === 'workflow_complete') {
        console.log('🎉 Workflow complete event received:', update);
        
        // Set flag immediately (both state and ref) to prevent any subsequent updates from resetting status
        workflowCompletedRef.current = true; // Synchronous - prevents race conditions
        setWorkflowCompleted(true);
        
        // Update all steps to completed
        etlSteps.forEach(step => {
          if (step.status === 'pending' || step.status === 'running') {
            updateETLStep(step.name, 'completed');
          }
        });
        
        // Set final status - this is the definitive completion
        updateCurrentRun({ 
          status: 'completed',
          current_step: 'completed',
          progress: 100
        });
        
        // Clean up HITL state
        setShowHitlApproval(false);
        setHitlMappings([]);
        setHitlReady(false);
        
        return; // Exit early - don't process any further logic
      }

      // PRIORITY 2: If workflow is already completed, ignore all subsequent updates
      // (cleanup step runs after workflow_complete and would reset status to 'running')
      // Use ref for synchronous check to avoid race conditions
      if (workflowCompletedRef.current || workflowCompleted) {
        // Just update the step status for UI, don't change workflow status
        const stepStatus = 
          update.status === 'completed' ? 'completed' :
          update.status === 'failed' || update.status === 'error' ? 'error' :
          'running';
        updateETLStep(update.step, stepStatus, update.message);
        return; // Exit early - don't process status updates
      }

      // PRIORITY 3: Handle HITL approval required
      if (update.type === 'hitl_approval_required') {
        console.log('HITL approval required:', update);
        const mappings = (update as any).data?.mappings || [];
        
        // Update step status - no separate chat message needed, the card shows all info
        updateETLStep('hitl', 'running', `${mappings.length} mapping(s) awaiting approval`);
        
        // Set mappings and show card after a small delay to let UI settle
        setHitlMappings(mappings);
        setShowHitlApproval(true);
        
        setTimeout(() => {
          setHitlReady(true);
        }, 300);
        
        return;
      }
      
      // Store mappings data when mapper step completes
      if (update.step === 'mapper' && update.status === 'completed' && (update as any).data?.mappings) {
        setWorkflowMappings((update as any).data.mappings);
      }
      
      // Store transformations data when transform step completes
      if (update.step === 'transform' && update.status === 'completed' && (update as any).data?.transformations) {
        setWorkflowTransformations((update as any).data.transformations);
      }
      
      // Also check workflow_complete data for mappings and transformations
      if (update.type === 'workflow_complete' && (update as any).data) {
        const data = (update as any).data;
        if (data.mappings) setWorkflowMappings(data.mappings);
        if (data.transformations) setWorkflowTransformations(data.transformations);
      }

      // Handle HITL approval complete
      if (update.type === 'hitl_approval_complete' || update.type === 'hitl_complete') {
        setShowHitlApproval(false);
        setHitlMappings([]);
        setHitlReady(false);
      }

      // Handle HITL progress updates
      if (update.type === 'hitl_progress') {
        const data = (update as any).data || {};
        updateETLStep('hitl', 'running', `${data.reviewed || 0} reviewed, ${data.pending || 0} remaining`);
        return;
      }

      // PRIORITY 4: Determine the overall workflow status for regular updates
      // Only mark as 'completed' when the ENTIRE workflow is done (workflow_complete event)
      // Individual step completions should keep status as 'running'
      let workflowStatus = update.status;
      if (update.status === 'completed' && update.type === 'workflow_update') {
        // Individual step completed - keep workflow running
        workflowStatus = 'running';
      } else if (update.status === 'failed' || update.status === 'error') {
        workflowStatus = 'failed';
      } else {
        workflowStatus = 'running';
      }

      updateCurrentRun({
        status: workflowStatus as any,
        current_step: update.step,
        progress: update.progress,
        error: update.error,
      });

      // Update the specific step
      const stepStatus = 
        update.status === 'completed' ? 'completed' :
        update.status === 'failed' || update.status === 'error' ? 'error' :
        update.status === 'started' || update.status === 'running' || update.status === 'waiting' || update.status === 'waiting_for_approval' ? 'running' :
        'pending';
      
      updateETLStep(update.step, stepStatus, update.message);
    }
  });

  // Handle HITL approval completion
  const handleHitlApprovalComplete = () => {
    setShowHitlApproval(false);
    setHitlMappings([]);
    setHitlReady(false);
    updateETLStep('hitl', 'completed', 'Approvals submitted - pipeline continuing');
  };

  const handleGCSWorkflowStarted = (runId: string, folderPath: string, files: string[]) => {
    // Reset ETL steps and HITL state
    resetETLSteps();
    setHitlMappings([]);
    setShowHitlApproval(false);
    setHitlReady(false);
    setWorkflowCompleted(false); // Reset completion flag for new workflow
    setWorkflowMappings([]); // Reset mappings
    setWorkflowTransformations([]); // Reset transformations
    workflowCompletedRef.current = false; // Reset ref for new workflow

    // Set the current run with progress starting at 0
    setCurrentRun({
      run_id: runId,
      folder_path: folderPath,
      gcs_uri: `gs://${folderPath}`,
      status: 'running',  // Start as running, not pending
      current_step: 'initialized',
      progress: 0,
      source_type: 'gcs_folder',
    });
  };


  const isWorkflowActive = currentRun &&
    currentRun.status !== 'pending' &&
    currentRun.source_type === 'gcs_folder';

  // Only mark workflow as complete when status is 'completed' or 'success'
  const isWorkflowComplete = currentRun &&
    (currentRun.status === 'completed' || currentRun.status === 'success');

  // Debug logging
  React.useEffect(() => {
    if (currentRun) {
      console.log('Current run state:', {
        status: currentRun.status,
        current_step: currentRun.current_step,
        progress: currentRun.progress,
        isWorkflowActive,
        isWorkflowComplete
      });
    }
  }, [currentRun?.status, currentRun?.current_step, currentRun?.progress]);

  // Show landing page when no workflow has been started
  const showLandingPage = !currentRun;

  if (showLandingPage) {
    return (
      <>
        <LandingPage onStartPipeline={() => setPipelineDialogOpen(true)} />
        {/* Pipeline Starter Dialog */}
        <PipelineStarter
          open={pipelineDialogOpen}
          onClose={() => setPipelineDialogOpen(false)}
          onWorkflowStarted={handleGCSWorkflowStarted}
        />
      </>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper sx={{ p: 2, borderRadius: 0 }} elevation={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h5">AIMagna ETL Pipeline</Typography>
            {currentRun && (
              <Box display="flex" gap={1} mt={1} flexWrap="wrap">
                <Chip label={`Run: ${currentRun.run_id}`} size="small" />
                <Chip
                  label={currentRun.status}
                  size="small"
                  color={
                    currentRun.status === 'completed' || currentRun.status === 'success' ? 'success' :
                    currentRun.status === 'failed' ? 'error' : 'primary'
                  }
                />
              </Box>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Workflow Content Area */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2, bgcolor: 'grey.50' }}>

        {/* ETL Progress Card - Single unified view */}
        {isWorkflowActive && (
          <ETLProgressCard
            runId={currentRun.run_id}
            folderPath={currentRun.folder_path}
            overallProgress={currentRun.progress}
            currentStep={currentRun.current_step}
            status={currentRun.status}
            steps={etlSteps}
            error={currentRun.error}
            isHitlWaiting={showHitlApproval && hitlReady}
            mappings={workflowMappings}
            transformations={workflowTransformations}
          />
        )}

        {/* HITL Approval Card - Shows when human approval is required and mappings are ready */}
        {showHitlApproval && hitlReady && hitlMappings.length > 0 && currentRun && (
          <HITLApprovalCard
            runId={currentRun.run_id}
            mappings={hitlMappings}
            onApprovalComplete={handleHitlApprovalComplete}
          />
        )}
      </Box>

      {/* Query Interface - Shows when workflow is complete */}
      {isWorkflowComplete && (
        <Box sx={{ p: 2, bgcolor: 'success.50', borderTop: 2, borderColor: 'success.main' }}>
          <Typography variant="subtitle2" color="success.dark" gutterBottom>
            ✅ ETL Complete! Query your transformed data:
          </Typography>
          <QueryInput />
        </Box>
      )}

      {/* Input Area - Only show Start Pipeline button if workflow can be started again */}
      {!isWorkflowActive && (
        <Paper sx={{ p: 2, borderRadius: 0 }} elevation={3}>
          <Box display="flex" justifyContent="center">
            <Tooltip title="Start ETL pipeline from GCS bucket folder">
              <Button
                variant="contained"
                color="success"
                size="large"
                startIcon={<PipelineIcon />}
                onClick={() => setPipelineDialogOpen(true)}
              >
                Start Pipeline
              </Button>
            </Tooltip>
          </Box>
        </Paper>
      )}

      {/* Pipeline Starter Dialog */}
      <PipelineStarter
        open={pipelineDialogOpen}
        onClose={() => setPipelineDialogOpen(false)}
        onWorkflowStarted={handleGCSWorkflowStarted}
      />
    </Box>
  );
};
