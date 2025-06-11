import React, { useState, useEffect, useContext } from "react";
import "./Desafios.css";
import { Link } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { AuthContext } from "../context/AuthContext";
import BotaoBloqueado from "../components/BotaoBloqueado";

export default function ListaDesafios() {
    const { nivelUsuario } = useContext(AuthContext);
    const [todosDesafios, setTodosDesafios] = useState([]);
    const [desafios, setDesafios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [inscritosDesafiosIds, setInscritosDesafiosIds] = useState([]);
    const token = localStorage.getItem("token");
    const [currentUserId, setCurrentUserId] = useState(null);
    const [paginaAtual, setPaginaAtual] = useState(1);
    const desafiosPorPagina = 6;

    useEffect(() => {
        if (token) {
            try {
                const decodedToken = jwtDecode(token);
                setCurrentUserId(decodedToken.id);
            } catch (e) {
                console.error("Erro ao decodificar o token:", e);
            }
        }
        const fetchDesafios = async () => {
            try {
                const response = await fetch("http://localhost:5000/api/desafios");
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data = await response.json();
                const desafiosOrdenados = data.sort((a, b) => b.ID_DESAFIO - a.ID_DESAFIO);
                setTodosDesafios(desafiosOrdenados);
            } catch (e) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };
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

    useEffect(() => {
        const indiceInicio = (paginaAtual - 1) * desafiosPorPagina;
        const indiceFim = indiceInicio + desafiosPorPagina;
        setDesafios(todosDesafios.slice(indiceInicio, indiceFim));
    }, [todosDesafios, paginaAtual]);

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
                headers: { Authorization: `Bearer ${token}` },
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

    const totalPaginas = Math.ceil(todosDesafios.length / desafiosPorPagina);
    const irParaPagina = (numeroPagina) => {
        setPaginaAtual(numeroPagina);
        document.querySelector('.lista-eventos-container')?.scrollIntoView({ behavior: 'smooth' });
    };

    if (loading) return <div className="loading">Carregando desafios...</div>;
    if (error) return <div className="error">Erro ao carregar desafios: {error}</div>;

    const temDesafios = todosDesafios.length > 0;

    const BotaoCriarDesafio = () => (
        <div className="botao-wrapper">
            {(nivelUsuario === 'prata' || nivelUsuario === 'ouro') ? (
                <Link to="/criar-desafio" className="criar-seu-evento-button">CRIE SEU DESAFIO</Link>
            ) : (
                <BotaoBloqueado nivelNecessario="Prata" paraCriar="um desafio" className="criar-seu-evento-button-bloqueado" />
            )}
        </div>
    );

    return (
        <div className={`lista-eventos-container ${temDesafios ? 'eventos-visiveis' : ''}`}>
            <h2>Próximos Desafios</h2>
            
            <div className="info-paginacao">
                {temDesafios && `Mostrando ${((paginaAtual - 1) * desafiosPorPagina) + 1} - ${Math.min(paginaAtual * desafiosPorPagina, todosDesafios.length)} de ${todosDesafios.length} desafios`}
            </div>
            
            <div className="eventos-grid">
                {desafios.map((desafio) => {
                    const jaInscrito = inscritosDesafiosIds.includes(desafio.ID_DESAFIO);
                    // A variável 'isCriador' não é mais necessária para a lógica do botão, mas pode ser útil para outras coisas.
                    const isCriador = currentUserId === desafio.ID_USUARIO; 
                    return (
                        <div className="evento-card" key={desafio.ID_DESAFIO}>
                            <img
                                src={desafio.foto_url || "https://placehold.co/600x400/cccccc/ffffff?text=Sem+Imagem"}
                                alt={desafio.Titulo}
                                onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/600x400/cccccc/ffffff?text=Erro"; }}
                            />
                            <div className="evento-info">
                                <h3>{desafio.Titulo}</h3>
                                <div className="autor-container">
                                    <p className="organizador">Criado por: {desafio.autor_nome || "Anônimo"}</p>
                                    {desafio.autor_insignia_url && (
                                        <img src={desafio.autor_insignia_url} alt="Insígnia" className="insignia-no-card"/>
                                    )}
                                </div>
                                <p className="descricao">{desafio.Descricao}</p>
                                <p className="xp">Recompensa: {desafio.XP} XP</p>
                            </div>
                            <div className="evento-footer">
                                {/* ===== MUDANÇA AQUI: Removida a condição "!isCriador" ===== */}
                                {token && (
                                    jaInscrito ? (
                                        <button className="inscrever-button" disabled>Inscrito</button>
                                    ) : (
                                        <button onClick={() => inscreverEmDesafio(desafio.ID_DESAFIO)} className="inscrever-button">
                                            Inscrever-se
                                        </button>
                                    )
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {totalPaginas > 1 && (
                <div className="paginacao">
                    <button className="paginacao-btn anterior" onClick={() => irParaPagina(paginaAtual - 1)} disabled={paginaAtual === 1}>← Anterior</button>
                    <div className="paginacao-numeros">
                        {Array.from({ length: totalPaginas }, (_, i) => (
                            <button key={i + 1} className={`paginacao-numero ${paginaAtual === i + 1 ? 'ativo' : ''}`} onClick={() => irParaPagina(i + 1)}>{i + 1}</button>
                        ))}
                    </div>
                    <button className="paginacao-btn proximo" onClick={() => irParaPagina(paginaAtual + 1)} disabled={paginaAtual === totalPaginas}>Próximo →</button>
                </div>
            )}

            {!temDesafios && !loading && (
                 <div className="sem-eventos-container">
                    <div className="cta-container">
                        <p className="cta-texto">Parece que não há desafios no momento... Que tal criar o primeiro?</p>
                        <BotaoCriarDesafio />
                    </div>
                </div>
            )}
            {temDesafios && <BotaoCriarDesafio />}
        </div>
    );
}