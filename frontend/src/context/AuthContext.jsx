// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const tokenSalvo = localStorage.getItem("token");
    const usuarioSalvo = localStorage.getItem("usuario");

    if (tokenSalvo && usuarioSalvo) {
      setToken(tokenSalvo);
      setUsuarioLogado(usuarioSalvo);
    }
  }, []);

  const login = (token, usuario) => {
    localStorage.setItem("token", token);
    localStorage.setItem("usuario", usuario);
    setToken(token);
    setUsuarioLogado(usuario);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    setToken(null);
    setUsuarioLogado(null);
  };

  return (
    <AuthContext.Provider value={{ usuarioLogado, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}