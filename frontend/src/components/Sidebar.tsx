"use client";
import { useAuth } from "@/lib/auth-context";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "📊", roles: ["Admin", "Cámara", "Recepción", "Ventas"] },
  { href: "/recepcion", label: "Recepción / Ingreso", icon: "📥", roles: ["Admin", "Recepción"] },
  { href: "/despacho", label: "Despacho / Ventas", icon: "📤", roles: ["Admin", "Ventas"] },
  { href: "/productores", label: "Productores", icon: "🧑‍🌾", roles: ["Admin", "Recepción"] },
  { href: "/mermas", label: "Auditoría de Mermas", icon: "⚖️", roles: ["Admin"] },
  { href: "/reportes", label: "Reportes", icon: "📈", roles: ["Admin"] },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  if (!user) return null;

  const navItems = NAV_ITEMS.filter((item) => item.roles.includes(user.rol));
  const initials = user.nombre
    .split(" ")
    .slice(0, 2)
    .map((n: string) => n[0])
    .join("")
    .toUpperCase();

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🥩</div>
        <div>
          <div className="sidebar-logo-text">Beni-Gan</div>
          <div className="sidebar-logo-sub">San Borja, Beni</div>
        </div>
      </div>

      {/* Navegación */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">Módulos</div>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item ${pathname.startsWith(item.href) ? "active" : ""}`}
          >
            <span style={{ fontSize: "1rem" }}>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Footer usuario */}
      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">{user.nombre}</div>
            <div className="user-role">{user.rol}</div>
          </div>
        </div>
        <button
          onClick={logout}
          className="btn btn-secondary btn-sm"
          style={{ width: "100%", marginTop: "0.5rem", justifyContent: "center" }}
        >
          🚪 Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
