import { useEffect, useState } from "react";

function App() {
  const [mensagem, setMensagem] = useState("Carregando...");

  useEffect(() => {
    fetch("/api/mensagem")
      .then((res) => res.json())
      .then((data) => setMensagem(data.mensagem))
      .catch((err) => setMensagem("Erro ao buscar dados do backend"));
  }, []);

  return (
    <div style={{ fontFamily: "sans-serif", padding: "2rem" }}>
      <h1>Mensagem do Backend:</h1>
      <p>{mensagem}</p>
    </div>
  );
}

export default App;
