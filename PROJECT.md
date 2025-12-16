# AIMagna - GenAI ETL Agent for Commercial Lending

## 1. Problem Statement

Commercial lending data is often fragmented, inconsistent, and stored in operational schemas that are not optimized for analytics. The process of transforming this data into a clean, structured, and queryable format is a complex, time-consuming, and error-prone task. Key challenges include:

*   **Data Silos:** Data is spread across multiple tables and systems with no clear and consistent relationships.
*   **Data Quality Issues:** The data suffers from inconsistencies, duplicates, and a lack of standardization. For example, the same borrower may be registered with slightly different names or addresses.
*   **Manual ETL Processes:** Traditional ETL processes require significant manual effort from data engineers to write and maintain complex transformation scripts.
*   **Lack of Accessibility:** Business users cannot easily access and analyze the data without the help of technical experts.

## 2. Solution Approach

This project addresses these challenges by building an intelligent, AI-powered ETL pipeline that automates the transformation of commercial lending data. The solution is based on a multi-agent system that orchestrates the entire ETL process, from data ingestion to a queryable analytical data warehouse.

The key components of the solution are:

*   **Multi-Agent Workflow:** A team of specialized AI agents (Profiler, Mapper, Transformer, etc.) work together to process the data in a structured and automated manner.
*   **Human-in-the-Loop (HITL):** A web-based UI allows business users to review and approve data mappings, ensuring data quality and accuracy.
*   **Natural Language to SQL (NL2SQL):** A feature that enables business users to query the transformed data in BigQuery using natural language, making data more accessible.
*   **Cloud-Native Architecture:** The solution is built on Google Cloud Platform, leveraging services like BigQuery, Cloud Storage, and Vertex AI for scalability, reliability, and performance.

## 3. Expected Outcomes

The expected outcomes of this project are:

*   **Improved Data Quality:** A clean, consistent, and standardized dataset in BigQuery, ready for analytics.
*   **Increased Automation:** A fully automated ETL pipeline that reduces manual effort and accelerates the data-to-insight lifecycle.
*   **Enhanced Accessibility:** Business users can easily access and analyze the data using natural language queries.
*   **Reduced Time-to-Value:** A faster and more efficient way to derive insights from commercial lending data.
*   **Scalable and Extensible Framework:** A flexible and extensible framework that can be adapted to other data domains and use cases.

## 4. High-Level Architecture

The application is designed with a modern, decoupled architecture, consisting of a frontend single-page application (SPA), a backend API, a multi-agent ETL pipeline, and a set of cloud services.

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

**Components:**

*   **React Frontend:** A single-page application that provides a user-friendly interface for interacting with the system. It communicates with the backend via HTTP and WebSockets.
*   **FastAPI Backend (NL Agent):** A Python-based backend that exposes a REST API for the frontend. It handles user requests, manages workflows, and interacts with the other agents and cloud services.
*   **Orchestrator Agent:** The "brain" of the ETL pipeline. It orchestrates the execution of the other agents in a predefined sequence.
*   **Specialized Agents:** A suite of agents, each responsible for a specific task in the ETL process (e.g., profiling, mapping, transformation).
*   **Core Infrastructure:** A set of shared services, including a WebSocket manager for real-time communication, an NL2SQL service for natural language querying, and a state store for managing workflow state.
*   **Google Cloud Services:** The application leverages a variety of Google Cloud services for data storage, computation, and AI.

## 5. Technologies & Tools Used

**Frontend:**

*   **React:** A JavaScript library for building user interfaces.
*   **TypeScript:** A typed superset of JavaScript.
*   **Vite:** A fast build tool for modern web development.
*   **Tailwind CSS:** A utility-first CSS framework.

**Backend:**

*   **Python:** The primary programming language for the backend and agents.
*   **FastAPI:** A modern, high-performance web framework for building APIs.
*   **Uvicorn:** An ASGI server for running FastAPI applications.
*   **Pydantic:** A data validation and settings management library.
*   **WebSockets:** For real-time communication between the frontend and backend.

**AI & Machine Learning:**

*   **Google Vertex AI:**
    *   **Gemini:** Used for the NL2SQL feature.
    *   **Vector Search:** Used for intelligent entity resolution.
*   **LangChain:** A framework for developing applications powered by language models.

**Data & Infrastructure:**

*   **Google Cloud Platform (GCP):**
    *   **BigQuery:** A serverless, highly scalable data warehouse.
    *   **Cloud Storage:** A scalable, secure, and durable object storage service.
    *   **Firestore:** A NoSQL document database for storing workflow state.
*   **Docker:** For containerizing the application.
*   **Git & GitHub:** For version control and source code management.

## 6. Challenges Faced

Developing this project involved overcoming several challenges:

