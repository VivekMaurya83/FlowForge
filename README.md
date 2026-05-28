# FlowForge AI 🧠✨

FlowForge AI is a modern, AI-powered editable diagram platform. Unlike static diagram generators, FlowForge allows you to generate diagrams using AI (powered by Google Gemini), manually edit them using a rich interactive canvas, and request incremental AI modifications that **preserve your manual layouts and edits**.

## Features

- **Prompt-to-Diagram**: Generate structured node-and-edge architectures in seconds using Gemini Flash.
- **Incremental Modification**: Add components via AI prompts without overwriting your manual layouts. The backend acts as a smart diff engine.
- **Full Canvas Control**: Drag, connect, color, and rename nodes manually (powered by React Flow).
- **Time Travel**: Snapshot and restore specific versions of your diagrams using MongoDB Atlas.

---

## Tech Stack

- **Frontend**: React + Vite, Zustand, React Flow, Vanilla CSS (Glassmorphism design)
- **Backend**: FastAPI (Python), Motor (Async MongoDB), Google Generative AI SDK
- **Database**: MongoDB Atlas

---

## Local Setup

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/FlowForge.git
cd FlowForge
```

### 2. Backend Setup
The backend requires Python 3.10+ and uses FastAPI.

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file in the `backend/` directory:
```env
GEMINI_API_KEY=your_google_gemini_key
MONGODB_URI=mongodb+srv://your_user:your_password@cluster.mongodb.net/flowforge_db?retryWrites=true&w=majority
DATABASE_NAME=flowforge_db
COLLECTION_NAME=diagrams
```

Run the backend server:
```bash
uvicorn main:app --reload
# Server runs on http://localhost:8000
```

### 3. Frontend Setup
The frontend uses Vite.

```bash
cd frontend
npm install
```

Run the frontend dev server:
```bash
npm run dev
# App runs on http://localhost:5173
```

---

## Core Architecture

FlowForge relies on a unique "Delta" update strategy. When a user requests an AI update to an existing diagram:
1. The frontend sends the *current JSON state* of the diagram plus the *new prompt*.
2. Gemini evaluates the diagram and outputs a **Delta JSON** (nodes to add, nodes to update, nodes to remove).
3. The frontend's Zustand store deeply merges this Delta, strictly preserving `position` attributes of all existing nodes.

*See the internal documentation or architecture overview for more deep-dives into the codebase.*
