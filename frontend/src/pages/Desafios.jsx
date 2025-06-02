import React, { useState, useEffect } from "react";
import "./Desafios.css";
import exemploImg from "../assets/imagemcard.png";
import { Link } from "react-router-dom";
import { jwtDecode } from "jwt-decode"; // Importar jwt-decode

export default function ListaDesafios() {
  const [desafios, setDesafios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inscritosDesafiosIds, setInscritosDesafiosIds] = useState([]);
  const token = localStorage.getItem("token");
  const [currentUserId, setCurrentUserId] = useState(null); // Estado para armazenar o ID do usuário logado

  useEffect(() => {
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        setCurrentUserId(decodedToken.id); // Pega o ID do usuário do token
      } catch (e) {
        console.error("Erro ao decodificar o token:", e);
        setCurrentUserId(null);
      }
    } else {
      setCurrentUserId(null);
    }

    const fetchDesafios = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/desafios");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const lastThreeDesafios = data.slice(-3); // Ou remova esta linha se quiser todos os desafios
        setDesafios(data); // Deixei para carregar todos os desafios, ajuste se quiser os últimos 3
        setLoading(false);
      } catch (e) {
        setError(e.message);
        setLoading(false);
      }
    };

    const fetchInscricoesDesafiosIds = async () => {
      if (!token) {
        setInscritosDesafiosIds([]);
        return;
      }
      try {
        const response = await fetch(
          "http://localhost:5000/api/meus_desafios_ids",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setInscritosDesafiosIds(data);
      } catch (e) {
        console.error("Erro ao buscar IDs de inscrições em desafios:", e);
      }
    };

    fetchDesafios();
    fetchInscricoesDesafiosIds();
  }, [token]);

  const inscreverEmDesafio = async (desafioId) => {
    if (!token) {
      alert("Você precisa estar logado para se inscrever.");
      return;
    }

    const formData = new FormData();
    formData.append("desafio_id", desafioId);

    try {
      const response = await fetch(
        "http://localhost:5000/api/inscrever_desafio",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (response.status === 201) {
        alert(data.mensagem || "Inscrição realizada com sucesso!");
        setInscritosDesafiosIds((prevInscritos) => [...prevInscritos, desafioId]);
      } else {
        alert(data.erro || data.message || "Erro ao se inscrever no desafio.");
      }
    } catch (error) {
      console.error("Erro na requisição de inscrição:", error);
      alert("Erro na requisição de inscrição. Verifique o console para mais detalhes.");
    }
  };

  // Nova função para finalizar desafio
  const finalizarDesafio = async (desafioId) => {
    if (!token) {
      alert("Você precisa estar logado para finalizar um desafio.");
      return;
    }

    const confirmFinalizar = window.confirm("Tem certeza que deseja finalizar este desafio? Esta ação não pode ser desfeita.");
    if (!confirmFinalizar) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/finalizar_desafio/${desafioId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json", // PUT geralmente envia JSON
          },
          // body: JSON.stringify({}) // Não precisa de body se só está mudando o status
        }
      );

      const data = await response.json();

      if (response.ok) { // response.ok para status 2xx
        alert(data.mensagem || "Desafio finalizado com sucesso!");
        // Atualiza o estado para que o frontend reflita a mudança
        setDesafios((prevDesafios) =>
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


  // Funções de editar e excluir desafio (se você já as tem, apenas mantenha)
  const editarDesafio = (desafioId) => {
    // Implemente a lógica de navegação para a tela de edição
    // Ex: navigate(`/editar-desafio/${desafioId}`);
    alert(`Lógica para editar desafio ${desafioId} seria implementada aqui.`);
  };

  const excluirDesafio = async (desafioId) => {
    if (!token) {
        alert("Você precisa estar logado para excluir um desafio.");
        return;
    }

    const confirmExcluir = window.confirm("Tem certeza que deseja excluir este desafio? Esta ação não pode ser desfeita e removerá todas as inscrições relacionadas.");
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
            // Remove o desafio da lista no estado
            setDesafios((prevDesafios) => prevDesafios.filter(d => d.ID_DESAFIO !== desafioId));
        } else {
            alert(data.erro || "Erro ao excluir desafio.");
        }
    } catch (error) {
        console.error("Erro na requisição de exclusão de desafio:", error);
        alert("Erro na requisição de exclusão de desafio. Verifique o console para mais detalhes.");
    }
  };


  if (loading) {
    return <p className="text-center text-xl mt-10">Carregando desafios...</p>;
  }

  if (error) {
    return <p className="text-center text-red-500 text-xl mt-10">Erro ao carregar desafios: {error}</p>;
  }

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <div className="lista-desafios-container container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-8 text-center">Próximos Desafios</h2>
        {desafios.length === 0 && !loading && (
          <p className="text-center text-gray-400">Nenhum desafio encontrado no momento.</p>
        )}
        <div className="desafios-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {desafios.map((desafio) => {
            const jaInscrito = inscritosDesafiosIds.includes(desafio.ID_DESAFIO);
            // Verifica se o usuário logado é o criador do desafio
            const isCriador = currentUserId === desafio.ID_USUARIO;
            const estaFinalizado = desafio.finalizado; // Use a nova propriedade

            return (
              <div
                className="desafio-card bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-transform transform hover:scale-105"
                key={desafio.ID_DESAFIO}
              >
                {desafio.foto ? (
                  <img
                    className="w-full h-48 object-cover"
                    src={`http://localhost:5000/uploads/${desafio.foto}`}
                    alt={desafio.Titulo}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://placehold.co/600x400/1f2937/7ca1f0?text=Imagem+Indisponivel";
                    }}
                  />
                ) : (
                  <img
                    className="w-full h-48 object-cover"
                    src="https://placehold.co/600x400/1f2937/7ca1f0?text=Sem+Imagem"
                    alt={desafio.Titulo}
                  />
                )}
                <div className="desafio-info p-6">
                  <h3 className="text-xl font-semibold mb-2">{desafio.Titulo}</h3>
                  <p className="organizador text-sm text-gray-400 mb-1">
                    Organizado por: {desafio.nome_usuario || "Anônimo"}
                  </p>
                  <p className="descricao text-gray-300 mb-3 text-sm h-20 overflow-y-auto">
                    {desafio.Descricao}
                  </p>
                  <p className="xp text-teal-400 font-bold mb-4">XP: {desafio.XP}</p>
                  {/* Status de Finalizado */}
                  {estaFinalizado && (
                    <p className="text-red-500 font-bold mb-2">Desafio Finalizado!</p>
                  )}

                  {token && ( // Mostrar botões de ação apenas se logado
                    <>
                      {/* Botão de inscrição/inscrito (sempre visível se logado e não for o criador) */}
                      {!isCriador && ( // Não mostra o botão de inscrição se for o criador
                        jaInscrito ? (
                          <button
                            className="w-full bg-green-500 text-white py-2 px-4 rounded-md font-semibold cursor-not-allowed"
                            disabled
                          >
                            Inscrito
                          </button>
                        ) : (
                          !estaFinalizado && ( // Só permite inscrever se não estiver finalizado
                            <button
                              onClick={() => inscreverEmDesafio(desafio.ID_DESAFIO)}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-semibold transition-colors"
                            >
                              Inscrever-se
                            </button>
                          )
                        )
                      )}

                      {/* Botões de gerenciamento (apenas para o criador e se não estiver finalizado) */}
                      {isCriador && !estaFinalizado && (
                        <div className="flex flex-col space-y-2 mt-4">
                            <button
                                onClick={() => editarDesafio(desafio.ID_DESAFIO)}
                                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-md font-semibold transition-colors"
                            >
                                Editar Desafio
                            </button>
                            <button
                                onClick={() => excluirDesafio(desafio.ID_DESAFIO)}
                                className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md font-semibold transition-colors"
                            >
                                Excluir Desafio
                            </button>
                            <button
                                onClick={() => finalizarDesafio(desafio.ID_DESAFIO)}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-md font-semibold transition-colors"
                            >
                                Finalizar Desafio
                            </button>
                        </div>
                      )}
                      {/* Se for o criador e o desafio ESTIVER finalizado, pode exibir um status ou nada */}
                      {isCriador && estaFinalizado && (
                         <p className="text-center text-gray-500 mt-4">Desafio gerenciado (Finalizado)</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="div-imagem-fundo">
        <img
          className="imagem-fundo w-full h-64 md:h-80 lg:h-96 object-cover"
          src={exemploImg}
          alt="Imagem de fundo com pessoas colaborando"
        />
        <div className="div_botao">
          <Link to="/criar-desafio">
            <button className="butãoCriarEvento">CRIE SEU DESAFIO</button>
          </Link>
        </div>
      </div>
    </div>
  );
}