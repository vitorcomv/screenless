import React, { useState, useEffect } from "react";
import "./Eventos.css";
import proximaImagem from '../assets/imagemfundo.png';
import { Link } from "react-router-dom";

export default function ListaEventos() {
  const [todosEventos, setTodosEventos] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [inscritos, setInscritos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paginaAtual, setPaginaAtual] = useState(1);
  
  const eventosPorPagina = 6; // Mostra 6 eventos por página
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchEventos = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/eventos");
        const data = await response.json();
        
        console.log("Dados dos eventos:", data);
        
        // Ordena eventos por data (mais recentes primeiro)
        const eventosOrdenados = data.sort((a, b) => new Date(b.data_hora_original) - new Date(a.data_hora_original));
        
        setTodosEventos(eventosOrdenados);
        setLoading(false);
      } catch (e) {
        setError(e);
        setLoading(false);
      }
    };

    const fetchInscricoes = async () => {
      try {
        if (!token) return;
        const response = await fetch("http://localhost:5000/api/meus_eventos", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await response.json();
        
        if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'number') {
          setInscritos(data);
        } 
        else if (Array.isArray(data) && data.length > 0 && data[0].ID_EVENTO) {
          setInscritos(data.map(evento => evento.ID_EVENTO));
        }
        else {
          setInscritos([]);
        }
      } catch (e) {
        console.error("Erro ao buscar inscrições:", e);
      }
    };

    fetchEventos();
    fetchInscricoes();
  }, [token]);

  // Atualiza os eventos exibidos quando muda a página ou os dados
  useEffect(() => {
    const indiceInicio = (paginaAtual - 1) * eventosPorPagina;
    const indiceFim = indiceInicio + eventosPorPagina;
    setEventos(todosEventos.slice(indiceInicio, indiceFim));
  }, [todosEventos, paginaAtual]);

  const inscreverEmEvento = async (eventoId) => {
    if (!token) {
      alert("Você precisa estar logado para se inscrever.");
      return;
    }

    const formData = new FormData();
    formData.append("evento_id", eventoId);

    try {
      const response = await fetch("http://localhost:5000/api/inscrever_evento", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.status === 201) {
        alert(data.mensagem);
        setInscritos([...inscritos, eventoId]);
      } else {
        alert(data.erro || "Erro ao se inscrever no evento.");
      }
    } catch (error) {
      alert("Erro na requisição.");
    }
  };

  // Cálculos para paginação
  const totalPaginas = Math.ceil(todosEventos.length / eventosPorPagina);
  const temPaginaAnterior = paginaAtual > 1;
  const temProximaPagina = paginaAtual < totalPaginas;

  const irParaPagina = (numeroPagina) => {
    setPaginaAtual(numeroPagina);
    // Scroll suave para o topo da lista de eventos
    document.querySelector('.lista-eventos-container')?.scrollIntoView({ 
      behavior: 'smooth' 
    });
  };

  const paginaAnterior = () => {
    if (temPaginaAnterior) {
      irParaPagina(paginaAtual - 1);
    }
  };

  const proximaPagina = () => {
    if (temProximaPagina) {
      irParaPagina(paginaAtual + 1);
    }
  };

  if (loading) return <div className="loading">Carregando eventos...</div>;
  if (error) return <div className="error">Erro ao carregar eventos: {error.message}</div>;

  return (
    <div>
      <div className="lista-eventos-container">
        <h2>Eventos</h2>
        
        {/* Informações da paginação */}
        {todosEventos.length > 0 && (
          <div className="info-paginacao">
            Mostrando {((paginaAtual - 1) * eventosPorPagina) + 1} - {Math.min(paginaAtual * eventosPorPagina, todosEventos.length)} de {todosEventos.length} eventos
          </div>
        )}
        
        <div className="eventos-grid">
          {eventos.map((evento) => {
            const jaInscrito = inscritos.includes(evento.ID_EVENTO);
            const eventoFinalizado = evento.Status === "finalizado";

            console.log(`Evento ${evento.ID_EVENTO}:`, {
              titulo: evento.titulo,
              Status: evento.Status,
              eventoFinalizado
            });

            return (
              <div className="evento-card" key={evento.ID_EVENTO}>
                {evento.foto_url && (
                  <img
                    src={evento.foto_url}
                    alt={evento.titulo}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/placeholder.png";
                    }}
                  />
                )}
                <div className="evento-info">
                  <h3>{evento.titulo}</h3>

                  {/* TRECHO MODIFICADO - INÍCIO */}
                  <div className="autor-container">
                    <p className="organizador">{evento.autor_nome}</p>
                    {evento.autor_insignia_url && (
                      <img 
                        src={evento.autor_insignia_url} 
                        alt="Insígnia do organizador" 
                        className="insignia-no-card"
                      />
                    )}
                  </div>
                  {/* TRECHO MODIFICADO - FIM */}
                  
                  <p className="endereco">{evento.endereco}</p>
                  <p className="data-hora">{evento.data_hora}</p>

                  {eventoFinalizado ? (
                    <p className="evento-status-finalizado">Evento Finalizado!</p>
                  ) : (
                    <button
                      className="inscrever-button"
                      onClick={() => inscreverEmEvento(evento.ID_EVENTO)}
                      disabled={jaInscrito}
                    >
                      {jaInscrito ? "Inscrito" : "Inscrever-se"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Controles de paginação */}
        {totalPaginas > 1 && (
          <div className="paginacao">
            <button 
              className="paginacao-btn anterior" 
              onClick={paginaAnterior}
              disabled={!temPaginaAnterior}
            >
              ← Anterior
            </button>
            
            <div className="paginacao-numeros">
              {Array.from({ length: totalPaginas }, (_, index) => {
                const numeroPagina = index + 1;
                return (
                  <button
                    key={numeroPagina}
                    className={`paginacao-numero ${paginaAtual === numeroPagina ? 'ativo' : ''}`}
                    onClick={() => irParaPagina(numeroPagina)}
                  >
                    {numeroPagina}
                  </button>
                );
              })}
            </div>
            
            <button 
              className="paginacao-btn proximo" 
              onClick={proximaPagina}
              disabled={!temProximaPagina}
            >
              Próximo →
            </button>
          </div>
        )}

        {/* Mensagem quando não há eventos */}
        {todosEventos.length === 0 && !loading && (
          <div className="sem-eventos">
            <p>Nenhum evento encontrado.</p>
          </div>
        )}
      </div>

      <div className="proxima-imagem">
        <img
          className="imagem-fundo"
          src={proximaImagem}
          alt="Imagem de fundo"
          style={{ width: "100%", display: "block" }}
        />
        <Link to="/criar-eventos">
          <button className="criar-seu-evento-button">CRIE SEU EVENTO</button>
        </Link>
      </div>
    </div>
  );
}