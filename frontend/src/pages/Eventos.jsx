import React, { useState, useEffect, useContext } from "react";
import "./Eventos.css"; // Seu CSS não será modificado
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import BotaoBloqueado from "../components/BotaoBloqueado";

export default function ListaEventos() {
  const { nivelUsuario } = useContext(AuthContext);
  const [todosEventos, setTodosEventos] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [inscritos, setInscritos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paginaAtual, setPaginaAtual] = useState(1);
  
  const eventosPorPagina = 8;
  const token = localStorage.getItem("token");

  // ... (toda a sua lógica de useEffects e outras funções permanece exatamente a mesma) ...
  useEffect(() => {
    const fetchEventos = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/eventos");
        const data = await response.json();
        const eventosOrdenados = data.sort((a, b) => new Date(b.data_hora_original) - new Date(a.data_hora_original));
        setTodosEventos(eventosOrdenados);
      } catch (e) {
        setError(e);
      } finally {
        setLoading(false);
      }
    };
    const fetchInscricoes = async () => {
      if (!token) return;
      try {
        const response = await fetch("http://localhost:5000/api/meus_eventos", { headers: { Authorization: `Bearer ${token}` }});
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'number') {
          setInscritos(data);
        } else if (Array.isArray(data) && data.length > 0 && data[0].ID_EVENTO) {
          setInscritos(data.map(evento => evento.ID_EVENTO));
        } else {
          setInscritos([]);
        }
      } catch (e) { console.error("Erro ao buscar inscrições:", e); }
    };
    fetchEventos();
    fetchInscricoes();
  }, [token]);

  useEffect(() => {
    const indiceInicio = (paginaAtual - 1) * eventosPorPagina;
    const indiceFim = indiceInicio + eventosPorPagina;
    setEventos(todosEventos.slice(indiceInicio, indiceFim));
  }, [todosEventos, paginaAtual]);

  const inscreverEmEvento = async (eventoId) => {
    if (!token) { alert("Você precisa estar logado para se inscrever."); return; }
    const formData = new FormData();
    formData.append("evento_id", eventoId);
    try {
      const response = await fetch("http://localhost:5000/api/inscrever_evento", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData });
      const data = await response.json();
      if (response.status === 201) { alert(data.mensagem); setInscritos([...inscritos, eventoId]); } else { alert(data.erro || "Erro ao se inscrever no evento."); }
    } catch (error) { alert("Erro na requisição."); }
  };

  const totalPaginas = Math.ceil(todosEventos.length / eventosPorPagina);

  const irParaPagina = (numeroPagina) => {
    setPaginaAtual(numeroPagina);
    document.querySelector('.lista-eventos-container')?.scrollIntoView({ behavior: 'smooth' });
  };


  if (loading) return <div className="loading">Carregando eventos...</div>;
  if (error) return <div className="error">Erro ao carregar eventos: {error.message}</div>;

  const temEventos = todosEventos.length > 0;

  // Componente do Botão para evitar repetição de código
  const BotaoCriarEvento = () => (
    <div className="botao-wrapper">
      {nivelUsuario === 'ouro' ? (
        <Link to="/criar-eventos" className="criar-seu-evento-button">
          CRIE SEU EVENTO
        </Link>
      ) : (
        <BotaoBloqueado 
          nivelNecessario="Ouro" 
          paraCriar="um evento"
          className="criar-seu-evento-button-bloqueado"
        />
      )}
    </div>
  );

  return (
    <div className={`lista-eventos-container ${temEventos ? 'eventos-visiveis' : ''}`}>
      <h2>Eventos</h2>

      {/* ===== TEXTO DE VOLTA AQUI ===== */}
      <div className="info-paginacao">
        {/* Adicionamos a condição 'temEventos' para só mostrar se houver eventos */}
        {temEventos && (
          `Mostrando ${((paginaAtual - 1) * eventosPorPagina) + 1} - ${Math.min(paginaAtual * eventosPorPagina, todosEventos.length)} de ${todosEventos.length} eventos`
        )}
      </div>
      
      {/* Seção com a grade de eventos */}
      <div className="eventos-grid">
        {eventos.map((evento) => (
          <div className="evento-card" key={evento.ID_EVENTO}>
            {/* ... conteúdo do card ... */}
            {evento.foto_url && <img src={evento.foto_url} alt={evento.titulo} onError={(e) => { e.target.onerror = null; e.target.src = "/placeholder.png"; }} />}
            <div className="evento-info">
              <h3>{evento.titulo}</h3>
              <div className="autor-container">
                <p className="organizador">{evento.autor_nome}</p>
                {evento.autor_insignia_url && <img src={evento.autor_insignia_url} alt="Insígnia do organizador" className="insignia-no-card"/>}
              </div>
              <p className="endereco">{evento.endereco}</p>
              <p className="data-hora">{evento.data_hora}</p>
              {evento.Status === "finalizado" ? (
                <p className="evento-status-finalizado">Evento Finalizado!</p>
              ) : (
                <button className="inscrever-button" onClick={() => inscreverEmEvento(evento.ID_EVENTO)} disabled={inscritos.includes(evento.ID_EVENTO)}>
                  {inscritos.includes(evento.ID_EVENTO) ? "Inscrito" : "Inscrever-se"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Paginação */}
      {temEventos && totalPaginas > 1 && (
        <div className="paginacao">
          {/* ... conteúdo da paginação ... */}
          <button className="paginacao-btn anterior" onClick={() => irParaPagina(paginaAtual - 1)} disabled={paginaAtual === 1}>← Anterior</button>
          <div className="paginacao-numeros">
            {Array.from({ length: totalPaginas }, (_, index) => (
              <button key={index + 1} className={`paginacao-numero ${paginaAtual === index + 1 ? 'ativo' : ''}`} onClick={() => irParaPagina(index + 1)}>{index + 1}</button>
            ))}
          </div>
          <button className="paginacao-btn proximo" onClick={() => irParaPagina(paginaAtual + 1)} disabled={paginaAtual === totalPaginas}>Próximo →</button>
        </div>
      )}

      
      {!temEventos && (
  <div className="sem-eventos-container">
    <div className="cta-container">
      <p className="cta-texto">
        Parece que não há nada por aqui... Que tal criar o primeiro evento?
      </p>
      <BotaoCriarEvento />
    </div>
  </div>
)}


      {temEventos && <BotaoCriarEvento />}
    </div>
  );
}