*   **Data Complexity and Quality:** The source data was spread across multiple CSV files with no clear relationships and suffered from quality issues like duplicate records.
*   **Building a Robust ETL Pipeline:** Designing and implementing a multi-agent ETL pipeline that is both robust and scalable was a complex task.
*   **Integrating AI Models:** Integrating and orchestrating multiple AI models (Gemini, Vector Search) within the ETL workflow required careful design and implementation.
*   **Real-time Communication:** Implementing a real-time communication mechanism between the frontend and backend to provide live updates on the workflow progress.
*   **Ensuring Data Security:** Implementing security measures to protect sensitive data throughout the ETL process and in the final data warehouse.
*   **User Experience:** Designing a user-friendly interface that simplifies the complex ETL process and makes it accessible to non-technical users.

## 7. Use of Google Environment

The project heavily relies on the Google Cloud Platform for its data, AI, and infrastructure needs.

*   **Google BigQuery:**
    *   **Data Warehouse:** Serves as the central data warehouse for the transformed data. The analytical star schema is designed to be easily queryable.
    *   **SQL Execution:** The NL2SQL feature executes the generated SQL queries against BigQuery.

*   **Google Cloud Storage (GCS):**
    *   **Data Lake:** Acts as a data lake to store the raw source data (CSV files).
    *   **Staging Area:** Used as a staging area for intermediate data during the ETL process.

*   **Google Vertex AI:**
    *   **Gemini:** The Gemini family of models is used to power the Natural Language to SQL (NL2SQL) feature, allowing users to query BigQuery using plain English.
    *   **Vector Search:** Used for intelligent entity resolution. It helps identify and merge duplicate borrower records based on semantic similarity rather than exact matches.

*   **Google Cloud Firestore:**
    *   **State Management:** Used as a state store to manage the state of the ETL workflow. It keeps track of the current step, progress, and any errors.
    *   **HITL Approvals:** Stores the pending and approved data mappings for the Human-in-the-Loop (HITL) step.

## 8. AI Techniques and Agentic Workflows

The core of this project is its intelligent automation, which is achieved through a combination of AI techniques and a multi-agent workflow.

### AI Techniques

*   **Natural Language to SQL (NL2SQL) with Gemini:**
    *   The application features a powerful NL2SQL capability that allows users to query the BigQuery data warehouse using natural language.
    *   This is implemented using Google's Gemini large language model (LLM). The `nl2sql_service.py` script sends a prompt to the Gemini model, which includes the user's query and the BigQuery table schema. The model then returns a SQL query that can be executed on BigQuery.

*   **Intelligent Entity Resolution with Vector Search:**
    *   A key challenge in the ETL process is identifying and merging duplicate records, especially for entities like "borrower".
    *   This is solved by using Vertex AI Vector Search. The `mapper_agent` creates vector embeddings of the borrower data using a text-embedding model. These embeddings are then used to build a Vector Search Index.
    *   The index allows the system to perform similarity searches and identify duplicate borrowers based on semantic meaning rather than exact string matching.

### Multi-Agent Workflow

The ETL process is orchestrated by a multi-agent system, where each agent is a specialized Python script responsible for a specific task. The `orchestrator_agent` manages the overall workflow, executing the agents in a predefined sequence.

The workflow consists of the following steps:

1.  **Profiler Agent:**
    *   **Purpose:** To analyze the source data and create a profile of each table.
    *   **Actions:** Reads the source CSV files from Google Cloud Storage, gathers metadata (e.g., column names, data types, row counts), and stores the profile in Firestore.

2.  **Mapper Agent:**
    *   **Purpose:** To map the source schema to the target schema and identify potential data quality issues.
    *   **Actions:**
        *   Uses an LLM to generate an initial mapping between the source and target tables.
        *   Uses Vertex AI Vector Search to identify duplicate borrower records.
        *   Generates a list of mapping candidates and potential duplicates and stores them in Firestore for the HITL step.

3.  **HITL (Human-in-the-Loop) Agent:**
    *   **Purpose:** To allow a human user to review and approve the data mappings.
    *   **Actions:**
        *   Retrieves the pending mappings from Firestore.
        *   Presents the mappings to the user via the frontend UI.
        *   Stores the user's approvals and rejections in Firestore.

4.  **Transform Agent:**
    *   **Purpose:** To transform the source data into the target schema based on the approved mappings.
    *   **Actions:**
        *   Reads the source data from GCS.
        *   Applies the approved mappings and transformation rules to the data.
        *   Generates the final transformed data and stores it in a staging area in GCS.

5.  **Validator Agent:**
    *   **Purpose:** To validate the transformed data before loading it into BigQuery.
    *   **Actions:**
        *   Performs data quality checks on the transformed data.
        *   Ensures that the data conforms to the target schema.
        *   Generates a validation report.

6.  **Executor Agent:**
    *   **Purpose:** To load the transformed data into BigQuery.
    *   **Actions:**
        *   Reads the transformed data from the GCS staging area.
        *   Loads the data into the corresponding tables in the BigQuery data warehouse.

7.  **Feedback Agent:**
    *   **Purpose:** To gather feedback on the ETL process and the transformed data.
    *   **Actions:**
        *   Collects logs and metrics from the other agents.
        *   Generates a feedback report that can be used to improve the ETL process over time.
        *   Stores the feedback in Firestore.

