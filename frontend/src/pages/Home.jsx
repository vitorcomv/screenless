import React, { useEffect, useState } from 'react';

const Home = () => {
  const [mensagem, setMensagem] = useState('');

  useEffect(() => {
    fetch('http://localhost:5000/api/mensagem')
      .then((res) => res.json())
      .then((data) => setMensagem(data.mensagem))
      .catch((err) => console.error('Erro ao buscar mensagem da API:', err));
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Bem-vindo à Home!</h1>
      <p>Mensagem da API Flask: <strong>{mensagem}</strong></p>
    </div>
  );
};

export default Home;
