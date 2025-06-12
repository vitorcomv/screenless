import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import './MeuPerfil.css';
import CustomAlert from '../components/CustomAlert';

const MeuPerfil = () => {
    const { token, atualizarUsuario } = useContext(AuthContext);
    const [alertState, setAlertState] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: '',
    });
    const [dados, setDados] = useState({
        nome: '',
        sobrenome: '',
        email: '',
        telefone: '',
        usuario: '',
        cpf: '',
        foto_perfil: null,
    });
    const [fotoPreview, setFotoPreview] = useState(null);
    const [fotoFile, setFotoFile] = useState(null);
    useEffect(() => {
        if (!token) return;

        fetch('https://screenless-8k2p.onrender.com/api/perfil', {
            headers: { Authorization: `Bearer ${token}` },
        })
        .then(res => res.json())
        .then(data => {
            if (data.erro) {
                setAlertState({ isOpen: true, title: "Erro ao Carregar Perfil", message: data.erro, type: 'error' });
            } else {
                setDados({
                    nome: data.nome || '',
                    sobrenome: data.sobrenome || '',
                    email: data.email || '',
                    telefone: data.telefone || '',
                    usuario: data.usuario || '',
                    cpf: data.CPF || '',
                    foto_perfil: data.foto_perfil || null
                });
                setFotoPreview(data.foto_url || (data.foto_perfil ? `https://screenless-8k2p.onrender.com/uploads/${data.foto_perfil}` : null));
            }
        });
    }, [token]);
    const handleChange = (e) => {
        const { name, value } = e.target;
        setDados(prev => ({ ...prev, [name]: value }));
    };
    const handleFotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFotoFile(file);
            setFotoPreview(URL.createObjectURL(file));
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('nome', dados.nome);
        formData.append('sobrenome', dados.sobrenome);
        formData.append('email', dados.email);
        formData.append('telefone', dados.telefone);
        formData.append('usuario', dados.usuario);
        if (fotoFile) {
            formData.append('foto_perfil', fotoFile);
        }
        try {
            const res = await fetch("https://screenless-8k2p.onrender.com/api/perfil", {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            const data = await res.json();
            if (res.ok) {
                setAlertState({ isOpen: true, title: "Sucesso!", message: "Perfil atualizado com sucesso!", type: 'success' });
                
                atualizarUsuario(dados.usuario, data.foto_url);
                if (data.foto_url) {
                    setFotoPreview(data.foto_url);
                }
            } else {
                setAlertState({ isOpen: true, title: "Erro na Atualização", message: data.erro || "Erro ao atualizar perfil.", type: 'error' });
            }
        } catch (error) {
            console.error(error);
            setAlertState({ isOpen: true, title: "Erro de Conexão", message: "Não foi possível se comunicar com o servidor.", type: 'error' });
        }
    };
    return (
        <div className="perfil-container">
            <CustomAlert
                isOpen={alertState.isOpen}
                title={alertState.title}
                message={alertState.message}
                type={alertState.type}
                onClose={() => setAlertState({ ...alertState, isOpen: false })}
            />
            <h2>Meu Perfil</h2>
            <form onSubmit={handleSubmit}>
                <div className="perfil-foto">
                    <img src={fotoPreview || '/placeholder.png'} alt="Foto de perfil" />
                    <input type="file" onChange={handleFotoChange} />
                </div>
                <input name="nome" value={dados.nome} onChange={handleChange} placeholder="Nome" required />
                <input name="sobrenome" value={dados.sobrenome} onChange={handleChange} placeholder="Sobrenome" required />
                <input name="email" value={dados.email} onChange={handleChange} placeholder="Email" required />
                <input name="telefone" value={dados.telefone} onChange={handleChange} placeholder="Telefone" />
                <input name="usuario" value={dados.usuario} onChange={handleChange} placeholder="Usuário" required />
                <input name="cpf" value={dados.cpf} disabled placeholder="CPF (não editável)" />
                <button type="submit">Salvar alterações</button>
            </form>
        </div>
    );
};

export default MeuPerfil;