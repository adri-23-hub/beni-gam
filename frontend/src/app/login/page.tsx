"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { loginApi } from "@/lib/api";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await loginApi(username, password);
      login(data.access_token, data.rol, data.nombre);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--color-bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Fondo decorativo */}
      <div
        style={{
          position: "absolute",
          top: "-20%",
          left: "-10%",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(233,69,96,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-20%",
          right: "-10%",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(79,156,249,0.1) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Card login */}
      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-xl)",
          padding: "2.5rem",
          width: "100%",
          maxWidth: "420px",
          boxShadow: "var(--shadow-lg)",
          animation: "slideUp 0.4s ease",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))",
              borderRadius: "var(--radius-lg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2rem",
              margin: "0 auto 1rem",
              boxShadow: "var(--shadow-glow-primary)",
              animation: "pulse-glow 3s ease-in-out infinite",
            }}
          >
            🥩
          </div>
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 800,
              background: "linear-gradient(135deg, #fff, var(--color-text-secondary))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              marginBottom: "0.25rem",
            }}
          >
            Beni-Gan
          </h1>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
            Central de Acopio · San Borja, Beni
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="alert-banner alert-banner-error" style={{ marginBottom: "1.25rem" }}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="username">Usuario</label>
            <input
              id="username"
              type="text"
              className={`input ${error ? "input-error" : ""}`}
              placeholder="Ingresa tu usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </div>

          <div className="form-group" style={{ marginBottom: "1.5rem" }}>
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              className={`input ${error ? "input-error" : ""}`}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: "100%", justifyContent: "center" }}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner" />
                Ingresando...
              </>
            ) : (
              "🔐 Iniciar Sesión"
            )}
          </button>
        </form>

        {/* Info */}
        <div
          style={{
            marginTop: "1.5rem",
            padding: "0.875rem",
            background: "var(--color-surface-2)",
            borderRadius: "var(--radius-md)",
            fontSize: "0.75rem",
            color: "var(--color-text-muted)",
            textAlign: "center",
          }}
        >
          <div style={{ marginBottom: "0.25rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>
            Credenciales de prueba
          </div>
          <code style={{ fontFamily: "var(--font-mono)" }}>admin / admin123</code>
          <div style={{ marginTop: "0.5rem", fontSize: "0.7rem" }}>
            🔒 La cuenta se bloquea tras 3 intentos fallidos
          </div>
        </div>
      </div>
    </div>
  );
}
