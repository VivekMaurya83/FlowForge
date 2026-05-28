from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any

from services.gemini_service import generate_diagram_from_prompt

router = APIRouter()


class GenerateRequest(BaseModel):
    prompt: str


class DiagramResponse(BaseModel):
    nodes: list[Any]
    edges: list[Any]


@router.post("/generate-diagram", response_model=DiagramResponse)
async def generate_diagram(body: GenerateRequest):
    """
    Phase 2: Generate a diagram from a natural language prompt.
    Calls Gemini API and returns structured node/edge JSON ready for React Flow.
    """
    if not body.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")

    try:
        result = await generate_diagram_from_prompt(body.prompt.strip())
        return result
    except RuntimeError as e:
        # API key missing or config issue
        raise HTTPException(status_code=500, detail=str(e))
    except ValueError as e:
        # JSON parse / structure error from Gemini
        raise HTTPException(status_code=422, detail=f"Gemini response parse error: {e}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gemini API error: {e}")
