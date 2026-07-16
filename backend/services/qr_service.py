import qrcode
import io
import base64
from datetime import datetime, timezone


def generar_codigo_qr(lote_id: int, peso: float, productor: str) -> tuple[str, str]:
    """
    Genera un código QR único para el lote.
    Retorna (codigo_qr_string, imagen_base64)
    """
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S%f")
    codigo = f"BG-{lote_id:05d}-{timestamp}"

    # Contenido embebido en el QR
    contenido_qr = (
        f"BENI-GAN\n"
        f"ID: {lote_id}\n"
        f"Código: {codigo}\n"
        f"Peso: {peso} kg\n"
        f"Productor: {productor}\n"
        f"Ingreso: {datetime.now(timezone.utc).strftime('%d/%m/%Y %H:%M')}"
    )

    # Generar imagen QR
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=8,
        border=4,
    )
    qr.add_data(contenido_qr)
    qr.make(fit=True)

    img = qr.make_image(fill_color="#1a1a2e", back_color="white")

    # Convertir a base64
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    img_base64 = base64.b64encode(buffer.read()).decode("utf-8")

    return codigo, img_base64
