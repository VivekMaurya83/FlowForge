from fastapi import APIRouter, HTTPException, Depends
from models import DiagramCreate, DiagramUpdate, DiagramResponse
from services.auth_service import get_current_user
from services.mongodb_service import create_diagram, get_diagram, update_diagram, get_user_diagrams, delete_diagram
from typing import List
from datetime import datetime, timezone

router = APIRouter()

@router.post("/", response_model=DiagramResponse)
async def create_new_diagram(diagram_in: DiagramCreate, current_user: dict = Depends(get_current_user)):
    new_doc = await create_diagram(
        user_id=current_user["_id"],
        title=diagram_in.title,
        nodes=diagram_in.nodes,
        edges=diagram_in.edges
    )
    return DiagramResponse(
        id=new_doc["_id"],
        user_id=new_doc["user_id"],
        title=new_doc["title"],
        nodes=new_doc["nodes"],
        edges=new_doc["edges"],
        created_at=new_doc["created_at"],
        updated_at=new_doc["updated_at"],
        current_version=new_doc["current_version"]
    )

@router.get("/list", response_model=List[DiagramResponse])
async def list_diagrams(current_user: dict = Depends(get_current_user)):
    docs = await get_user_diagrams(current_user["_id"])
    results = []
    now = datetime.now(timezone.utc).isoformat()
    for d in docs:
        try:
            results.append(DiagramResponse(
                id=d["_id"],
                user_id=d.get("user_id", current_user["_id"]),
                title=d.get("title", "Untitled Diagram"),
                nodes=d.get("nodes") or [],
                edges=d.get("edges") or [],
                created_at=d.get("created_at", now),
                updated_at=d.get("updated_at", now),
                current_version=d.get("current_version", 1)
            ))
        except Exception as e:
            print(f"⚠️  Skipping malformed diagram {d.get('_id')}: {e}")
    return results

@router.get("/{diagram_id}", response_model=DiagramResponse)
async def get_diagram_by_id(diagram_id: str, current_user: dict = Depends(get_current_user)):
    doc = await get_diagram(diagram_id, current_user["_id"])
    if not doc:
        raise HTTPException(status_code=404, detail="Diagram not found")
    now = datetime.now(timezone.utc).isoformat()
    return DiagramResponse(
        id=doc["_id"],
        user_id=doc.get("user_id", current_user["_id"]),
        title=doc.get("title", "Untitled Diagram"),
        nodes=doc.get("nodes") or [],
        edges=doc.get("edges") or [],
        created_at=doc.get("created_at", now),
        updated_at=doc.get("updated_at", now),
        current_version=doc.get("current_version", 1)
    )

@router.put("/{diagram_id}")
async def update_diagram_by_id(diagram_id: str, diagram_in: DiagramUpdate, current_user: dict = Depends(get_current_user)):
    updates = {k: v for k, v in diagram_in.dict(exclude_unset=True).items()}
    if not updates:
        return {"success": True}
    
    success = await update_diagram(diagram_id, current_user["_id"], updates)
    if not success:
        raise HTTPException(status_code=404, detail="Diagram not found or update failed")
    return {"success": True}

@router.delete("/{diagram_id}")
async def delete_diagram_by_id(diagram_id: str, current_user: dict = Depends(get_current_user)):
    success = await delete_diagram(diagram_id, current_user["_id"])
    if not success:
        raise HTTPException(status_code=404, detail="Diagram not found or delete failed")
    return {"success": True}
