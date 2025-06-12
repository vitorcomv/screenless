import React from 'react';
import './BotaoBloqueado.css';
import { FaLock } from 'react-icons/fa'; // Vamos usar um ícone de cadeado!

export default function BotaoBloqueado({ nivelNecessario, paraCriar, className }) {
  const mensagem = `Alcance o nível ${nivelNecessario} para criar ${paraCriar}. Você consegue!`;

  return (
    // O 'div' wrapper permite que a dica apareça mesmo com o botão desabilitado
    <div className="botao-bloqueado-wrapper">
      <button className={`botao-bloqueado-base ${className}`} disabled>
        <FaLock className="cadeado-icone" /> 
        CRIE SEU {paraCriar.split(' ')[1].toUpperCase()}
      </button>
      <span className="tooltip-bloqueado">{mensagem}</span>
    </div>
  );
}