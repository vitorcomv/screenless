import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CriarDesafio.css";

export default function CriarDesafio() {
  const [form, setForm] = useState({
    titulo: "",
    descricao: "",
    xp: "",
    imagem: null,
  });

  const navigate = useNavigate();

  const [xpErro, setXpErro] = useState("");


  const handleChange = (e) => {
  const { name, value } = e.target;

  if (name === "xp") {
    if (Number(value) > 100) {
      setXpErro("O XP não pode ser maior que 100.");
    } else {
      setXpErro("");
    }
  }

  setForm({ ...form, [name]: value });
};


  const handleImagemChange = (e) => {
    setForm({ ...form, imagem: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Você precisa estar logado para criar um desafio.");
      return;
    }
  
    const formData = new FormData();
    formData.append("nome_usuario", form.nome_usuario);
    formData.append("titulo", form.titulo);
    formData.append("descricao", form.descricao);
    formData.append("xp", form.xp);
    if (form.imagem) {
      formData.append("foto", form.imagem);
    }
  
    try {
      const response = await fetch("http://screenless-env.eba-cnrmxhn5.us-east-1.elasticbeanstalk.com/api/criar_desafio", {
        method: "POST",
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
  
      const data = await response.json();
  
      if (response.ok) {
        alert(data.mensagem);
        navigate("/desafios"); // Redireciona para a página de desafios após criar
      } else {
        alert(data.erro);
      }
    } catch (error) {
      alert("Erro ao criar desafio: " + error.message);
    }
  };
  

  return (
    <section className="form-mini">
      <form className="form" onSubmit={handleSubmit}>
        <h2 className="heading-mini">SUA VEZ!</h2>
        <h3 className="heading-mini">Crie um novo desafio</h3>

        <input
          className="input-mini"
          type="text"
          name="titulo"
          placeholder="Título do desafio"
          value={form.titulo}
          onChange={handleChange}
          required
        />

        <textarea
          className="input-mini"
          name="descricao"
          placeholder="Descreva o desafio"
          rows={5}
          style={{ resize: "none" }}
          value={form.descricao}
          onChange={handleChange}
          required
        />

        <input
        className="input-mini"
        type="number"
        name="xp"
        placeholder="Quantidade de XP"
        value={form.xp}
        onChange={handleChange}
        required
        min="0"
        max="100"
        />
        {xpErro && <p className="mensagem-erro">{xpErro}</p>}


        <div className="upload-container">
          <label htmlFor="imagem">Imagem representativa:</label>
          <input
            type="file"
            id="imagem"
            name="imagem"
            accept="image/*"
            onChange={handleImagemChange}
          />
        </div>

        <button className="btn-mini" type="submit">Enviar</button>
      </form>
    </section>
  );
}
