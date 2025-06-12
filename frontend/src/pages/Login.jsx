import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useAlert } from "../context/AlertContext"; // 1. IMPORTAR O HOOK
import logo2 from "../assets/logo2.png";
import "./Login.css";

export default function Login() {
  const [form, setForm] = useState({
    usuario: "",
    senha: "",
  });

  // O estado 'erroLogin' não é mais necessário, o showAlert cuidará disso.
  // const [erroLogin, setErroLogin] = useState("");

  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const { showAlert } = useAlert(); // 2. OBTER A FUNÇÃO DO CONTEXTO

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 3. ATUALIZAR A FUNÇÃO DE LOGIN
  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Adicionado try...catch para lidar com erros de rede (servidor offline, etc.)
    try {
      const response = await fetch("https://screenless-8k2p.onrender.com/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
  
      const data = await response.json();

      if (response.ok) {
        // Adiciona um alerta de sucesso antes de redirecionar
        showAlert({
          title: "Bem-vindo(a)!",
          message: `Login realizado com sucesso.`,
          type: "success"
        });
        login(data.token, data.usuario, data.foto_url, data.insignia_icone_url);
        navigate("/");
      } else {
        // Substitui o texto de erro por um alerta mais visível
        showAlert({
          title: "Falha no Login",
          message: data.erro || "Usuário ou senha inválidos.",
          type: "error"
        });
      }
    } catch (error) {
      console.error("Erro de conexão ao tentar fazer login:", error);
      showAlert({
        title: "Erro de Conexão",
        message: "Não foi possível conectar ao servidor. Tente novamente mais tarde.",
        type: "error"
      });
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleLogin} className="form-login">
        <Link to="/">
          <div className="div-imagem-login">
            <img src={logo2} alt="Screenless" className="logo" />
          </div>
        </Link>
  
        <div className="input-group">
          <label htmlFor="usuario">Usuário</label>
          <input
            type="text"
            id="usuario"
            name="usuario"
            placeholder="Insira seu usuário"
            value={form.usuario}
            onChange={handleChange}
            required // Adicionado para validação básica do navegador
          />
        </div>
  
        <div className="input-group">
          <label htmlFor="senha">Senha</label>
          <input
            type="password"
            id="senha"
            name="senha"
            placeholder="Insira sua senha"
            value={form.senha}
            onChange={handleChange}
            required // Adicionado para validação básica do navegador
          />
        </div>
  
        {/* A mensagem de erro em texto foi removida, pois o alerta é mais eficaz */}
        {/* {erroLogin && <p className="mensagem-erro">{erroLogin}</p>} */}

        <div className="botoes-login-container">
          <button type="submit" className="login-button">Entrar</button>
          <Link to="/registro" className="register-link">Cadastrar-se</Link>
        </div>
      </form>
    </div>
  );
}