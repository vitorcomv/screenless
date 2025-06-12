// src/context/AuthContext.jsx (VERSÃO CORRIGIDA)

import React, { createContext, useState, useEffect, useCallback } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [fotoUsuario, setFotoUsuario] = useState(null);
  const [insigniaUsuarioUrl, setInsigniaUsuarioUrl] = useState(null);
  
  const [xpUsuario, setXpUsuario] = useState(0);
  const [nivelUsuario, setNivelUsuario] = useState('bronze');
  const [loadingAuth, setLoadingAuth] = useState(true);

  // A função 'logout' precisa estar disponível para o useCallback
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    setToken(null);
    setUsuarioLogado(null);
    setFotoUsuario(null);
    setInsigniaUsuarioUrl(null);
    setXpUsuario(0);
    setNivelUsuario('bronze');
  }, []);

  const fetchUsuarioData = useCallback(async (authToken) => {
    if (!authToken) {
      setLoadingAuth(false);
      return;
    }
    try {
      const response = await fetch("https://screenless-8k2p.onrender.com/api/usuario_xp", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!response.ok) throw new Error("Falha ao buscar XP");
      
      const data = await response.json();
      const xp = data.xp || 0;
      setXpUsuario(xp);

      if (xp >= 2000) setNivelUsuario("ouro");
      else if (xp >= 1000) setNivelUsuario("prata");
      else setNivelUsuario("bronze");

    } catch (err) {
      console.error("Erro ao buscar dados do usuário (XP):", err);
      logout();
    }
  }, [logout]);

  useEffect(() => {
    const tokenSalvo = localStorage.getItem("token");
    const usuarioSalvo = localStorage.getItem("usuario");

    if (tokenSalvo && usuarioSalvo) {
      try {
        const dados = JSON.parse(usuarioSalvo);
        setToken(tokenSalvo);
        setUsuarioLogado(dados.usuario);
        setFotoUsuario(dados.foto_url);
        setInsigniaUsuarioUrl(dados.insignia_icone_url);
        fetchUsuarioData(tokenSalvo);
      } catch (e) {
        console.warn("Falha ao fazer parse do usuário:", usuarioSalvo);
        logout();
      }
    }
    setLoadingAuth(false);
  }, [fetchUsuarioData, logout]);

  const login = (tokenRecebido, usuarioRecebido, fotoUrlRecebida = null, insigniaUrlRecebida = null) => {
    localStorage.setItem("token", tokenRecebido);
    localStorage.setItem("usuario", JSON.stringify({ 
        usuario: usuarioRecebido, 
        foto_url: fotoUrlRecebida,
        insignia_icone_url: insigniaUrlRecebida 
    }));
    
    setToken(tokenRecebido);
    setUsuarioLogado(usuarioRecebido);
    setFotoUsuario(fotoUrlRecebida);
    setInsigniaUsuarioUrl(insigniaUrlRecebida);
    
    fetchUsuarioData(tokenRecebido);
  };

  const atualizarFoto = (novaUrl) => {
    setFotoUsuario(novaUrl);
    const usuarioSalvo = JSON.parse(localStorage.getItem("usuario"));
    if (usuarioSalvo) {
      usuarioSalvo.foto_url = novaUrl;
      localStorage.setItem("usuario", JSON.stringify(usuarioSalvo));
    }
  };

  const atualizarInsignia = (novaInsigniaUrl) => {
    setInsigniaUsuarioUrl(novaInsigniaUrl);
    const usuarioSalvo = JSON.parse(localStorage.getItem("usuario"));
    if (usuarioSalvo) {
        usuarioSalvo.insignia_icone_url = novaInsigniaUrl;
        localStorage.setItem("usuario", JSON.stringify(usuarioSalvo));
    }
  };

  const atualizarUsuario = (novoUsuario, novaFotoUrl) => {
    setUsuarioLogado(novoUsuario);
    setFotoUsuario(novaFotoUrl);
  };

  // OBJETO CORRIGIDO: Agora inclui os dados de XP e Nível
  const providerValue = {
    token,
    usuarioLogado,
    fotoUsuario,
    insigniaUsuarioUrl,
    xpUsuario,
    nivelUsuario,
    loadingAuth,
    login,
    logout,
    atualizarFoto,
    atualizarInsignia,
    atualizarUsuario
  };

  return (
    <AuthContext.Provider value={providerValue}>
      {children}
    </AuthContext.Provider>
  );
}