## 9. Detailed Walkthrough of the Source Code

This section provides a detailed walkthrough of the source code, from the frontend to the backend and the agentic workflow.

### Specialized Agents

The ETL workflow is executed by a series of specialized agents, each responsible for a specific task.

*   **`profiler_agent`**: Analyzes the source data and generates profiling statistics, such as row counts, column data types, and null value counts.
*   **`mapper_agent`**: Generates mappings between the source and target schemas using AI-powered embeddings and cosine similarity.
*   **`hitl_agent`**: Manages the Human-in-the-Loop (HITL) approval process for data mappings. It can operate in a web-based mode (using Firestore) or a CLI-based mode.
*   **`transform_agent`**: Generates the SQL queries for transforming the data from the source schema to the target schema. It includes logic for finding join paths between tables.
*   **`validator_agent`**: Runs data quality checks on the transformed data in BigQuery to ensure its integrity.
*   **`feedback_agent`**: Gathers feedback and metrics about the workflow execution to enable continuous learning and improvement. (Note: This agent is currently a placeholder for future implementation).

### Core Tools (`Sample-DataSet-CommercialLending/src/core_tools`)

The `core_tools` directory contains a set of shared Python modules that provide common functionalities used by the different agents.

*   **`bigquery_runner.py`**: A wrapper around the Google Cloud BigQuery client for running queries and managing BigQuery resources.
*   **`dq_tool.py`**: A tool for running data quality checks on BigQuery tables.
*   **`gcs_io.py`**: A module for interacting with Google Cloud Storage (GCS), including uploading and downloading files.
*   **`logger.py`**: A custom logger for logging messages in a structured format.
*   **`state_store.py`**: A module for managing the state of the ETL workflow using Firestore.
*   **`vector_store.py`**: A module for interacting with a vector store (e.g., Vertex AI Vector Search) for similarity searches.
*   **`vertex_ai.py`**: A wrapper around the Google Cloud Vertex AI client for interacting with AI models like Gemini and text-embedding models.

## 10. Feedback Mechanism

The project is designed with a feedback loop to enable continuous learning and improvement of the ETL process. This is orchestrated by the `feedback_agent`.

**How it Works:**

1.  **Data Collection:** At the end of each workflow run, the `orchestrator_agent` calls the `feedback_agent` and passes the validation results.
2.  **Analysis:** The `feedback_agent` analyzes the validation results, as well as the HITL approvals and rejections, to identify patterns and areas for improvement.
3.  **Model Updates:** Based on the analysis, the `feedback_agent` is intended to:
    *   Update the mapping templates to improve the accuracy of the `mapper_agent`.
    *   Update the prompt exemplars for the LLM to improve the quality of the generated SQL and rationales.
    *   Re-rank the embeddings in the vector store to improve the performance of the similarity search.

**Current Status:**

The `feedback_agent` is currently a placeholder and the feedback loop is not fully implemented. The agent logs the planned actions, but it does not yet perform the actual updates. This is a key area for future development.

## 11. Prompts

The application uses several prompts to interact with the Gemini LLM.

### NL2SQL Prompt (`nl_agent/nl2sql_service.py`)

This prompt is used to convert a natural language query into a BigQuery SQL statement.

```
You are an expert BigQuery SQL developer. Convert the following natural language query into a valid BigQuery SQL statement.

**BigQuery Schema:**
<schema>

**User Query:**
<query>

**Instructions:**
- Only output the SQL query.
- Do not include any explanations or markdown formatting.
- Ensure the query is valid for BigQuery.
```

### Result Interpretation Prompt (`nl_agent/nl2sql_service.py`)

This prompt is used to interpret the results of a SQL query and provide a natural language answer.

```
You are a helpful data analyst assistant. A user asked a question about their commercial lending data, and a SQL query was executed. Analyze the results and provide a clear, concise answer to their question.

**User Question:**
<question>

**SQL Query:**
<sql_query>

**Query Results (first <n> rows):**
<query_results>

**Instructions:**
- Provide a natural language answer to the user's question based on the query results.
- If the results are empty, state that no data was found.
- Do not repeat the SQL query.
- Be concise and to the point.
```

### HITL Rationale Prompt (`hitl_agent/main.py`)

This prompt is used to generate a rationale for a mapping candidate in the HITL step.

```
Analyze the following column mapping and explain why it makes sense (or doesn't) based on the column descriptions.

**Source Column:**
<source_column>
<source_description>

**Target Column:**
<target_column>
<target_description>

Provide a concise 1-2 sentence explanation of why this mapping is appropriate or what concerns exist. Focus on the semantic meaning and business logic based on the descriptions.
```

## 12. References

*   [Google Cloud](https://cloud.google.com/)
*   [Google BigQuery](https://cloud.google.com/bigquery)
*   [Google Cloud Storage](https://cloud.google.com/storage)
*   [Google Vertex AI](https://cloud.google.com/vertex-ai)
*   [FastAPI](https://fastapi.tiangolo.com/)
*   [React](https://reactjs.org/)
*   [LangChain](https://www.langchain.com/)
