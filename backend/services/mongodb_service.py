"""
MongoDB Service — Phase 4 fully implemented.

Manages diagram version persistence using MongoDB Atlas with Motor async driver.

Schema:
{
  "diagram_id": "string (UUID from frontend)",
  "title": "string",
  "nodes": [...],
  "edges": [...],
  "timestamp": "ISO datetime (UTC)",
  "version_label": "string (optional)"
}
"""

import os
import re
from datetime import datetime, timezone
from urllib.parse import quote_plus, urlparse, urlunparse
import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

_RAW_URI = os.environ.get("MONGODB_URI", "")
DB_NAME = os.environ.get("DATABASE_NAME", "flowforge_db")
COLLECTION_NAME = os.environ.get("COLLECTION_NAME", "diagram_versions")
USERS_COLLECTION = "users"
DIAGRAMS_COLLECTION = "diagrams"

client: AsyncIOMotorClient | None = None
db = None

def _encode_mongo_uri(uri: str) -> str:
    if not uri:
        return uri
    scheme_match = re.match(r"^(mongodb(?:\+srv)?://)", uri)
    if not scheme_match: return uri
    scheme_prefix = scheme_match.group(1)
    after_scheme = uri[len(scheme_prefix):]
    last_at = after_scheme.rfind("@")
    if last_at == -1: return uri
    credentials = after_scheme[:last_at]
    host_and_rest = after_scheme[last_at + 1:]
    colon_pos = credentials.find(":")
    if colon_pos == -1: return uri
    username = credentials[:colon_pos]
    password = credentials[colon_pos + 1:]
    return f"{scheme_prefix}{quote_plus(username)}:{quote_plus(password)}@{host_and_rest}"

MONGODB_URI = _encode_mongo_uri(_RAW_URI)

async def connect():
    global client, db
    if not MONGODB_URI: raise RuntimeError("MONGODB_URI not set")
    client = AsyncIOMotorClient(MONGODB_URI, tlsCAFile=certifi.where())
    db = client[DB_NAME]
    await client.admin.command("ping")
    # Ensure unique index on email
    await db[USERS_COLLECTION].create_index("email", unique=True)
    print(f"✅ MongoDB connected → {DB_NAME}")

async def disconnect():
    global client
    if client:
        client.close()
        print("🔌 MongoDB disconnected")

def _serialize_doc(doc: dict) -> dict:
    if doc is None: return {}
    doc["_id"] = str(doc["_id"])
    return doc

# ─── USERS ────────────────────────────────────────────────────────────────
async def create_user(name: str, email: str, password_hash: str) -> dict:
    doc = {
        "name": name,
        "email": email,
        "password_hash": password_hash,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db[USERS_COLLECTION].insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc

async def get_user_by_email(email: str) -> dict | None:
    doc = await db[USERS_COLLECTION].find_one({"email": email})
    return _serialize_doc(doc) if doc else None

async def get_user_by_id(user_id: str) -> dict | None:
    try: oid = ObjectId(user_id)
    except Exception: return None
    doc = await db[USERS_COLLECTION].find_one({"_id": oid})
    return _serialize_doc(doc) if doc else None

# ─── DIAGRAMS ─────────────────────────────────────────────────────────────
async def create_diagram(user_id: str, title: str, nodes: list, edges: list) -> dict:
    doc = {
        "user_id": user_id,
        "title": title,
        "nodes": nodes,
        "edges": edges,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "current_version": 1
    }
    result = await db[DIAGRAMS_COLLECTION].insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return _serialize_doc(doc)

async def get_diagram(diagram_id: str, user_id: str) -> dict | None:
    try: oid = ObjectId(diagram_id)
    except Exception: return None
    doc = await db[DIAGRAMS_COLLECTION].find_one({"_id": oid, "user_id": user_id})
    return _serialize_doc(doc) if doc else None

async def update_diagram(diagram_id: str, user_id: str, updates: dict) -> bool:
    try: oid = ObjectId(diagram_id)
    except Exception: return False
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db[DIAGRAMS_COLLECTION].update_one(
        {"_id": oid, "user_id": user_id},
        {"$set": updates}
    )
    return result.modified_count > 0

async def get_user_diagrams(user_id: str) -> list:
    cursor = db[DIAGRAMS_COLLECTION].find(
        {"user_id": user_id},
        sort=[("updated_at", -1)]
    )
    docs = await cursor.to_list(length=100)
    return [_serialize_doc(d) for d in docs]

async def delete_diagram(diagram_id: str, user_id: str) -> bool:
    try: oid = ObjectId(diagram_id)
    except Exception: return False
    result = await db[DIAGRAMS_COLLECTION].delete_one({"_id": oid, "user_id": user_id})
    return result.deleted_count > 0

# ─── VERSIONS ─────────────────────────────────────────────────────────────
async def save_version(diagram_id: str, user_id: str, title: str, nodes: list, edges: list, version_label: str = "") -> dict:
    # Get current version number
    diagram = await get_diagram(diagram_id, user_id)
    if not diagram:
        raise ValueError("Diagram not found or not owned by user")
    
    version_number = diagram.get("current_version", 1) + 1
    await update_diagram(diagram_id, user_id, {"current_version": version_number})
    
    doc = {
        "diagram_id": diagram_id,
        "user_id": user_id,
        "version_number": version_number,
        "title": title,
        "nodes": nodes,
        "edges": edges,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version_label": version_label,
    }
    result = await db[COLLECTION_NAME].insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return _serialize_doc(doc)

async def get_versions(diagram_id: str, user_id: str) -> list:
    cursor = db[COLLECTION_NAME].find(
        {"diagram_id": diagram_id, "user_id": user_id},
        sort=[("timestamp", -1)],
    )
    docs = await cursor.to_list(length=100)
    return [_serialize_doc(d) for d in docs]

async def restore_version(version_id: str, user_id: str) -> dict:
    try: oid = ObjectId(version_id)
    except Exception: raise ValueError(f"Invalid version ID: {version_id}")
    doc = await db[COLLECTION_NAME].find_one({"_id": oid, "user_id": user_id})
    if not doc:
        raise ValueError(f"Version {version_id} not found or access denied")
    return _serialize_doc(doc)
