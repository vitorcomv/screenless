import React, { useState, useEffect } from "react";
import "./EditarEventoForm.css";

export default function EditarEventoForm({ evento, onClose, onSave }) {
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    endereco: "",
    data_hora: ""
  });

  useEffect(() => {
    if (evento) {
      setFormData({
        titulo: evento.titulo,
        descricao: evento.descricao,
        endereco: evento.endereco,
        data_hora: evento.data_hora
      });
    }
  }, [evento]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`https://screenless-8k2p.onrender.com/api/editar_evento/${evento.ID_EVENTO}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Evento atualizado com sucesso!");
        onSave(); // recarrega os eventos
        onClose(); // fecha o modal
      } else {
        alert(data.erro || "Erro ao atualizar evento.");
      }
    } catch (err) {
      console.error("Erro na atualização", err);
      alert("Erro ao conectar com o servidor.");
    }
  };

  return (
    <div className="editar-evento-overlay">
      <div className="editar-evento-modal">
        <button className="fechar-btn" onClick={onClose}>X</button>
        <h2>Editar Evento</h2>
        <form onSubmit={handleSubmit}>
          <input name="titulo" placeholder="Título" value={formData.titulo} onChange={handleChange} required />
          <textarea name="descricao" placeholder="Descrição" value={formData.descricao} onChange={handleChange} required />
          <input name="endereco" placeholder="Endereço" value={formData.endereco} onChange={handleChange} required />
          <input name="data_hora" type="datetime-local" value={formData.data_hora} onChange={handleChange} required />
          <input type="file" name="foto" accept="image/*" onChange={(e) => setFormData(prev => ({ ...prev, foto: e.target.files[0] }))} />
          <button type="submit" className="salvar-btn">Salvar</button>
        </form>
      </div>
    </div>
  );
}