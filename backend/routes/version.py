from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Any
from services.mongodb_service import save_version, get_versions, restore_version
from services.auth_service import get_current_user

router = APIRouter()


class SaveVersionRequest(BaseModel):
    diagram_id: str
    nodes: list[Any]
    edges: list[Any]
    title: str = "Untitled"
    version_label: str = ""


@router.post("/versions/save")
async def save_diagram_version(body: SaveVersionRequest, current_user: dict = Depends(get_current_user)):
    """Phase 4: Save current diagram as a named version in MongoDB."""
    try:
        doc = await save_version(
            diagram_id=body.diagram_id,
            user_id=current_user["_id"],
            title=body.title,
            nodes=body.nodes,
            edges=body.edges,
            version_label=body.version_label,
        )
        return {"success": True, "version": doc}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save version: {e}")


@router.get("/versions/{diagram_id}")
async def list_diagram_versions(diagram_id: str, current_user: dict = Depends(get_current_user)):
    """Phase 4: List all saved versions for a diagram, newest first."""
    try:
        versions = await get_versions(diagram_id, current_user["_id"])
        return {"versions": versions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list versions: {e}")


@router.get("/versions/restore/{version_id}")
async def restore_diagram_version(version_id: str, current_user: dict = Depends(get_current_user)):
    """Phase 4: Restore a saved diagram version by its MongoDB _id."""
    try:
        doc = await restore_version(version_id, current_user["_id"])
        return {"success": True, "diagram": doc}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to restore version: {e}")
