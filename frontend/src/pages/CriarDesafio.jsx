import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "./CriarDesafio.css";
import { AuthContext } from "../context/AuthContext";
import { useAlert } from "../context/AlertContext"; // 1. IMPORTAR O HOOK

export default function CriarDesafio() {
  const [form, setForm] = useState({
    titulo: "",
    descricao: "",
    xp: "",
    imagem: null,
  });

  const navigate = useNavigate();
  const { token, usuarioLogado, nivelUsuario, loadingAuth } = useContext(AuthContext);
  const { showAlert } = useAlert(); // 2. OBTER A FUNÇÃO DO CONTEXTO
  const [xpErro, setXpErro] = useState("");

  useEffect(() => {
    if (!loadingAuth) {
      if (nivelUsuario !== 'prata' && nivelUsuario !== 'ouro') {
        // 3. SUBSTITUIR O ALERTA DE PERMISSÃO
        showAlert({
          title: "Acesso Negado",
          message: "Você precisa ser nível Prata ou superior para criar um desafio.",
          type: "error"
        });
        navigate('/desafios');
      }
    }
  }, [nivelUsuario, loadingAuth, navigate, showAlert]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "xp") {
      if (Number(value) > 100) {
        setXpErro("O XP não pode ser maior que 100.");
        // Adiciona um alerta imediato para o usuário
        showAlert({ title: "Valor Inválido", message: "A recompensa de XP não pode ultrapassar 100.", type: "warning" });
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

    // Adiciona uma verificação para não enviar o formulário com erro
    if (xpErro) {
      showAlert({ title: "Formulário Inválido", message: "Corrija os erros indicados antes de enviar o desafio.", type: "error" });
      return;
    }

    if (!token) {
      // 4. SUBSTITUIR OS ALERTAS NO SUBMIT
      showAlert({
        title: "Acesso Requerido",
        message: "Você precisa estar logado para criar um desafio.",
        type: "warning"
      });
      return;
    }
  
    const formData = new FormData();
    formData.append("nome_usuario", usuarioLogado);
    formData.append("titulo", form.titulo);
    formData.append("descricao", form.descricao);
    formData.append("xp", form.xp);
    if (form.imagem) {
      formData.append("foto", form.imagem);
    }
  
    try {
      const response = await fetch("https://screenless-8k2p.onrender.com/api/criar_desafio", {
        method: "POST",
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
  
      const data = await response.json();
  
      if (response.ok) {
        showAlert({
          title: "Sucesso!",
          message: data.mensagem || "Desafio criado e enviado para a comunidade!",
          type: "success"
        });
        navigate("/desafios");
      } else {
        showAlert({
          title: "Erro na Criação",
          message: data.erro || "Não foi possível criar o desafio.",
          type: "error"
        });
      }
    } catch (error) {
      console.error("Erro ao criar desafio:", error);
      showAlert({
        title: "Erro de Conexão",
        message: "Falha ao comunicar com o servidor. Tente novamente.",
        type: "error"
      });
    }
  };

  if (loadingAuth) {
    return <div className="loading-auth-check">Verificando permissões...</div>;
  }

  // O JSX do formulário permanece o mesmo
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
          placeholder="Quantidade de XP (máx. 100)"
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