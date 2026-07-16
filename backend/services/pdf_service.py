import os
import io
from datetime import datetime, timezone
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib.colors import HexColor, black, white
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

PDFS_DIR = os.path.join(os.path.dirname(__file__), "..", "static", "pdfs")
os.makedirs(PDFS_DIR, exist_ok=True)

COLOR_PRIMARIO = HexColor("#16213e")
COLOR_ACENTO = HexColor("#e94560")
COLOR_CLARO = HexColor("#f0f0f0")
COLOR_VERDE = HexColor("#0f9b58")
COLOR_AMARILLO = HexColor("#f4a261")


def generar_remito_despacho(lote_data: dict) -> str:
    """
    Genera un PDF de remito/ticket de salida para el despacho.
    Retorna la ruta relativa del PDF generado.
    """
    filename = f"remito_{lote_data['codigo_qr'].replace('-', '_')}.pdf"
    filepath = os.path.join(PDFS_DIR, filename)

    doc = SimpleDocTemplate(
        filepath,
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=2*cm,
        bottomMargin=2*cm
    )

    styles = getSampleStyleSheet()
    elementos = []

    # ─── Encabezado ────────────────────────────────────────────────
    estilo_titulo = ParagraphStyle(
        "titulo",
        fontSize=22,
        textColor=white,
        backColor=COLOR_PRIMARIO,
        alignment=TA_CENTER,
        spaceAfter=4,
        spaceBefore=4,
        leading=28,
        fontName="Helvetica-Bold",
    )
    estilo_subtitulo = ParagraphStyle(
        "subtitulo",
        fontSize=11,
        textColor=HexColor("#a0a0a0"),
        alignment=TA_CENTER,
        spaceAfter=12,
        fontName="Helvetica",
    )
    estilo_seccion = ParagraphStyle(
        "seccion",
        fontSize=12,
        textColor=COLOR_PRIMARIO,
        fontName="Helvetica-Bold",
        spaceBefore=12,
        spaceAfter=4,
    )
    estilo_normal = ParagraphStyle(
        "normal_custom",
        fontSize=10,
        textColor=black,
        fontName="Helvetica",
        leading=16,
    )
    estilo_alerta = ParagraphStyle(
        "alerta",
        fontSize=10,
        textColor=COLOR_ACENTO,
        fontName="Helvetica-Bold",
        alignment=TA_CENTER,
        spaceAfter=6,
    )

    # Título
    elementos.append(Paragraph("🥩 BENI-GAN", estilo_titulo))
    elementos.append(Paragraph("Central de Acopio — San Borja, Beni", estilo_subtitulo))
    elementos.append(Paragraph("REMITO DE DESPACHO / TICKET DE SALIDA", ParagraphStyle(
        "remito_title",
        fontSize=14,
        textColor=COLOR_ACENTO,
        alignment=TA_CENTER,
        fontName="Helvetica-Bold",
        spaceAfter=8,
    )))
    elementos.append(HRFlowable(width="100%", thickness=2, color=COLOR_ACENTO))
    elementos.append(Spacer(1, 0.4*cm))

    # ─── Datos del lote ────────────────────────────────────────────
    fecha_despacho = lote_data.get("fecha_hora_despacho", datetime.now(timezone.utc))
    if isinstance(fecha_despacho, str):
        fecha_despacho = datetime.fromisoformat(fecha_despacho)

    fecha_ingreso = lote_data.get("fecha_hora_ingreso")
    if isinstance(fecha_ingreso, str):
        fecha_ingreso = datetime.fromisoformat(fecha_ingreso)

    merma_pct = lote_data.get("merma_porcentaje", 0)
    alerta_amarilla = merma_pct > 3.0

    datos_tabla = [
        ["Campo", "Valor"],
        ["Código QR / Trazabilidad", lote_data.get("codigo_qr", "")],
        ["Productor", lote_data.get("productor_nombre", "")],
        ["Estancia / Ubicación", lote_data.get("productor_estancia", "-")],
        ["Fecha de Ingreso", fecha_ingreso.strftime("%d/%m/%Y %H:%M") if fecha_ingreso else "-"],
        ["Fecha de Despacho", fecha_despacho.strftime("%d/%m/%Y %H:%M")],
        ["Peso de Ingreso (kg)", f"{lote_data.get('peso_ingreso', 0):.3f} kg"],
        ["Peso de Salida (kg)", f"{lote_data.get('peso_salida', 0):.3f} kg"],
        ["Merma (kg)", f"{lote_data.get('merma', 0):.3f} kg"],
        ["Merma (%)", f"{merma_pct:.2f}%  {'⚠️ ANORMAL' if alerta_amarilla else '✅ Normal'}"],
        ["Estado", "DESPACHADA ✅"],
    ]

    tabla = Table(datos_tabla, colWidths=[6*cm, 10*cm])
    tabla.setStyle(TableStyle([
        # Encabezado
        ("BACKGROUND", (0, 0), (-1, 0), COLOR_PRIMARIO),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 11),
        ("ALIGN", (0, 0), (-1, 0), "CENTER"),
        # Filas
        ("FONTNAME", (0, 1), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 1), (-1, -1), 10),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [COLOR_CLARO, white]),
        ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#cccccc")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        # Resaltar fila de merma si es anormal
        *([("BACKGROUND", (0, 9), (-1, 9), HexColor("#fff3cd")),
           ("TEXTCOLOR", (1, 9), (1, 9), HexColor("#856404"))] if alerta_amarilla else []),
    ]))

    elementos.append(Paragraph("DATOS DEL LOTE", estilo_seccion))
    elementos.append(tabla)
    elementos.append(Spacer(1, 0.5*cm))

    # ─── Alerta si merma anormal ──────────────────────────────────
    if alerta_amarilla:
        elementos.append(Paragraph(
            f"⚠️ ALERTA: Merma del {merma_pct:.2f}% supera el umbral del 3%. "
            "Se recomienda revisión supervisada.",
            estilo_alerta
        ))

    # ─── Pie de página ─────────────────────────────────────────────
    elementos.append(Spacer(1, 1*cm))
    elementos.append(HRFlowable(width="100%", thickness=1, color=HexColor("#cccccc")))
    elementos.append(Spacer(1, 0.3*cm))
    elementos.append(Paragraph(
        f"Documento generado automáticamente — Sistema BENI-GAN | {datetime.now(timezone.utc).strftime('%d/%m/%Y %H:%M')} UTC",
        ParagraphStyle("footer", fontSize=8, textColor=HexColor("#999999"), alignment=TA_CENTER)
    ))

    doc.build(elementos)
    return f"/static/pdfs/{filename}"


