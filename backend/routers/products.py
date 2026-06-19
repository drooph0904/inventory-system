from typing import Annotated, List

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import Product
from schemas import ProductCreate, ProductResponse, ProductUpdate

router = APIRouter()

DbDep = Annotated[AsyncSession, Depends(get_db)]


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(payload: ProductCreate, db: DbDep):
    # Check SKU uniqueness
    result = await db.execute(select(Product).where(Product.sku == payload.sku))
    existing = result.scalars().first()
    if existing:
        raise HTTPException(status_code=409, detail="SKU already exists")

    product = Product(**payload.model_dump())
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return product


@router.get("", response_model=List[ProductResponse])
async def list_products(
    db: DbDep,
    low_stock: bool = Query(False, description="Filter products with quantity < 10"),
):
    stmt = select(Product)
    if low_stock:
        stmt = stmt.where(Product.quantity < 10)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: str, db: DbDep):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalars().first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(product_id: str, payload: ProductUpdate, db: DbDep):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalars().first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    updates = payload.model_dump(exclude_unset=True)

    # Guard: quantity must not go negative
    if "quantity" in updates and updates["quantity"] < 0:
        raise HTTPException(status_code=400, detail="Quantity cannot be negative")

    for field, value in updates.items():
        setattr(product, field, value)

    await db.commit()
    await db.refresh(product)
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(product_id: str, db: DbDep):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalars().first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    await db.delete(product)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
