from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime


# ─── Auth ──────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    rol: str
    nombre: str


# ─── Productor ─────────────────────────────────────────────────────────────────

class ProductorCreate(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=200)
    ci_nit: str = Field(..., min_length=3, max_length=50)
    estancia_ubicacion: Optional[str] = None


class ProductorUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=2, max_length=200)
    ci_nit: Optional[str] = Field(None, min_length=3, max_length=50)
    estancia_ubicacion: Optional[str] = None


class ProductorResponse(BaseModel):
    id: int
    nombre: str
    ci_nit: str
    estancia_ubicacion: Optional[str]
    activo: bool

    class Config:
        from_attributes = True


# ─── Lote Carcasa ──────────────────────────────────────────────────────────────

class RecepcionCreate(BaseModel):
    peso_ingreso: float = Field(..., gt=0.2, description="Peso debe ser mayor a 0.2 kg")
    id_productor: int
    observaciones: Optional[str] = None

    @field_validator("peso_ingreso")
    @classmethod
    def validar_peso(cls, v):
        if v <= 0.2:
            raise ValueError("El peso de ingreso debe ser estrictamente mayor a 0.2 kg")
        return round(v, 3)


class DespachoCreate(BaseModel):
    codigo_qr: str
    peso_salida: float = Field(..., gt=0)


class LoteResponse(BaseModel):
    id: int
    codigo_qr: str
    peso_ingreso: float
    peso_salida: Optional[float]
    merma: Optional[float]
    merma_porcentaje: Optional[float]
    fecha_hora_ingreso: datetime
    fecha_hora_despacho: Optional[datetime]
    estado: str
    observaciones: Optional[str]
    id_productor: int
    productor: ProductorResponse
    # Campos calculados
    horas_almacenado: Optional[float] = None
    alerta_roja: Optional[bool] = None
    alerta_amarilla: Optional[bool] = None

    class Config:
        from_attributes = True


class RecepcionResponse(BaseModel):
    lote: LoteResponse
    codigo_qr: str
    qr_base64: str  # imagen QR en base64 para mostrar en pantalla
    mensaje: str


class DespachoResponse(BaseModel):
    lote: LoteResponse
    pdf_url: str
    merma: float
    merma_porcentaje: float
    alerta_amarilla: bool
    mensaje: str


# ─── Reportes ──────────────────────────────────────────────────────────────────

class EstadisticaMes(BaseModel):
    periodo: str
    total_ingresos: int
    total_despachos: int
    peso_total_ingresado: float
    peso_total_despachado: float
    merma_total: float
    merma_promedio_porcentaje: float
