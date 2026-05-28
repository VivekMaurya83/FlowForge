from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any

from services.gemini_service import modify_diagram_with_prompt

router = APIRouter()


class ModifyRequest(BaseModel):
    prompt: str
    current_diagram: dict[str, Any]


class DiagramDeltaResponse(BaseModel):
    """
    Returns only the DELTA — the frontend merges this into existing state.
    This is the core USP: manual edits and node positions are preserved.
    """
    nodes_to_add: list[Any] = []
    edges_to_add: list[Any] = []
    nodes_to_update: list[Any] = []
    nodes_to_remove: list[str] = []
    edges_to_remove: list[str] = []


@router.post("/modify-diagram", response_model=DiagramDeltaResponse)
async def modify_diagram(body: ModifyRequest):
    """
    Phase 3: Incrementally modify an existing diagram using a prompt.

    Gemini reads the full current_diagram, understands the structure,
    and returns ONLY the delta (new/changed/removed nodes and edges).
    The frontend merges this delta — preserving all manual edits and positions.
    """
    if not body.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")

    if not body.current_diagram.get("nodes"):
        raise HTTPException(
            status_code=400,
            detail="current_diagram must have at least one node. Generate a diagram first.",
        )

    try:
        delta = await modify_diagram_with_prompt(
            body.prompt.strip(), body.current_diagram
        )
        return delta
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=422, detail=f"Gemini response parse error: {e}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gemini API error: {e}")
