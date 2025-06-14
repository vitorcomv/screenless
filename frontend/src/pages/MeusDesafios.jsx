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
                const response = await fetch("https://screenless-8k2p.onrender.com/api/desafios_criados", {
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
                const response = await fetch("https://screenless-8k2p.onrender.com/api/desafios_inscritos", {
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

    const handleEditarClick = (desafio) => {
        setDesafioEmEdicao(desafio);
    };

    const handleSaveEdicao = (desafioAtualizado) => {
        setDesafiosCriados(prev => prev.map(d => d.ID_DESAFIO === desafioAtualizado.ID_DESAFIO ? desafioAtualizado : d));
        setDesafioEmEdicao(null);
    showAlert({
          title: "Sucesso!",                     
          message: "O desafio foi atualizado.",        
          type: "success"                           
    });
    };

    const finalizarDesafio = async (desafioId) => {
        showConfirm({
            title: "Finalizar Desafio",
            message: "Tem certeza que deseja finalizar este desafio e distribuir o XP para os participantes? Esta ação não pode ser desfeita.",
            onConfirm: async () => {
                try {
                    // Chama a rota POST correta
                    const response = await fetch(`https://screenless-8k2p.onrender.com/api/finalizar_desafio_post/${desafioId}`, {
                        method: "POST",
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    const data = await response.json();

                    if (response.ok) {
                        // Atualiza o estado local para refletir que o desafio foi finalizado
                        setDesafiosCriados((prev) => prev.map((d) => d.ID_DESAFIO === desafioId ? { ...d, Status: 'finalizado', finalizado: true } : d));
                        showAlert({ title: "Finalizado!", message: data.mensagem || "O desafio foi finalizado com sucesso.", type: 'success' });
                    } else {
                        showAlert({ title: "Erro", message: data.erro || "Não foi possível finalizar o desafio.", type: 'error' });
                    }
                } catch (error) {
                    console.error("Erro ao finalizar desafio:", error);
                    showAlert({ title: "Erro de Conexão", message: "Falha ao comunicar com o servidor.", type: 'error' });
                }
            },
        });
    };

    const excluirDesafio = async (desafioId) => {
        showConfirm({
            title: "Excluir Desafio",
            message: <>Você está prestes a remover o desafio permanentemente. <br/><strong>Esta ação não pode ser desfeita.</strong></>,
            onConfirm: async () => {
                try {
                    // Chama a rota DELETE correta
                    const response = await fetch(`https://screenless-8k2p.onrender.com/api/excluir_desafio/${desafioId}`, {
                        method: "DELETE",
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    const data = await response.json();

                    if (response.ok) {
                        setDesafiosCriados((prev) => prev.filter((d) => d.ID_DESAFIO !== desafioId));
                        showAlert({ title: "Excluído!", message: data.mensagem || "O desafio foi removido.", type: 'success' });
                    } else {
                        showAlert({ title: "Erro", message: data.erro || "Não foi possível excluir o desafio.", type: 'error' });
                    }
                } catch (error) {
                    console.error("Erro ao excluir desafio:", error);
                    showAlert({ title: "Erro de Conexão", message: "Falha ao comunicar com o servidor.", type: 'error' });
                }
            },
        });
    };

    const cancelarInscricaoDesafio = async (desafioId) => {
        showConfirm({
            title: "Cancelar Inscrição",
            message: "Tem certeza que deseja cancelar sua inscrição neste desafio?",
            onConfirm: async () => {
                try {
                    const response = await fetch(`https://screenless-8k2p.onrender.com/api/cancelar_inscricao_desafio/${desafioId}`, {
                        method: "DELETE",
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    const data = await response.json();

                    if (response.ok) {
                        // ATUALIZA A TELA APENAS SE O BACKEND CONFIRMAR
                        setDesafiosInscritos((prev) => prev.filter((d) => d.ID_DESAFIO !== desafioId));
                        showAlert({ title: "Inscrição Cancelada", message: data.mensagem, type: 'success' });
                    } else {
                        // MOSTRA O ERRO RECEBIDO DO BACKEND
                        showAlert({ title: "Erro", message: data.erro, type: 'error' });
                    }
                } catch (error) {
                    console.error("Erro ao cancelar inscrição no desafio:", error);
                    showAlert({ title: "Erro de Conexão", message: "Não foi possível comunicar com o servidor.", type: 'error' });
                }
            },
        });
    };
    
    // ===== LÓGICA DE PAGINAÇÃO (CRIADOS) =====
    const desafiosCriadosPaginados = desafiosCriados.slice((paginaAtualCriados - 1) * desafiosPorPagina, paginaAtualCriados * desafiosPorPagina);
    const totalPaginasCriados = Math.ceil(desafiosCriados.length / desafiosPorPagina);
    const temPaginaAnteriorCriados = paginaAtualCriados > 1;
    const temProximaPaginaCriados = paginaAtualCriados < totalPaginasCriados;
    const irParaPaginaCriados = (num) => {
        setPaginaAtualCriados(num);
        document.querySelector('#secao-criados')?.scrollIntoView({ behavior: 'smooth' });
    };
    const paginaAnteriorCriados = () => { if (temPaginaAnteriorCriados) irParaPaginaCriados(paginaAtualCriados - 1); };
    const proximaPaginaCriados = () => { if (temProximaPaginaCriados) irParaPaginaCriados(paginaAtualCriados + 1); };

    // ===== LÓGICA DE PAGINAÇÃO (INSCRITOS) =====
    const desafiosInscritosPaginados = desafiosInscritos.slice((paginaAtualInscritos - 1) * desafiosPorPagina, paginaAtualInscritos * desafiosPorPagina);
    const totalPaginasInscritos = Math.ceil(desafiosInscritos.length / desafiosPorPagina);
    const temPaginaAnteriorInscritos = paginaAtualInscritos > 1;
    const temProximaPaginaInscritos = paginaAtualInscritos < totalPaginasInscritos;
    const irParaPaginaInscritos = (num) => {
        setPaginaAtualInscritos(num);
        document.querySelector('#secao-inscritos')?.scrollIntoView({ behavior: 'smooth' });
    };
    const paginaAnteriorInscritos = () => { if (temPaginaAnteriorInscritos) irParaPaginaInscritos(paginaAtualInscritos - 1); };
    const proximaPaginaInscritos = () => { if (temProximaPaginaInscritos) irParaPaginaInscritos(paginaAtualInscritos + 1); };

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
                    <p className="feedback-message empty" style={{ color: 'black' }}>Você ainda não criou nenhum desafio.</p>
                ) : (
                    <>
                        <div className="info-paginacao">
                            Mostrando {desafiosCriadosPaginados.length > 0 ? ((paginaAtualCriados - 1) * desafiosPorPagina) + 1 : 0} - {Math.min(paginaAtualCriados * desafiosPorPagina, desafiosCriados.length)} de {desafiosCriados.length} desafios
                        </div>
                        <div className="eventos-grid">
                            {/* ... seu .map() para desafios criados ... */}
                            {desafiosCriadosPaginados.map((desafio) => (
                                <div className="evento-card" key={desafio.ID_DESAFIO}>
                                    <img src={desafio.foto_url || "https://placehold.co/600x400/cccccc/ffffff?text=Sem+Imagem"} alt={desafio.Titulo} onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/600x400/cccccc/ffffff?text=Imagem+Indisponivel"; }}/>
                                    <div className="evento-info">
                                        <h3>{desafio.Titulo}</h3>
                                        <p className="organizador">Organizado por: {desafio.nome_usuario || "Você"}</p>
                                        <p className="descricao">{desafio.Descricao}</p>
                                        <p className="xp">XP: {desafio.XP}</p>
                                    </div>
                                    <div className="evento-footer">
                                        {desafio.finalizado ? (<p className="status-finalizado">Desafio Finalizado!</p>) : (<div className="management-actions"><button onClick={() => handleEditarClick(desafio)} className="management-btn editar">Editar</button><button onClick={() => excluirDesafio(desafio.ID_DESAFIO)} className="management-btn excluir">Excluir</button><button onClick={() => finalizarDesafio(desafio.ID_DESAFIO)} className="management-btn finalizar">Finalizar</button></div>)}
                                    </div>
                                </div>
                            ))}
                        </div>
                        {/* ===== CÓDIGO DA PAGINAÇÃO CRIADOS ADICIONADO ===== */}
                        {totalPaginasCriados > 1 && (
                            <div className="paginacao" style={{ marginTop: '20px' }}>
                                <button className="paginacao-btn anterior" onClick={paginaAnteriorCriados} disabled={!temPaginaAnteriorCriados}>← Anterior</button>
                                <div className="paginacao-numeros">
                                    {Array.from({ length: totalPaginasCriados }, (_, i) => (
                                        <button key={`criados-${i + 1}`} className={`paginacao-numero ${paginaAtualCriados === i + 1 ? 'ativo' : ''}`} onClick={() => irParaPaginaCriados(i + 1)}>{i + 1}</button>
                                    ))}
                                </div>
                                <button className="paginacao-btn proximo" onClick={proximaPaginaCriados} disabled={!temProximaPaginaCriados}>Próximo →</button>
                            </div>
                        )}
                    </>
                )}
            </div>

            <div id="secao-inscritos" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h2 className="titulo-secao-secundaria">Desafios que me Inscrevi</h2>
                {errorInscritos && <p className="feedback-message error">Erro: {errorInscritos}</p>}
                {!errorInscritos && desafiosInscritos.length === 0 ? (
                    <p className="feedback-message-empty" style={{ color: 'black' }}>Você ainda não está inscrito em nenhum desafio.</p>
                ) : (
                    <>
                        <div className="info-paginacao">
                           Mostrando {desafiosInscritosPaginados.length > 0 ? ((paginaAtualInscritos - 1) * desafiosPorPagina) + 1 : 0} - {Math.min(paginaAtualInscritos * desafiosPorPagina, desafiosInscritos.length)} de {desafiosInscritos.length} desafios
                        </div>
                        <div className="eventos-grid">
                            {/* ... seu .map() para desafios inscritos ... */}
                            {desafiosInscritosPaginados.map((desafio) => (
                                <div className="evento-card" key={desafio.ID_DESAFIO}>
                                    <img src={desafio.foto_url || "https://placehold.co/600x400/cccccc/ffffff?text=Sem+Imagem"} alt={desafio.Titulo} onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/600x400/cccccc/ffffff?text=Imagem+Indisponivel"; }}/>
                                    <div className="evento-info">
                                        <h3>{desafio.Titulo}</h3>
                                        <p className="organizador">Organizado por: {desafio.nome_usuario || "Anônimo"}</p>
                                        <p className="descricao">{desafio.Descricao}</p>
                                        <p className="xp">XP: {desafio.XP}</p>
                                    </div>
                                    <div className="evento-footer">
                                        {desafio.finalizado ? (<p className="status-finalizado">Desafio Finalizado!</p>) : (<button onClick={() => cancelarInscricaoDesafio(desafio.ID_DESAFIO)} className="management-btn cancelar">Cancelar Inscrição</button>)}
                                    </div>
                                </div>
                            ))}
                        </div>
                        {/* ===== CÓDIGO DA PAGINAÇÃO INSCRITOS ADICIONADO ===== */}
                        {totalPaginasInscritos > 1 && (
                            <div className="paginacao" style={{ marginTop: '20px' }}>
                                <button className="paginacao-btn anterior" onClick={paginaAnteriorInscritos} disabled={!temPaginaAnteriorInscritos}>← Anterior</button>
                                <div className="paginacao-numeros">
                                    {Array.from({ length: totalPaginasInscritos }, (_, i) => (
                                        <button key={`inscritos-${i + 1}`} className={`paginacao-numero ${paginaAtualInscritos === i + 1 ? 'ativo' : ''}`} onClick={() => irParaPaginaInscritos(i + 1)}>{i + 1}</button>
                                    ))}
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