import React, { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { Link } from "react-router-dom";

import "./MeusDesafios.css";

export default function MeusDesafios() {
  const [desafiosCriados, setDesafiosCriados] = useState([]);
  const [loadingCriados, setLoadingCriados] = useState(true);
  const [errorCriados, setErrorCriados] = useState(null);

  const [desafiosInscritos, setDesafiosInscritos] = useState([]);
  const [loadingInscritos, setLoadingInscritos] = useState(true);
  const [errorInscritos, setErrorInscritos] = useState(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    let currentUserId = null;
    if (token) {
      try {
        currentUserId = jwtDecode(token).id;
      } catch (e) {
        console.error("Erro ao decodificar o token:", e);
      }
    }

    const fetchDesafiosCriados = async () => {
      if (!token) {
        setLoadingCriados(false);
        setErrorCriados("Você precisa estar logado para ver seus desafios criados.");
        return;
      }
      try {
        const response = await fetch("http://localhost:5000/api/desafios_criados", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setDesafiosCriados(data);
      } catch (e) {
        setErrorCriados(e.message);
      } finally {
        setLoadingCriados(false);
      }
    };

    const fetchDesafiosInscritos = async () => {
      if (!token) {
        setLoadingInscritos(false);
        return;
      }
      try {
        const response = await fetch("http://localhost:5000/api/desafios_inscritos", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setDesafiosInscritos(data);
      } catch (e) {
        setErrorInscritos(e.message);
      } finally {
        setLoadingInscritos(false);
      }
    };

    fetchDesafiosCriados();
    fetchDesafiosInscritos();
  }, [token]);

  const finalizarDesafio = async (desafioId) => {
    // ... (lógica da função continua a mesma)
  };

  const editarDesafio = (desafioId) => {
    alert(`Lógica para editar desafio ${desafioId} seria implementada aqui.`);
  };

  const excluirDesafio = async (desafioId) => {
    // ... (lógica da função continua a mesma)
  };

  const cancelarInscricaoDesafio = async (desafioId) => {
    // ... (lógica da função continua a mesma)
  };

  if (loadingCriados || loadingInscritos) {
    return <p className="feedback-message">Carregando seus desafios...</p>;
  }

  if (errorCriados || errorInscritos) {
    return (
      <p className="feedback-message error">
        Erro: {errorCriados} {errorInscritos && `| ${errorInscritos}`}
      </p>
    );
  }

  return (
    <div className="meus-desafios-page">
      <h2 className="section-title">Meus Desafios Criados</h2>
      {desafiosCriados.length === 0 ? (
        <p className="feedback-message empty">Você ainda não criou nenhum desafio.</p>
      ) : (
        <div className="cards-grid">
          {desafiosCriados.map((desafio) => (
            <div className="card-desafio" key={desafio.ID_DESAFIO}>
              <img
                className="card-image"
                src={desafio.foto ? `http://localhost:5000/uploads/${desafio.foto}` : "https://placehold.co/600x400/1f2937/7ca1f0?text=Sem+Imagem"}
                alt={desafio.Titulo}
              />
              <div className="card-info">
                <h3>{desafio.Titulo}</h3>
                <p className="organizador">Organizado por: {desafio.nome_usuario || "Você"}</p>
                <p className="descricao">{desafio.Descricao}</p>
                <p className="xp">XP: {desafio.XP}</p>

                {desafio.finalizado ? (
                  <p className="status-finalizado">Desafio Finalizado!</p>
                ) : (
                  <div className="gerenciamento-botoes">
                    <button onClick={() => editarDesafio(desafio.ID_DESAFIO)} className="btn-gerenciamento btn-editar">
                      Editar Desafio
                    </button>
                    <button onClick={() => excluirDesafio(desafio.ID_DESAFIO)} className="btn-gerenciamento btn-excluir">
                      Excluir Desafio
                    </button>
                    <button onClick={() => finalizarDesafio(desafio.ID_DESAFIO)} className="btn-gerenciamento btn-finalizar">
                      Finalizar Desafio
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 className="section-title inscritos">Desafios que me Inscrevi</h2>
      {desafiosInscritos.length === 0 ? (
        <p className="feedback-message empty">Você ainda não está inscrito em nenhum desafio.</p>
      ) : (
        <div className="cards-grid">
          {desafiosInscritos.map((desafio) => (
            <div className="card-desafio" key={desafio.ID_DESAFIO}>
              <img
                className="card-image"
                src={desafio.foto ? `http://localhost:5000/uploads/${desafio.foto}` : "https://placehold.co/600x400/1f2937/7ca1f0?text=Sem+Imagem"}
                alt={desafio.Titulo}
              />
              <div className="card-info">
                <h3>{desafio.Titulo}</h3>
                <p className="organizador">Organizado por: {desafio.nome_usuario || "Anônimo"}</p>
                <p className="descricao">{desafio.Descricao}</p>
                <p className="xp">XP: {desafio.XP}</p>

                {desafio.finalizado ? (
                  <p className="status-finalizado">Desafio Finalizado!</p>
                ) : (
                  <button onClick={() => cancelarInscricaoDesafio(desafio.ID_DESAFIO)} className="btn-gerenciamento btn-cancelar">
                    Cancelar Inscrição
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}