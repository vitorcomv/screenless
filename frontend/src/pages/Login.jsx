import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import logo2 from "../assets/logo2.png";
import "./Login.css"; // Importe o arquivo CSS específico para Login

export default function Login() {
  const [form, setForm] = useState({
    usuario: "",
    senha: "",
  });

  const [erroLogin, setErroLogin] = useState("");

  const navigate = useNavigate();

  const { login } = useContext(AuthContext);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErroLogin(""); // limpa erro anterior
  
    const response = await fetch("http://localhost:5000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
  
    const data = await response.json();
    if (response.ok) {
      login(data.token, data.usuario);
      navigate("/"); // Redireciona ao fazer login
    } else {
      setErroLogin(data.erro); // Mostra erro na tela
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
          />
        </div>
  
        {erroLogin && <p className="mensagem-erro">{erroLogin}</p>}

        <div className="botoes-login-container">
          <button type="submit" className="login-button">Entrar</button>
          <Link to="/registro" className="register-link">Cadastrar-se</Link>
        </div>
      </form>
    </div>
  );
}  