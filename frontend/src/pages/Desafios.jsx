import React, { useState, useEffect } from "react";
import "./Desafios.css";
import exemploImg from "../assets/imagemcard.png";
import { Link } from "react-router-dom";

export default function ListaDesafios() {
  const [desafios, setDesafios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inscritosDesafiosIds, setInscritosDesafiosIds] = useState([]); // Renomeado para clareza
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchDesafios = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/desafios");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const lastThreeDesafios = data.slice(-3);
        setDesafios(lastThreeDesafios);
        setLoading(false);
      } catch (e) {
        setError(e.message);
        setLoading(false);
      }
    };

    // FUNÇÃO PARA BUSCAR APENAS OS IDs DOS DESAFIOS QUE O USUÁRIO ESTÁ INSCRITO
    const fetchInscricoesDesafiosIds = async () => {
      if (!token) {
        setInscritosDesafiosIds([]); // Limpa as inscrições se não houver token
        return;
      }
      try {
        const response = await fetch(
          "http://localhost:5000/api/meus_desafios_ids", // <--- USE ESTE ENDPOINT!
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setInscritosDesafiosIds(data); // Assume que a API retorna um array de IDs diretamente
      } catch (e) {
        console.error("Erro ao buscar IDs de inscrições em desafios:", e);
        // Opcionalmente, pode-se definir um estado de erro específico para as inscrições aqui
      }
    };

    fetchDesafios();
    fetchInscricoesDesafiosIds(); // Chame a nova função que busca apenas os IDs
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
        // Adiciona o novo desafioId à lista de IDs de desafios inscritos
        setInscritosDesafiosIds((prevInscritos) => [...prevInscritos, desafioId]);
      } else {
        alert(data.erro || data.message || "Erro ao se inscrever no desafio.");
      }
    } catch (error) {
      console.error("Erro na requisição de inscrição:", error);
      alert("Erro na requisição de inscrição. Verifique o console para mais detalhes.");
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
            // Verifica se o desafio atual está na lista de IDs de desafios inscritos
            const jaInscrito = inscritosDesafiosIds.includes(desafio.ID_DESAFIO);

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
                  {/* Lógica do botão */}
                  {token && ( // Mostrar botão apenas se logado
                    jaInscrito ? ( // Use a variável 'jaInscrito'
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
                        Inscrever-se {/* TEXTO DO BOTÃO AQUI */}
                      </button>
                    )
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