import React from 'react';
import { useNavigate, Link } from "react-router-dom";
import './SobreNos.css';
import autor1Img from '../assets/autor1.png';
import autor2Img from '../assets/autor2.png';
import autor3Img from '../assets/autor3.png';

const LinkedInIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
        <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.25 6.5 1.75 1.75 0 016.5 8.25zM19 19h-3v-4.75c0-1.4-1.2-2.5-2.5-2.5S11 12.85 11 14.25V19h-3v-9h2.9v1.35c.7-1.2 2.2-1.6 3.1-1.35 1.6.45 2.5 2.1 2.5 3.75V19z" />
    </svg>
);

const GitHubIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.165 6.839 9.492.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.031-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.03 1.595 1.03 2.688 0 3.848-2.338 4.695-4.566 4.942.359.308.678.92.678 1.852 0 1.338-.012 2.419-.012 2.745 0 .267.18.577.688.482A10.001 10.001 0 0022 12c0-5.523-4.477-10-10-10z" clipRule="evenodd" />
    </svg>
);

const membros = [
    {
        nome: "Bruno Klisman",
        imagem: autor1Img,
        linkedin: "https://www.linkedin.com/in/bruno-klisman-30aa14267/",
        github: "https://github.com/Bruno-Klisman",
        role: "Gerente do Projeto e DBA"
    },
    {
        nome: "Isael Garcia",
        imagem: autor2Img,
        linkedin: "https://www.linkedin.com/in/isael-garcia-7aa837271/",
        github: "https://github.com/isaelgarcia",
        role: "Desenvolvedor Full-Stack"
    },
    {
        nome: "Vitor Hugo",
        imagem: autor3Img,
        linkedin: "https://www.linkedin.com/in/vitor-hugo-258130258/",
        github: "https://github.com/vitorcomv",
        role: "Desenvolvedor Full-Stack"
    }
];

export default function SobreNos() {
  const navigate = useNavigate();

  return (
    <div className="sobre-nos-page">
      <header className="sobre-nos-header">
        <div className="header-content">
          <h1>Nossa História: Da Preocupação à Ação</h1>
          <p>Um convite para redescobrir o mundo além das telas.</p>
        </div>
      </header>

      <section className="sobre-nos-section">
        <div className="text-container">

          <div className="text-block">
              <h2>O Mundo em Desequilíbrio</h2>
              <p>
                Vivemos na era da hiperconexão digital. As telas, antes janelas para o mundo, tornaram-se barreiras silenciosas entre olhares, risadas e abraços. As conversas profundas deram lugar a mensagens instantâneas; os momentos de presença foram engolidos por rolagens infinitas. Não somos apenas nós, adultos, que sentimos esse vazio — nossas crianças e jovens estão crescendo em um mundo onde o toque e o olhar se tornam cada vez mais raros.

                Mas ainda há tempo de virar essa chave.
                <br/>
                Acreditamos que cada família, cada pequeno grupo, pode ser a centelha de transformação que o mundo precisa. Por isso, criamos o Desafio Screenless: um convite para que pais, filhos, avós e amigos se unam em experiências reais e significativas, e compartilhem essas vivências com a comunidade. Assim, cada gesto simples — uma caminhada ao ar livre, um jantar sem celulares, um jogo de tabuleiro em família — se transforma em inspiração para outras pessoas reencontrarem o equilíbrio.
              </p>
          </div>

          <div className="text-block">
              <h2>Nossa Missão: A Reconexão</h2>
              <div className="missao-container">
                <p>
                    O Screenless nasceu não como uma simples plataforma, mas como um chamado. Um movimento que acredita que a verdadeira riqueza da vida está nos momentos vividos fora das telas — no sorriso partilhado, na conversa sem pressa, na descoberta ao ar livre. Nossa missão é reacender a alegria das pequenas experiências, fortalecer os laços humanos e reconstruir a beleza das conexões reais.
                    <br/>
                    Se você também sente que é hora de resgatar tudo aquilo que realmente importa, junte-se a nós.
                    Tem ideias, sugestões ou quer colaborar com o movimento? Estamos abertos a ouvir. 💚
                </p>
                  <ul>
                      <li><span>✓</span> Incentivamos desafios que transformam rotinas.</li>
                      <li><span>✓</span> Facilitamos a criação de eventos que unem pessoas.</li>
                      <li><span>✓</span> Criamos uma comunidade que valoriza e compartilha histórias reais.</li>
                      <li><span>✓</span> Promovemos a reconexão com o mundo real.</li>
                      <li><span>✓</span> Oferecemos uma plataforma intuitiva e acessível.</li>
                  </ul>
              </div>
          </div>

        </div>
      </section>
      
      <section className="sobre-nos-team">
        <h2>Os Criadores por Trás da Reconexão</h2>
        <div className="team-container">
          {membros.map((membro, index) => (
            <div className="team-member-card" key={index}>
              <img className="member-photo" src={membro.imagem} alt={membro.nome} />
              <h3 className="member-name">{membro.nome}</h3>
              <p className="member-role">{membro.role}</p>
              <div className="member-contact">
                <a href={membro.linkedin} target="_blank" rel="noopener noreferrer" aria-label={`LinkedIn de ${membro.nome}`}>
                  <LinkedInIcon />
                </a>
                <a href={membro.github} target="_blank" rel="noopener noreferrer" aria-label={`GitHub de ${membro.nome}`}>
                  <GitHubIcon />
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>
      
      <section className="sobre-nos-cta">
        <h2>Faça Parte do Movimento</h2>
        <p>Junte-se a milhares de pessoas que estão redescobrindo a alegria de viver momentos autênticos.</p>
        <Link to="/eventos" className="cta-link">
            Comece sua Jornada Screenless →
        </Link>
      </section>
    </div>
  );
}
