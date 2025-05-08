import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const Eventos = () => {
  const [mensagem, setMensagem] = useState('');

  useEffect(() => {
    fetch('http://localhost:5000/api/mensagem')
      .then((res) => res.json())
      .then((data) => setMensagem(data.mensagem))
      .catch((err) => console.error('Erro ao buscar mensagem da API:', err));
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Bem-vindo à Eventos!</h1>
      <p>Mensagem da API Flask: <strong>{mensagem}</strong></p>
      <button><Link to="/criar-eventos">Criar evento</Link></button>
    </div>
  );
};

export default Eventos;