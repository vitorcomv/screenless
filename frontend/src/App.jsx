import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Registro from './pages/Registro';
import Eventos from './pages/Eventos';
import CriarEventos from './pages/CriarEventos';
import Desafios from './pages/Desafios';
import CriarDesafio from './pages/CriarDesafio';
import MeusEventos from "./pages/MeusEventos";

function AppWrapper() {
  const location = useLocation();
  const hideNavbar = location.pathname === '/login' || location.pathname === '/registro';

  return (
    <>
      {!hideNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/eventos" element={<Eventos />} />
        <Route path="/criar-eventos" element={<CriarEventos />} />
        <Route path="/desafios" element={<Desafios />} />
        <Route path="/criar-desafio" element={<CriarDesafio />} />
        <Route path="/meus-eventos" element={<MeusEventos />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AppWrapper />
    </Router>
  );
}
