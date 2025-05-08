import React, { useState, useEffect } from "react";
import "./Eventos.css"; // Crie um arquivo CSS para esta página
import proximaImagem from '../assets/imagemfundo.png'; // Importe sua imagem
import { Link } from "react-router-dom";

export default function ListaEventos() {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEventos = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/eventos");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        // Limitar aos 3 últimos eventos
        const lastThreeEventos = data.slice(-3);
        setEventos(lastThreeEventos);
        setLoading(false);
      } catch (e) {
        setError(e);
        setLoading(false);
      }
    };

    fetchEventos();
  }, []);

  if (loading) {
    return <div>Carregando eventos...</div>;
  }

  if (error) {
    return <div>Erro ao carregar eventos: {error.message}</div>;
  }

  return (
    <div>
    <div className="lista-eventos-container">
      <h2>Próximos Eventos</h2>
      <div className="eventos-grid">
        {eventos.map((evento) => (
          <div className="evento-card" key={evento.ID_EVENTO}>
            {evento.foto && (
              <img
                src={`http://localhost:5000/uploads/${evento.foto}`}
                alt={evento.titulo}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://via.placeholder.com/200x150";
                }}
              />
            )}
            <div className="evento-info">
              <h3>{evento.titulo}</h3>
              <p className="organizador">{evento.organizador}</p>
              <p className="endereco">{evento.endereco}</p>
              <p className="data-hora">{evento.data_hora}</p>
              <p className="xp">xp: 80</p>
            </div>
          </div>
        ))}
      </div>
    </div>
    {/* Nova seção para a imagem */}
    <div className="proxima-imagem">
        <img className="imagem-fundo" src={proximaImagem} alt="Imagem de fundo" style={{ width: '100%', display: 'block' }} />
      <Link to="/criar-eventos"><button className="criar-seu-evento-button"  >CRIE SEU EVENTO</button></Link>
      </div>
    </div>
  );
}