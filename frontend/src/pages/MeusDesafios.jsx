import React, { useEffect, useState } from "react";
import "./MeusDesafios.css"; // Crie este arquivo CSS
import { useNavigate } from "react-router-dom";

export default function MeusDesafios() {
  const [desafiosCriados, setDesafiosCriados] = useState([]);
  const [desafiosInscritos, setDesafiosInscritos] = useState([]);
  const [desafioEditando, setDesafioEditando] = useState(null); // Desafio em edição
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    xp: "", // Adicionado XP para desafios
    foto: null,
  });

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    // Função para buscar desafios criados pelo usuário logado
    const fetchDesafiosCriados = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/desafios_criados", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setDesafiosCriados(data);
      } catch (err) {
        console.error("Erro ao buscar desafios criados", err);
      }
    };

    // Função para buscar desafios em que o usuário está inscrito
    const fetchDesafiosInscritos = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/desafios_inscritos", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setDesafiosInscritos(data);
      } catch (err) {
        console.error("Erro ao buscar desafios inscritos", err);
      }
    };

    if (token) { // Só faz as chamadas se tiver token
      fetchDesafiosCriados();
      fetchDesafiosInscritos();
    } else {
      // Opcional: redirecionar ou mostrar mensagem se não estiver logado
      // navigate('/login');
      console.log("Usuário não logado. Não é possível buscar desafios.");
    }
  }, [token, navigate]);

  const iniciarEdicao = (desafio) => {
    setDesafioEditando(desafio.ID_DESAFIO);
    setFormData({
      titulo: desafio.Titulo, // Ajuste para 'Titulo' como no seu banco de dados
      descricao: desafio.Descricao, // Ajuste para 'Descricao'
      xp: desafio.XP, // Ajuste para 'XP'
      foto: null, // Não pré-preenche a foto, pois é um arquivo. Define como null.
    });
  };

  const cancelarEdicao = () => {
    setDesafioEditando(null);
    setFormData({
      titulo: "",
      descricao: "",
      xp: "",
      foto: null,
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const salvarEdicao = async () => {
    const form = new FormData();
    form.append("titulo", formData.titulo);
    form.append("descricao", formData.descricao);
    form.append("xp", formData.xp); // Adicionado XP
    if (formData.foto) form.append("foto", formData.foto); // só se nova foto for enviada

    try {
      const res = await fetch(`http://localhost:5000/api/editar_desafio/${desafioEditando}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          // 'Content-Type' não é necessário para FormData, o navegador define automaticamente
        },
        body: form,
      });

      const data = await res.json();

      if (res.ok) {
        alert("Desafio atualizado com sucesso.");
        setDesafioEditando(null);
        // Atualiza a lista de desafios criados para refletir a edição
        setDesafiosCriados((prev) =>
          prev.map((d) =>
            d.ID_DESAFIO === desafioEditando ? { ...d, ...formData } : d
          )
        );
      } else {
        alert(data.erro || "Erro ao atualizar desafio.");
      }
    } catch (err) {
      console.error("Erro ao salvar edição:", err);
      alert("Erro na requisição.");
    }
  };

  const cancelarInscricaoDesafio = async (desafioId) => {
    const confirmar = window.confirm("Tem certeza que deseja cancelar sua inscrição neste desafio?");
    if (!confirmar) return;

    try {
      const res = await fetch(`http://localhost:5000/api/cancelar_inscricao_desafio?desafio_id=${desafioId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        alert("Inscrição cancelada com sucesso.");
        // Remove o desafio da lista de inscritos
        setDesafiosInscritos(desafiosInscritos.filter(d => d.ID_DESAFIO !== desafioId));
      } else {
        const data = await res.json();
        alert(data.erro || "Erro ao cancelar inscrição.");
      }
    } catch (err) {
      console.error("Erro ao cancelar inscrição:", err);
      alert("Erro na requisição.");
    }
  };

  const excluirDesafio = async (desafioId) => {
    const confirmar = window.confirm("Tem certeza que deseja excluir este desafio? Esta ação é irreversível.");
    if (!confirmar) return;

    try {
      const res = await fetch(`http://localhost:5000/api/excluir_desafio/${desafioId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        alert("Desafio excluído com sucesso.");
        // Remove o desafio da lista de criados
        setDesafiosCriados(desafiosCriados.filter(d => d.ID_DESAFIO !== desafioId));
      } else {
        alert(data.erro || "Erro ao excluir desafio.");
      }
    } catch (err) {
      console.error("Erro ao excluir desafio:", err);
      alert("Erro na requisição.");
    }
  };

  const renderCard = (desafio, isCriado = false) => (
    <div className="meu-desafio-card" key={desafio.ID_DESAFIO}>
      {desafio.foto ? ( // Assumindo que o campo da foto é 'foto'
        <img
          className="meu-desafio-imagem"
          src={`http://localhost:5000/uploads/${desafio.foto}`}
          alt={desafio.Titulo}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "/placeholder.png"; // certifique-se de ter este arquivo em /public
          }}
        />
      ) : (
        <img
          className="meu-desafio-imagem"
          src="/placeholder.png" // Fallback se não houver foto
          alt={desafio.Titulo}
        />
      )}

      <div className="meu-desafio-info">
        <h3>{desafio.Titulo}</h3> {/* Ajustado para 'Titulo' */}
        <p className="organizador">Organizado por: {desafio.nome_usuario || "Você"}</p> {/* Assumindo que a API retorna 'nome_usuario' para criados */}
        <p>XP: {desafio.XP}</p> {/* Adicionado XP */}
        {desafio.Descricao && <p className="descricao">{desafio.Descricao}</p>} {/* Ajustado para 'Descricao' */}
        
        {isCriado ? (
          <>
            <button className="desafio-btn editar" onClick={() => iniciarEdicao(desafio)}>
              Editar Desafio
            </button>
            <button className="desafio-btn excluir" onClick={() => excluirDesafio(desafio.ID_DESAFIO)}>
              Excluir Desafio
            </button>

            {desafio.Status !== "finalizado" ? (
              <button
                className="desafio-btn finalizar"
                onClick={() => {
                  const confirmar = window.confirm("Deseja realmente finalizar este desafio? O XP será distribuído para os inscritos.");
                  if (!confirmar) return;

                  fetch(`http://localhost:5000/api/finalizar_desafio/${desafio.ID_DESAFIO}`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                  })
                    .then(async (res) => {
                      const data = await res.json();
                      if (res.ok) {
                        alert(data.mensagem);
                        // Atualiza a lista de desafios após finalizar
                        setDesafiosCriados((prev) =>
                          prev.map((d) =>
                            d.ID_DESAFIO === desafio.ID_DESAFIO ? { ...d, Status: "finalizado" } : d
                          )
                        );
                      } else {
                        alert(data.erro || "Erro ao finalizar desafio.");
                      }
                    })
                    .catch((err) => {
                      console.error("Erro ao finalizar desafio:", err);
                      alert("Erro na requisição.");
                    });
                }}
              >
                Finalizar Desafio
              </button>
            ) : (
              <p className="status-finalizado">Desafio finalizado</p>
            )}
          </>
        ) : (
          <button className="desafio-btn cancelar" onClick={() => cancelarInscricaoDesafio(desafio.ID_DESAFIO)}>
            Cancelar Inscrição
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="meus-desafios-container">
      <h2>Meus Desafios</h2>

      {desafioEditando && (
        <div className="editar-form-container">
          <h3>Editar Desafio</h3>
          <input
            type="text"
            name="titulo"
            placeholder="Título"
            value={formData.titulo}
            onChange={handleInputChange}
          />
          <textarea
            name="descricao"
            placeholder="Descrição"
            value={formData.descricao}
            onChange={handleInputChange}
          />
          <input
            type="number" // XP é um número
            name="xp"
            placeholder="XP"
            value={formData.xp}
            onChange={handleInputChange}
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, foto: e.target.files[0] }))
            }
          />
          <div className="editar-form-buttons">
            <button className="desafio-btn editar" onClick={salvarEdicao}>Salvar</button>
            <button className="desafio-btn cancelar" onClick={cancelarEdicao}>Cancelar</button>
          </div>
        </div>
      )}

      <section>
        <h3>Desafios Criados por Mim</h3>
        {desafiosCriados.length === 0 ? (
          <p className="mensagem-vazia">Você ainda não criou nenhum desafio.</p>
        ) : (
          <div className="meus-desafios-grid">
            {desafiosCriados.map((desafio) => renderCard(desafio, true))}
          </div>
        )}
      </section>

      <section>
        <h3>Desafios que me Inscrevi</h3>
        {desafiosInscritos.length === 0 ? (
          <p className="mensagem-vazia">Você ainda não está inscrito em nenhum desafio.</p>
        ) : (
          <div className="meus-desafios-grid">
            {desafiosInscritos.map((desafio) => renderCard(desafio, false))}
          </div>
        )}
      </section>
    </div>
  );
}