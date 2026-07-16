from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from jose import jwt
from passlib.context import CryptContext
import os

from database import get_db, Usuario, Rol
from schemas import TokenResponse

router = APIRouter(prefix="/api/auth", tags=["Auth"])

SECRET_KEY = os.getenv("SECRET_KEY", "beni-gan-secret-key-2024-super-seguro")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480  # 8 horas

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verificar_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def hashear_password(password: str) -> str:
    return pwd_context.hash(password)


def crear_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


@router.post("/login", response_model=TokenResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.username == form_data.username).first()

    if not usuario:
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")

    if usuario.bloqueado:
        raise HTTPException(
            status_code=403,
            detail="Cuenta bloqueada por demasiados intentos fallidos. Contacte al administrador."
        )

    if not verificar_password(form_data.password, usuario.password_hash):
        usuario.intentos_fallidos += 1
        if usuario.intentos_fallidos >= 3:
            usuario.bloqueado = True
            db.commit()
            raise HTTPException(
                status_code=403,
                detail="Cuenta bloqueada después de 3 intentos fallidos."
            )
        db.commit()
        restantes = 3 - usuario.intentos_fallidos
        raise HTTPException(
            status_code=401,
            detail=f"Contraseña incorrecta. Te quedan {restantes} intento(s)."
        )

    # Reset intentos al loguearse bien
    usuario.intentos_fallidos = 0
    db.commit()

    rol = db.query(Rol).filter(Rol.id == usuario.id_rol).first()
    token = crear_token({"sub": usuario.username, "rol": rol.nombre, "uid": usuario.id})

    return TokenResponse(
        access_token=token,
        rol=rol.nombre,
        nombre=usuario.nombre_completo
    )


@router.post("/desbloquear/{usuario_id}")
def desbloquear_usuario(usuario_id: int, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    usuario.bloqueado = False
    usuario.intentos_fallidos = 0
    db.commit()
    return {"mensaje": f"Usuario {usuario.username} desbloqueado exitosamente"}
