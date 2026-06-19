from typing import Annotated, List

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import Customer
from schemas import CustomerCreate, CustomerResponse, CustomerUpdate

router = APIRouter()

DbDep = Annotated[AsyncSession, Depends(get_db)]


@router.post("", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
async def create_customer(payload: CustomerCreate, db: DbDep):
    # Check email uniqueness
    result = await db.execute(select(Customer).where(Customer.email == payload.email))
    existing = result.scalars().first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already exists")

    customer = Customer(**payload.model_dump())
    db.add(customer)
    await db.commit()
    await db.refresh(customer)
    return customer


@router.get("", response_model=List[CustomerResponse])
async def list_customers(db: DbDep):
    result = await db.execute(select(Customer))
    return result.scalars().all()


@router.get("/{customer_id}", response_model=CustomerResponse)
async def get_customer(customer_id: str, db: DbDep):
    result = await db.execute(select(Customer).where(Customer.id == customer_id))
    customer = result.scalars().first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.put("/{customer_id}", response_model=CustomerResponse)
async def update_customer(customer_id: str, payload: CustomerUpdate, db: DbDep):
    result = await db.execute(select(Customer).where(Customer.id == customer_id))
    customer = result.scalars().first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    updates = payload.model_dump(exclude_unset=True)

    if "email" in updates:
        conflict = await db.execute(
            select(Customer).where(Customer.email == updates["email"], Customer.id != customer_id)
        )
        if conflict.scalars().first():
            raise HTTPException(status_code=409, detail="Email already in use by another customer")

    for field, value in updates.items():
        setattr(customer, field, value)

    await db.commit()
    await db.refresh(customer)
    return customer


@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_customer(customer_id: str, db: DbDep):
    result = await db.execute(select(Customer).where(Customer.id == customer_id))
    customer = result.scalars().first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    await db.delete(customer)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
