import React, { useEffect, useState } from 'react';
import './Home.css';

const Home = () => {
  const [mensagem, setMensagem] = useState('');

  useEffect(() => {
    fetch('http://localhost:5000/api/mensagem')
      .then((res) => res.json())
      .then((data) => setMensagem(data.mensagem))
      .catch((err) => console.error('Erro ao buscar mensagem da API:', err));
  }, []);

  return (
    <div className="home-container">
      {/* Seção do Hero - Banner principal */}
      <section className="hero-section">
        {/* Navbar removida conforme solicitado */}

        <div className="hero-content">
          <h1 className="hero-title">
            Menos tela,<br />
            Mais vida!
          </h1>
          <p className="hero-subtitle">Crie momentos especiais com atividades!</p>
          <div className="hero-buttons">
            <button className="btn btn-primary">
              Encontre um evento perto de você
            </button>
            <button className="btn btn-outline">
              Planeje seu evento
            </button>
          </div>
        </div>
      </section>

      {/* Seção de Próximos Eventos */}
      <section className="events-section">
        <div className="section-container">
          <h2 className="section-title">Comunidade</h2>
          <p className="section-subtitle">Veja abaixo os próximos eventos e atividades na sua cidade.</p>
          
          <div className="events-card">
            <div className="event-item">
              <div className="event-header">
                <div className="event-user">
                  <div className="user-avatar"></div>
                  <span className="user-name">Nome da pessoa</span>
                </div>
                <span className="event-date">09/09/2025</span>
              </div>
            </div>
            
            <div className="event-item">
              {/* Conteúdo do evento */}
            </div>
            
            <div className="event-item">
              {/* Conteúdo do evento */}
            </div>
            
            <div className="event-item">
              {/* Conteúdo do evento */}
            </div>
          </div>
        </div>
      </section>

      {/* Seção Como Funciona */}
      <section className="how-section">
        <div className="section-container">
          <div className="how-content">
            <div className="how-text">
              <h2 className="section-title">Como Funciona?</h2>
              <p className="section-text">
                BrincarMais é um projeto social voltado para a promoção da saúde infantil, do brincar e de relações saudáveis entre crianças e adolescentes da comunidade. Através de eventos presenciais, atividades lúdicas, jogos educativos e um portal digital interativo, buscamos reduzir o tempo de tela das crianças e estimular o uso consciente da tecnologia e brincadeiras. 
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
