from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from database import init_db, SessionLocal, Rol, Usuario
from routers.auth import hashear_password
from routers import auth, productores, inventario, despacho

app = FastAPI(
    title="Beni-Gan API",
    description="Sistema de gestión de inventario cárnico — Central de Acopio San Borja, Beni",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Archivos estáticos (PDFs, QRs) ───────────────────────────────────────────
static_dir = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(os.path.join(static_dir, "pdfs"), exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# ─── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(productores.router)
app.include_router(inventario.router)
app.include_router(despacho.router)


# ─── Inicialización de datos semilla ──────────────────────────────────────────
def seed_data():
    """Crea roles y usuario admin por defecto si no existen."""
    db = SessionLocal()
    try:
        roles_default = ["Admin", "Recepción", "Cámara", "Ventas"]
        for nombre_rol in roles_default:
            if not db.query(Rol).filter(Rol.nombre == nombre_rol).first():
                db.add(Rol(nombre=nombre_rol))
        db.commit()

        if not db.query(Usuario).filter(Usuario.username == "admin").first():
            rol_admin = db.query(Rol).filter(Rol.nombre == "Admin").first()
            admin = Usuario(
                username="admin",
                password_hash=hashear_password("admin123"),
                nombre_completo="Administrador del Sistema",
                id_rol=rol_admin.id,
            )
            db.add(admin)
            db.commit()
            print("[OK] Usuario admin creado: username=admin, password=admin123")
    finally:
        db.close()


@app.on_event("startup")
def startup_event():
    print("[INFO] Iniciando Beni-Gan API...")
    init_db()
    seed_data()
    print("[INFO] Base de datos lista")


@app.get("/")
def root():
    return {
        "sistema": "Beni-Gan",
        "descripcion": "Sistema de Gestión de Inventario Cárnico",
        "version": "1.0.0",
        "estado": "operativo",
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {"status": "ok"}
