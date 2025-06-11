import React, { useState, useEffect } from "react";
import "./FormularioEdicaoEvento.css"; // Usaremos um novo CSS

export default function FormularioEdicaoEvento({ eventoParaEditar, onSave, onCancel }) {
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
      // Formata a data para o input datetime-local
      const dataFormatada = new Date(eventoParaEditar.data_hora)
        .toISOString()
        .slice(0, 16);

      setFormData({
        titulo: eventoParaEditar.titulo || "",
        descricao: eventoParaEditar.descricao || "",
        endereco: eventoParaEditar.endereco || "",
        data_hora: dataFormatada,
      });
      setFoto(null); // Reseta a foto ao abrir
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
        alert("Sessão expirada. Faça login novamente.");
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
        alert("Evento atualizado com sucesso!");
        // Envia o evento atualizado de volta para o componente pai
        onSave(data.evento); 
      } else {
        alert(data.erro || "Erro ao atualizar evento.");
      }
    } catch (err) {
      console.error("Erro na atualização", err);
      alert("Erro ao conectar com o servidor.");
    }
  };
  
  // Impede que o clique dentro do modal feche o modal
  const stopPropagation = (e) => e.stopPropagation();

  return (
    // A div overlay agora chama onCancel para fechar quando clicada
    <div className="form-edicao-overlay" onClick={onCancel}>
      <div className="form-edicao-modal" onClick={stopPropagation}>
        <button className="fechar-btn" onClick={onCancel}>&times;</button>
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