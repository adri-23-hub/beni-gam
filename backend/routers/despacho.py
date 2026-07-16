from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, func, extract
from datetime import datetime, timezone
from typing import Optional

from database import get_db, LoteCarcasa
from services.pdf_service import generar_remito_despacho, generar_reporte_estadisticas

router = APIRouter(prefix="/api", tags=["Despacho y Mermas"])

UMBRAL_MERMA_PCT = 3.0


@router.post("/despacho")
def registrar_despacho(codigo_qr: str, peso_salida: float, db: Session = Depends(get_db)):
    """Registra despacho, calcula merma y genera PDF de remito."""
    if peso_salida <= 0:
        raise HTTPException(status_code=400, detail="El peso de salida debe ser mayor a 0")

    lote = (
        db.query(LoteCarcasa)
        .options(joinedload(LoteCarcasa.productor))
        .filter(LoteCarcasa.codigo_qr == codigo_qr)
        .first()
    )

    if not lote:
        raise HTTPException(status_code=404, detail=f"No se encontró lote con código QR: {codigo_qr}")

    if lote.estado != "En Cámara":
        raise HTTPException(
            status_code=400,
            detail=f"El lote ya fue despachado (estado: {lote.estado})"
        )

    if peso_salida > lote.peso_ingreso:
        raise HTTPException(
            status_code=400,
            detail=f"El peso de salida ({peso_salida} kg) no puede superar el peso de ingreso ({lote.peso_ingreso} kg)"
        )

    # Calcular merma
    merma = round(lote.peso_ingreso - peso_salida, 3)
    merma_pct = round((merma / lote.peso_ingreso) * 100, 2)

    # Actualizar lote
    lote.peso_salida = round(peso_salida, 3)
    lote.merma = merma
    lote.merma_porcentaje = merma_pct
    lote.estado = "Despachada"
    lote.fecha_hora_despacho = datetime.now(timezone.utc)
    db.commit()
    db.refresh(lote)

    # Generar PDF
    pdf_url = generar_remito_despacho({
        "codigo_qr": lote.codigo_qr,
        "productor_nombre": lote.productor.nombre,
        "productor_estancia": lote.productor.estancia_ubicacion or "-",
        "fecha_hora_ingreso": lote.fecha_hora_ingreso,
        "fecha_hora_despacho": lote.fecha_hora_despacho,
        "peso_ingreso": lote.peso_ingreso,
        "peso_salida": lote.peso_salida,
        "merma": merma,
        "merma_porcentaje": merma_pct,
    })

    return {
        "lote": {
            "id": lote.id,
            "codigo_qr": lote.codigo_qr,
            "peso_ingreso": lote.peso_ingreso,
            "peso_salida": lote.peso_salida,
            "merma": merma,
            "merma_porcentaje": merma_pct,
            "estado": lote.estado,
            "fecha_hora_ingreso": lote.fecha_hora_ingreso,
            "fecha_hora_despacho": lote.fecha_hora_despacho,
            "id_productor": lote.id_productor,
            "productor": {
                "id": lote.productor.id,
                "nombre": lote.productor.nombre,
                "ci_nit": lote.productor.ci_nit,
                "estancia_ubicacion": lote.productor.estancia_ubicacion,
                "activo": lote.productor.activo,
            },
        },
        "pdf_url": pdf_url,
        "merma": merma,
        "merma_porcentaje": merma_pct,
        "alerta_amarilla": merma_pct > UMBRAL_MERMA_PCT,
        "mensaje": f"Lote despachado. Merma: {merma:.3f} kg ({merma_pct:.2f}%)"
    }


@router.get("/mermas")
def auditar_mermas(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Historial de despachos con cálculo de mermas. Marca alertas >3%."""
    lotes = (
        db.query(LoteCarcasa)
        .options(joinedload(LoteCarcasa.productor))
        .filter(LoteCarcasa.estado == "Despachada")
        .order_by(desc(LoteCarcasa.fecha_hora_despacho))
        .offset(skip)
        .limit(limit)
        .all()
    )

    resultado = []
    for l in lotes:
        merma_pct = l.merma_porcentaje or 0
        resultado.append({
            "id": l.id,
            "codigo_qr": l.codigo_qr,
            "productor": l.productor.nombre,
            "peso_ingreso": l.peso_ingreso,
            "peso_salida": l.peso_salida,
            "merma": l.merma,
            "merma_porcentaje": merma_pct,
            "fecha_hora_ingreso": l.fecha_hora_ingreso,
            "fecha_hora_despacho": l.fecha_hora_despacho,
            "alerta_amarilla": merma_pct > UMBRAL_MERMA_PCT,
        })

    total_merma = sum(r["merma"] or 0 for r in resultado)
    alertas_amarillas = sum(1 for r in resultado if r["alerta_amarilla"])

    return {
        "total": len(resultado),
        "alertas_amarillas": alertas_amarillas,
        "total_merma_kg": round(total_merma, 3),
        "lotes": resultado,
    }


@router.get("/reportes")
def obtener_estadisticas(
    agrupacion: str = "mes",  # "mes" o "semana"
    db: Session = Depends(get_db)
):
    """Estadísticas agrupadas de inventario para el reporte gerencial."""

    if agrupacion == "mes":
        grupo = func.to_char(LoteCarcasa.fecha_hora_ingreso, "YYYY-MM")
    else:
        grupo = func.to_char(LoteCarcasa.fecha_hora_ingreso, "IYYY-IW")

    # Ingresos por período
    ingresos = (
        db.query(
            grupo.label("periodo"),
            func.count(LoteCarcasa.id).label("total"),
            func.sum(LoteCarcasa.peso_ingreso).label("peso_total"),
        )
        .group_by("periodo")
        .order_by("periodo")
        .all()
    )

    # Despachos por período
    despachos = (
        db.query(
            grupo.label("periodo"),
            func.count(LoteCarcasa.id).label("total"),
            func.sum(LoteCarcasa.peso_salida).label("peso_total"),
            func.sum(LoteCarcasa.merma).label("merma_total"),
            func.avg(LoteCarcasa.merma_porcentaje).label("merma_prom"),
        )
        .filter(LoteCarcasa.estado == "Despachada")
        .group_by("periodo")
        .order_by("periodo")
        .all()
    )

    # Combinar datos
    despachos_dict = {d.periodo: d for d in despachos}
    estadisticas = []
    for ing in ingresos:
        des = despachos_dict.get(ing.periodo)
        estadisticas.append({
            "periodo": ing.periodo,
            "total_ingresos": ing.total,
            "total_despachos": des.total if des else 0,
            "peso_total_ingresado": round(float(ing.peso_total or 0), 2),
            "peso_total_despachado": round(float(des.peso_total or 0), 2) if des else 0,
            "merma_total": round(float(des.merma_total or 0), 2) if des else 0,
            "merma_promedio_porcentaje": round(float(des.merma_prom or 0), 2) if des else 0,
        })

    # Generar PDF del reporte
    pdf_url = generar_reporte_estadisticas(estadisticas, agrupacion)

    return {
        "agrupacion": agrupacion,
        "estadisticas": estadisticas,
        "pdf_url": pdf_url,
    }
