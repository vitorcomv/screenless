// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [usuarioLogado, setUsuarioLogado] = useState(localStorage.getItem("usuario"));
  const [fotoUsuario, setFotoUsuario] = useState(localStorage.getItem("fotoUsuario"));

  useEffect(() => {
    const tokenSalvo = localStorage.getItem("token");
    const usuarioSalvo = localStorage.getItem("usuario");

    if (tokenSalvo && usuarioSalvo) {
    try {
      const dados = JSON.parse(usuarioSalvo);
      setToken(tokenSalvo);
      setUsuarioLogado(dados.usuario);
      setFotoUsuario(dados.foto_url);
    } catch (e) {
      console.warn("Falha ao fazer parse do usuário:", usuarioSalvo);
      localStorage.removeItem("usuario");
    }
  }
}, []);

  const login = (tokenRecebido, usuarioRecebido, fotoUrlRecebida = null) => {
    setToken(tokenRecebido);
    setUsuarioLogado(usuarioRecebido);
    setFotoUsuario(fotoUrlRecebida); // Define a foto recebida
    localStorage.setItem("token", tokenRecebido);
    // Salva a foto_url junto com o usuário no localStorage
    localStorage.setItem("usuario", JSON.stringify({ usuario: usuarioRecebido, foto_url: fotoUrlRecebida }));
  };


  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    setToken(null);
    setUsuarioLogado(null);
    setFotoUsuario(null);
  };

  const atualizarFoto = (novaUrl) => {
  setFotoUsuario(novaUrl);
  const usuarioSalvo = JSON.parse(localStorage.getItem("usuario"));
    if (usuarioSalvo) {
      usuarioSalvo.foto_url = novaUrl;
      localStorage.setItem("usuario", JSON.stringify(usuarioSalvo));
    }
  };

  const atualizarUsuario = (novoUsuario, novaFotoUrl) => {
    setUsuarioLogado(novoUsuario);
    setFotoUsuario(novaFotoUrl);
    localStorage.setItem("usuario", novoUsuario);
    localStorage.setItem("fotoUsuario", novaFotoUrl);
  };

  return (
    <AuthContext.Provider value={{ usuarioLogado, fotoUsuario, token, login, logout, atualizarFoto, atualizarUsuario }}>
      {children}
    </AuthContext.Provider>
  );
}