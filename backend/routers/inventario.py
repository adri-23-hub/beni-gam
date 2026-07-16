from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, asc
from datetime import datetime, timezone
from typing import List, Optional

from database import get_db, LoteCarcasa, Productor
from schemas import RecepcionCreate, RecepcionResponse, LoteResponse
from services.qr_service import generar_codigo_qr

router = APIRouter(prefix="/api", tags=["Inventario"])

UMBRAL_ALERTA_HORAS = 48.0


def _calcular_horas(fecha_ingreso: datetime) -> float:
    now = datetime.now(timezone.utc)
    if fecha_ingreso.tzinfo is None:
        fecha_ingreso = fecha_ingreso.replace(tzinfo=timezone.utc)
    delta = now - fecha_ingreso
    return delta.total_seconds() / 3600


def _lote_a_response(lote: LoteCarcasa) -> dict:
    horas = _calcular_horas(lote.fecha_hora_ingreso) if lote.estado == "En Cámara" else None
    alerta_roja = (horas is not None and horas > UMBRAL_ALERTA_HORAS)
    alerta_amarilla = (lote.merma_porcentaje is not None and lote.merma_porcentaje > 3.0)

    return {
        "id": lote.id,
        "codigo_qr": lote.codigo_qr,
        "peso_ingreso": lote.peso_ingreso,
        "peso_salida": lote.peso_salida,
        "merma": lote.merma,
        "merma_porcentaje": lote.merma_porcentaje,
        "fecha_hora_ingreso": lote.fecha_hora_ingreso,
        "fecha_hora_despacho": lote.fecha_hora_despacho,
        "estado": lote.estado,
        "observaciones": lote.observaciones,
        "id_productor": lote.id_productor,
        "productor": {
            "id": lote.productor.id,
            "nombre": lote.productor.nombre,
            "ci_nit": lote.productor.ci_nit,
            "estancia_ubicacion": lote.productor.estancia_ubicacion,
            "activo": lote.productor.activo,
        },
        "horas_almacenado": round(horas, 2) if horas is not None else None,
        "alerta_roja": alerta_roja,
        "alerta_amarilla": alerta_amarilla,
    }


# ─── Recepción ─────────────────────────────────────────────────────────────────

@router.post("/recepcion", status_code=201)
def registrar_ingreso(data: RecepcionCreate, db: Session = Depends(get_db)):
    """Registra un nuevo lote/carcasa en la cámara de frío. Genera QR único."""
    productor = db.query(Productor).filter(Productor.id == data.id_productor).first()
    if not productor:
        raise HTTPException(status_code=404, detail="Productor no encontrado")

    # Crear lote temporal para obtener ID
    lote = LoteCarcasa(
        codigo_qr="TEMP",
        peso_ingreso=data.peso_ingreso,
        id_productor=data.id_productor,
        observaciones=data.observaciones,
        estado="En Cámara",
    )
    db.add(lote)
    db.flush()  # Obtener ID sin commit

    # Generar código QR usando el ID real
    codigo_qr, qr_base64 = generar_codigo_qr(lote.id, data.peso_ingreso, productor.nombre)
    lote.codigo_qr = codigo_qr
    db.commit()
    db.refresh(lote)

    return {
        "lote": _lote_a_response(lote),
        "codigo_qr": codigo_qr,
        "qr_base64": qr_base64,
        "mensaje": f"Lote {codigo_qr} registrado exitosamente. Cronómetro PEPS iniciado."
    }


# ─── Dashboard / Inventario ────────────────────────────────────────────────────

@router.get("/inventario")
def obtener_inventario_activo(db: Session = Depends(get_db)):
    """Retorna inventario en cámara ordenado por PEPS (más antiguo primero). Marca alertas >48h."""
    lotes = (
        db.query(LoteCarcasa)
        .options(joinedload(LoteCarcasa.productor))
        .filter(LoteCarcasa.estado == "En Cámara")
        .order_by(asc(LoteCarcasa.fecha_hora_ingreso))  # PEPS: más antiguo primero
        .all()
    )

    resultado = [_lote_a_response(l) for l in lotes]
    alertas_rojas = sum(1 for r in resultado if r["alerta_roja"])

    return {
        "total": len(resultado),
        "alertas_rojas": alertas_rojas,
        "lotes": resultado,
    }


@router.get("/inventario/buscar")
def buscar_lote(codigo_qr: Optional[str] = None, lote_id: Optional[int] = None, db: Session = Depends(get_db)):
    """Busca un lote por código QR o ID para el módulo de despacho."""
    query = db.query(LoteCarcasa).options(joinedload(LoteCarcasa.productor))

    if codigo_qr:
        lote = query.filter(LoteCarcasa.codigo_qr == codigo_qr).first()
    elif lote_id:
        lote = query.filter(LoteCarcasa.id == lote_id).first()
    else:
        raise HTTPException(status_code=400, detail="Proporciona código_qr o lote_id")

    if not lote:
        raise HTTPException(status_code=404, detail="Lote no encontrado")

    return _lote_a_response(lote)


@router.get("/inventario/todos")
def obtener_todos_los_lotes(
    estado: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Historial completo de lotes (para auditoría y reportes)."""
    query = db.query(LoteCarcasa).options(joinedload(LoteCarcasa.productor))
    if estado:
        query = query.filter(LoteCarcasa.estado == estado)
    lotes = query.order_by(desc(LoteCarcasa.fecha_hora_ingreso)).offset(skip).limit(limit).all()
    return [_lote_a_response(l) for l in lotes]
