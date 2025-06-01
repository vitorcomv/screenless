import React, { useState, useEffect } from "react";
import "./Desafios.css"; // Certifique-se que este arquivo CSS existe no caminho correto
import exemploImg from "../assets/imagemcard.png"; // Certifique-se que este arquivo de imagem existe
import { Link } from "react-router-dom";

export default function ListaDesafios() {
  // Declaração dos estados que estavam faltando
  const [desafios, setDesafios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [inscritos, setInscritos] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchDesafios = async () => {
      try {
        // setLoading(true); // Movido para o início do estado para refletir o carregamento inicial
        const response = await fetch("http://localhost:5000/api/desafios");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const lastThreeDesafios = data.slice(-3);
        setDesafios(lastThreeDesafios);
        setLoading(false);
      } catch (e) {
        setError(e.message); // Salvar a mensagem de erro, não o objeto de erro inteiro
        setLoading(false);
      }
    };

    const fetchInscricoesDesafios = async () => {
      if (!token) return;
      try {
        const response = await fetch(
          "http://localhost:5000/api/meus_desafios",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!response.ok) {
            // Adicionar tratamento de erro para esta chamada também
            const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setInscritos(data.map(inscricao => inscricao.ID_DESAFIO)); // Assumindo que a API retorna um array de objetos e você quer os IDs
      } catch (e) {
        console.error("Erro ao buscar inscrições em desafios:", e);
        // Opcionalmente, definir um estado de erro para inscrições também
        // setErrorInscricoes(e.message);
      }
    };

    fetchDesafios();
    fetchInscricoesDesafios();
  }, [token]); // Adicionar 'token' como dependência está correto

  const inscreverEmDesafio = async (desafioId) => {
    if (!token) {
      alert("Você precisa estar logado para se inscrever."); // Considere usar um modal ou notificação no lugar de alert
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
            // 'Content-Type': 'application/json' não é necessário para FormData, o browser define automaticamente
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (response.status === 201) {
        alert(data.mensagem || "Inscrição realizada com sucesso!"); // Considere usar um modal ou notificação
        setInscritos((prevInscritos) => [...prevInscritos, desafioId]);
      } else {
        alert(data.erro || data.message || "Erro ao se inscrever no desafio."); // Considere usar um modal ou notificação
      }
    } catch (error) {
      console.error("Erro na requisição de inscrição:", error);
      alert("Erro na requisição de inscrição. Verifique o console para mais detalhes."); // Considere usar um modal ou notificação
    }
  };

  // Adicionar tratamento para o estado de loading e error no JSX
  if (loading) {
    return <p className="text-center text-xl mt-10">Carregando desafios...</p>;
  }

  if (error) {
    return <p className="text-center text-red-500 text-xl mt-10">Erro ao carregar desafios: {error}</p>;
  }

  return (
    <div className="bg-gray-900 text-white min-h-screen"> {/* Exemplo de cor de fundo e texto */}
      <div className="lista-desafios-container container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-8 text-center">Próximos Desafios</h2>
        {desafios.length === 0 && !loading && (
            <p className="text-center text-gray-400">Nenhum desafio encontrado no momento.</p>
        )}
        <div className="desafios-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {desafios.map((desafio) => (
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
                    e.target.src = "https://placehold.co/600x400/1f2937/7ca1f0?text=Imagem+Indisponivel"; // Placeholder melhorado
                  }}
                />
              ) : (
                <img
                  className="w-full h-48 object-cover"
                  src="https://placehold.co/600x400/1f2937/7ca1f0?text=Sem+Imagem" // Placeholder para quando não há foto
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
                {/* Botão de inscrição */}
                {token && ( // Mostrar botão apenas se logado
                    inscritos.includes(desafio.ID_DESAFIO) ? (
                        <button
                            className="w-full bg-green-500 text-white py-2 px-4 rounded-md font-semibold cursor-not-allowed"
                            disabled
                        >
                            Inscrito
                        </button>
                    ) : (
                        <button
                            onClick={() => inscreverEmDesafio(desafio.ID_DESAFIO)}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-semibold transition-colors"
                        >
                            Inscrever-se
                        </button>
                    )
                )}
              </div>
            </div>
          ))}
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
            <button className="butãoCriarEvento">
                CRIE SEU DESAFIO
            </button>
            </Link>
        </div>
      </div>
    </div>
  );
}