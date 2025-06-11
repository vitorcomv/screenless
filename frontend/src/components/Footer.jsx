import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';
import logoImage from '../assets/logo2.png'; 

export default function Footer() {
  return (
    <footer className="footer-container">
      <div className="footer-content">
        <div className="footer-section about">
          <img src={logoImage} alt="Logo do SeuApp" className="footer-logo-img" />
          <p>
            Desconecte-se. Viva o momento. No Screenless, transforme experiências reais em conquistas e compartilhe sua jornada offline com a comunidade.
          </p>
        </div>
        <div className="footer-section links">
          <h2>Links Rápidos</h2>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/eventos">Eventos</Link></li>
            <li><Link to="/desafios">Desafios</Link></li>
          </ul>
        </div>
        <div className="footer-section contact">
          <h2>Contato</h2>
          <span><i className="fas fa-envelope"></i>screenless.suporte@gmail.com</span>
          {/* Adicione links para redes sociais se desejar */}
        </div>
      </div>
      <div className="footer-bottom">
        &copy; {new Date().getFullYear()} Screenless | Todos os direitos reservados
      </div>
    </footer>
  );
}