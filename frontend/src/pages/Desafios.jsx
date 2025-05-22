import React, { useState, useEffect } from "react";
import "./Desafios.css";
import exemploImg from "../assets/imagemfundo.jpg";
import { Link } from "react-router-dom";

export default function ListaDesafios() {
  const [desafios, setDesafios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDesafios = async () => {
      try {
        const response = await fetch("https://screenless-8k2p.onrender.com/api/desafios");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const lastThreeDesafios = data.slice(-3); // últimos 3
        setDesafios(lastThreeDesafios);
        setLoading(false);
      } catch (e) {
        setError(e);
        setLoading(false);
      }
    };

    fetchDesafios();
  }, []);

  if (loading) {
    return <div>Carregando desafios...</div>;
  }

  if (error) {
    return <div>Erro ao carregar desafios: {error.message}</div>;
  }

  return (
    <div>
      <div className="lista-desafios-container">
        <h2>Próximos Desafios</h2>
        <div className="desafios-grid">
          {desafios.map((desafio) => (
            <div className="desafio-card" key={desafio.ID_DESAFIO}>
              {desafio.foto && (
                <img
                  src={`http://screenless-env.eba-cnrmxhn5.us-east-1.elasticbeanstalk.com/uploads/${desafio.foto}`}
                  alt={desafio.Titulo}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/200x150";
                  }}
                />
              )}
              <div className="desafio-info">
                <h3>{desafio.Titulo}</h3>
                <p className="organizador">{desafio.nome_usuario}</p>
                <p className="descricao">{desafio.Descricao}</p>
                <p className="xp">XP: {desafio.XP}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="proxima-imagem">
        <img className="imagem-fundo" src={exemploImg} alt="Imagem de fundo" style={{ width: "100%", display: "block" }} />
        <Link to="/criar-desafio">
          <button className="criar-seu-desafio-button">CRIE SEU DESAFIO</button>
        </Link>
      </div>
    </div>
  );
}