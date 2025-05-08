// src/components/Navbar.jsx
import React, { useContext } from "react";
import "./Navbar.css";
import logo2 from "../assets/logo2.png";
import { AuthContext } from "../context/AuthContext";
import { Link } from "react-router-dom";

export default function Navbar() {
  const { usuarioLogado, logout } = useContext(AuthContext);

  const scrollToSection = (id) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav className="navbar">
      <div className="nav-left">
        <Link to="/">
          <img src={logo2} alt="logo" className="logo" />
        </Link>
      </div>
      <div className="nav-center">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            scrollToSection("comunidade");
          }}
        >
          Comunidade
        </a>
        <Link to="/eventos">Eventos</Link>
        <a href="#desafios">Desafios</a>
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
