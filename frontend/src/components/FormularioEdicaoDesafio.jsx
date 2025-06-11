import React, { useState, useEffect } from "react";
import "./FormularioEdicaoDesafio.css"; // Vamos criar este CSS a seguir

export default function FormularioEdicaoDesafio({ desafioParaEditar, onSave, onCancel }) {
  const [form, setForm] = useState({
    titulo: "",
    descricao: "",
    xp: "",
  });
  const [novaImagemFile, setNovaImagemFile] = useState(null);

  // Quando o componente recebe um desafio para editar, preenche o formulário
  useEffect(() => {
    if (desafioParaEditar) {
      setForm({
        titulo: desafioParaEditar.Titulo,
        descricao: desafioParaEditar.Descricao,
        xp: desafioParaEditar.XP,
      });
    }
  }, [desafioParaEditar]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImagemChange = (e) => {
    setNovaImagemFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return;

    const formData = new FormData();
    formData.append("titulo", form.titulo);
    formData.append("descricao", form.descricao);
    formData.append("xp", form.xp);
    if (novaImagemFile) {
      formData.append("foto", novaImagemFile);
    }

    try {
      // Usa a mesma rota PUT de antes
      const response = await fetch(`http://localhost:5000/api/editar_desafio/${desafioParaEditar.ID_DESAFIO}`, {
        method: "PUT",
        body: formData,
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (response.ok) {
        alert(data.mensagem || "Desafio atualizado com sucesso!");
        onSave({ ...desafioParaEditar, ...form, foto: novaImagemFile ? novaImagemFile.name : desafioParaEditar.foto }); // Avisa o componente pai que salvou
      } else {
        alert(data.erro);
      }
    } catch (error) {
      alert("Erro ao atualizar o desafio: " + error.message);
    }
  };

  // Se nenhum desafio foi passado, não renderiza nada
  if (!desafioParaEditar) return null;

  return (
    // O overlay que escurece o fundo
    <div className="modal-overlay">
      <div className="modal-content">
        <form className="form-edicao" onSubmit={handleSubmit}>
          <h2>Editando Desafio</h2>
          <label>Título</label>
          <input type="text" name="titulo" value={form.titulo} onChange={handleChange} required />
          
          <label>Descrição</label>
          <textarea name="descricao" value={form.descricao} onChange={handleChange} required rows={5} />

          <label>XP</label>
          <input type="number" name="xp" value={form.xp} onChange={handleChange} required min="0" max="100" />
          
          <label>Trocar imagem (opcional):</label>
          <input type="file" name="imagem" accept="image/*" onChange={handleImagemChange} />

          <div className="modal-botoes">
            <button type="button" onClick={onCancel} className="btn-cancelar">Cancelar</button>
            <button type="submit" className="btn-salvar">Salvar Alterações</button>
          </div>
        </form>
      </div>
    </div>
  );
}