# 🧠 Sourcely AI — The Neural Brain of Your Team

> **"Converting scattered company knowledge into an intelligent, searchable AI Wiki & Chat Assistant."**

![Sourcely Banner](https://raw.githubusercontent.com/tanishbhandari11t/Sourcely/main/public/logo.svg)

---

## 🧾 Project Overview

**Sourcely** is an AI-powered developer knowledge base generator. It solves the "Scattered Knowledge" problem where company info is lost across Slack threads, PDFs, GitHub Readmes, and meeting notes. 

New developers struggle to find answers → Sourcely ingests that data and automatically generates a **Living AI Wiki** and a grounded **Chat Assistant**.

---

## 🔥 Core Features

### 1️⃣ Workspace System (Multi-Tenant SaaS)
*   **Pure Ownership**: Each workspace has a single Owner and verified Members.
*   **Join Flow**: Secure Request-to-Join system with real-time Owner notifications.
*   **Isolated Intelligence**: Data from Workspace A never leaks to Workspace B.

### 2️⃣ Intelligence Ingestion (The Brain)
*   **Local Assets**: Upload PDFs, TXT, and Markdown files directly.
*   **Platform Sync**: Automatically fetch and analyze content from **Slack, GitHub, and Jira** links.
*   **Brain Explorer**: Transparently view the raw text chunks extracted from your sources.

### 3️⃣ AI RAG Engine (Retrieval-Augmented Generation)
*   **Vector Memory**: Powered by `pgvector` in Supabase.
*   **Zero-Hallucination**: Answers are strictly grounded in your workspace data.
*   **Llama-3 70B**: Lightning-fast intelligent responses via Groq.

### 4️⃣ Neural Wiki & Chat
*   **Auto-Wiki**: AI automatically clusters ingested data into structured documentation pages.
*   **Oracle Chat**: Ask anything about your tech stack and get "Sources Used" citations.

---

## 🤖 How the RAG Engine Works

Sourcely follows a high-fidelity intelligence pipeline:

1.  **Ingest**: Raw data is fetched from local files or external links.
2.  **Chop**: Text is broken into 500-token "Knowledge Chunks."
3.  **Embed**: Chunks are converted into multi-dimensional vectors using Google Gemini.
4.  **Store**: Vectors are saved in the Supabase PostgreSQL database.
5.  **Retrieve**: User questions trigger a "Similarity Search" to find relevant chunks.
6.  **Synthesize**: The LLM (Llama-3) generates an answer based *only* on retrieved data.

---

## 🧱 Tech Stack

*   **Frontend**: Next.js 14 (App Router), TailwindCSS, Shadcn/UI, Lucide Icons.
*   **Backend**: Supabase (Auth, DB, Storage, pgvector).
*   **AI Models**: Groq (Llama-3 70B) for Chat, Google Gemini for Embeddings.
*   **Design**: Immersive Dark Workspace aesthetic.

---

## 🎨 Design System

| Element | Hex Code |
| :--- | :--- |
| **Background** | `#0B0F14` |
| **Surface** | `#111827` |
| **Primary** | `#6366F1` |
| **Accent** | `#22C55E` |

---

## 🚀 Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/tanishbhandari11t/Sourcely.git
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
GROQ_API_KEY=your_key
GEMINI_API_KEY=your_key
```

### 4. Run Locally
```bash
npm run dev
```

---

## 👥 Contributors
Created with ❤️ by **Tanish Bhandari**

---

> *"Sourcely becomes the brain of your company."*
