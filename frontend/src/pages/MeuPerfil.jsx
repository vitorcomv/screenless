import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import './MeuPerfil.css';

const MeuPerfil = () => {
  const { token, atualizarUsuario } = useContext(AuthContext);
  const [dados, setDados] = useState({
    nome: '',
    sobrenome: '',
    email: '',
    telefone: '',
    usuario: '',
    cpf: '',
    foto_perfil: null,
  });
  const [fotoPreview, setFotoPreview] = useState(null);
  const [mensagem, setMensagem] = useState('');
  const [fotoFile, setFotoFile] = useState(null);

  useEffect(() => {
    if (!token) return;

    fetch('http://localhost:5000/api/perfil', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        if (data.erro) {
          setMensagem(data.erro);
        } else {
          setDados({
            nome: data.nome || '',
            sobrenome: data.sobrenome || '',
            email: data.email || '',
            telefone: data.telefone || '',
            usuario: data.usuario || '',
            cpf: data.CPF || '',
            foto_perfil: data.foto_perfil || null
          });
          // Usar foto_url se disponível, senão usar foto_perfil com URL construída
          setFotoPreview(data.foto_url || (data.foto_perfil ? `http://localhost:5000/uploads/${data.foto_perfil}` : null));
        }
      });
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDados(prev => ({ ...prev, [name]: value }));
  };

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFotoFile(file);
      setFotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();

    formData.append('nome', dados.nome);
    formData.append('sobrenome', dados.sobrenome);
    formData.append('email', dados.email);
    formData.append('telefone', dados.telefone);
    formData.append('usuario', dados.usuario);

    if (fotoFile) {
      formData.append('foto_perfil', fotoFile);
    }

    try {
      const res = await fetch("http://localhost:5000/api/perfil", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setMensagem("Perfil atualizado com sucesso!");
        // Atualizar o contexto com a nova foto URL
        atualizarUsuario(dados.usuario, data.foto_url);
        // Atualizar o preview também
        if (data.foto_url) {
          setFotoPreview(data.foto_url);
        }
      } else {
        setMensagem(data.erro || "Erro ao atualizar perfil.");
      }
    } catch (error) {
      console.error(error);
      setMensagem("Erro de conexão.");
    }
  };

  return (
    <div className="perfil-container">
      <h2>Meu Perfil</h2>
      <form onSubmit={handleSubmit}>
        <div className="perfil-foto">
          <img src={fotoPreview || '/placeholder.png'} alt="Foto de perfil" />
          <input type="file" onChange={handleFotoChange} />
        </div>
        <input name="nome" value={dados.nome} onChange={handleChange} placeholder="Nome" required />
        <input name="sobrenome" value={dados.sobrenome} onChange={handleChange} placeholder="Sobrenome" required />
        <input name="email" value={dados.email} onChange={handleChange} placeholder="Email" required />
        <input name="telefone" value={dados.telefone} onChange={handleChange} placeholder="Telefone" />
        <input name="usuario" value={dados.usuario} onChange={handleChange} placeholder="Usuário" required />
        <input name="cpf" value={dados.cpf} disabled />
        <button type="submit">Salvar alterações</button>
      </form>
      {mensagem && <p className="mensagem">{mensagem}</p>}
    </div>
  );
};

export default MeuPerfil;