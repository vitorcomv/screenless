// src/components/Navbar.jsx
import React, { useContext } from "react";
import "./Navbar.css";
import logo from "../assets/logo.png";
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
        <img src={logo} alt="logo" className="logo" />
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
        <a href="#eventos">Eventos</a>
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
