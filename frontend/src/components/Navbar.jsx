import { Link } from 'react-router-dom';
import './Navbar.css';
import logo from '../assets/logo.png';

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="nav-left">
        <img src={logo} alt="Logo" className="logo" />
      </div>
      <div className="nav-center">
        <a href="#comunidade">Comunidade</a>
        <a href="#eventos">Eventos</a>
        <a href="#desafios">Desafios</a>
      </div>
      <div className="nav-right">
        <Link to="/login">Login</Link>
        <Link to="/registro">Cadastro</Link>
      </div>
    </nav>
  );
}
