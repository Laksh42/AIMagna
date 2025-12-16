# AIMagna - Commercial Lending GenAI ETL Agent

This project demonstrates an end-to-end ETL (Extract, Transform, Load) pipeline powered by Generative AI agents. The pipeline transforms a synthetic commercial lending dataset from a source operational schema into a BigQuery analytical star schema.

The key feature is the use of a multi-agent workflow to orchestrate the ETL process, with a human-in-the-loop (HITL) step for critical decision-making. The project also includes a natural language to SQL (NL2SQL) feature to query the transformed data in BigQuery.

## Table of Contents
1.  [High-Level Architecture](#high-level-architecture)
2.  [Features](#features)
3.  [Prerequisites](#prerequisites)
4.  [Setup and Installation](#setup-and-installation)
5.  [Running the Application](#running-the-application)
6.  [Verifying the Results](#verifying-the-results)
7.  [Frontend Application](#frontend-application)
8.  [Project Structure](#project-structure)

---

## High-Level Architecture

The architecture consists of a React frontend, a FastAPI backend, and a suite of "GenAI agents" that orchestrate the ETL workflow. Google Cloud services like BigQuery, Cloud Storage, and Vertex AI are used for data storage, processing, and AI capabilities.

```
┌─────────────────────────────────────────────────────────────┐
│                    REACT FRONTEND                           │
│  Chat UI | HITL Approval Cards | Query Interface           │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/WebSocket
┌────────────────────▼────────────────────────────────────────┐
│                 FASTAPI BACKEND (NL Agent)                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 10 REST Endpoints | WebSocket | CORS | Validation  │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│            ORCHESTRATOR AGENT                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ WebSocket Broadcasts | Firestore Updates | 10 Steps │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│            CORE INFRASTRUCTURE                               │
│  ┌───────────────┬──────────────┬───────────────────────┐  │
│  │ WebSocket Mgr │ NL2SQL       │ State Store (Firestore│  │
│  │ (broadcasts)  │ (Gemini LLM) │ + HITL)               │  │
│  └───────────────┴──────────────┴───────────────────────┘  │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                  GCP SERVICES                                │
│  BigQuery | GCS | Vertex AI | Firestore                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Features

*   **End-to-End ETL Pipeline:** Ingests CSV data, transforms it, and loads it into a BigQuery data warehouse.
*   **Multi-Agent Workflow:** Orchestrates the ETL process using a series of specialized agents (Profiler, Mapper, Transformer, etc.).
*   **Human-in-the-Loop (HITL):** Includes a UI for manual approval of data mappings.
*   **Natural Language to SQL (NL2SQL):** Converts natural language queries into SQL to be executed on BigQuery.
*   **Real-time Updates:** Uses WebSockets to provide real-time updates on the ETL workflow progress.
*   **Frontend UI:** A React-based frontend to interact with the backend services.

---

## Prerequisites

*   **Google Cloud SDK:** Authenticated to your GCP project.
*   **Python 3.9+** and `pip`.
*   **Node.js and npm:** For running the frontend application.

---

## Setup and Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/GoogleCloudPlatform/genai-databases-retrieval-augmented-generation.git
    cd genai-databases-retrieval-augmented-generation/app-integration/chatbot-bigquery-vertexai/
    ```

2.  **Configure Google Cloud:**
    *   Authenticate with GCP:
        ```bash
        gcloud auth login
        gcloud auth application-default login
        ```
    *   Set your project ID:
        ```bash
        gcloud config set project [YOUR_PROJECT_ID]
        ```

3.  **Set up the Backend:**
    *   Navigate to the `Sample-DataSet-CommercialLending` directory:
        ```bash
        cd Sample-DataSet-CommercialLending
        ```
    *   Create and activate a Python virtual environment:
        ```bash
        python3 -m venv venv
        source venv/bin/activate
        ```
    *   Install the required Python libraries:
        ```bash
        pip3 install -r requirements.txt
        ```
    *   Create a `.env` file from the `.env.example` and update the values for your GCP project.

4.  **Set up the Frontend:**
    *   Navigate to the `frontend` directory:
        ```bash
        cd frontend
        ```
    *   Install the required npm packages:
        ```bash
        npm install
        ```
    *   Create a `.env.development` file and add the following line:
        ```
        VITE_API_BASE_URL=http://localhost:8000
        ```

---

## Running the Application

1.  **Start the Backend:**
    *   From the `Sample-DataSet-CommercialLending` directory, run:
        ```bash
        uvicorn src.nl_agent.main:app --reload
        ```
    *   The backend will be running at `http://localhost:8000`.

2.  **Start the Frontend:**
    *   From the `frontend` directory, run:
        ```bash
        npm run dev
        ```
    *   The frontend will be running at `http://localhost:5173`.

---

## Verifying the Results

After the ETL pipeline finishes successfully, you can verify that the data has been loaded correctly into BigQuery.

1.  **Navigate to the BigQuery Console** for your GCP project.
2.  **Check for Target Tables**: In the `commercial_lending` dataset, you should see the populated dimension and fact tables (e.g., `dim_borrower`, `dim_loan`, `fact_payments`).
3.  **Run Verification Queries**: Execute SQL queries in the BigQuery Editor to inspect the data.

---

## Frontend Application

The frontend application provides a user interface to:
*   Upload data and start the ETL workflow.
*   Monitor the progress of the workflow in real-time.
*   Approve or reject data mappings in the HITL step.
*   Query the transformed data in BigQuery using natural language.

---

## Project Structure

The project is organized into the following main directories:

*   `Sample-DataSet-CommercialLending/`: The main project directory.
    *   `src/`: Contains the Python source code for the backend and agents.
        *   `nl_agent/`: The main FastAPI backend.
        *   `orchestrator_agent/`: The agent that orchestrates the ETL workflow.
        *   Other agent directories (`profiler_agent`, `mapper_agent`, etc.).
        *   `core_tools/`: Shared tools for logging, GCP integration, etc.
    *   `frontend/`: The React frontend application.
    *   `Source-Schema-DataSets/`: Sample source data.
    *   `Target-Schema/`: SQL files for the target BigQuery schema.