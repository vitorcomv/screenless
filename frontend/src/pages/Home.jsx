import React, { useEffect, useState } from 'react';
import './Home.css';
import heroVideo from '../assets/crianças-video.mp4';
import imagemcard from '../assets/imagemcard.png';
import CustomAlert from '../components/CustomAlert'; // Importando o alerta

const Home = () => {
    // Estado para controlar o alerta
    const [alertState, setAlertState] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: '',
    });

    const [mensagem, setMensagem] = useState('');
    const [relatoTitulo, setRelatoTitulo] = useState('');
    const [relatoTexto, setRelatoTexto] = useState('');
    const [relatos, setRelatos] = useState([]);

    useEffect(() => {
        // ... seu useEffect para buscar dados permanece o mesmo ...
        fetch('http://localhost:5000/api/mensagem')
            .then((res) => res.json())
            .then((data) => setMensagem(data.mensagem))
            .catch((err) => console.error('Erro ao buscar mensagem da API:', err));

        const fetchRelatos = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/relatos');
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data = await response.json();
                const relatosComIds = data.map(relato => ({ ...relato, ID_RELATO: relato.ID_RELATO || Math.random().toString(36).substr(2, 9) }));
                setRelatos(relatosComIds);
            } catch (error) {
                console.error('Erro ao buscar relatos:', error);
            }
        };
        fetchRelatos();
    }, []);

    const handleSubmitRelato = async (e) => {
        e.preventDefault();
        const currentToken = localStorage.getItem('token');
        
        if (!currentToken) {
            setAlertState({ isOpen: true, title: "Acesso Negado", message: "Você precisa estar logado para enviar um relato.", type: 'warning' });
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/criar_relato', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentToken}` },
                body: JSON.stringify({ titulo: relatoTitulo, relato: relatoTexto }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ erro: `Erro HTTP ${response.status}` }));
                throw new Error(errorData.erro || `HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            setAlertState({ isOpen: true, title: "Sucesso!", message: result.mensagem || "Relato enviado e aguardando aprovação.", type: 'success' });
            
            if (result.novas_insignias_conquistadas && result.novas_insignias_conquistadas.length > 0) {
                setTimeout(() => {
                    setAlertState({
                        isOpen: true,
                        title: "Parabéns, Nova Conquista!",
                        message: `Você ganhou ${result.novas_insignias_conquistadas.length > 1 ? 'as insígnias' : 'a insígnia'}: ${result.novas_insignias_conquistadas.join(', ')}`,
                        type: 'success'
                    });
                }, 2000);
            }

            setRelatoTitulo('');
            setRelatoTexto('');

            const updatedRelatosResponse = await fetch('http://localhost:5000/api/relatos');
            const updatedRelatos = await updatedRelatosResponse.json();
            const updatedRelatosComIds = updatedRelatos.map(relato => ({ ...relato, ID_RELATO: relato.ID_RELATO || Math.random().toString(36).substr(2, 9) }));
            setRelatos(updatedRelatosComIds);

        } catch (error) {
            console.error('Erro ao enviar relato:', error);
            setAlertState({ isOpen: true, title: "Erro ao Enviar", message: error.message || "Não foi possível conectar ao servidor.", type: 'error' });
        }
    };

    return (
        <div className="home-container">
            <CustomAlert
                isOpen={alertState.isOpen}
                title={alertState.title}
                message={alertState.message}
                type={alertState.type}
                onClose={() => setAlertState({ ...alertState, isOpen: false })}
            />

            <section className="hero-section">
                <video autoPlay loop muted className="hero-video-background">
                    <source src={heroVideo} type="video/mp4" />
                    Seu navegador não suporta a tag de vídeo.
                </video>
                <div className="hero-overlay"></div>
                <div className="hero-content">
                    <h1 className="hero-title">
                        <span className="highlight">Menos tela,</span>
                        <br />
                        <span className="highlight">Mais vida!</span>
                    </h1>
                    <p className="hero-subtitle">Crie momentos especiais com atividades divertidas e novas amizades!</p>
                    <div className="scroll-down-arrow">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </section>

            <section className="how-section" id="como-funciona">
                <div className="section-container">
                    <div className="how-content">
                        <div className="how-text">
                            <h2 className="section-title">Como Funciona?</h2>
                            <p className="section-text">
                                Screenless é um projeto social voltado para a promoção da saúde mental, do bem-estar e da educação de qualidade entre crianças e adolescentes da comunidade.
                                Através de eventos presenciais, atividades dinâmicas, ações educativas e um ambiente digital interativo, o projeto busca prevenir a dependência de internet, incentivando o uso consciente da tecnologia e fortalecendo vínculos familiares e comunitários.
                                Screenless acredita que menos tela significa mais vida, mais conexão real e mais desenvolvimento social.
                            </p>
                        </div>
                        <div className="how-image">
                            <img src={imagemcard} alt="Crianças brincando" className="how-image-img" />
                        </div>
                    </div>
                </div>
            </section>
            
            <section className="community-section" id="comunidade">
                <div className="section-container">
                    <h2 className="section-title">Comunidade</h2>
                    <p className="section-subtitle">Relatos inspiradores de pessoas que transformaram seus hábitos digitais.</p>

                    <div className="new-relato-card-container">
                        <span className="comments-title">Relatos</span>

                        <div className="new-comments-section">
                            {relatos.length > 0 ? (
                                relatos.map((relato) => (
                                    <div className="comment-item" key={relato.ID_RELATO}>
                                        <div className="comment-container">
                                            <div className="user">
                                                <div className="avatar">
                                                    <svg fill="none" viewBox="0 0 24 24" height="20" width="20" xmlns="http://www.w3.org/2000/svg">
                                                        <path strokeLinejoin="round" fill="#707277" strokeLinecap="round" strokeWidth="2" stroke="#707277" d="M6.57757 15.4816C5.1628 16.324 1.45336 18.0441 3.71266 20.1966C4.81631 21.248 6.04549 22 7.59087 22H16.4091C17.9545 22 19.1837 21.248 20.2873 20.1966C22.5466 18.0441 18.8372 16.324 17.4224 15.4816C14.1048 13.5061 9.89519 13.5061 6.57757 15.4816Z"></path>
                                                        <path strokeWidth="2" fill="#707277" stroke="#707277" d="M16.5 6.5C16.5 8.98528 14.4853 11 12 11C9.51472 11 7.5 8.98528 7.5 6.5C7.5 4.01472 9.51472 2 12 2C14.4853 2 16.5 4.01472 16.5 6.5Z"></path>
                                                    </svg>
                                                </div>
                                                <div className="user-info">
                                                    <div className="user-name-container">
                                                        <span className="user-name">{relato.autor_nome}</span>
                                                        {relato.autor_insignia_url && (
                                                            <img 
                                                                src={relato.autor_insignia_url}
                                                                alt="Insígnia do usuário"
                                                                className="insignia-no-relato"
                                                            />
                                                        )}
                                                    </div>
                                                    <p className="relato-date">{relato.data_criacao_formatada}</p>
                                                </div>
                                            </div>
                                            <div className="comment-content">
                                                <h3 className="relato-title">{relato.titulo}</h3>
                                                <p className="relato-text-scroll">{relato.texto}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="no-relatos-message">Nenhum relato ainda. Seja o primeiro a compartilhar!</p>
                            )}
                        </div>

                        <form onSubmit={handleSubmitRelato} className="text-box">
                            <div className="box-container">
                                <input
                                    type="text"
                                    placeholder="Título do seu relato"
                                    className="relato-input-title"
                                    value={relatoTitulo}
                                    onChange={(e) => setRelatoTitulo(e.target.value)}
                                    required
                                />
                                <textarea
                                    placeholder="Escreva seu relato"
                                    value={relatoTexto}
                                    onChange={(e) => setRelatoTexto(e.target.value)}
                                    required
                                ></textarea>
                                <div>
                                    <button className="pushable">
                                        <span className="shadow"></span>
                                        <span className="edge"></span>
                                        <span className="front"> Enviar </span>
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;