"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getProductores, crearProductor, actualizarProductor, eliminarProductor } from "@/lib/api";
import { useRouter } from "next/navigation";

interface Productor {
  id: number;
  nombre: string;
  ci_nit: string;
  estancia_ubicacion?: string;
  activo: boolean;
}

const EMPTY_FORM = { nombre: "", ci_nit: "", estancia_ubicacion: "" };

export default function ProductoresPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [productores, setProductores] = useState<Productor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<Productor | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [guardando, setGuardando] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
      return;
    }
    if (user) {
      cargar();
    }
  }, [user, isLoading, router]);

  const cargar = async () => {
    try {
      const data = await getProductores(user!.token);
      setProductores(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-center" style={{ height: "100vh" }}>
        <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
      </div>
    );
  }

  if (!user) return null;

  const abrirNuevo = () => {
    setEditando(null);
    setForm(EMPTY_FORM);
    setError("");
    setShowModal(true);
  };

  const abrirEditar = (p: Productor) => {
    setEditando(p);
    setForm({ nombre: p.nombre, ci_nit: p.ci_nit, estancia_ubicacion: p.estancia_ubicacion || "" });
    setError("");
    setShowModal(true);
  };

  const guardar = async () => {
    if (!form.nombre.trim() || !form.ci_nit.trim()) {
      setError("Nombre y CI/NIT son obligatorios");
      return;
    }
    setGuardando(true);
    setError("");
    try {
      if (editando) {
        await actualizarProductor(editando.id, form, user!.token);
        setSuccess("Productor actualizado correctamente");
      } else {
        await crearProductor(form, user!.token);
        setSuccess("Productor registrado correctamente");
      }
      setShowModal(false);
      cargar();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (id: number) => {
    if (!confirm("¿Confirmas eliminar este productor?")) return;
    try {
      await eliminarProductor(id, user!.token);
      setSuccess("Productor eliminado");
      cargar();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const filtrados = productores.filter(
    (p) =>
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.ci_nit.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">🧑‍🌾 Productores Ganaderos</h1>
          <p className="page-subtitle">Gestión de proveedores ganaderos — CI/NIT único obligatorio</p>
        </div>
        <button onClick={abrirNuevo} className="btn btn-primary">
          ＋ Nuevo Productor
        </button>
      </div>

      {success && <div className="alert-banner alert-banner-success">✅ {success}</div>}
      {error && !showModal && <div className="alert-banner alert-banner-error">⚠️ {error}</div>}

      {/* Búsqueda */}
      <div className="search-bar" style={{ marginBottom: "1.25rem", maxWidth: "380px" }}>
        <svg className="search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          className="input"
          placeholder="Buscar por nombre o CI/NIT..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {/* Tabla */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-container" style={{ borderRadius: "var(--radius-lg)" }}>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>CI / NIT</th>
                <th>Estancia / Ubicación</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6}><div className="flex-center" style={{padding:"2rem"}}><div className="spinner"/></div></td></tr>
              ) : filtrados.length === 0 ? (
                <tr><td colSpan={6}><div className="empty-state"><div className="empty-state-icon">🧑‍🌾</div><div className="empty-state-text">No se encontraron productores</div><button className="btn btn-primary btn-sm" onClick={abrirNuevo}>Registrar primero</button></div></td></tr>
              ) : filtrados.map((p) => (
                <tr key={p.id}>
                  <td><strong style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>#{p.id}</strong></td>
                  <td style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{p.nombre}</td>
                  <td><code style={{ fontFamily: "var(--font-mono)", color: "var(--color-accent)", fontSize: "0.85rem" }}>{p.ci_nit}</code></td>
                  <td>{p.estancia_ubicacion || "—"}</td>
                  <td><span className={`badge ${p.activo ? "badge-green" : "badge-red"}`}>{p.activo ? "Activo" : "Inactivo"}</span></td>
                  <td>
                    <div className="flex-gap">
                      <button className="btn btn-secondary btn-sm" onClick={() => abrirEditar(p)}>✏️ Editar</button>
                      <button className="btn btn-danger btn-sm" onClick={() => eliminar(p.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <h2 className="modal-title">
              {editando ? "✏️ Editar Productor" : "➕ Nuevo Productor"}
            </h2>
            {error && <div className="alert-banner alert-banner-error" style={{marginBottom:"1rem"}}>⚠️ {error}</div>}
            <div className="form-group">
              <label>Nombre completo *</label>
              <input className="input" placeholder="Ej: Juan Mamani Flores" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            </div>
            <div className="form-group">
              <label>CI / NIT *</label>
              <input className="input" placeholder="Ej: 1234567" value={form.ci_nit} onChange={(e) => setForm({ ...form, ci_nit: e.target.value })} />
              <span className="error-msg" style={{ color: "var(--color-text-muted)", fontSize: "0.72rem" }}>
                ℹ️ El CI/NIT debe ser único en el sistema
              </span>
            </div>
            <div className="form-group">
              <label>Estancia / Ubicación</label>
              <input className="input" placeholder="Ej: Estancia El Palmar, km 45" value={form.estancia_ubicacion} onChange={(e) => setForm({ ...form, estancia_ubicacion: e.target.value })} />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={guardar} disabled={guardando}>
                {guardando ? <><div className="spinner" /> Guardando...</> : "💾 Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
