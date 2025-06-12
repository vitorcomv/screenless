import React, { useState, useEffect } from "react";
import "./FormularioEdicaoEvento.css";
import { useAlert } from "../context/AlertContext"; // Importe o hook

export default function FormularioEdicaoEvento({ eventoParaEditar, onSave, onCancel }) {
  const { showAlert } = useAlert(); // Use o hook
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    endereco: "",
    data_hora: "",
  });
  const [foto, setFoto] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (eventoParaEditar) {
      const dataFormatada = new Date(eventoParaEditar.data_hora)
        .toISOString()
        .slice(0, 16);

      setFormData({
        titulo: eventoParaEditar.titulo || "",
        descricao: eventoParaEditar.descricao || "",
        endereco: eventoParaEditar.endereco || "",
        data_hora: dataFormatada,
      });
      setFoto(null);
    }
  }, [eventoParaEditar]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFotoChange = (e) => {
    setFoto(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      showAlert("Sessão expirada. Faça login novamente.", "warning");
      onCancel(); // Fecha o modal
      return;
    }

    const formPayload = new FormData();
    formPayload.append("titulo", formData.titulo);
    formPayload.append("descricao", formData.descricao);
    formPayload.append("endereco", formData.endereco);
    formPayload.append("data_hora", formData.data_hora);
    if (foto) {
      formPayload.append("foto", foto);
    }

    try {
      const res = await fetch(
        `http://localhost:5000/api/editar_evento/${eventoParaEditar.ID_EVENTO}`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
          body: formPayload,
        }
      );

      const data = await res.json();

      if (res.ok) {
        // Agora data.evento existe e contém o objeto completo!
        onSave(data.evento); 
      } else {
        showAlert(data.erro || "Erro ao atualizar evento.", "error");
      }
    } catch (err) {
      console.error("Erro na atualização", err);
      showAlert("Falha na comunicação com o servidor.", "error");
    }
  };
  
  const stopPropagation = (e) => e.stopPropagation();

  return (
    <div className="form-edicao-overlay" onClick={onCancel}>
      <div className="form-edicao-modal" onClick={stopPropagation}>
        <h2>Editar Evento</h2>
        <form onSubmit={handleSubmit} className="form-edicao-conteudo">
          <label>Título do Evento</label>
          <input name="titulo" placeholder="Título" value={formData.titulo} onChange={handleInputChange} required />
          
          <label>Descrição</label>
          <textarea name="descricao" placeholder="Descrição" value={formData.descricao} onChange={handleInputChange} required />
          
          <label>Endereço</label>
          <input name="endereco" placeholder="Endereço" value={formData.endereco} onChange={handleInputChange} required />
          
          <label>Data e Hora</label>
          <input name="data_hora" type="datetime-local" value={formData.data_hora} onChange={handleInputChange} required />
          
          <label>Alterar Foto (opcional)</label>
          <input type="file" name="foto" accept="image/*" onChange={handleFotoChange} />
          
          <div className="form-edicao-botoes">
             <button type="button" className="btn-cancelar" onClick={onCancel}>Cancelar</button>
             <button type="submit" className="btn-salvar">Salvar Alterações</button>
          </div>
        </form>
      </div>
    </div>
  );
}