import React, { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate, Link } from "react-router-dom";
import FormularioEdicaoDesafio from "../components/FormularioEdicaoDesafio";
import "./MeusDesafios.css";

export default function MeusDesafios() {
  const navigate = useNavigate();
  const [desafiosCriados, setDesafiosCriados] = useState([]);
  const [loadingCriados, setLoadingCriados] = useState(true);
  const [errorCriados, setErrorCriados] = useState(null);

  const [desafiosInscritos, setDesafiosInscritos] = useState([]);
  const [loadingInscritos, setLoadingInscritos] = useState(true);
  const [errorInscritos, setErrorInscritos] = useState(null);

  const [desafioEmEdicao, setDesafioEmEdicao] = useState(null);

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
    if (!token) {
      alert("Você precisa estar logado para finalizar um desafio.");
      return;
    }

    const confirmFinalizar = window.confirm(
      "Tem certeza que deseja finalizar este desafio? Esta ação não pode ser desfeita."
    );
    if (!confirmFinalizar) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/finalizar_desafio_post/${desafioId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      if (response.ok) {
        alert(data.mensagem || "Desafio finalizado com sucesso!");
        setDesafiosCriados((prevDesafios) =>
          prevDesafios.map((d) =>
            d.ID_DESAFIO === desafioId ? { ...d, finalizado: true } : d
          )
        );
      } else {
        alert(data.erro || "Erro ao finalizar desafio.");
      }
    } catch (error) {
      console.error("Erro na requisição de finalizar desafio:", error);
      alert("Erro na requisição de finalizar desafio. Verifique o console para mais detalhes.");
    }
  };

  const handleEditarClick = (desafio) => {
    setDesafioEmEdicao(desafio);
  };

  // NOVO: Função chamada quando a edição é salva com sucesso
  const handleSaveEdicao = (desafioAtualizado) => {
    setDesafiosCriados(prev => 
      prev.map(d => 
        d.ID_DESAFIO === desafioAtualizado.ID_DESAFIO ? desafioAtualizado : d
      )
    );
    setDesafioEmEdicao(null); // Fecha o modal
  };

  const excluirDesafio = async (desafioId) => {
    if (!token) {
      alert("Você precisa estar logado para excluir um desafio.");
    return;
    }

    const confirmExcluir = window.confirm(
    "Tem certeza que deseja excluir este desafio? Esta ação não pode ser desfeita e removerá todas as inscrições relacionadas."
    );
    if (!confirmExcluir) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/excluir_desafio/${desafioId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (response.ok) {
        alert(data.mensagem || "Desafio excluído com sucesso!");
        setDesafiosCriados((prevDesafios) =>
          prevDesafios.filter((d) => d.ID_DESAFIO !== desafioId)
        );
      } else {
        alert(data.erro || "Erro ao excluir desafio.");
      }
    } catch (error) {
    console.error("Erro na requisição de exclusão de desafio:", error);
    alert("Erro na requisição de exclusão de desafio. Verifique o console para mais detalhes.");
    }
  };
  const cancelarInscricaoDesafio = async (desafioId) => {
    if (!token) {
      alert("Você precisa estar logado para cancelar uma inscrição.");
    return;
    }

    const confirmCancel = window.confirm(
    "Tem certeza que deseja cancelar sua inscrição neste desafio?"
    );
    if (!confirmCancel) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/cancelar_inscricao_desafio/${desafioId}`,
        {
          method: "DELETE", // Ou o método que você definiu para cancelar inscrição
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (response.ok) {
        alert(data.mensagem || "Inscrição cancelada com sucesso!");
        setDesafiosInscritos((prevDesafios) =>
          prevDesafios.filter((d) => d.ID_DESAFIO !== desafioId)
        );
      } else {
        alert(data.erro || "Erro ao cancelar inscrição.");
      }
    } catch (error) {
    console.error("Erro na requisição de cancelar inscrição:", error);
    alert("Erro na requisição de cancelar inscrição. Verifique o console para mais detalhes.");
    }
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
      <div className="meus-desafios-page">
      {/* O formulário modal será renderizado aqui quando um desafio for selecionado */}
      {desafioEmEdicao && (
        <FormularioEdicaoDesafio
          desafioParaEditar={desafioEmEdicao}
          onSave={handleSaveEdicao}
          onCancel={() => setDesafioEmEdicao(null)}
        />
      )}
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
                    <button onClick={() => handleEditarClick(desafio)} className="btn-gerenciamento btn-editar">
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
    </div>
  );
}