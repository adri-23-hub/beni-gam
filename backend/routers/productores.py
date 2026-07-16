from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db, Productor
from schemas import ProductorCreate, ProductorUpdate, ProductorResponse

router = APIRouter(prefix="/api/productores", tags=["Productores"])


@router.get("/", response_model=List[ProductorResponse])
def listar_productores(db: Session = Depends(get_db)):
    return db.query(Productor).filter(Productor.activo == True).all()


@router.post("/", response_model=ProductorResponse, status_code=201)
def crear_productor(data: ProductorCreate, db: Session = Depends(get_db)):
    existente = db.query(Productor).filter(Productor.ci_nit == data.ci_nit).first()
    if existente:
        raise HTTPException(
            status_code=400,
            detail=f"Ya existe un productor con CI/NIT '{data.ci_nit}'. No se permiten duplicados."
        )
    productor = Productor(**data.model_dump())
    db.add(productor)
    db.commit()
    db.refresh(productor)
    return productor


@router.get("/{productor_id}", response_model=ProductorResponse)
def obtener_productor(productor_id: int, db: Session = Depends(get_db)):
    productor = db.query(Productor).filter(Productor.id == productor_id).first()
    if not productor:
        raise HTTPException(status_code=404, detail="Productor no encontrado")
    return productor


@router.put("/{productor_id}", response_model=ProductorResponse)
def actualizar_productor(productor_id: int, data: ProductorUpdate, db: Session = Depends(get_db)):
    productor = db.query(Productor).filter(Productor.id == productor_id).first()
    if not productor:
        raise HTTPException(status_code=404, detail="Productor no encontrado")

    if data.ci_nit and data.ci_nit != productor.ci_nit:
        existente = db.query(Productor).filter(Productor.ci_nit == data.ci_nit).first()
        if existente:
            raise HTTPException(status_code=400, detail=f"CI/NIT '{data.ci_nit}' ya está en uso")

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(productor, field, value)

    db.commit()
    db.refresh(productor)
    return productor


@router.delete("/{productor_id}")
def eliminar_productor(productor_id: int, db: Session = Depends(get_db)):
    productor = db.query(Productor).filter(Productor.id == productor_id).first()
    if not productor:
        raise HTTPException(status_code=404, detail="Productor no encontrado")

    # Verificar si tiene lotes asociados
    if productor.lotes:
        productor.activo = False  # Baja lógica
        db.commit()
        return {"mensaje": "Productor desactivado (tiene lotes asociados, no se puede eliminar)"}

    db.delete(productor)
    db.commit()
    return {"mensaje": "Productor eliminado correctamente"}
