import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import logo from "../assets/logo.png";
import "./Login.css"; // Importe o arquivo CSS específico para Login

export default function Login() {
  const [form, setForm] = useState({
    usuario: "",
    senha: "",
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    const response = await fetch("http://localhost:5000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await response.json();
    if (response.ok) {
      alert(data.mensagem);
      navigate("/home"); // Redirecione para a página principal após o login
    } else {
      alert(data.erro);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleLogin} className="form-login">
        <div className="div-imagem-login"><img src={logo} alt="Screenless" className="logo" /></div>
        <div className="input-group">
          <label htmlFor="usuario">Usuário</label>
          <input className="input"
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
          <input className="input"
            type="password"
            id="senha"
            name="senha"
            placeholder="Insira sua senha"
            value={form.senha}
            onChange={handleChange}
          />
        </div>
        <button type="submit" className="login-button">
          Entrar
        </button>
        <Link to="/registro" className="register-link">
          Cadastrar-se
        </Link>
      </form>
    </div>
  );
}