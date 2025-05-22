// src/components/Navbar.jsx
import React, { useContext, useRef, useState, useEffect } from "react";
import "./Navbar.css";
import logo2 from "../assets/logo2.png";
import { AuthContext } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const { usuarioLogado, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [menuAberto, setMenuAberto] = useState(false);
  const menuRef = useRef(null);

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

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuAberto(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

        <button
          className="btn"
          onClick={() => 
            navigate("/eventos")}
        >
          Eventos
        </button>

        <button
          className="btn"
          onClick={() => 
            navigate("/desafios")}
        >
          Desafios
        </button>
      </div>

      <div className="auth">
        {usuarioLogado ? (
          <div className="user-menu" ref={menuRef}>
            <button onClick={toggleMenu} className="user-button">
              {usuarioLogado} ▼
            </button>
            {menuAberto && (
              <div className="dropdown-menu">
                <Link to="/meus-eventos" onClick={() => setMenuAberto(false)}>Meus Eventos</Link>
                <button onClick={handleLogout}>Sair</button>
              </div>
            )}
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
