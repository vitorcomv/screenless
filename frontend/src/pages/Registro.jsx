import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import logo from "../assets/logo.png";
import "./Registro.css";

export default function Registro() {
  const [form, setForm] = useState({
    email: "",
    usuario: "",
    nome: "",
    sobrenome: "",
    cpf: "",
    telefone: "",
    senha: "",
    repetirSenha: "",
  });

  const [erros, setErros] = useState({});
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErros({ ...erros, [e.target.name]: "", geral: "" });
  };

  const validarFormulario = () => {
    const novosErros = {};
    const { email, usuario, nome, sobrenome, cpf, telefone, senha, repetirSenha } = form;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const telefoneRegex = /^\d{10,11}$/;
    const cpfRegex = /^\d{11,}$/;

    if (!emailRegex.test(email)) {
      novosErros.email = "Email inválido";
    }

    if (!usuario || usuario.length < 3) {
      novosErros.usuario = "Usuário deve ter pelo menos 3 caracteres";
    }

    if (!nome) {
      novosErros.nome = "Nome é obrigatório";
    }

    if (!sobrenome) {
      novosErros.sobrenome = "Sobrenome é obrigatório";
    }

    if (!cpfRegex.test(cpf.replace(/\D/g, ""))) {
      novosErros.cpf = "CPF (11 números, sem sinais)";
    }

    if (!telefoneRegex.test(telefone.replace(/\D/g, ""))) {
      novosErros.telefone = "Telefone inválido (somente números com DDD)";
    }

    if (senha.length < 6) {
      novosErros.senha = "A senha deve ter no mínimo 6 caracteres";
    }

    if (senha !== repetirSenha) {
      novosErros.repetirSenha = "As senhas não coincidem";
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleRegistro = async (e) => {
    e.preventDefault();

    if (!validarFormulario()) return;

    try {
      const response = await fetch("http://localhost:5000/api/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.mensagem || "Cadastro realizado com sucesso!");
        navigate("/");
      } else {
        const novosErros = {};
        const erroMsg = data.erro; // Pega a string de erro diretamente

        if (erroMsg === "Email já cadastrado") {
          novosErros.email = erroMsg;
        } else if (erroMsg === "Nome de usuário já está em uso") {
          novosErros.usuario = erroMsg;
        } else if (erroMsg === "CPF já cadastrado") {
          novosErros.cpf = erroMsg;
        } else if (erroMsg === "Telefone já cadastrado") {
          novosErros.telefone = erroMsg;
        } else {
          novosErros.geral = erroMsg; // Para outros erros, exibe a mensagem recebida
        }

        setErros(novosErros);
      }
    } catch (error) {
      setErros({ geral: "Erro ao conectar com o servidor." });
    }
  };

  return (
    <div className="form-container">
      <form onSubmit={handleRegistro}>
        <div className="div-imagem">
          <img src={logo} alt="Screenless" className="logo" />
        </div>

        {erros.email && <span className="erro">{erros.email}</span>}
        <input
          type="email"
          name="email"
          placeholder="Insira seu email"
          value={form.email}
          onChange={handleChange}
        />

        {erros.usuario && <span className="erro">{erros.usuario}</span>}
        <input
          type="text"
          name="usuario"
          placeholder="Insira seu usuário"
          value={form.usuario}
          onChange={handleChange}
        />

        <div className="inline-inputs">
          <div>
            {erros.nome && <span className="erro">{erros.nome}</span>}
            <input
              type="text"
              name="nome"
              placeholder="Insira seu Nome"
              value={form.nome}
              onChange={handleChange}
            />
          </div>
          <div>
            {erros.sobrenome && <span className="erro">{erros.sobrenome}</span>}
            <input
              type="text"
              name="sobrenome"
              placeholder="Insira seu Sobrenome"
              value={form.sobrenome}
              onChange={handleChange}
            />
          </div>
        </div>

        {erros.cpf && <span className="erro">{erros.cpf}</span>}
        <input
          type="text"
          name="cpf"
          placeholder="Insira seu CPF (sem sinais)"
          value={form.cpf}
          onChange={handleChange}
        />

        {erros.telefone && <span className="erro">{erros.telefone}</span>}
        <input
          type="text"
          name="telefone"
          placeholder="Insira seu Telefone (somente números)"
          value={form.telefone}
          onChange={handleChange}
        />

        {erros.senha && <span className="erro">{erros.senha}</span>}
        <input
          type="password"
          name="senha"
          placeholder="Insira sua Senha"
          value={form.senha}
          onChange={handleChange}
        />

        {erros.repetirSenha && <span className="erro">{erros.repetirSenha}</span>}
        <input
          type="password"
          name="repetirSenha"
          placeholder="Repita sua Senha"
          value={form.repetirSenha}
          onChange={handleChange}
        />

        {erros.geral && <span className="erro erro-geral">{erros.geral}</span>}

        <button type="submit">Cadastrar-se</button>
        <Link to="/login" className="link">
          Login
        </Link>
      </form>
    </div>
  );
}