"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getProductores, registrarIngreso, getApiUrl } from "@/lib/api";
import { useRouter } from "next/navigation";

interface Productor { id: number; nombre: string; ci_nit: string; estancia_ubicacion?: string; }

export default function RecepcionPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [productores, setProductores] = useState<Productor[]>([]);
  const [form, setForm] = useState({ peso_ingreso: "", id_productor: "", observaciones: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resultado, setResultado] = useState<{
    lote: any; codigo_qr: string; qr_base64: string; mensaje: string;
  } | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
      return;
    }
    if (user) {
      getProductores(user.token).then(setProductores).catch(console.error);
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex-center" style={{ height: "100vh" }}>
        <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
      </div>
    );
  }

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const peso = parseFloat(form.peso_ingreso);
    if (isNaN(peso) || peso <= 0.2) {
      setError("El peso de ingreso debe ser mayor a 0.2 kg");
      return;
    }
    if (!form.id_productor) {
      setError("Selecciona un productor");
      return;
    }
    setLoading(true);
    try {
      const data = await registrarIngreso(
        { peso_ingreso: peso, id_productor: parseInt(form.id_productor), observaciones: form.observaciones },
        user!.token
      );
      setResultado(data);
      setForm({ peso_ingreso: "", id_productor: "", observaciones: "" });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNuevo = () => setResultado(null);

  const handleImprimir = () => window.print();

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">📥 Recepción e Ingreso</h1>
          <p className="page-subtitle">Registra un nuevo lote de carcasa y genera el código QR de trazabilidad</p>
        </div>
      </div>

      {resultado ? (
        /* ─── Resultado QR ─────────────────────────────── */
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <div className="alert-banner alert-banner-success" style={{ marginBottom: "1.5rem" }}>
            ✅ {resultado.mensaje}
          </div>

          <div className="card" style={{ textAlign: "center" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1.5rem", color: "var(--color-text-primary)" }}>
              🏷️ Código QR Generado
            </h2>

            {/* QR Image */}
            <div className="qr-container" style={{ margin: "0 auto 1rem" }}>
              <img
                src={`data:image/png;base64,${resultado.qr_base64}`}
                alt="Código QR"
                style={{ width: 200, height: 200 }}
              />
            </div>
            <div className="qr-code-info">{resultado.codigo_qr}</div>

            {/* Info del lote */}
            <div
              style={{
                background: "var(--color-surface-2)",
                borderRadius: "var(--radius-md)",
                padding: "1rem",
                marginTop: "1.25rem",
                textAlign: "left",
              }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                {[
                  ["Productor", resultado.lote.productor?.nombre],
                  ["Peso ingreso", `${resultado.lote.peso_ingreso} kg`],
                  ["Fecha ingreso", new Date(resultado.lote.fecha_hora_ingreso).toLocaleString("es-BO")],
                  ["Estado", resultado.lote.estado],
                ].map(([label, value]) => (
                  <div key={label}>
                    <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.2rem" }}>{label}</div>
                    <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--color-text-primary)" }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", marginTop: "1.5rem" }}>
              <button className="btn btn-secondary" onClick={handleImprimir}>🖨️ Imprimir QR</button>
              <button className="btn btn-primary" onClick={handleNuevo}>➕ Registrar Otro</button>
            </div>
          </div>
        </div>
      ) : (
        /* ─── Formulario ─────────────────────────────── */
        <div style={{ maxWidth: "560px" }}>
          <div className="card">
            <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1.5rem", color: "var(--color-text-primary)" }}>
              🐄 Datos del Ingreso
            </h2>

            {error && <div className="alert-banner alert-banner-error" style={{ marginBottom: "1rem" }}>⚠️ {error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Productor / Proveedor *</label>
                <select
                  className="input"
                  value={form.id_productor}
                  onChange={(e) => setForm({ ...form, id_productor: e.target.value })}
                  required
                >
                  <option value="">— Seleccionar productor —</option>
                  {productores.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} (CI/NIT: {p.ci_nit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Peso de Ingreso (kg) *</label>
                <input
                  type="number"
                  step="0.001"
                  min="0.201"
                  className="input"
                  placeholder="Ej: 125.500"
                  value={form.peso_ingreso}
                  onChange={(e) => setForm({ ...form, peso_ingreso: e.target.value })}
                  required
                />
                <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>
                  ⚠️ Mínimo 0.200 kg — se rechaza cualquier valor menor o igual
                </span>
              </div>

              <div className="form-group">
                <label>Observaciones</label>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Estado de la carcasa, notas de recepción..."
                  value={form.observaciones}
                  onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                  style={{ resize: "vertical" }}
                />
              </div>

              {/* Regla de negocio visual */}
              <div
                style={{
                  background: "var(--color-surface-2)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  padding: "0.875rem",
                  marginBottom: "1.25rem",
                  fontSize: "0.8rem",
                  color: "var(--color-text-muted)",
                }}
              >
                <strong style={{ color: "var(--color-text-secondary)" }}>ℹ️ Al registrar:</strong>
                <ul style={{ marginTop: "0.4rem", paddingLeft: "1.25rem", lineHeight: "1.8" }}>
                  <li>Se generará un <strong style={{ color: "var(--color-accent)" }}>Código QR único</strong> de trazabilidad</li>
                  <li>El cronómetro PEPS se inicia automáticamente</li>
                  <li>Alerta roja activada si supera las <strong style={{ color: "var(--color-alert-red)" }}>48 horas</strong></li>
                </ul>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                style={{ width: "100%", justifyContent: "center" }}
                disabled={loading}
              >
                {loading ? <><div className="spinner" /> Generando QR...</> : "📸 Registrar y Generar QR"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