def generar_reporte_estadisticas(estadisticas: list, periodo: str) -> str:
    """
    Genera un PDF de reporte gerencial con estadísticas agrupadas.
    """
    filename = f"reporte_{periodo}_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}.pdf"
    filepath = os.path.join(PDFS_DIR, filename)

    doc = SimpleDocTemplate(filepath, pagesize=A4, rightMargin=2*cm, leftMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm)
    elementos = []
    styles = getSampleStyleSheet()

    estilo_titulo = ParagraphStyle("t", fontSize=20, textColor=white, backColor=COLOR_PRIMARIO,
                                   alignment=TA_CENTER, spaceAfter=4, fontName="Helvetica-Bold", leading=26)
    estilo_seccion = ParagraphStyle("s", fontSize=13, textColor=COLOR_PRIMARIO, fontName="Helvetica-Bold",
                                    spaceBefore=12, spaceAfter=4)

    elementos.append(Paragraph("🥩 BENI-GAN — REPORTE GERENCIAL", estilo_titulo))
    elementos.append(Paragraph(f"Central de Acopio San Borja | Período: {periodo}", ParagraphStyle(
        "sub", fontSize=10, textColor=HexColor("#666666"), alignment=TA_CENTER, spaceAfter=12)))
    elementos.append(HRFlowable(width="100%", thickness=2, color=COLOR_ACENTO))
    elementos.append(Spacer(1, 0.5*cm))

    if not estadisticas:
        elementos.append(Paragraph("No hay datos disponibles para el período seleccionado.", styles["Normal"]))
    else:
        elementos.append(Paragraph("RESUMEN ESTADÍSTICO", estilo_seccion))
        encabezado = ["Período", "Ingresos", "Despachos", "Peso Ingr. (kg)", "Peso Desp. (kg)", "Merma Total (kg)", "Merma Prom. (%)"]
        filas = [encabezado]
        for e in estadisticas:
            filas.append([
                e.get("periodo", ""),
                str(e.get("total_ingresos", 0)),
                str(e.get("total_despachos", 0)),
                f"{e.get('peso_total_ingresado', 0):.2f}",
                f"{e.get('peso_total_despachado', 0):.2f}",
                f"{e.get('merma_total', 0):.2f}",
                f"{e.get('merma_promedio_porcentaje', 0):.2f}%",
            ])

        t = Table(filas, repeatRows=1)
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), COLOR_PRIMARIO),
            ("TEXTCOLOR", (0, 0), (-1, 0), white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [COLOR_CLARO, white]),
            ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#cccccc")),
            ("ALIGN", (1, 0), (-1, -1), "CENTER"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ]))
        elementos.append(t)

    elementos.append(Spacer(1, 1*cm))
    elementos.append(HRFlowable(width="100%", thickness=1, color=HexColor("#cccccc")))
    elementos.append(Paragraph(
        f"Generado: {datetime.now(timezone.utc).strftime('%d/%m/%Y %H:%M')} UTC — Sistema BENI-GAN",
        ParagraphStyle("footer", fontSize=8, textColor=HexColor("#999999"), alignment=TA_CENTER)
    ))

    doc.build(elementos)
    return f"/static/pdfs/{filename}"
