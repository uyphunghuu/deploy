"""
Products Router — serves product catalogue data.
GET /api/products       → list all products
GET /api/products/{id}  → get single product
"""
from fastapi import APIRouter, HTTPException

router = APIRouter()

# ── Mock Product Database (mirrors src/agent.py) ───────────────────────────────
PRODUCTS = {
    "PROD-101": {
        "id": "PROD-101",
        "name": "Premium AI Laptop",
        "stock": 5,
        "price": 1200,
        "currency": "USD",
        "description": "High performance laptop optimized for local AI workflows.",
        "category": "Computers",
        "in_stock": True,
    },
    "PROD-102": {
        "id": "PROD-102",
        "name": "Wireless Noise-Cancelling Headphones",
        "stock": 0,
        "price": 250,
        "currency": "USD",
        "description": "Active noise cancelling with 30-hour battery life.",
        "category": "Audio",
        "in_stock": False,
    },
    "PROD-103": {
        "id": "PROD-103",
        "name": "Smart Watch Series 5",
        "stock": 15,
        "price": 350,
        "currency": "USD",
        "description": "Fitness tracking and cellular connectivity.",
        "category": "Wearables",
        "in_stock": True,
    },
}

# ── Endpoints ──────────────────────────────────────────────────────────────────
@router.get("/products")
async def list_products():
    """Return all products in the catalogue."""
    return {
        "total": len(PRODUCTS),
        "products": list(PRODUCTS.values()),
    }

@router.get("/products/{product_id}")
async def get_product(product_id: str):
    """Return a single product by ID."""
    product = PRODUCTS.get(product_id.upper())
    if not product:
        raise HTTPException(
            status_code=404,
            detail={"error": "not_found", "message": f"Product '{product_id}' not found."}
        )
    return product
