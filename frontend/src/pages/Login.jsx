import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

export default function Login() {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    const response = await fetch("http://localhost:5000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario, senha }),
    });

    const data = await response.json();
    if (response.ok) {
      login(data.usuario); // Atualiza o contexto
      alert("Login realizado com sucesso!");
      navigate("/");
    } else {
      alert(data.erro);
    }
  };

  return (
    <div className="form-container">
      <form onSubmit={handleLogin}>
        <img src={logo} alt="Screenless" className="logo" />
        <input type="text" placeholder="Usuário" value={usuario} onChange={e => setUsuario(e.target.value)} />
        <input type="password" placeholder="Senha" value={senha} onChange={e => setSenha(e.target.value)} />
        <button type="submit">Entrar</button>
      </form>
    </div>
  );
}
