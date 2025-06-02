// src/components/Navbar.jsx
import React, { useContext, useRef, useState, useEffect } from "react";
import "./Navbar.css";
import logo2 from "../assets/logo2.png";
import nivelBronze from "../assets/nivel_bronze.png";
import nivelPrata from "../assets/nivel_prata.png";
import nivelOuro from "../assets/nivel_ouro.png";
import { AuthContext } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const { usuarioLogado, fotoUsuario, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [menuAberto, setMenuAberto] = useState(false);
  const menuRef = useRef(null);
  const [xpUsuario, setXpUsuario] = useState(0);
  const [nivel, setNivel] = useState("bronze");

  const handleScrollToSection = (id) => {
    if (window.location.pathname !== "/") {
      navigate("/", { state: { scrollTo: id } });
    } else {
      const section = document.getElementById(id);
      if (section) {
        section.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const toggleMenu = () => {
    setMenuAberto(!menuAberto);
  };

  const getNivelImg = () => {
    if (nivel === "ouro") return nivelOuro;
    if (nivel === "prata") return nivelPrata;
    return nivelBronze;
  };

  const getXpLimite = () => {
    if (nivel === "ouro") return "∞";
    if (nivel === "prata") return 2000;
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

  useEffect(() => {
    if (!usuarioLogado) return;

    const token = localStorage.getItem("token");
    fetch("http://localhost:5000/api/usuario_xp", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const xp = data.xp || 0;
        setXpUsuario(xp);

        if (xp >= 2000) setNivel("ouro");
        else if (xp >= 1000) setNivel("prata");
        else setNivel("bronze");
      })
      .catch((err) => {
        console.error("Erro ao buscar XP:", err);
      });
  }, [usuarioLogado]);

  return (
    <nav className="navbar">
      <div className="nav-left">
        <Link to="/">
          <img src={logo2} alt="logo" className="logo" />
        </Link>
      </div>

      <div className="nav-center">
        <button
          className="btn"
          onClick={(e) => {
            e.preventDefault();
            handleScrollToSection("comunidade");
          }}
        >
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
          <>
            <div className="user-wrapper">
              <div className="nivel-info">
                <img src={getNivelImg()} alt={nivel} className="nivel-icon" />
                <span>{xpUsuario}/{getXpLimite()}</span>
              </div>

              <div className="user-menu" ref={menuRef}>
                <button onClick={toggleMenu} className="user-button">
                  {fotoUsuario ? (
                    <img src={fotoUsuario} alt="avatar" className="avatar" />
                  ) : (
                    <span className="avatar-placeholder">
                      {usuarioLogado?.charAt(0)}
                    </span>
                  )}
                  <span className="user-nome">{usuarioLogado}</span> ▼
                </button>
                {menuAberto && (
                  <div className="dropdown-menu">
                    <Link to="/meu-perfil" onClick={() => setMenuAberto(false)}>
                      Meu Perfil
                    </Link>
                    <Link to="/meus-eventos" onClick={() => setMenuAberto(false)}>
                      Meus Eventos
                    </Link>
                    <Link to="/meus-desafios" onClick={() => setMenuAberto(false)}>
                      Meus Desafios
                    </Link>
                    <button onClick={handleLogout}>Sair</button>
                  </div>
                )}
              </div>
            </div>

          </>
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
