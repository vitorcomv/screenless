import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import './Home.css';
import imagem1 from '../assets/CriançasCorrendo.jpeg';
import imagem2 from '../assets/MulherCorrendo.jpeg';
import imagem3 from '../assets/TimePark.jpeg';
import imagemcard from '../assets/imagemcard.png';

const Home = () => {
  const [mensagem, setMensagem] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef(null);

  const location = useLocation();

  useEffect(() => {
    if (location.state?.scrollTo) {
      const section = document.getElementById(location.state.scrollTo);
      if (section) {
        section.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [location]);

  const images = [
    imagem1,
    imagem2,
    imagem3,
  ];
  const intervalTime = 5000; // Tempo em milissegundos para cada imagem (5 segundos)

  // Estados para o formulário de relato
  const [relatoTitulo, setRelatoTitulo] = useState('');
  const [relatoTexto, setRelatoTexto] = useState('');
  const [relatos, setRelatos] = useState([]); // Estado para armazenar os relatos

  useEffect(() => {
    fetch('https://screenless-8k2p.onrender.com/api/mensagem')
      .then((res) => res.json())
      .then((data) => setMensagem(data.mensagem))
      .catch((err) => console.error('Erro ao buscar mensagem da API:', err));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, intervalTime);

    return () => clearInterval(interval); // Limpa o intervalo ao desmontar o componente
  }, [currentIndex]);

  useEffect(() => {
    // Função para buscar os relatos do backend
    const fetchRelatos = async () => {
      try {
        const response = await fetch('https://screenless-8k2p.onrender.com/api/relatos');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setRelatos(data); // Atualiza o estado com os relatos
      } catch (error) {
        console.error('Erro ao buscar relatos:', error);
      }
    };

    fetchRelatos();
  }, []); // Executa apenas uma vez ao montar o componente

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  // Função para lidar com o envio do formulário de relato
  const handleSubmitRelato = async (e) => {
    e.preventDefault(); // Previne o comportamento padrão de recarregar a página

    // Simulação de user_id e nome_usuario. Em um ambiente real, você obteria isso do estado de autenticação (e.g., localStorage, Context API, Redux)
    const user_id = localStorage.getItem('user_id') || 1; // Use o ID do usuário logado ou um padrão
    const nome_usuario = localStorage.getItem('nome_usuario') || 'Usuário Anônimo'; // Use o nome do usuário logado ou um padrão

    try {
      const response = await fetch('https://screenless-8k2p.onrender.com/api/criar_relato', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', // Importante para enviar JSON
        },
        body: JSON.stringify({
          titulo: relatoTitulo,
          relato: relatoTexto,
          user_id: user_id,
          nome_usuario: nome_usuario,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.erro || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      alert(result.mensagem); // Mensagem de sucesso

      // Limpa o formulário
      setRelatoTitulo('');
      setRelatoTexto('');

      // Re-busca os relatos para atualizar a lista
      const updatedRelatosResponse = await fetch('https://screenless-8k2p.onrender.com/api/relatos');
      const updatedRelatos = await updatedRelatosResponse.json();
      setRelatos(updatedRelatos);

    } catch (error) {
      console.error('Erro ao enviar relato:', error);
      alert('Erro ao enviar relato: ' + error.message);
    }
  };

  return (
    <div className="home-container">
      {/* Seção do Hero - Banner principal */}
      <section className="hero-section carousel-container" ref={carouselRef}>
        {images.map((image, index) => (
          <div
            key={index}
            className={`carousel-slide ${index === currentIndex ? 'active' : ''}`}
            style={{ backgroundImage: `url(${image})` }}
          >
            <div className="hero-content">
              {index === 0 && (
                <>
                  <h1 className="hero-title">Menos tela,<br />Mais vida!</h1>
                  <p className="hero-subtitle">Crie momentos especiais com atividades!</p>
                </>
              )}
              {index === 1 && (
                <>
                  <h1 className="hero-title">Cada passo é <br />uma vitória !</h1>
                  <p className="hero-subtitle">A corrida é a sua jornada de superação!</p>
                </>
              )}
              {index === 2 && (
                <>
                  <h1 className="hero-title">Alegria compartilhada!</h1>
                  <p className="hero-subtitle">A felicidade ganha uma nova dimensão quando dividida</p>
                </>
              )}
            </div>
          </div>
        ))}
      </section>

      <section className="events-section" id="comunidade">
        <div className="section-container">
          <h2 className="section-title">Comunidade</h2>
          <p className="section-subtitle">Relatos inspiradores de pessoas que transformaram seus hábitos digitais.</p>

          <div className="events-card">
            {/* Mapeia os relatos do estado para criar os cards dinamicamente */}
            {relatos.map((relato) => (
              <div className="event-item expandable" key={relato.ID_RELATO}>
                <div className="event-header">
                  <div className="event-user">
                    <div className="user-avatar"></div> {/* Pode ser uma imagem de perfil ou ícone */}
                    <span className="user-name">{relato.nome_usuario}</span>
                    <span className="user-title">→</span>
                    <h3 className="user-title">{relato.titulo}</h3>
                  </div>
                  <span className="event-date">{relato.data_criacao}</span>
                </div>
                <div className="event-details">
                  <p>{relato.texto}</p>
                </div>
              </div>
            ))}
            {relatos.length === 0 && <p>Nenhum relato ainda. Seja o primeiro a compartilhar!</p>}
          </div>
        </div>

        {/* Mini formulário da Comunidade */}
        <section className="form-mini">
          <div className="form">
            <h2 className="heading-mini">PARTICIPE!</h2>
            <h3 className="heading-mini">Compartilhe seu relato</h3>
            <form onSubmit={handleSubmitRelato}> {/* Adiciona o onSubmit aqui */}
              <input
                className="input-mini"
                type="text"
                placeholder="Título do Relato"
                value={relatoTitulo}
                onChange={(e) => setRelatoTitulo(e.target.value)}
                required
              />
              <textarea
                className="input-mini"
                placeholder="Escreva seu relato aqui..."
                rows={5}
                style={{ resize: 'none' }}
                value={relatoTexto}
                onChange={(e) => setRelatoTexto(e.target.value)}
                required
              ></textarea>
              <button className="btn-mini" type="submit">Enviar</button>
            </form>
          </div>
        </section>

      </section>

      {/* Seção Como Funciona (mantida como está) */}
      <section className="how-section">
        <div className="section-container">
          <div className="how-content">
            <div className="how-text">
              <h2 className="section-title">Como Funciona?</h2>
              <p className="section-text">
                Screenless é um projeto social voltado para a promoção da saúde mental, do bem-estar e da educação de qualidade entre crianças e adolescentes da comunidade.
                Através de eventos presenciais, atividades dinâmicas, ações educativas e um ambiente digital interativo, o projeto busca prevenir a dependência de internet, incentivando o uso consciente da tecnologia e fortalecendo vínculos familiares e comunitários.
                Screenless acredita que menos tela significa mais vida, mais conexão real e mais desenvolvimento social.
              </p>
              <button className="btn btn-primary">
                Vamos começar!
              </button>
            </div>
            <div className="how-image">
              <img src={imagemcard} alt="Crianças brincando" style={{ width: '70%', height: 'auto' }} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;