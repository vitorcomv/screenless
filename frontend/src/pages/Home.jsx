import React, { useEffect, useState, useRef } from 'react';
import './Home.css';
import imagem1 from '../assets/CriançasCorrendo.jpeg';
import imagem2 from '../assets/PaieFilho.jpg';
import imagem3 from '../assets/TimePark.jpeg';
const Home = () => {
  const [mensagem, setMensagem] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef(null);
  const images = [
    imagem1,
    imagem2,
    imagem3,
  ];
  const intervalTime = 5000; // Tempo em milissegundos para cada imagem (5 segundos)

  useEffect(() => {
    fetch('http://localhost:5000/api/mensagem')
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

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
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
                  <h1 className="hero-title">Outra Mensagem</h1>
                  <p className="hero-subtitle">Uma legenda diferente para a segunda imagem.</p>
                </>
              )}
              {index === 2 && (
                <>
                  <h1 className="hero-title">Mais uma Mensagem</h1>
                  <p className="hero-subtitle">E mais uma legenda para a terceira imagem.</p>
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
            {/* Card 1 - Ana Silva */}
            <div className="event-item expandable">
              <div className="event-header">
                <div className="event-user">
                  <div className="user-avatar"></div>
                  <span className="user-name">Ana Silva</span>
                  <span className="user-title">→</span>
                  <h3 className="user-title">Redescobrindo o Quintal</h3>
                </div>
                <span className="event-date">09/09/2025</span>
              </div>
              <div className="event-details">
                <p>Antes eu passava o dia inteiro no celular, pulando de vídeo em vídeo. Um dia, minha avó me chamou pra plantar flores com ela. Achei chato no começo, mas agora é o melhor momento do meu dia. Eu aprendi a cuidar, esperar e até me sujar de terra. É muito melhor do que só deslizar o dedo na tela.</p>
              </div>
            </div>

            {/* Card 2 - Pedro Costa */}
            <div className="event-item expandable">
              <div className="event-header">
                <div className="event-user">
                  <div className="user-avatar"></div>
                  <span className="user-name">Pedro Costa</span>
                  <span className="user-title">→</span>
                  <h3 className="user-title">O Som do Silêncio</h3>
                </div>
                <span className="event-date">15/09/2025</span>
              </div>
              <div className="event-details">
                <p>Eu vivia com fone de ouvido e jogando online. Quando minha internet caiu por uns dias, comecei a tocar o violão do meu irmão. Hoje eu componho minhas músicas e me apresento na escola. Descobri que o silêncio também pode ser incrível quando a gente aprende a escutar a si mesmo.</p>
              </div>
            </div>

            {/* Card 3 - Marcela Oliveira */}
            <div className="event-item expandable">
              <div className="event-header">
                <div className="event-user">
                  <div className="user-avatar"></div>
                  <span className="user-name">Marcela Oliveira</span>
                  <span className="user-title">→</span>
                  <h3 className="user-title">Mais Amigos, Menos Wi-Fi</h3>
                </div>
                <span className="event-date">22/09/2025</span>
              </div>
              <div className="event-details">
                <p>Meu recorde era de 12 horas por dia no celular. Só percebi o quanto isso me deixava triste quando comecei a sair com meus vizinhos pra brincar no parque. Agora, minha tela favorita é ver os sorrisos dos meus amigos de verdade. Nunca pensei que jogar bola fosse mais divertido que ficar só assistindo os outros.</p>
              </div>
            </div>

            {/* Card 4 - Lucas Santos */}
            <div className="event-item expandable">
              <div className="event-header">
                <div className="event-user">
                  <div className="user-avatar"></div>
                  <span className="user-name">Lucas Santos</span>
                  <span className="user-title">→</span>
                  <h3 className="user-title">Desconectar Pra Conectar</h3>
                </div>
                <span className="event-date">30/09/2025</span>
              </div>
              <div className="event-details">
                <p>Sempre que eu tava nervoso ou triste, corria pro videogame. Mas isso só escondia o problema. Um dia decidi tentar basquete com a galera da rua. Errava tudo, mas eles riam comigo, não de mim. Aprendi que me conectar com pessoas reais me faz sentir mais forte e mais feliz.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Mini formulário da Comunidade */}
      <section className="form-mini">
        <div className="form">
          <h2 className="heading-mini">PARTICIPE!</h2>
          <h3 className="heading-mini">Compartilhe seu relato</h3>
          <input className="input-mini" type="text" placeholder="Título do Relato"/>
          <textarea className="input-mini" placeholder="Escreva seu relato aqui..." rows={5} style={{ resize: 'none' }}></textarea>
          <button className="btn-mini" type="submit">Enviar</button>
        </div>
      </section>

      </section>

      {/* Seção Como Funciona */}
      <section className="how-section">
        <div className="section-container">
          <div className="how-content">
            <div className="how-text">
              <h2 className="section-title">Como Funciona?</h2>
              <p className="section-text">
                BrincarMais é um projeto social voltado para a promoção da saúde infantil, do brincar e de relações saudáveis entre crianças e adolescentes da comunidade. Através de eventos presenciais, atividades lúdicas, jogos educativos e um portal digital interativo, buscamos reduzir o tempo de tela das crianças e estimular o uso consciente da tecnologia e brincadeiras.&nbsp;
              </p>
              <p className="section-text">
                Nossos monitores e voluntários se dedicam a promover jogos, esportes em grupo e atividades criativas com bom conteúdo.
              </p>
              <button className="btn btn-primary">
                Vamos começar!
              </button>
            </div>
            <div className="how-image">
              <div className="image-container">
                <span>Imagem de crianças brincando</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;