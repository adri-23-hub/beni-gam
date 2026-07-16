from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker
from datetime import datetime, timezone
import os
from dotenv import load_dotenv

from dotenv import load_dotenv

load_dotenv(encoding='utf-8')

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:123456789@localhost:5432/benigan")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Rol(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(50), unique=True, nullable=False)
    usuarios = relationship("Usuario", back_populates="rol")


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    nombre_completo = Column(String(200), nullable=False)
    intentos_fallidos = Column(Integer, default=0)
    bloqueado = Column(Boolean, default=False)
    activo = Column(Boolean, default=True)
    id_rol = Column(Integer, ForeignKey("roles.id"), nullable=False)
    rol = relationship("Rol", back_populates="usuarios")


class Productor(Base):
    __tablename__ = "productores"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(200), nullable=False)
    ci_nit = Column(String(50), unique=True, nullable=False, index=True)
    estancia_ubicacion = Column(String(300), nullable=True)
    activo = Column(Boolean, default=True)
    lotes = relationship("LoteCarcasa", back_populates="productor")


class LoteCarcasa(Base):
    __tablename__ = "lotes_carcasa"

    id = Column(Integer, primary_key=True, index=True)
    codigo_qr = Column(String(255), unique=True, nullable=False, index=True)
    peso_ingreso = Column(Float, nullable=False)
    peso_salida = Column(Float, nullable=True)
    merma = Column(Float, nullable=True)
    merma_porcentaje = Column(Float, nullable=True)
    fecha_hora_ingreso = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    fecha_hora_despacho = Column(DateTime(timezone=True), nullable=True)
    estado = Column(String(50), default="En Cámara", nullable=False)
    observaciones = Column(Text, nullable=True)
    id_productor = Column(Integer, ForeignKey("productores.id"), nullable=False)
    productor = relationship("Productor", back_populates="lotes")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)
