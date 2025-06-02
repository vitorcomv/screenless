import React, { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { Link } from "react-router-dom"; // Assumindo que você está usando Link para navegação

import "./MeusDesafios.css";

export default function MeusDesafios() {
  const [desafiosCriados, setDesafiosCriados] = useState([]);
  const [loadingCriados, setLoadingCriados] = useState(true); // Renomeado para clareza
  const [errorCriados, setErrorCriados] = useState(null); // Renomeado para clareza

  // NOVOS ESTADOS PARA DESAFIOS INSCRITOS
  const [desafiosInscritos, setDesafiosInscritos] = useState([]);
  const [loadingInscritos, setLoadingInscritos] = useState(true);
  const [errorInscritos, setErrorInscritos] = useState(null);

  const token = localStorage.getItem("token");
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        setCurrentUserId(decodedToken.id);
      } catch (e) {
        console.error("Erro ao decodificar o token:", e);
        setCurrentUserId(null);
      }
    } else {
      setCurrentUserId(null);
    }

    // Função para buscar Desafios CRIADOS
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
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setDesafiosCriados(data);
        setLoadingCriados(false);
      } catch (e) {
        setErrorCriados(e.message);
        setLoadingCriados(false);
      }
    };

    // NOVA FUNÇÃO para buscar Desafios INSCRITOS
    const fetchDesafiosInscritos = async () => {
      if (!token) {
        setLoadingInscritos(false);
        // Não é um erro grave, mas a seção estará vazia se não logado
        return;
      }
      try {
        const response = await fetch("http://localhost:5000/api/desafios_inscritos", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setDesafiosInscritos(data);
        setLoadingInscritos(false);
      } catch (e) {
        console.error("Erro ao carregar desafios inscritos:", e);
        setErrorInscritos(e.message);
        setLoadingInscritos(false);
      }
    };

    fetchDesafiosCriados(); // Chama a busca por desafios criados
    fetchDesafiosInscritos(); // Chama a busca por desafios inscritos
  }, [token]);

  // Função para finalizar desafio (mantida como você tem)
  const finalizarDesafio = async (desafioId) => {
    if (!token) {
      alert("Você precisa estar logado para finalizar um desafio.");
      return;
    }

    const confirmFinalizar = window.confirm(
      "Tem certeza que deseja finalizar este desafio? Esta ação não pode ser desfeita."
    );
    if (!confirmFinalizar) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/finalizar_desafio_post/${desafioId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert(data.mensagem || "Desafio finalizado com sucesso!");
        setDesafiosCriados((prevDesafios) =>
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

  // Funções de editar e excluir desafio
  const editarDesafio = (desafioId) => {
    alert(`Lógica para editar desafio ${desafioId} seria implementada aqui.`);
  };

  const excluirDesafio = async (desafioId) => {
    if (!token) {
      alert("Você precisa estar logado para excluir um desafio.");
      return;
    }

    const confirmExcluir = window.confirm(
      "Tem certeza que deseja excluir este desafio? Esta ação não pode ser desfeita e removerá todas as inscrições relacionadas."
    );
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
        setDesafiosCriados((prevDesafios) =>
          prevDesafios.filter((d) => d.ID_DESAFIO !== desafioId)
        );
      } else {
        alert(data.erro || "Erro ao excluir desafio.");
      }
    } catch (error) {
      console.error("Erro na requisição de exclusão de desafio:", error);
      alert("Erro na requisição de exclusão de desafio. Verifique o console para mais detalhes.");
    }
  };

  // Nova função para cancelar inscrição em desafio
  const cancelarInscricaoDesafio = async (desafioId) => {
    if (!token) {
      alert("Você precisa estar logado para cancelar uma inscrição.");
      return;
    }

    const confirmCancel = window.confirm(
      "Tem certeza que deseja cancelar sua inscrição neste desafio?"
    );
    if (!confirmCancel) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/cancelar_inscricao_desafio/${desafioId}`,
        {
          method: "DELETE", // Ou o método que você definiu para cancelar inscrição
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert(data.mensagem || "Inscrição cancelada com sucesso!");
        setDesafiosInscritos((prevDesafios) =>
          prevDesafios.filter((d) => d.ID_DESAFIO !== desafioId)
        );
      } else {
        alert(data.erro || "Erro ao cancelar inscrição.");
      }
    } catch (error) {
      console.error("Erro na requisição de cancelar inscrição:", error);
      alert("Erro na requisição de cancelar inscrição. Verifique o console para mais detalhes.");
    }
  };

  if (loadingCriados || loadingInscritos) { // Verifica ambos os loadings
    return <p className="text-center text-xl mt-10">Carregando seus desafios...</p>;
  }

  // Combina os erros para exibir uma mensagem geral
  if (errorCriados || errorInscritos) {
    return (
      <p className="text-center text-red-500 text-xl mt-10">
        Erro: {errorCriados} {errorInscritos && `| ${errorInscritos}`}
      </p>
    );
  }

  return (
    <div className="meus-desafios-container bg-gray-900 text-white min-h-screen p-8">
      <h2 className="text-3xl font-bold mb-8 text-center">Meus Desafios Criados</h2>
      {desafiosCriados.length === 0 && (
        <p className="text-center text-gray-400">Você ainda não criou nenhum desafio.</p>
      )}
      <div className="desafios-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {desafiosCriados.map((desafio) => {
          const estaFinalizado = desafio.finalizado;

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
                  Organizado por: {desafio.nome_usuario || "Você"}
                </p>
                <p className="descricao text-gray-300 mb-3 text-sm h-20 overflow-y-auto">
                  {desafio.Descricao}
                </p>
                <p className="xp text-teal-400 font-bold mb-4">XP: {desafio.XP}</p>

                {estaFinalizado ? (
                  <p className="status-finalizado text-red-500 font-bold">Desafio Finalizado!</p>
                ) : (
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
              </div>
            </div>
          );
        })}
      </div>

      {/* SEÇÃO NOVAMENTE ADICIONADA: Desafios que me Inscrevi */}
      <h2 className="text-3xl font-bold mb-8 text-center mt-12">Desafios que me Inscrevi</h2>
      {loadingInscritos ? (
        <p className="text-center text-xl mt-10">Carregando desafios inscritos...</p>
      ) : errorInscritos ? (
        <p className="text-center text-red-500 text-xl mt-10">
          Erro ao carregar desafios inscritos: {errorInscritos}
        </p>
      ) : desafiosInscritos.length === 0 ? (
        <p className="text-center text-gray-400">Você ainda não está inscrito em nenhum desafio.</p>
      ) : (
        <div className="desafios-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {desafiosInscritos.map((desafio) => {
            const estaFinalizado = desafio.finalizado; // Usando a propriedade finalizado

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

                  {estaFinalizado ? (
                    <p className="status-finalizado text-red-500 font-bold">Desafio Finalizado!</p>
                  ) : (
                    <button
                      className="desafio-btn cancelar w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md font-semibold transition-colors"
                      onClick={() => cancelarInscricaoDesafio(desafio.ID_DESAFIO)}
                    >
                      Cancelar Inscrição
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}