# Sistema Beni-Gan — README

## Central de Acopio San Borja, Beni — Sistema de Trazabilidad Cárnica

### Stack Tecnológico
- **Frontend**: Next.js 14 (App Router) + TypeScript → Puerto 3000
- **Backend**: Python FastAPI → Puerto 8000
- **Base de Datos**: PostgreSQL → Puerto 5432
- **ORM**: Prisma (schema en `frontend/prisma/schema.prisma`)

---

## 🚀 Inicio Rápido

### Requisitos previos
1. **PostgreSQL** instalado y corriendo en `localhost:5432`
2. Crear la base de datos: `CREATE DATABASE benigan;`
3. **Node.js** v18+ instalado
4. **Python** 3.10+ instalado

### Pasos de instalación (primera vez)

```bash
# 1. Backend - instalar dependencias
cd backend
pip install -r requirements.txt

# 2. Frontend - instalar dependencias
cd ../frontend
npm install

# 3. Configurar variables de entorno
# Editar backend/.env con tus credenciales de PostgreSQL
# Editar frontend/.env.local con tus credenciales
```

### Iniciar el sistema
**Doble clic en `INICIAR_SISTEMA.bat`** — inicia ambos servidores automáticamente.

O manualmente:
```bash
# Terminal 1 - Backend
cd backend
python -m uvicorn main:app --reload --port 8000

# Terminal 2 - Frontend
cd frontend
npm run dev
```

---

## 📌 Acceso al Sistema

| Servicio | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API (FastAPI) | http://localhost:8000 |
| Documentación API | http://localhost:8000/docs |

### Credenciales por defecto
- **Usuario**: `admin`
- **Contraseña**: `admin123`

### Roles del sistema
| Rol | Permisos |
|-----|---------|
| Admin | Acceso total |
| Recepción | Registrar ingresos, gestionar productores |
| Cámara | Ver dashboard PEPS |
| Ventas | Registrar despachos |

---

## 📋 Módulos

| Módulo | Ruta | Descripción |
|--------|------|-------------|
| Login | `/login` | Autenticación con bloqueo tras 3 intentos |
| Dashboard | `/dashboard` | Inventario PEPS con alerta roja >48h |
| Recepción | `/recepcion` | Ingreso de carcasas + generación QR |
| Despacho | `/despacho` | Registro de salida + cálculo de merma + PDF |
| Productores | `/productores` | CRUD proveedores ganaderos |
| Mermas | `/mermas` | Auditoría con alerta amarilla >3% |
| Reportes | `/reportes` | Gráficos + exportación PDF gerencial |

---

## 🔴 Reglas de Negocio Críticas

1. **Peso mínimo**: `peso_ingreso > 0.2 kg` — rechazado si no cumple
2. **Alerta Roja**: carcasa en cámara > **48 horas** → fila roja parpadeante
3. **Alerta Amarilla**: merma > **3%** → fila amarilla en auditoría
4. **PEPS**: inventario ordenado de más antiguo a más reciente
5. **CI/NIT único**: no se permiten productores duplicados
6. **Bloqueo de cuenta**: 3 intentos fallidos → cuenta bloqueada

---

## 📁 Estructura del Proyecto

```
Sistema BENI GAN/
├── INICIAR_SISTEMA.bat        ← Script de inicio
├── README.md
├── frontend/                  ← Next.js App
│   ├── prisma/
│   │   └── schema.prisma      ← Esquema de BD
│   ├── src/
│   │   ├── app/
│   │   │   ├── login/         ← Módulo 1: Login
│   │   │   └── (app)/
│   │   │       ├── dashboard/ ← Módulo 4: PEPS
│   │   │       ├── recepcion/ ← Módulo 3: Ingreso
│   │   │       ├── despacho/  ← Módulo 5: Ventas
│   │   │       ├── productores/← Módulo 2: CRUD
│   │   │       ├── mermas/    ← Módulo 6: Auditoría
│   │   │       └── reportes/  ← Módulo 7: Reportes
│   │   ├── components/
│   │   │   └── Sidebar.tsx
│   │   └── lib/
│   │       ├── api.ts         ← Cliente FastAPI
│   │       └── auth-context.tsx
│   └── .env.local
└── backend/                   ← FastAPI Python
    ├── main.py                ← App principal
    ├── database.py            ← Modelos SQLAlchemy
    ├── schemas.py             ← Pydantic schemas
    ├── routers/
    │   ├── auth.py            ← Login + JWT
    │   ├── productores.py     ← CRUD productores
    │   ├── inventario.py      ← PEPS + alertas
    │   └── despacho.py        ← Mermas + reportes
    ├── services/
    │   ├── qr_service.py      ← Generación QR
    │   └── pdf_service.py     ← Generación PDF
    └── .env
```
