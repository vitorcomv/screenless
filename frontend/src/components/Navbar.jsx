import React, { useContext, useState, useEffect, useRef } from "react";
import "./Navbar.css"; // Usaremos o novo CSS
import logo2 from "../assets/logo2.png";
import nivelBronze from "../assets/nivel_bronze.png";
import nivelPrata from "../assets/nivel_prata.png";
import nivelOuro from "../assets/nivel_ouro.png";
import { AuthContext } from "../context/AuthContext";
import { Link, NavLink, useNavigate } from "react-router-dom";

// Ícone do Menu Hambúrguer
const HamburgerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 16 16">
        <path fillRule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"/>
    </svg>
);

export default function Navbar() {
    const { usuarioLogado, fotoUsuario, logout, xpUsuario, nivelUsuario } = useContext(AuthContext);
    const navigate = useNavigate();
    const [menuAberto, setMenuAberto] = useState(false);
    const [menuMobileAberto, setMenuMobileAberto] = useState(false);
    const menuRef = useRef(null);
    const [erroCarregandoImagem, setErroCarregandoImagem] = useState(false);

    const handleScrollToSection = (id) => {
        setMenuMobileAberto(false); // Fecha o menu mobile ao clicar
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

    const toggleUserMenu = () => setMenuAberto(!menuAberto);
    const toggleMobileMenu = () => setMenuMobileAberto(!menuMobileAberto);

    const getNivelImg = () => {
        if (nivelUsuario === "ouro") return nivelOuro;
        if (nivelUsuario === "prata") return nivelPrata;
        return nivelBronze;
    };

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

    useEffect(() => {
        setErroCarregandoImagem(false);
    }, [fotoUsuario]);

    // Adiciona classe ao body para impedir scroll quando menu mobile está aberto
    useEffect(() => {
        if (menuMobileAberto) {
            document.body.classList.add('no-scroll');
        } else {
            document.body.classList.remove('no-scroll');
        }
    }, [menuMobileAberto]);

    return (
        <nav className="navbar">
            <div className="nav-logo">
                <Link to="/">
                    <img src={logo2} alt="Screenless logo" className="logo" />
                </Link>
            </div>

            {/* Menu para telas grandes */}
            <div className="nav-center-desktop">
                <NavLink to="/#comunidade" onClick={() => handleScrollToSection("comunidade")} className="nav-link">Comunidade</NavLink>
                <NavLink to="/eventos" className="nav-link">Eventos</NavLink>
                <NavLink to="/desafios" className="nav-link">Desafios</NavLink>
                <NavLink to="/sobre-nos" className="nav-link">Sobre Nós</NavLink>
            </div>

            <div className="nav-auth">
                {usuarioLogado ? (
                    <div className="user-wrapper">
                        <div className="nivel-info" title={`${xpUsuario} / ${getXpLimite()} XP`}>
                            <img src={getNivelImg()} alt={`Nível ${nivelUsuario}`} className="nivel-icon" />
                            <span>{xpUsuario} XP</span>
                        </div>
                        <div className="user-menu" ref={menuRef}>
                            <button onClick={toggleUserMenu} className="user-button">
                                {fotoUsuario && !erroCarregandoImagem ? (
                                    <img src={fotoUsuario} alt="Avatar" className="avatar" onError={() => setErroCarregandoImagem(true)} />
                                ) : (
                                    <span className="avatar-placeholder">{usuarioLogado?.charAt(0).toUpperCase()}</span>
                                )}
                                <span className="user-nome">{usuarioLogado}</span>
                                <span className={`dropdown-arrow ${menuAberto ? 'open' : ''}`}>▼</span>
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
                    <div className="nav-login">
                        <Link to="/login" className="nav-button secondary">Login</Link>
                        <Link to="/registro" className="nav-button primary">Cadastro</Link>
                    </div>
                )}
            </div>

            {/* Botão do Menu Hambúrguer para telas pequenas */}
            <div className="nav-hamburger">
                <button onClick={toggleMobileMenu}>
                    <HamburgerIcon />
                </button>
            </div>

            {/* Menu que abre em telas pequenas */}
            {menuMobileAberto && (
                <div className="nav-mobile-menu">
                    <button className="close-mobile-menu" onClick={toggleMobileMenu}>&times;</button>
                    <NavLink to="/#comunidade" onClick={() => handleScrollToSection("comunidade")}>Comunidade</NavLink>
                    <NavLink to="/eventos" onClick={toggleMobileMenu}>Eventos</NavLink>
                    <NavLink to="/desafios" onClick={toggleMobileMenu}>Desafios</NavLink>
                    <NavLink to="/sobre-nos" onClick={toggleMobileMenu}>Sobre Nós</NavLink>
                </div>
            )}
        </nav>
    );
}