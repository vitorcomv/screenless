import React, { useContext, useRef, useState, useEffect } from "react";
import "./Navbar.css";
import logo2 from "../assets/logo2.png";
import nivelBronze from "../assets/nivel_bronze.png";
import nivelPrata from "../assets/nivel_prata.png";
import nivelOuro from "../assets/nivel_ouro.png";
import { AuthContext } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  // Pegando os dados de XP e Nível direto do Contexto
  const { usuarioLogado, fotoUsuario, logout, xpUsuario, nivelUsuario } = useContext(AuthContext);
  const navigate = useNavigate();
  const [menuAberto, setMenuAberto] = useState(false);
  const menuRef = useRef(null);
  const [erroCarregandoImagem, setErroCarregandoImagem] = useState(false);

  const handleScrollToSection = (id) => {
    if (window.location.pathname !== "/") {
      navigate("/", { state: { scrollTo: id } });
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const toggleMenu = () => {
    setMenuAberto(!menuAberto);
  };

  // CORRIGIDO: Usa 'nivelUsuario' do contexto
  const getNivelImg = () => {
    if (nivelUsuario === "ouro") return nivelOuro;
    if (nivelUsuario === "prata") return nivelPrata;
    return nivelBronze;
  };

  // CORRIGIDO: Usa 'nivelUsuario' do contexto
  const getXpLimite = () => {
    if (nivelUsuario === "ouro") return "∞";
    if (nivelUsuario === "prata") return 2000;
    return 1000;
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuAberto(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  // O useEffect que buscava o XP foi REMOVIDO, pois o AuthContext agora faz isso.

  useEffect(() => {
    setErroCarregandoImagem(false);
  }, [fotoUsuario]);


  return (
    <nav className="navbar">
      <div className="nav-left">
        <Link to="/">
          <img src={logo2} alt="logo" className="logo" />
        </Link>
      </div>

      <div className="nav-center">
        <button className="btn" onClick={() => handleScrollToSection("comunidade")}>
          Comunidade
        </button>
        <button className="btn" onClick={() => navigate("/eventos")}>
          Eventos
        </button>
        <button className="btn" onClick={() => navigate("/desafios")}>
          Desafios
        </button>
      </div>

      <div className="auth">
        {usuarioLogado ? (
          <div className="user-wrapper">
            <div className="nivel-info">
              {/* CORRIGIDO: usa nivelUsuario para o alt text */}
              <img src={getNivelImg()} alt={nivelUsuario} className="nivel-icon" />
              <span>{xpUsuario}/{getXpLimite()}</span>
            </div>

            <div className="user-menu" ref={menuRef}>
              <button onClick={toggleMenu} className="user-button">
                {fotoUsuario && !erroCarregandoImagem ? (
                  <img
                    src={fotoUsuario}
                    alt="avatar"
                    className="avatar"
                    onLoad={() => setErroCarregandoImagem(false)}
                    onError={() => setErroCarregandoImagem(true)}
                  />
                ) : (
                  <span className="avatar-placeholder">
                    {usuarioLogado?.charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="user-nome">{usuarioLogado}</span> ▼
              </button>

              {menuAberto && (
                <div className="dropdown-menu">
                  <Link to="/meu-perfil" onClick={() => setMenuAberto(false)}>Meu Perfil</Link>
                  <Link to="/meus-eventos" onClick={() => setMenuAberto(false)}>Meus Eventos</Link>
                  <Link to="/meus-desafios" onClick={() => setMenuAberto(false)}>Meus Desafios</Link>
                  <Link to="/mural-de-insignias" onClick={() => setMenuAberto(false)}>Mural de Insígnias</Link>
                  <button onClick={handleLogout}>Sair</button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="nav-right">
            <Link to="/login">Login</Link>
            <Link to="/registro">Cadastro</Link>
          </div>
        )}
      </div>
    </nav>
  );
}