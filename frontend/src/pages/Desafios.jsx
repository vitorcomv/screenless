import React, { useState, useEffect } from "react";
import "./Desafios.css";
import exemploImg from "../assets/imagemcard.png";
import { Link } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

export default function ListaDesafios() {
  const [desafios, setDesafios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inscritosDesafiosIds, setInscritosDesafiosIds] = useState([]);
  const token = localStorage.getItem("token");
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    // Decodifica o token para saber quem é o usuário logado
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        setCurrentUserId(decodedToken.id);
      } catch (e) {
        console.error("Erro ao decodificar o token:", e);
      }
    }

    // Busca TODOS os desafios ativos para listar publicamente
    const fetchDesafios = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/desafios");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setDesafios(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    // Busca apenas os IDs dos desafios em que o usuário está inscrito
    const fetchInscricoesDesafiosIds = async () => {
      if (!token) return;
      try {
        const response = await fetch("http://localhost:5000/api/meus_desafios_ids", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Falha ao buscar inscrições");
        const data = await response.json();
        setInscritosDesafiosIds(data);
      } catch (e) {
        console.error("Erro ao buscar IDs de inscrições:", e);
      }
    };

    fetchDesafios();
    fetchInscricoesDesafiosIds();
  }, [token]);

  // A ÚNICA AÇÃO DESTA PÁGINA: Inscrever-se em um desafio
  const inscreverEmDesafio = async (desafioId) => {
    if (!token) {
      alert("Você precisa estar logado para se inscrever.");
      return;
    }
    try {
      const formData = new FormData();
      formData.append('desafio_id', desafioId);

      const response = await fetch("http://localhost:5000/api/inscrever_desafio", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        alert(data.mensagem || "Inscrição realizada com sucesso!");
        setInscritosDesafiosIds((prevInscritos) => [...prevInscritos, desafioId]);
      } else {
        alert(data.erro || "Erro ao se inscrever no desafio.");
      }
    } catch (error) {
      console.error("Erro na requisição de inscrição:", error);
      alert("Ocorreu um erro na comunicação com o servidor.");
    }
  };

  if (loading) {
    return <p className="loading-message">Carregando desafios...</p>;
  }

  if (error) {
    return <p className="error-message">Erro ao carregar desafios: {error}</p>;
  }

  return (
    <div className="desafios-page-wrapper">
      <div className="lista-desafios-container">
        <h2>Próximos Desafios</h2>
        {desafios.length === 0 && !loading && (
          <p className="no-desafios-message">Nenhum desafio encontrado no momento.</p>
        )}
        <div className="desafios-grid">
          {desafios.map((desafio) => {
            const jaInscrito = inscritosDesafiosIds.includes(desafio.ID_DESAFIO);
            const isCriador = currentUserId === desafio.ID_USUARIO;

            return (
              <div className="desafio-card" key={desafio.ID_DESAFIO}>
                <img
                  className="card-image"
                  src={desafio.foto_url || "https://placehold.co/600x400/1f2937/7ca1f0?text=Sem+Imagem"}
                  alt={desafio.Titulo}
                />
                <div className="desafio-info">
                  <h3>{desafio.Titulo}</h3>
                  <div className="autor-container-desafio">
                    <p className="organizador">
                      Criado por: {desafio.autor_nome || "Anônimo"}
                    </p>
                    {desafio.autor_insignia_url && (
                      <img
                        src={desafio.autor_insignia_url}
                        alt="Insígnia do criador"
                        className="insignia-no-card-desafio"
                      />
                    )}
                  </div>
                  <p className="descricao">{desafio.Descricao}</p>
                  <p className="xp">XP: {desafio.XP}</p>
                  
                  {token && !isCriador && (
                    jaInscrito ? (
                      <button className="desafio-btn btn-inscrito" disabled>
                        Inscrito
                      </button>
                    ) : (
                      <button
                        onClick={() => inscreverEmDesafio(desafio.ID_DESAFIO)}
                        className="desafio-btn btn-inscrever"
                      >
                        Inscrever-se
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="div-imagem-fundo">
        <img
          className="imagem-fundo"
          src={exemploImg}
          alt="Imagem de fundo com pessoas colaborando"
        />
        <div className="div_botao">
          <Link to="/criar-desafio">
            <button className="butãoCriarEvento">CRIE SEU DESAFIO</button>
          </Link>
        </div>
      </div>
    </div>
  );
}