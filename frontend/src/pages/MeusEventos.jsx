import React, { useEffect, useState } from "react";
import "./MeusEventos.css";
import { useNavigate } from "react-router-dom";
import FormularioEdicaoEvento from "../components/FormularioEdicaoEvento";

export default function MeusEventos() {
  const [eventosCriados, setEventosCriados] = useState([]);
  const [eventosInscritos, setEventosInscritos] = useState([]);
  const [eventoEmEdicao, setEventoEmEdicao] = useState(null);

  const [eventosCriadosPaginados, setEventosCriadosPaginados] = useState([]);
  const [paginaAtualCriados, setPaginaAtualCriados] = useState(1);
  
  const [eventosInscritosPaginados, setEventosInscritosPaginados] = useState([]);
  const [paginaAtualInscritos, setPaginaAtualInscritos] = useState(1);

  const eventosPorPagina = 3;

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEventosCriados = async () => {
      if (!token) return; // Adicionado para evitar chamada sem token
      try {
        const res = await fetch("http://localhost:5000/api/eventos_criados", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) { // Adicionado tratamento de erro
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        // Assumindo que a API retorna o campo 'Status' para cada evento
        setEventosCriados(data);
      } catch (err) {
        console.error("Erro ao buscar eventos criados", err);
        // Poderia adicionar um estado de erro para exibir na UI
      }
    };

    const fetchEventosInscritos = async () => {
      if (!token) return; // Adicionado para evitar chamada sem token
      try {
        const res = await fetch("http://localhost:5000/api/eventos_inscritos", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) { // Adicionado tratamento de erro
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        setEventosInscritos(data);
      } catch (err) {
        console.error("Erro ao buscar eventos inscritos", err);
         // Poderia adicionar um estado de erro para exibir na UI
      }
    };

    if (token) { // Só busca se houver token
        fetchEventosCriados();
        fetchEventosInscritos();
    } else {
        // Limpar estados ou redirecionar se o token não estiver presente
        setEventosCriados([]);
        setEventosInscritos([]);
        console.warn("Nenhum token encontrado. O usuário precisa estar logado.");
        // navigate("/login"); // Exemplo de redirecionamento
    }
  }, [token, navigate]); // Adicionado navigate como dependência se usado dentro do useEffect

  useEffect(() => {
    const indiceInicio = (paginaAtualCriados - 1) * eventosPorPagina;
    const indiceFim = indiceInicio + eventosPorPagina;
    setEventosCriadosPaginados(eventosCriados.slice(indiceInicio, indiceFim));
  }, [eventosCriados, paginaAtualCriados]);

  useEffect(() => {
    const indiceInicio = (paginaAtualInscritos - 1) * eventosPorPagina;
    const indiceFim = indiceInicio + eventosPorPagina;
    setEventosInscritosPaginados(eventosInscritos.slice(indiceInicio, indiceFim));
  }, [eventosInscritos, paginaAtualInscritos]);

  // --- LÓGICA DE PAGINAÇÃO PARA EVENTOS CRIADOS ---
  const totalPaginasCriados = Math.ceil(eventosCriados.length / eventosPorPagina);
  const temPaginaAnteriorCriados = paginaAtualCriados > 1;
  const temProximaPaginaCriados = paginaAtualCriados < totalPaginasCriados;
  const irParaPaginaCriados = (num) => {
      setPaginaAtualCriados(num);
      document.querySelector('#secao-criados')?.scrollIntoView({ behavior: 'smooth' });
  };
  const paginaAnteriorCriados = () => { if (temPaginaAnteriorCriados) irParaPaginaCriados(paginaAtualCriados - 1); };
  const proximaPaginaCriados = () => { if (temProximaPaginaCriados) irParaPaginaCriados(paginaAtualCriados + 1); };

  // --- LÓGICA DE PAGINAÇÃO PARA EVENTOS INSCRITOS ---
  const totalPaginasInscritos = Math.ceil(eventosInscritos.length / eventosPorPagina);
  const temPaginaAnteriorInscritos = paginaAtualInscritos > 1;
  const temProximaPaginaInscritos = paginaAtualInscritos < totalPaginasInscritos;
  const irParaPaginaInscritos = (num) => {
      setPaginaAtualInscritos(num);
      document.querySelector('#secao-inscritos')?.scrollIntoView({ behavior: 'smooth' });
  };
  const paginaAnteriorInscritos = () => { if (temPaginaAnteriorInscritos) irParaPaginaInscritos(paginaAtualInscritos - 1); };
  const proximaPaginaInscritos = () => { if (temProximaPaginaInscritos) irParaPaginaInscritos(paginaAtualInscritos + 1); };

  // Funções de controle do formulário modal
  const handleEditarClick = (evento) => {
    setEventoEmEdicao(evento);
  };

  const handleSaveEdicao = (eventoAtualizado) => {
    setEventosCriados(prev => 
      prev.map(e => 
        e.ID_EVENTO === eventoAtualizado.ID_EVENTO ? eventoAtualizado : e
      )
    );
    setEventoEmEdicao(null); // Fecha o modal após salvar
  };

  const cancelarInscricao = async (eventoId) => {
    if (!token) return;
    const confirmCancel = window.confirm("Tem certeza que deseja cancelar sua inscrição neste evento?");
    if (!confirmCancel) return;

    try {
      const res = await fetch(
        `http://localhost:5000/api/cancelar_inscricao?evento_id=${eventoId}`, // A rota parece ser `cancelar_inscricao_evento` no exemplo de desafios
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.ok) {
        alert("Inscrição cancelada com sucesso.");
        setEventosInscritos((prevInscritos) =>
          prevInscritos.filter((e) => e.ID_EVENTO !== eventoId)
        );
      } else {
        const data = await res.json();
        alert(data.erro || "Erro ao cancelar inscrição.");
      }
    } catch (err) {
      console.error("Erro ao cancelar inscrição:", err);
      alert("Erro na requisição de cancelar inscrição.");
    }
  };

  const excluirEvento = async (eventoId) => {
    if (!token) return;
    const confirmar = window.confirm(
      "Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita e removerá todas as inscrições relacionadas."
    );
    if (!confirmar) return;

    try {
      const res = await fetch(
        `http://localhost:5000/api/excluir_evento/${eventoId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (res.ok) {
        alert(data.mensagem || "Evento excluído com sucesso.");
        setEventosCriados((prevCriados) =>
          prevCriados.filter((e) => e.ID_EVENTO !== eventoId)
        );
      } else {
        alert(data.erro || "Erro ao excluir evento.");
      }
    } catch (err) {
      console.error("Erro ao excluir evento:", err);
      alert("Erro na requisição de excluir evento.");
    }
  };

  // NOVA FUNÇÃO: Finalizar Evento
  const finalizarEvento = async (eventoId) => {
    if (!token) {
      alert("Você precisa estar logado para finalizar um evento.");
      return;
    }

    const confirmFinalizar = window.confirm(
      "Tem certeza que deseja finalizar este evento e distribuir XP para os inscritos? Esta ação não pode ser desfeita."
    );
    if (!confirmFinalizar) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/finalizar_evento/${eventoId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json", // Backend espera JSON para algumas rotas, mas esta não tem body
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert(data.mensagem || "Evento finalizado com sucesso!");
        // Atualiza o estado para refletir que o evento foi finalizado
        setEventosCriados((prevEventos) =>
          prevEventos.map((e) =>
            e.ID_EVENTO === eventoId ? { ...e, Status: "finalizado" } : e
          )
        );
      } else {
        alert(data.erro || "Erro ao finalizar evento.");
      }
    } catch (error) {
      console.error("Erro na requisição de finalizar evento:", error);
      alert("Erro na requisição de finalizar evento. Verifique o console para mais detalhes.");
    }
  };

  const renderCard = (evento, isCriado = false) => (
    <div className="meus-evento-card" key={evento.ID_EVENTO}>
      <img
        className="meus-evento-imagem"
        src={`http://localhost:5000/uploads/${evento.foto}` || "https://placehold.co/600x400/1f2937/7ca1f0?text=Sem+Imagem"}
        alt={evento.titulo}
        onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/600x400/1f2937/7ca1f0?text=Imagem+Indisponivel"; }}
      />
      <div className="meus-evento-info">
        <h3>{evento.titulo}</h3>
        <p>Organizador: {evento.organizador_nome || "Não informado"}</p>
        <p>Endereço: {evento.endereco}</p>
        <p>Data: {new Date(evento.data_hora).toLocaleString('pt-BR')}</p>
        {evento.descricao && <p className="descricao">Descrição: {evento.descricao}</p>}
        {isCriado ? (
          evento.Status === "finalizado" ? (
            <p className="meus-evento-status-finalizado">Evento Finalizado!</p>
          ) : (
            <div className="botoes-acao-evento">
              <button className="evento-btn editar" onClick={() => handleEditarClick(evento)}>
                Editar
              </button>
              <button className="evento-btn excluir" onClick={() => excluirEvento(evento.ID_EVENTO)}>
                Excluir
              </button>
              <button className="evento-btn concluir" onClick={() => finalizarEvento(evento.ID_EVENTO)}>
                Finalizar e Distribuir XP
              </button>
            </div>
          )
        ) : (
          evento.Status === "finalizado" ? (
            <p className="meus-evento-status-finalizado">Evento Finalizado! XP recebido.</p>
          ) : (
            <button className="evento-btn cancelar" onClick={() => cancelarInscricao(evento.ID_EVENTO)}>
              Cancelar Inscrição
            </button>
          )
        )}
      </div>
    </div>
  );

  return (
    <div className="meus-eventos-container">
      <h2>Meus Eventos</h2>

      {/* AQUI FICA A CHAMADA PARA O FORMULÁRIO MODAL */}
      {eventoEmEdicao && (
        <FormularioEdicaoEvento
          eventoParaEditar={eventoEmEdicao}
          onSave={handleSaveEdicao}
          onCancel={() => setEventoEmEdicao(null)}
        />
      )}

      {/* Seção de Eventos Criados com Paginação */}
      <section id="secao-criados">
        <h3>Eventos Criados</h3>
        {eventosCriados.length === 0 ? (
          <p className="mensagem-vazia">{token ? "Você ainda não criou nenhum evento." : "Faça login para ver seus eventos criados."}</p>
        ) : (
          <>
            <div className="info-paginacao">
              Mostrando {eventosCriadosPaginados.length > 0 ? ((paginaAtualCriados - 1) * eventosPorPagina) + 1 : 0} - {Math.min(paginaAtualCriados * eventosPorPagina, eventosCriados.length)} de {eventosCriados.length} eventos
            </div>
            <div className="meus-eventos-grid">
              {eventosCriadosPaginados.map((evento) => renderCard(evento, true))}
            </div>
            {totalPaginasCriados > 1 && (
              <div className="paginacao" style={{ marginTop: '20px' }}>
                <button className="paginacao-btn anterior" onClick={paginaAnteriorCriados} disabled={!temPaginaAnteriorCriados}>← Anterior</button>
                <div className="paginacao-numeros">
                  {Array.from({ length: totalPaginasCriados }, (_, i) => (<button key={i+1} className={`paginacao-numero ${paginaAtualCriados === i + 1 ? 'ativo' : ''}`} onClick={() => irParaPaginaCriados(i + 1)}>{i + 1}</button>))}
                </div>
                <button className="paginacao-btn proximo" onClick={proximaPaginaCriados} disabled={!temProximaPaginaCriados}>Próximo →</button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Seção de Eventos Inscritos com Paginação */}
      <section id="secao-inscritos">
        <h3>Eventos Inscritos</h3>
        {eventosInscritos.length === 0 ? (
          <p className="mensagem-vazia">{token ? "Você ainda não está inscrito em nenhum evento." : "Faça login para ver os eventos em que está inscrito."}</p>
        ) : (
          <>
            <div className="info-paginacao">
              Mostrando {eventosInscritosPaginados.length > 0 ? ((paginaAtualInscritos - 1) * eventosPorPagina) + 1 : 0} - {Math.min(paginaAtualInscritos * eventosPorPagina, eventosInscritos.length)} de {eventosInscritos.length} eventos
            </div>
            <div className="meus-eventos-grid">
              {eventosInscritosPaginados.map((evento) => renderCard(evento, false))}
            </div>
            {totalPaginasInscritos > 1 && (
              <div className="paginacao" style={{ marginTop: '20px' }}>
                <button className="paginacao-btn anterior" onClick={paginaAnteriorInscritos} disabled={!temPaginaAnteriorInscritos}>← Anterior</button>
                <div className="paginacao-numeros">
                  {Array.from({ length: totalPaginasInscritos }, (_, i) => (<button key={i+1} className={`paginacao-numero ${paginaAtualInscritos === i + 1 ? 'ativo' : ''}`} onClick={() => irParaPaginaInscritos(i + 1)}>{i + 1}</button>))}
                </div>
                <button className="paginacao-btn proximo" onClick={proximaPaginaInscritos} disabled={!temProximaPaginaInscritos}>Próximo →</button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}