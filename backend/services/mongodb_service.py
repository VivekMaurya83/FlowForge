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
COLLECTION_NAME = os.environ.get("COLLECTION_NAME", "diagrams")

client: AsyncIOMotorClient | None = None
db = None


def _encode_mongo_uri(uri: str) -> str:
    """
    Percent-encode the username and password in a MongoDB URI so that
    special characters (@ # % : etc.) in credentials don't break parsing.

    Strategy: split on the LAST '@' (host separator), then split user:pass
    on the FIRST ':' — this correctly handles passwords containing '@' or ':'.
    Works for both mongodb:// and mongodb+srv:// schemes.
    """
    if not uri:
        return uri

    # Extract scheme prefix: "mongodb://" or "mongodb+srv://"
    scheme_match = re.match(r"^(mongodb(?:\+srv)?://)", uri)
    if not scheme_match:
        return uri

    scheme_prefix = scheme_match.group(1)
    after_scheme = uri[len(scheme_prefix):]  # "user:pass@host/..."

    # Split on the LAST '@' — everything before it is credentials
    last_at = after_scheme.rfind("@")
    if last_at == -1:
        return uri  # No credentials

    credentials = after_scheme[:last_at]   # "user:pass" (pass may contain @)
    host_and_rest = after_scheme[last_at + 1:]  # "host/db?..."

    # Split credentials on the FIRST ':' only
    colon_pos = credentials.find(":")
    if colon_pos == -1:
        return uri  # No password — nothing to encode

    username = credentials[:colon_pos]
    password = credentials[colon_pos + 1:]

    encoded = (
        f"{scheme_prefix}"
        f"{quote_plus(username)}:{quote_plus(password)}"
        f"@{host_and_rest}"
    )
    return encoded


MONGODB_URI = _encode_mongo_uri(_RAW_URI)


async def connect():
    """Initialize MongoDB connection. Called at FastAPI startup."""
    global client, db
    if not MONGODB_URI:
        raise RuntimeError("MONGODB_URI not set in environment")
    client = AsyncIOMotorClient(MONGODB_URI, tlsCAFile=certifi.where())
    db = client[DB_NAME]
    # Verify connection
    await client.admin.command("ping")
    print(f"✅ MongoDB connected → {DB_NAME}.{COLLECTION_NAME}")


async def disconnect():
    """Close MongoDB connection. Called at FastAPI shutdown."""
    global client
    if client:
        client.close()
        print("🔌 MongoDB disconnected")


def _serialize_doc(doc: dict) -> dict:
    """Convert MongoDB document to JSON-serializable dict."""
    if doc is None:
        return {}
    doc["_id"] = str(doc["_id"])
    return doc


async def save_version(
    diagram_id: str,
    title: str,
    nodes: list,
    edges: list,
    version_label: str = "",
) -> dict:
    """Save a diagram snapshot as a new version in MongoDB."""
    doc = {
        "diagram_id": diagram_id,
        "title": title,
        "nodes": nodes,
        "edges": edges,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version_label": version_label,
    }
    result = await db[COLLECTION_NAME].insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc


async def get_versions(diagram_id: str) -> list:
    """List all versions for a diagram, sorted newest first."""
    cursor = db[COLLECTION_NAME].find(
        {"diagram_id": diagram_id},
        sort=[("timestamp", -1)],
    )
    docs = await cursor.to_list(length=100)
    return [_serialize_doc(d) for d in docs]


async def restore_version(version_id: str) -> dict:
    """Load a specific diagram version by its MongoDB _id."""
    try:
        oid = ObjectId(version_id)
    except Exception:
        raise ValueError(f"Invalid version ID: {version_id}")

    doc = await db[COLLECTION_NAME].find_one({"_id": oid})
    if not doc:
        raise ValueError(f"Version {version_id} not found")
    return _serialize_doc(doc)
