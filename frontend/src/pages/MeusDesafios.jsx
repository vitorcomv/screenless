import React, { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate, Link } from "react-router-dom";
import { useAlert } from "../context/AlertContext";
import FormularioEdicaoDesafio from "../components/FormularioEdicaoDesafio";
import "./MeusDesafios.css";

export default function MeusDesafios() {
  const navigate = useNavigate();
  const { showAlert, showConfirm } = useAlert();

  const [desafiosCriados, setDesafiosCriados] = useState([]);
  const [loadingCriados, setLoadingCriados] = useState(true);
  const [errorCriados, setErrorCriados] = useState(null);

  const [desafiosInscritos, setDesafiosInscritos] = useState([]);
  const [loadingInscritos, setLoadingInscritos] = useState(true);
  const [errorInscritos, setErrorInscritos] = useState(null);

  const [desafioEmEdicao, setDesafioEmEdicao] = useState(null);

  // --- ESTADOS PARA PAGINAÇÃO ---
  const [desafiosCriadosPaginados, setDesafiosCriadosPaginados] = useState([]);
  const [paginaAtualCriados, setPaginaAtualCriados] = useState(1);
  
  const [desafiosInscritosPaginados, setDesafiosInscritosPaginados] = useState([]);
  const [paginaAtualInscritos, setPaginaAtualInscritos] = useState(1);

  const desafiosPorPagina = 3;

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

  // --- EFEITOS PARA ATUALIZAR LISTAS PAGINADAS ---
  useEffect(() => {
    const indiceInicio = (paginaAtualCriados - 1) * desafiosPorPagina;
    const indiceFim = indiceInicio + desafiosPorPagina;
    setDesafiosCriadosPaginados(desafiosCriados.slice(indiceInicio, indiceFim));
  }, [desafiosCriados, paginaAtualCriados]);

  useEffect(() => {
    const indiceInicio = (paginaAtualInscritos - 1) * desafiosPorPagina;
    const indiceFim = indiceInicio + desafiosPorPagina;
    setDesafiosInscritosPaginados(desafiosInscritos.slice(indiceInicio, indiceFim));
  }, [desafiosInscritos, paginaAtualInscritos]);


  // --- LÓGICA DE PAGINAÇÃO PARA DESAFIOS CRIADOS ---
  const totalPaginasCriados = Math.ceil(desafiosCriados.length / desafiosPorPagina);
  const temPaginaAnteriorCriados = paginaAtualCriados > 1;
  const temProximaPaginaCriados = paginaAtualCriados < totalPaginasCriados;
  const irParaPaginaCriados = (num) => {
      setPaginaAtualCriados(num);
      document.querySelector('#secao-criados')?.scrollIntoView({ behavior: 'smooth' });
  };
  const paginaAnteriorCriados = () => { if (temPaginaAnteriorCriados) irParaPaginaCriados(paginaAtualCriados - 1); };
  const proximaPaginaCriados = () => { if (temProximaPaginaCriados) irParaPaginaCriados(paginaAtualCriados + 1); };

  // --- LÓGICA DE PAGINAÇÃO PARA DESAFIOS INSCRITOS ---
  const totalPaginasInscritos = Math.ceil(desafiosInscritos.length / desafiosPorPagina);
  const temPaginaAnteriorInscritos = paginaAtualInscritos > 1;
  const temProximaPaginaInscritos = paginaAtualInscritos < totalPaginasInscritos;
  const irParaPaginaInscritos = (num) => {
      setPaginaAtualInscritos(num);
      document.querySelector('#secao-inscritos')?.scrollIntoView({ behavior: 'smooth' });
  };
  const paginaAnteriorInscritos = () => { if (temPaginaAnteriorInscritos) irParaPaginaInscritos(paginaAtualInscritos - 1); };
  const proximaPaginaInscritos = () => { if (temProximaPaginaInscritos) irParaPaginaInscritos(paginaAtualInscritos + 1); };

  const finalizarDesafio = async (desafioId) => {
    if (!token) {
      showAlert("Você precisa estar logado para finalizar um desafio.", "warning");
      return;
    }

    showConfirm({
      title: "Finalizar Desafio",
      message: "Tem certeza que deseja finalizar este desafio? Esta ação não pode ser desfeita.",
      onConfirm: async () => {
        try {
          const response = await fetch(`http://localhost:5000/api/finalizar_desafio_post/${desafioId}`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          });
          const data = await response.json();
          if (response.ok) {
            showAlert(data.mensagem || "Desafio finalizado com sucesso!", "success");
            setDesafiosCriados((prev) => prev.map((d) => d.ID_DESAFIO === desafioId ? { ...d, finalizado: true } : d));
          } else {
            showAlert(data.erro || "Erro ao finalizar desafio.", "error");
          }
        } catch (error) {
          console.error("Erro na requisição de finalizar desafio:", error);
          showAlert("Erro de conexão ao finalizar desafio.", "error");
        }
      },
    });
  };

  const handleEditarClick = (desafio) => {
    setDesafioEmEdicao(desafio);
  };

  const handleSaveEdicao = (desafioAtualizado) => {
    setDesafiosCriados(prev => prev.map(d => d.ID_DESAFIO === desafioAtualizado.ID_DESAFIO ? desafioAtualizado : d));
    setDesafioEmEdicao(null); // Fecha o modal
    showAlert("Desafio atualizado com sucesso!", "success"); // Feedback para o usuário
  };

  const excluirDesafio = async (desafioId) => {
    if (!token) {
      showAlert("Você precisa estar logado para excluir um desafio.", "warning");
      return;
    }

    showConfirm({
      title: "Excluir Desafio",
      message: "Tem certeza? Esta ação removerá o desafio permanentemente, incluindo todas as inscrições relacionadas.",
      onConfirm: async () => {
        try {
          const response = await fetch(`http://localhost:5000/api/excluir_desafio/${desafioId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await response.json();
          if (response.ok) {
            showAlert(data.mensagem || "Desafio excluído com sucesso!", "success");
            setDesafiosCriados((prev) => prev.filter((d) => d.ID_DESAFIO !== desafioId));
          } else {
            showAlert(data.erro || "Erro ao excluir desafio.", "error");
          }
        } catch (error) {
          console.error("Erro na requisição de exclusão:", error);
          showAlert("Erro de conexão ao excluir desafio.", "error");
        }
      },
    });
  };

  const cancelarInscricaoDesafio = async (desafioId) => {
    if (!token) {
      showAlert("Você precisa estar logado para cancelar uma inscrição.", "warning");
      return;
    }

    showConfirm({
      title: "Cancelar Inscrição",
      message: "Tem certeza que deseja cancelar sua inscrição neste desafio?",
      onConfirm: async () => {
        try {
          const response = await fetch(`http://localhost:5000/api/cancelar_inscricao_desafio/${desafioId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await response.json();
          if (response.ok) {
            showAlert(data.mensagem || "Inscrição cancelada com sucesso!", "success");
            setDesafiosInscritos((prev) => prev.filter((d) => d.ID_DESAFIO !== desafioId));
          } else {
            showAlert(data.erro || "Erro ao cancelar inscrição.", "error");
          }
        } catch (error) {
          console.error("Erro na requisição de cancelar inscrição:", error);
          showAlert("Erro de conexão ao cancelar inscrição.", "error");
        }
      },
    });
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
      {desafioEmEdicao && (
        <FormularioEdicaoDesafio
          desafioParaEditar={desafioEmEdicao}
          onSave={handleSaveEdicao}
          onCancel={() => setDesafioEmEdicao(null)}
        />
      )}
      
      <div id="secao-criados">
        <h2 className="section-title">Meus Desafios Criados</h2>
        {errorCriados && <p className="feedback-message error">Erro: {errorCriados}</p>}
        {!errorCriados && desafiosCriados.length === 0 ? (
          <p className="feedback-message empty">Você ainda não criou nenhum desafio.</p>
        ) : (
          <>
            <div className="info-paginacao">
              Mostrando {desafiosCriadosPaginados.length > 0 ? ((paginaAtualCriados - 1) * desafiosPorPagina) + 1 : 0} - {Math.min(paginaAtualCriados * desafiosPorPagina, desafiosCriados.length)} de {desafiosCriados.length} desafios
            </div>
            <div className="cards-grid">
              {desafiosCriadosPaginados.map((desafio) => (
                <div className="card-desafio" key={desafio.ID_DESAFIO}>
                  <img className="card-image" 
                    src={`http://localhost:5000/uploads/${desafio.foto}` || "https://placehold.co/600x400/1f2937/7ca1f0?text=Sem+Imagem"} 
                    alt={desafio.Titulo}
                    onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/600x400/1f2937/7ca1f0?text=Imagem+Indisponivel"; }}/>
                  <div className="card-info">
                    <h3>{desafio.Titulo}</h3>
                    <p className="organizador">Organizado por: {desafio.nome_usuario || "Você"}</p>
                    <p className="descricao">{desafio.Descricao}</p>
                    <p className="xp">XP: {desafio.XP}</p>
                    {desafio.finalizado ? (
                      <p className="status-finalizado">Desafio Finalizado!</p>
                    ) : (
                      <div className="gerenciamento-botoes">
                        <button onClick={() => handleEditarClick(desafio)} className="btn-gerenciamento btn-editar">Editar</button>
                        <button onClick={() => excluirDesafio(desafio.ID_DESAFIO)} className="btn-gerenciamento btn-excluir">Excluir</button>
                        <button onClick={() => finalizarDesafio(desafio.ID_DESAFIO)} className="btn-gerenciamento btn-finalizar">Finalizar</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {totalPaginasCriados > 1 && (
              <div className="paginacao" style={{ marginTop: '20px' }}>
                <button className="paginacao-btn anterior" onClick={paginaAnteriorCriados} disabled={!temPaginaAnteriorCriados}>← Anterior</button>
                <div className="paginacao-numeros">
                  {Array.from({ length: totalPaginasCriados }, (_, i) => <button key={i+1} className={`paginacao-numero ${paginaAtualCriados === i+1 ? 'ativo' : ''}`} onClick={() => irParaPaginaCriados(i+1)}>{i+1}</button>)}
                </div>
                <button className="paginacao-btn proximo" onClick={proximaPaginaCriados} disabled={!temProximaPaginaCriados}>Próximo →</button>
              </div>
            )}
          </>
        )}
      </div>

      <div id="secao-inscritos">
        <h2 className="section-title inscritos">Desafios que me Inscrevi</h2>
        {errorInscritos && <p className="feedback-message error">Erro: {errorInscritos}</p>}
        {!errorInscritos && desafiosInscritos.length === 0 ? (
          <p className="feedback-message empty">Você ainda não está inscrito em nenhum desafio.</p>
        ) : (
          <>
            <div className="info-paginacao">
              Mostrando {desafiosInscritosPaginados.length > 0 ? ((paginaAtualInscritos - 1) * desafiosPorPagina) + 1 : 0} - {Math.min(paginaAtualInscritos * desafiosPorPagina, desafiosInscritos.length)} de {desafiosInscritos.length} desafios
            </div>
            <div className="cards-grid">
              {desafiosInscritosPaginados.map((desafio) => (
                <div className="card-desafio" key={desafio.ID_DESAFIO}>
                  <img className="card-image" 
                    src={`http://localhost:5000/uploads/${desafio.foto}` || "https://placehold.co/600x400/1f2937/7ca1f0?text=Sem+Imagem"} 
                    alt={desafio.Titulo}
                    onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/600x400/1f2937/7ca1f0?text=Imagem+Indisponivel"; }}
                    />
                  <div className="card-info">
                    <h3>{desafio.Titulo}</h3>
                    <p className="organizador">Organizado por: {desafio.nome_usuario || "Anônimo"}</p>
                    <p className="descricao">{desafio.Descricao}</p>
                    <p className="xp">XP: {desafio.XP}</p>
                    {desafio.finalizado ? (
                      <p className="status-finalizado">Desafio Finalizado!</p>
                    ) : (
                      <button onClick={() => cancelarInscricaoDesafio(desafio.ID_DESAFIO)} className="btn-gerenciamento btn-cancelar">Cancelar Inscrição</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
             {totalPaginasInscritos > 1 && (
              <div className="paginacao" style={{ marginTop: '20px' }}>
                <button className="paginacao-btn anterior" onClick={paginaAnteriorInscritos} disabled={!temPaginaAnteriorInscritos}>← Anterior</button>
                <div className="paginacao-numeros">
                  {Array.from({ length: totalPaginasInscritos }, (_, i) => <button key={i+1} className={`paginacao-numero ${paginaAtualInscritos === i+1 ? 'ativo' : ''}`} onClick={() => irParaPaginaInscritos(i+1)}>{i+1}</button>)}
                </div>
                <button className="paginacao-btn proximo" onClick={proximaPaginaInscritos} disabled={!temProximaPaginaInscritos}>Próximo →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}