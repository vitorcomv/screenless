import React, { useEffect, useState } from "react";
import "./MeusEventos.css";
import { useNavigate } from "react-router-dom";

export default function MeusEventos() {
  const [eventosCriados, setEventosCriados] = useState([]);
  const [eventosInscritos, setEventosInscritos] = useState([]);
  const [eventoEditando, setEventoEditando] = useState(null);
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    endereco: "",
    data_hora: "",
    foto: null,
  });

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

  const iniciarEdicao = (evento) => {
    const dataFormatada = new Date(evento.data_hora)
      .toISOString()
      .slice(0, 16);

    setEventoEditando(evento.ID_EVENTO);
    setFormData({
      titulo: evento.titulo,
      descricao: evento.descricao,
      endereco: evento.endereco,
      data_hora: dataFormatada,
      foto: null, // Não pré-populamos a foto, o usuário deve reenviar se quiser mudar
    });
  };

  const cancelarEdicao = () => {
    setEventoEditando(null);
    setFormData({
      titulo: "",
      descricao: "",
      endereco: "",
      data_hora: "",
      foto: null,
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFotoChange = (e) => { // Função separada para o input de arquivo
    setFormData((prev) => ({ ...prev, foto: e.target.files[0] }));
  };


  const salvarEdicao = async () => {
    if (!token || !eventoEditando) return;

    const formPayload = new FormData();
    formPayload.append("titulo", formData.titulo);
    formPayload.append("descricao", formData.descricao);
    formPayload.append("endereco", formData.endereco);
    formPayload.append("data_hora", formData.data_hora);
    if (formData.foto) {
      formPayload.append("foto", formData.foto);
    }

    try {
      const res = await fetch(
        `http://localhost:5000/api/editar_evento/${eventoEditando}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            // "Content-Type": "multipart/form-data" é definido automaticamente pelo browser ao usar FormData
          },
          body: formPayload,
        }
      );

      const data = await res.json();

      if (res.ok) {
        alert("Evento atualizado com sucesso.");
        setEventoEditando(null);
        // Atualiza o evento na lista, incluindo a foto se uma nova foi enviada (a API deveria retornar o nome da nova foto)
        setEventosCriados((prev) =>
          prev.map((e) =>
            e.ID_EVENTO === eventoEditando
              ? { ...e, ...formData, foto: data.foto_path || e.foto } // Assumindo que a API retorna `data.foto_path` se a foto foi atualizada
              : e
          )
        );
      } else {
        alert(data.erro || "Erro ao atualizar evento.");
      }
    } catch (err) {
      console.error("Erro ao salvar edição:", err);
      alert("Erro na requisição de salvar edição.");
    }
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
      {evento.foto && (
        <img
          className="meus-evento-imagem"
          src={`http://localhost:5000/uploads/${evento.foto}`}
          alt={evento.titulo}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "https://placehold.co/600x400/1f2937/7ca1f0?text=Imagem+Indisponivel"; // Placeholder
          }}
        />
      )}
      {!evento.foto && ( // Adicionado para mostrar placeholder se não houver foto
         <img
            className="meus-evento-imagem"
            src="https://placehold.co/600x400/1f2937/7ca1f0?text=Sem+Imagem"
            alt={evento.titulo}
          />
      )}

      <div className="meus-evento-info">
        <h3>{evento.titulo}</h3>
        {/* Idealmente, o nome do organizador viria da API em `eventos_inscritos` também */}
        <p className="organizador">Organizador: {evento.organizador_nome || evento.organizador || "Não informado"}</p>
        <p>Endereço: {evento.endereco}</p>
        <p>Data: {new Date(evento.data_hora).toLocaleString('pt-BR')}</p>
        {evento.descricao && <p className="descricao">Descrição: {evento.descricao}</p>}
        
        {/* XP do evento não é mostrado aqui, pois é fixo (100 XP) e distribuído no backend */}

        {isCriado ? (
          // Se o evento foi criado pelo usuário logado
          evento.Status === "finalizado" ? (
            <p className="meus-evento-status-finalizado">Evento Finalizado!</p>
          ) : (
            <>
              <button className="evento-btn editar" onClick={() => iniciarEdicao(evento)}>
                Editar Evento
              </button>
              <button className="evento-btn excluir" onClick={() => excluirEvento(evento.ID_EVENTO)}>
                Excluir Evento
              </button>
              <button className="evento-btn concluir" onClick={() => finalizarEvento(evento.ID_EVENTO)}>
                Concluir Evento e Distribuir XP
              </button>
            </>
          )
        ) : (
          // Se o usuário está apenas inscrito no evento
          evento.Status === "finalizado" ? (
             <p className="meus-evento-status-finalizado">Evento Finalizado! XP já distribuído.</p>
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

      {eventoEditando && (
        <div className="editar-form-container">
          <h3>Editar Evento</h3>
          <input
            type="text"
            name="titulo"
            placeholder="Título"
            value={formData.titulo}
            onChange={handleInputChange}
            className="form-input"
          />
          <textarea
            name="descricao"
            placeholder="Descrição"
            value={formData.descricao}
            onChange={handleInputChange}
            className="form-textarea"
          />
          <input
            type="text"
            name="endereco"
            placeholder="Endereço"
            value={formData.endereco}
            onChange={handleInputChange}
            className="form-input"
          />
          <input
            type="datetime-local"
            name="data_hora"
            value={formData.data_hora}
            onChange={handleInputChange}
            className="form-input"
          />
          <input
            type="file"
            accept="image/*"
            onChange={handleFotoChange} // Usar handleFotoChange
            className="form-input-file"
          />
          <div className="editar-form-buttons">
            <button className="evento-btn editar" onClick={salvarEdicao}>
              Salvar
            </button>
            <button className="evento-btn cancelar-edicao" onClick={cancelarEdicao}> {/* Classe diferente para estilo */}
              Cancelar Edição
            </button>
          </div>
        </div>
      )}

      <section>
        <h3>Eventos Criados</h3>
        {eventosCriados.length === 0 ? (
          <p className="mensagem-vazia">
            {token ? "Você ainda não criou nenhum evento." : "Faça login para ver seus eventos criados."}
          </p>
        ) : (
          <div className="meus-eventos-grid">
            {eventosCriados.map((evento) => renderCard(evento, true))}
          </div>
        )}
      </section>

      <section>
        <h3>Eventos Inscritos</h3>
        {eventosInscritos.length === 0 ? (
          <p className="mensagem-vazia">
           {token ? "Você ainda não está inscrito em nenhum evento." : "Faça login para ver os eventos em que está inscrito."}
          </p>
        ) : (
          <div className="meus-eventos-grid">
            {eventosInscritos.map((evento) => renderCard(evento, false))}
          </div>
        )}
      </section>
    </div>
  );
}