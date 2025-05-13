// src/components/Navbar.jsx
import React, { useContext } from "react";
import "./Navbar.css";
import logo2 from "../assets/logo2.png";
import { AuthContext } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const { usuarioLogado, logout } = useContext(AuthContext);

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

  const navigate = useNavigate();

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
        <>
          <span>Olá, {usuarioLogado}</span>
          <button onClick={logout}>Sair</button>
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
