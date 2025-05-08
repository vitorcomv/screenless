import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import logo from "../assets/logo.png";
import "./Registro.css";

export default function Registro() {
  const [form, setForm] = useState({
    email: "", usuario: "", nome: "", sobrenome: "",
    cpf: "", telefone: "", senha: "", repetirSenha: ""
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegistro = async (e) => {
    e.preventDefault();

    if (form.senha !== form.repetirSenha) {
      return alert("As senhas não coincidem!");
    }

    const response = await fetch("http://localhost:5000/api/registro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await response.json();
    if (response.ok) {
      alert(data.mensagem);
      navigate("/");
    } else {
      alert(data.erro);
    }
  };

  return (
    <div className="form-container">
      <form onSubmit={handleRegistro}>
        <div className="div-imagem"><img src={logo} alt="Screenless" className="logo" /></div>
        <input type="email" name="email" placeholder="Insira seu email" value={form.email} onChange={handleChange} />
        <input type="text" name="usuario" placeholder="Insira seu usuário" value={form.usuario} onChange={handleChange} />
        <div className="inline-inputs">
          <input type="text" name="nome" placeholder="Insira seu Nome" value={form.nome} onChange={handleChange} />
          <input type="text" name="sobrenome" placeholder="Insira seu Sobrenome" value={form.sobrenome} onChange={handleChange} />
        </div>
        <input type="text" name="cpf" placeholder="Insira seu CPF ou CadÚnico" value={form.cpf} onChange={handleChange} />
        <input type="text" name="telefone" placeholder="Insira seu Telefone" value={form.telefone} onChange={handleChange} />
        <input type="password" name="senha" placeholder="Insira sua Senha" value={form.senha} onChange={handleChange} />
        <input type="password" name="repetirSenha" placeholder="Repita sua Senha" value={form.repetirSenha} onChange={handleChange} />
        <button type="submit">Cadastrar-se</button>
        <Link to="/" className="link">Entrar →</Link>
      </form>
    </div>
  );
}
