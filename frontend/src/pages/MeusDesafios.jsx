import React, { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
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
    const [paginaAtualCriados, setPaginaAtualCriados] = useState(1);
    const [paginaAtualInscritos, setPaginaAtualInscritos] = useState(1);
    const desafiosPorPagina = 3;
    const token = localStorage.getItem("token");

    // ===== AS FUNÇÕES QUE FALTAVAM ESTÃO AQUI DE VOLTA =====

    useEffect(() => {
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
    
    const desafiosCriadosPaginados = desafiosCriados.slice((paginaAtualCriados - 1) * desafiosPorPagina, paginaAtualCriados * desafiosPorPagina);
    const desafiosInscritosPaginados = desafiosInscritos.slice((paginaAtualInscritos - 1) * desafiosPorPagina, paginaAtualInscritos * desafiosPorPagina);

    const totalPaginasCriados = Math.ceil(desafiosCriados.length / desafiosPorPagina);
    const irParaPaginaCriados = (num) => setPaginaAtualCriados(num);

    const totalPaginasInscritos = Math.ceil(desafiosInscritos.length / desafiosPorPagina);
    const irParaPaginaInscritos = (num) => setPaginaAtualInscritos(num);

    const handleEditarClick = (desafio) => {
        setDesafioEmEdicao(desafio);
    };

    const handleSaveEdicao = (desafioAtualizado) => {
        setDesafiosCriados(prev => prev.map(d => d.ID_DESAFIO === desafioAtualizado.ID_DESAFIO ? desafioAtualizado : d));
        setDesafioEmEdicao(null);
        showAlert({ title: "Sucesso!", message: "Desafio atualizado.", type: 'success' });
    };

    const finalizarDesafio = async (desafioId) => {
        showConfirm({
            title: "Finalizar Desafio",
            message: "Tem certeza que deseja finalizar este desafio? Esta ação não pode ser desfeita.",
            onConfirm: async () => {
                // ... sua lógica de fetch ...
                setDesafiosCriados((prev) => prev.map((d) => d.ID_DESAFIO === desafioId ? { ...d, finalizado: true } : d));
                showAlert({ title: "Finalizado!", message: "O desafio foi marcado como finalizado.", type: 'success' });
            },
        });
    };

    const excluirDesafio = async (desafioId) => {
        showConfirm({
            title: "Excluir Desafio",
            message: <>Você está prestes a remover o desafio permanentemente. <br/><strong>Esta ação não pode ser desfeita.</strong><br/><br/>Deseja continuar?</>,
            onConfirm: async () => {
                // ... sua lógica de fetch ...
                setDesafiosCriados((prev) => prev.filter((d) => d.ID_DESAFIO !== desafioId));
                showAlert({ title: "Excluído!", message: "O desafio foi removido.", type: 'success' });
            },
        });
    };

    const cancelarInscricaoDesafio = async (desafioId) => {
        showConfirm({
            title: "Cancelar Inscrição",
            message: "Tem certeza que deseja cancelar sua inscrição neste desafio?",
            onConfirm: async () => {
                // ... sua lógica de fetch ...
                setDesafiosInscritos((prev) => prev.filter((d) => d.ID_DESAFIO !== desafioId));
                showAlert({ title: "Inscrição Cancelada", message: "Você não está mais inscrito neste desafio.", type: 'info' });
            },
        });
    };
    
    // =============================================================

    if (loadingCriados || loadingInscritos) {
        return <div className="loading">Carregando seus desafios...</div>;
    }

    return (
        <div className="lista-eventos-container">
            {desafioEmEdicao && (
                <FormularioEdicaoDesafio
                    desafioParaEditar={desafioEmEdicao}
                    onSave={handleSaveEdicao}
                    onCancel={() => setDesafioEmEdicao(null)}
                />
            )}
            
            <div id="secao-criados" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h2>Meus Desafios Criados</h2>
                {errorCriados && <p className="feedback-message error">Erro: {errorCriados}</p>}
                {!errorCriados && desafiosCriados.length === 0 ? (
                  <p className="feedback-message empty">Você ainda não criou nenhum desafio.</p>
                ) : (
                  <>
                    <div className="info-paginacao">
                      Mostrando {desafiosCriadosPaginados.length > 0 ? ((paginaAtualCriados - 1) * desafiosPorPagina) + 1 : 0} - {Math.min(paginaAtualCriados * desafiosPorPagina, desafiosCriados.length)} de {desafiosCriados.length} desafios
                    </div>
                    <div className="eventos-grid">
                      {desafiosCriadosPaginados.map((desafio) => (
                        <div className="evento-card" key={desafio.ID_DESAFIO}>
                          <img 
                            src={desafio.foto ? `http://localhost:5000/uploads/${desafio.foto}` : "https://placehold.co/600x400/cccccc/ffffff?text=Sem+Imagem"} 
                            alt={desafio.Titulo}
                            onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/600x400/cccccc/ffffff?text=Imagem+Indisponivel"; }}
                          />
                          <div className="evento-info">
                            <h3>{desafio.Titulo}</h3>
                            <p className="organizador">Organizado por: {desafio.nome_usuario || "Você"}</p>
                            <p className="descricao">{desafio.Descricao}</p>
                            <p className="xp">XP: {desafio.XP}</p>
                          </div>
                          <div className="evento-footer">
                            {desafio.finalizado ? (
                              <p className="status-finalizado">Desafio Finalizado!</p>
                            ) : (
                              <div className="management-actions">
                                <button onClick={() => handleEditarClick(desafio)} className="management-btn editar">Editar</button>
                                <button onClick={() => excluirDesafio(desafio.ID_DESAFIO)} className="management-btn excluir">Excluir</button>
                                <button onClick={() => finalizarDesafio(desafio.ID_DESAFIO)} className="management-btn finalizar">Finalizar</button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {totalPaginasCriados > 1 && (
                      <div className="paginacao" style={{ marginTop: '20px' }}>
                         {/* Lógica de paginação aqui */}
                      </div>
                    )}
                  </>
                )}
            </div>

            <div id="secao-inscritos" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h2 className="titulo-secao-secundaria">Desafios que me Inscrevi</h2>
                {errorInscritos && <p className="feedback-message error">Erro: {errorInscritos}</p>}
                {!errorInscritos && desafiosInscritos.length === 0 ? (
                  <p className="feedback-message empty">Você ainda não está inscrito em nenhum desafio.</p>
                ) : (
                  <>
                    <div className="info-paginacao">
                       Mostrando {desafiosInscritosPaginados.length > 0 ? ((paginaAtualInscritos - 1) * desafiosPorPagina) + 1 : 0} - {Math.min(paginaAtualInscritos * desafiosPorPagina, desafiosInscritos.length)} de {desafiosInscritos.length} desafios
                    </div>
                    <div className="eventos-grid">
                      {desafiosInscritosPaginados.map((desafio) => (
                        <div className="evento-card" key={desafio.ID_DESAFIO}>
                          <img 
                            src={desafio.foto ? `http://localhost:5000/uploads/${desafio.foto}`: "https://placehold.co/600x400/cccccc/ffffff?text=Sem+Imagem"} 
                            alt={desafio.Titulo}
                            onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/600x400/cccccc/ffffff?text=Imagem+Indisponivel"; }}
                          />
                          <div className="evento-info">
                            <h3>{desafio.Titulo}</h3>
                            <p className="organizador">Organizado por: {desafio.nome_usuario || "Anônimo"}</p>
                            <p className="descricao">{desafio.Descricao}</p>
                            <p className="xp">XP: {desafio.XP}</p>
                          </div>
                          <div className="evento-footer">
                            {desafio.finalizado ? (
                              <p className="status-finalizado">Desafio Finalizado!</p>
                            ) : (
                              <button onClick={() => cancelarInscricaoDesafio(desafio.ID_DESAFIO)} className="management-btn cancelar">Cancelar Inscrição</button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {totalPaginasInscritos > 1 && (
                      <div className="paginacao" style={{ marginTop: '20px' }}>
                          {/* Lógica de paginação aqui */}
                      </div>
                    )}
                  </>
                )}
            </div>
        </div>
    );
}