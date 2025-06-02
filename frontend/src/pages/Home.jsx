import React, { useEffect, useState, useRef } from 'react';
import './Home.css';
import heroVideo from '../assets/crianças-video.mp4';
import imagemcard from '../assets/imagemcard.png';

const Home = () => {
  const [mensagem, setMensagem] = useState('');
  const [relatoTitulo, setRelatoTitulo] = useState(''); // Estado para o título do relato
  const [relatoTexto, setRelatoTexto] = useState('');
  const [relatos, setRelatos] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/mensagem')
      .then((res) => res.json())
      .then((data) => setMensagem(data.mensagem))
      .catch((err) => console.error('Erro ao buscar mensagem da API:', err));
  }, []);

  useEffect(() => {
    const fetchRelatos = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/relatos');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const relatosComIds = data.map(relato => ({
          ...relato,
          ID_RELATO: relato.ID_RELATO || Math.random().toString(36).substr(2, 9)
        }));
        setRelatos(relatosComIds);
      } catch (error) {
        console.error('Erro ao buscar relatos:', error);
      }
    };

    fetchRelatos();
  }, []);

  const handleSubmitRelato = async (e) => {
    e.preventDefault();

    const user_id = localStorage.getItem('user_id') || 1;
    const nome_usuario = localStorage.getItem('nome_usuario') || 'Usuário Anônimo';

    try {
      const response = await fetch('http://localhost:5000/api/criar_relato', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          titulo: relatoTitulo, // Usando o estado do título
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
      alert(result.mensagem);

      setRelatoTitulo(''); // Limpa o campo do título
      setRelatoTexto(''); // Limpa o campo do texto

      const updatedRelatosResponse = await fetch('http://localhost:5000/api/relatos');
      const updatedRelatos = await updatedRelatosResponse.json();
      const updatedRelatosComIds = updatedRelatos.map(relato => ({
        ...relato,
        ID_RELATO: relato.ID_RELATO || Math.random().toString(36).substr(2, 9)
      }));
      setRelatos(updatedRelatosComIds);

    } catch (error) {
      console.error('Erro ao enviar relato:', error);
      alert('Erro ao enviar relato: ' + error.message);
    }
  };

  return (
    <div className="home-container">
      {/* Seção Hero - Com vídeo de fundo */}
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

      {/* Seção de Destaque - Como Funciona */}
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

      {/* Seção Comunidade - Relatos (com novo layout) */}
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
                    <div className="comment-react">
                      <button>
                        <svg fill="none" viewBox="0 0 24 24" height="16" width="16" xmlns="http://www.w3.org/2000/svg">
                          <path fill="#707277" strokeLinecap="round" strokeWidth="2" stroke="#707277" d="M19.4626 3.99415C16.7809 2.34923 14.4404 3.01211 13.0344 4.06801C12.4578 4.50096 12.1696 4.71743 12 4.71743C11.8304 4.71743 11.5422 4.50096 10.9656 4.06801C9.55962 3.01211 7.21909 2.34923 4.53744 3.99415C1.01807 6.15294 0.221721 13.2749 8.33953 19.2834C9.88572 20.4278 10.6588 21 12 21C13.3412 21 14.1143 20.4278 15.6605 19.2834C23.7783 13.2749 22.9819 6.15294 19.4626 3.99415Z"></path>
                        </svg>
                      </button>
                      <hr />
                      <span>{relato.likes || 0}</span>
                    </div>
                    <div className="comment-container">
                      <div className="user">
                        <div className="user-pic">
                          <svg fill="none" viewBox="0 0 24 24" height="20" width="20" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinejoin="round" fill="#707277" strokeLinecap="round" strokeWidth="2" stroke="#707277" d="M6.57757 15.4816C5.1628 16.324 1.45336 18.0441 3.71266 20.1966C4.81631 21.248 6.04549 22 7.59087 22H16.4091C17.9545 22 19.1837 21.248 20.2873 20.1966C22.5466 18.0441 18.8372 16.324 17.4224 15.4816C14.1048 13.5061 9.89519 13.5061 6.57757 15.4816Z"></path>
                            <path strokeWidth="2" fill="#707277" stroke="#707277" d="M16.5 6.5C16.5 8.98528 14.4853 11 12 11C9.51472 11 7.5 8.98528 7.5 6.5C7.5 4.01472 9.51472 2 12 2C14.4853 2 16.5 4.01472 16.5 6.5Z"></path>
                          </svg>
                        </div>
                        <div className="user-info">
                          <span className="user-name">{relato.nome_usuario}</span>
                          <p className="relato-date">{new Date(relato.data_criacao).toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>
                      <div className="comment-content"> {/* Mudei para div para comportar título e texto */}
                        <h3 className="relato-title">{relato.titulo}</h3>
                        <p className="relato-text-scroll">{relato.texto}</p> {/* Nova classe para rolagem */}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-relatos-message">Nenhum relato ainda. Seja o primeiro a compartilhar!</p>
              )}
            </div>

            {/* Formulário de Relato (com novo layout) */}
            <form onSubmit={handleSubmitRelato} className="text-box">
              <div className="box-container">
                {/* Campo para o título do relato */}
                <input
                  type="text"
                  placeholder="Título do seu relato"
                  className="relato-input-title" // Nova classe para o input do título
                  value={relatoTitulo}
                  onChange={(e) => setRelatoTitulo(e.target.value)}
                  required
                />
                {/* Campo para o texto do relato */}
                <textarea
                  placeholder="Escreva seu relato"
                  value={relatoTexto}
                  onChange={(e) => setRelatoTexto(e.target.value)}
                  required
                ></textarea>
                <div>
                  <div className="formatting">
                    <button type="button">
                      <svg fill="none" viewBox="0 0 24 24" height="16" width="16" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinejoin="round" strokeLinecap="round" strokeWidth="2.5" stroke="#707277" d="M5 6C5 4.58579 5 3.87868 5.43934 3.43934C5.87868 3 6.58579 3 8 3H12.5789C15.0206 3 17 5.01472 17 7.5C17 9.98528 15.0206 12 12.5789 12H5V6Z" clipRule="evenodd" fillRule="evenodd"></path>
                        <path strokeLinejoin="round" strokeLinecap="round" strokeWidth="2.5" stroke="#707277" d="M12.4286 12H13.6667C16.0599 12 18 14.0147 18 16.5C18 18.9853 16.0599 21 13.6667 21H8C6.58579 21 5.87868 21 5.43934 20.5607C5 20.1213 5 19.4142 5 18V12"></path>
                      </svg>
                    </button>
                    <button type="button">
                      <svg fill="none" viewBox="0 0 24 24" height="16" width="16" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeWidth="2.5" stroke="#707277" d="M12 4H19"></path>
                        <path strokeLinecap="round" strokeWidth="2.5" stroke="#707277" d="M8 20L16 4"></path>
                        <path strokeLinecap="round" strokeWidth="2.5" stroke="#707277" d="M5 20H12"></path>
                      </svg>
                    </button>
                    <button type="button">
                      <svg fill="none" viewBox="0 0 24 24" height="16" width="16" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinejoin="round" strokeLinecap="round" strokeWidth="2.5" stroke="#707277" d="M5.5 3V11.5C5.5 15.0899 8.41015 18 12 18C15.5899 18 18.5 15.0899 18.5 11.5V3"></path>
                        <path strokeLinecap="round" strokeWidth="2.5" stroke="#707277" d="M3 21H21"></path>
                      </svg>
                    </button>
                    <button type="button">
                      <svg fill="none" viewBox="0 0 24 24" height="16" width="16" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinejoin="round" strokeLinecap="round" strokeWidth="2.5" stroke="#707277" d="M4 12H20"></path>
                        <path strokeLinecap="round" strokeWidth="2.5" stroke="#707277" d="M17.5 7.66667C17.5 5.08934 15.0376 3 12 3C8.96243 3 6.5 5.08934 6.5 7.66667C6.5 8.15279 6.55336 8.59783 6.6668 9M6 16.3333C6 18.9107 8.68629 21 12 21C15.3137 21 18 19.6667 18 16.3333C18 13.9404 16.9693 12.5782 14.9079 12"></path>
                      </svg>
                    </button>
                    <button type="button">
                      <svg fill="none" viewBox="0 0 24 24" height="16" width="16" xmlns="http://www.w3.org/2000/svg">
                        <circle strokeLinejoin="round" strokeLinecap="round" strokeWidth="2.5" stroke="#707277" r="10" cy="12" cx="12"></circle>
                        <path strokeLinejoin="round" strokeLinecap="round" strokeWidth="2.5" stroke="#707277" d="M8 15C8.91212 16.2144 10.3643 17 12 17C13.6357 17 15.0879 16.2144 16 15"></path>
                        <path strokeLinejoin="round" strokeLinecap="round" strokeWidth="3" stroke="#707277" d="M8.00897 9L8 9M16 9L15.991 9"></path>
                      </svg>
                    </button>
                    <button type="submit" className="send" title="Send">
                      <svg fill="none" viewBox="0 0 24 24" height="18" width="18" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinejoin="round" strokeLinecap="round" strokeWidth="2.5" stroke="#ffffff" d="M12 5L12 20"></path>
                        <path strokeLinejoin="round" strokeLinecap="round" strokeWidth="2.5" stroke="#ffffff" d="M7 9L11.2929 4.70711C11.6262 4.37377 11.7929 4.20711 12 4.20711C12.2071 4.20711 12.3738 4.37377 12.7071 4.70711L17 9"></path>
                      </svg>
                    </button>
                  </div>
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