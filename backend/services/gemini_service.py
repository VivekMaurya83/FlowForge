"""
Gemini Service — Phase 2 & 3 fully implemented.

Handles:
  - Diagram generation from plain-text prompts (Phase 2)
  - Incremental diagram modification (Phase 3)

Incremental Modification Strategy (Phase 3):
The system prompt instructs Gemini to:
  1. Read and understand the FULL current_diagram JSON
  2. Identify which nodes/edges to ADD (never remove unless explicitly asked)
  3. Return ONLY the new/modified nodes and edges — NOT the whole diagram
  4. Respect existing node positions (preserve layout)
  5. Use existing node IDs when referencing connections
  6. Generate unique IDs for newly added nodes

This preserves all manual user edits and layout work.
"""

import os
import json
import re
import google.generativeai as genai

GEMINI_MODEL = "gemini-3-flash-preview"

SYSTEM_PROMPT_GENERATE = """
You are a Cloud Architecture Diagram Expert. Given a description, produce a JSON diagram.
Return ONLY valid JSON — no markdown, no explanation, no code fences.

Use this exact structure:
{
  "nodes": [
    {
      "id": "unique_snake_case_id",
      "type": "editableNode",
      "position": { "x": <number>, "y": <number> },
      "data": {
        "label": "Component Name",
        "category": "user|frontend|backend|database|storage|ai|service|cloud|notification|gateway|security",
        "description": "Short description of purpose",
        "size": "normal" // use "large" only for the 2-3 most critical workflow nodes
      }
    }
  ],
  "edges": [
    {
      "id": "edge_source_target",
      "source": "source_node_id",
      "target": "target_node_id",
      "type": "smoothstep",
      "animated": false,
      "style": { "stroke": "#6366f1", "strokeWidth": 2 }
    }
  ]
}

Layout & Presentation Guidelines (STRICTLY ENFORCED):
- USE A HORIZONTAL PRODUCT-FLOW ARCHITECTURE (Left to Right progression on X-axis).
- X-axis Layers:
  * x=0-200: Users, Clients (category: user)
  * x=450-600: Gateways, Input Mechanisms (category: gateway, frontend)
  * x=900-1100: Core Engines, Processing (category: ai, backend)
  * x=1400-1600: Storage, Output, History (category: database, storage)
- Space nodes vertically (Y-axis) by at least 250px to prevent overlap. Y-axis range: 100 to 1200.

Abstraction Rules (PRODUCT WORKFLOW FOCUS):
- FlowForge AI is an editable diagram product. When prompted to draw its architecture, DO NOT focus on low-level infrastructure (like FastAPI or MongoDB).
- Instead, focus on the USER WORKFLOW: User Prompt -> Generation Engine -> Editable Canvas -> Manual Edit -> Incremental Update -> Version Storage.
- Apply `"size": "large"` to the core workflow nodes (e.g., "Editable Canvas", "Incremental Update Engine") to make them visually dominant.
- Collapse internal services into high-level modules. Optimize readability over technical completeness.
- The `label` must be the actual high-level component or workflow step.
- Assign the best matching `category` from the allowed list.
"""

SYSTEM_PROMPT_MODIFY = """
You are a Cloud Architecture Diagram Modification Expert. You will receive:
1. A CURRENT diagram JSON with nodes and edges
2. A modification request from the user

CRITICAL RULES:
- Return ONLY the changes — never the full diagram.
- NEVER change existing node positions or IDs.
- NEVER remove existing nodes unless explicitly requested ("remove", "delete").
- Place new nodes horizontally adjacent to their connected node, respecting the Left-to-Right X-axis layer architecture:
  (user x=0, frontend x=500, backend/ai x=1000, database x=1500)
- Space new nodes vertically (Y-axis) from existing nodes to avoid overlap.
- Reference existing node IDs when creating edges.
- Use unique snake_case IDs for new nodes.
- Maintain product-flow abstractions (do not generate low-level implementation details).

Return ONLY valid JSON:
{
  "nodes_to_add": [ ...new full node objects... ],
  "edges_to_add": [ ...new full edge objects... ],
  "nodes_to_update": [ ...existing nodes with ONLY changed data fields... ],
  "nodes_to_remove": [ "id1", "id2" ],
  "edges_to_remove": [ "edge_id1" ]
}
"""


def _get_model() -> genai.GenerativeModel:
    """Configure and return the Gemini model."""
    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY not set in environment")
    genai.configure(api_key=api_key)
    return genai.GenerativeModel(GEMINI_MODEL)


# ── Phase 2: Generate diagram ────────────────────────────────────────────────
async def generate_diagram_from_prompt(prompt: str) -> dict:
    """
    Call Gemini to generate a new diagram from a plain-text prompt.
    Returns { nodes: [...], edges: [...] }
    """
    model = _get_model()
    full_prompt = f"{SYSTEM_PROMPT_GENERATE}\n\nUser request: {prompt}"

    response = model.generate_content(full_prompt)
    return _parse_diagram_json(response.text)


# ── Phase 3: Modify existing diagram ─────────────────────────────────────────
async def modify_diagram_with_prompt(prompt: str, current_diagram: dict) -> dict:
    """
    Call Gemini to incrementally update an existing diagram.
    Returns only the delta — new/changed nodes and edges to merge.
    """
    model = _get_model()
    context = (
        f"{SYSTEM_PROMPT_MODIFY}\n\n"
        f"CURRENT DIAGRAM JSON:\n{json.dumps(current_diagram, indent=2)}\n\n"
        f"Modification request: {prompt}"
    )

    response = model.generate_content(context)
    return _parse_modification_json(response.text)


# ── JSON Parsers ─────────────────────────────────────────────────────────────
def _extract_json(raw: str) -> str:
    """Strip markdown fences and extract raw JSON string."""
    # Remove ```json ... ``` or ``` ... ``` fences
    cleaned = re.sub(r"```(?:json)?\s*", "", raw).strip().rstrip("`").strip()
    # If there are still extraneous characters before {, trim them
    first_brace = cleaned.find("{")
    last_brace = cleaned.rfind("}")
    if first_brace != -1 and last_brace != -1:
        cleaned = cleaned[first_brace : last_brace + 1]
    return cleaned


def _parse_diagram_json(raw: str) -> dict:
    """Extract and validate diagram JSON from Gemini response."""
    cleaned = _extract_json(raw)
    data = json.loads(cleaned)
    if "nodes" not in data or "edges" not in data:
        raise ValueError(f"Invalid diagram structure from Gemini: missing nodes or edges")
    return data


def _parse_modification_json(raw: str) -> dict:
    """Extract and validate modification delta JSON."""
    cleaned = _extract_json(raw)
    data = json.loads(cleaned)
    return {
        "nodes_to_add": data.get("nodes_to_add", []),
        "edges_to_add": data.get("edges_to_add", []),
        "nodes_to_update": data.get("nodes_to_update", []),
        "nodes_to_remove": data.get("nodes_to_remove", []),
        "edges_to_remove": data.get("edges_to_remove", []),
    }
