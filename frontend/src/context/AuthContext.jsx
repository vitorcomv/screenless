import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [usuarioLogado, setUsuarioLogado] = useState(localStorage.getItem("usuario"));
  const [fotoUsuario, setFotoUsuario] = useState(localStorage.getItem("fotoUsuario"));
  const [insigniaUsuarioUrl, setInsigniaUsuarioUrl] = useState(null); // NOVO: Estado para a insígnia

  useEffect(() => {
    const tokenSalvo = localStorage.getItem("token");
    const usuarioSalvo = localStorage.getItem("usuario");

    if (tokenSalvo && usuarioSalvo) {
      try {
        const dados = JSON.parse(usuarioSalvo);
        setToken(tokenSalvo);
        setUsuarioLogado(dados.usuario);
        setFotoUsuario(dados.foto_url);
        setInsigniaUsuarioUrl(dados.insignia_icone_url); // NOVO: Carrega a insígnia do localStorage
      } catch (e) {
        console.warn("Falha ao fazer parse do usuário:", usuarioSalvo);
        // Limpa dados corrompidos
        localStorage.removeItem("token");
        localStorage.removeItem("usuario");
      }
    }
  }, []);

  // MODIFICADO: A função login agora aceita a URL da insígnia
  const login = (tokenRecebido, usuarioRecebido, fotoUrlRecebida = null, insigniaUrlRecebida = null) => {
    setToken(tokenRecebido);
    setUsuarioLogado(usuarioRecebido);
    setFotoUsuario(fotoUrlRecebida);
    setInsigniaUsuarioUrl(insigniaUrlRecebida); // NOVO: Define a insígnia recebida

    localStorage.setItem("token", tokenRecebido);
    // MODIFICADO: Salva a insígnia junto com os outros dados no localStorage
    localStorage.setItem("usuario", JSON.stringify({ 
        usuario: usuarioRecebido, 
        foto_url: fotoUrlRecebida,
        insignia_icone_url: insigniaUrlRecebida 
    }));
  };


  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    setToken(null);
    setUsuarioLogado(null);
    setFotoUsuario(null);
    setInsigniaUsuarioUrl(null); // NOVO: Limpa o estado da insígnia
  };

  const atualizarFoto = (novaUrl) => {
    setFotoUsuario(novaUrl);
    const usuarioSalvo = JSON.parse(localStorage.getItem("usuario"));
    if (usuarioSalvo) {
      usuarioSalvo.foto_url = novaUrl;
      localStorage.setItem("usuario", JSON.stringify(usuarioSalvo));
    }
  };

  // NOVO: Função para atualizar a insígnia (será útil no futuro)
  const atualizarInsignia = (novaInsigniaUrl) => {
    setInsigniaUsuarioUrl(novaInsigniaUrl);
    const usuarioSalvo = JSON.parse(localStorage.getItem("usuario"));
    if (usuarioSalvo) {
        usuarioSalvo.insignia_icone_url = novaInsigniaUrl;
        localStorage.setItem("usuario", JSON.stringify(usuarioSalvo));
    }
  };


  // A função atualizarUsuario pode ser simplificada ou removida se não for usada.
  const atualizarUsuario = (novoUsuario, novaFotoUrl) => {
    setUsuarioLogado(novoUsuario);
    setFotoUsuario(novaFotoUrl);
    // Esta implementação está incompleta, pois não atualiza o objeto no localStorage corretamente.
    // Sugiro usar as funções específicas `atualizarFoto` e `atualizarInsignia`.
  };

  // MODIFICADO: Expondo os novos valores no Provider
  const providerValue = {
    usuarioLogado,
    fotoUsuario,
    token,
    insigniaUsuarioUrl, // NOVO
    login,
    logout,
    atualizarFoto,
    atualizarInsignia, // NOVO
    atualizarUsuario
  };

  return (
    <AuthContext.Provider value={providerValue}>
      {children}
    </AuthContext.Provider>
  );
}