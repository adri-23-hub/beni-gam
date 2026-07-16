"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";

interface AuthUser {
  token: string;
  rol: string;
  nombre: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (token: string, rol: string, nombre: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
  isLoading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("bg_token");
    const rol = localStorage.getItem("bg_rol");
    const nombre = localStorage.getItem("bg_nombre");
    if (token && rol && nombre) {
      setUser({ token, rol, nombre });
    }
    setIsLoading(false);
  }, []);

  const login = (token: string, rol: string, nombre: string) => {
    localStorage.setItem("bg_token", token);
    localStorage.setItem("bg_rol", rol);
    localStorage.setItem("bg_nombre", nombre);
    setUser({ token, rol, nombre });
  };

  const logout = () => {
    localStorage.removeItem("bg_token");
    localStorage.removeItem("bg_rol");
    localStorage.removeItem("bg_nombre");
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
