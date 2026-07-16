"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getInventario } from "@/lib/api";
import { useRouter } from "next/navigation";

interface Lote {
  id: number;
  codigo_qr: string;
  peso_ingreso: number;
  fecha_hora_ingreso: string;
  estado: string;
  horas_almacenado: number;
  alerta_roja: boolean;
  productor: { nombre: string; estancia_ubicacion?: string };
  observaciones?: string;
}

function formatHoras(horas: number): string {
  if (horas < 1) return `${Math.round(horas * 60)} min`;
  if (horas < 24) return `${horas.toFixed(1)}h`;
  const dias = Math.floor(horas / 24);
  const h = Math.round(horas % 24);
  return `${dias}d ${h}h`;
}

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [inventario, setInventario] = useState<{ total: number; alertas_rojas: number; lotes: Lote[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
      return;
    }
    if (user) {
      cargar();
      const interval = setInterval(cargar, 60000); // Refresh cada 1 min
      return () => clearInterval(interval);
    }
  }, [user, isLoading, router]);

  const cargar = async () => {
    try {
      const data = await getInventario(user!.token);
      setInventario(data);
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

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">📊 Dashboard PEPS</h1>
          <p className="page-subtitle">
            Inventario en cámara ordenado por método PEPS (Primero en Entrar, Primero en Salir)
          </p>
        </div>
        <button onClick={cargar} className="btn btn-secondary btn-sm">
          🔄 Actualizar
        </button>
      </div>

      {/* Stats */}
      {inventario && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon primary">🥩</div>
            <div>
              <div className="stat-value">{inventario.total}</div>
              <div className="stat-label">Carcasas en cámara</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon danger">🚨</div>
            <div>
              <div className="stat-value" style={{ color: inventario.alertas_rojas > 0 ? "var(--color-alert-red)" : "inherit" }}>
                {inventario.alertas_rojas}
              </div>
              <div className="stat-label">Alertas rojas (&gt;48h)</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon success">✅</div>
            <div>
              <div className="stat-value">{inventario.total - inventario.alertas_rojas}</div>
              <div className="stat-label">En tiempo normal</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon accent">⚖️</div>
            <div>
              <div className="stat-value">
                {inventario.lotes.reduce((s, l) => s + l.peso_ingreso, 0).toFixed(1)} kg
              </div>
              <div className="stat-label">Peso total en cámara</div>
            </div>
          </div>
        </div>
      )}

      {/* Leyenda */}
      <div className="flex-gap" style={{ marginBottom: "1rem", flexWrap: "wrap" }}>
        <div className="badge badge-red" style={{ padding: "0.35rem 0.75rem" }}>
          🔴 Rojo = más de 48h en cámara
        </div>
        <div className="badge badge-green" style={{ padding: "0.35rem 0.75rem" }}>
          🟢 Normal = dentro de tiempo
        </div>
        <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginLeft: "auto" }}>
          Actualiza automáticamente cada 60 segundos
        </div>
      </div>

      {/* Tabla */}
      <div className="card" style={{ padding: 0 }}>
        {loading && (
          <div className="flex-center" style={{ padding: "3rem" }}>
            <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
          </div>
        )}
        {error && (
          <div className="alert-banner alert-banner-error" style={{ margin: "1rem" }}>
            ⚠️ {error}
          </div>
        )}
        {!loading && !error && inventario && (
          <div className="table-container" style={{ borderRadius: "var(--radius-lg)" }}>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Código QR</th>
                  <th>Productor</th>
                  <th>Estancia</th>
                  <th>Peso Ingreso</th>
                  <th>Fecha Ingreso</th>
                  <th>Tiempo en Cámara</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {inventario.lotes.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="empty-state">
                        <div className="empty-state-icon">📦</div>
                        <div className="empty-state-text">No hay carcasas en cámara actualmente</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  inventario.lotes.map((lote, idx) => (
                    <tr key={lote.id} className={lote.alerta_roja ? "alert-red" : ""}>
                      <td style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{idx + 1}</td>
                      <td>
                        <code style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--color-accent)" }}>
                          {lote.codigo_qr}
                        </code>
                      </td>
                      <td style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>
                        {lote.productor.nombre}
                      </td>
                      <td>{lote.productor.estancia_ubicacion || "—"}</td>
                      <td>
                        <strong style={{ color: "var(--color-text-primary)" }}>{lote.peso_ingreso} kg</strong>
                      </td>
                      <td>{new Date(lote.fecha_hora_ingreso).toLocaleString("es-BO")}</td>
                      <td>
                        <span
                          style={{
                            fontWeight: 700,
                            color: lote.alerta_roja ? "var(--color-alert-red)" : "var(--color-success)",
                          }}
                        >
                          {lote.alerta_roja ? "⚠️" : "✅"} {formatHoras(lote.horas_almacenado)}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${lote.alerta_roja ? "badge-red" : "badge-green"}`}>
                          {lote.alerta_roja ? "🔴 ALERTA" : "🟢 Normal"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
