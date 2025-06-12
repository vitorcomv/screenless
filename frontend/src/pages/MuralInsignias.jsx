import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; // Se precisar redirecionar
import './MuralInsignias.css'; // Criaremos este arquivo em seguida

// Componente para um Card de Insígnia individual
const InsigniaCard = ({ insignia, onSelecionar, desabilitado, token }) => {
  const handleCardClick = () => {
    if (!desabilitado && insignia.conquistada && !insignia.selecionada) {
      onSelecionar(insignia.ID_INSIGNIA);
    } else if (!desabilitado && insignia.conquistada && insignia.selecionada) {
      // Opcional: permitir desmarcar clicando na já selecionada
      // onSelecionar(null); // Ou ter um botão específico para "Remover Seleção"
      console.log("Insígnia já selecionada. Para desmarcar, implemente um botão ou lógica adicional.");
    }
  };

  const cardClassName = `
    insignia-card
    ${insignia.conquistada ? 'conquistada' : 'nao-conquistada'}
    ${insignia.selecionada ? 'selecionada' : ''}
    ${desabilitado ? 'desabilitado' : ''}
    ${insignia.conquistada && !insignia.selecionada && !desabilitado ? 'selecionavel' : ''}
  `;

  return (
    <div className={cardClassName} onClick={handleCardClick} title={insignia.conquistada ? (insignia.selecionada ? "Insígnia atualmente em uso" : "Clique para selecionar esta insígnia") : "Você ainda não conquistou esta insígnia"}>
      {insignia.icone_url ? (
        <img src={insignia.icone_url} alt={insignia.nome} className="insignia-icone" />
      ) : (
        <div className="insignia-icone-placeholder">Sem Ícone</div>
      )}
      <h3 className="insignia-nome">{insignia.nome}</h3>
      <p className="insignia-descricao">{insignia.descricao}</p>
      {!insignia.conquistada && (
        <div className="insignia-status-bloqueada">Bloqueada</div>
      )}
      {insignia.selecionada && (
        <div className="insignia-status-selecionada">Selecionada</div>
      )}
    </div>
  );
};


export default function MuralInsignias() {
  const [insignias, setInsignias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mensagem, setMensagem] = useState(''); // Para feedback ao usuário
  const [idUsuarioLogado, setIdUsuarioLogado] = useState(null); // Precisamos do ID do usuário
  const [token, setToken] = useState(localStorage.getItem('token'));
  const navigate = useNavigate();

  // Função para decodificar o token e pegar o ID do usuário
  // (Você pode ter uma função utilitária para isso)
  const getUserIdFromToken = useCallback(() => {
    if (token) {
      try {
        const payloadBase64 = token.split('.')[1];
        const decodedPayload = JSON.parse(atob(payloadBase64));
        return decodedPayload.id; // Assumindo que o ID está no campo 'id' do payload
      } catch (e) {
        console.error("Erro ao decodificar token:", e);
        setError("Sessão inválida. Por favor, faça login novamente.");
        localStorage.removeItem('token');
        setToken(null); // Limpa o token do estado
        // navigate('/login'); // Redireciona para o login
        return null;
      }
    }
    return null;
  }, [token]); // Adicionado navigate como dependência

  useEffect(() => {
    const userId = getUserIdFromToken();
    if (userId) {
      setIdUsuarioLogado(userId);
    } else if (!token) {
        // Se não há token, não prosseguir com o fetch e talvez redirecionar
        setError("Você precisa estar logado para ver o mural de insígnias.");
        setLoading(false);
        // Considere redirecionar para o login: navigate('/login');
        return;
    } else {
        // Token existe mas é inválido (já tratado em getUserIdFromToken)
        setLoading(false);
        return;
    }

    if (userId && token) { // Só faz o fetch se tiver userId e token válidos
      setLoading(true);
      fetch(`https://screenless-8k2p.onrender.com/api/mural-insignias`, { // A rota não precisa do ID na URL se o backend pega do token
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
        .then(res => {
          if (!res.ok) {
            if (res.status === 401) {
              localStorage.removeItem('token');
              setToken(null);
              throw new Error('Sessão expirada ou inválida. Faça login novamente.');
            }
            throw new Error(`Erro HTTP: ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          setInsignias(data);
          setLoading(false);
        })
        .catch(err => {
          console.error("Erro ao buscar insígnias:", err);
          setError(err.message || "Não foi possível carregar as insígnias.");
          setLoading(false);
        });
    }
  }, [token, getUserIdFromToken]); // Depende de token e da função de decodificação

  const handleSelecionarInsignia = async (idInsignia) => {
    if (!token) {
      setError("Sessão expirada. Faça login novamente.");
      // navigate('/login');
      return;
    }
    setMensagem('Selecionando insígnia...');
    try {
      const response = await fetch(`https://screenless-8k2p.onrender.com/api/usuario/insignia-selecionada`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ id_insignia: idInsignia }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.erro || `Erro ao selecionar insígnia: ${response.statusText}`);
      }

      setMensagem(data.mensagem || 'Insígnia atualizada!');
      
      // Atualizar a lista de insígnias para refletir a nova seleção
      setInsignias(prevInsignias =>
        prevInsignias.map(ins => ({
          ...ins,
          selecionada: ins.ID_INSIGNIA === idInsignia,
        }))
      );

      // TODO: Idealmente, atualizar o token JWT no localStorage se ele contém
      // a insignia_selecionada_id e insignia_icone_url, ou forçar um refresh
      // dos dados do usuário no contexto global da aplicação.
      // Por ora, a mudança é apenas visual no mural. O próximo login pegará o novo estado.

      setTimeout(() => setMensagem(''), 3000); // Limpa a mensagem após 3 segundos

    } catch (err) {
      console.error("Erro ao selecionar insígnia:", err);
      setError(err.message || "Não foi possível selecionar a insígnia.");
      setMensagem(''); // Limpa a mensagem de "carregando"
    }
  };
  
  // Botão para desmarcar a insígnia atualmente selecionada
  const handleDesmarcarInsignia = () => {
    const insigniaSelecionada = insignias.find(ins => ins.selecionada);
    if (insigniaSelecionada) {
      handleSelecionarInsignia(null); // Envia null para desmarcar
    } else {
      setMensagem("Nenhuma insígnia está selecionada para desmarcar.");
      setTimeout(() => setMensagem(''), 3000);
    }
  };


  if (loading) return <div className="mural-loading">Carregando insígnias...</div>;
  if (error) return <div className="mural-error">Erro: {error}</div>;

  const algumaInsigniaSelecionada = insignias.some(ins => ins.selecionada);

  return (
    <div className="mural-insignias-container">
      <h2>Mural de Insígnias</h2>
      {mensagem && <div className="mural-mensagem">{mensagem}</div>}
      
      {/* Botão para desmarcar insígnia */}
      {algumaInsigniaSelecionada && (
          <button onClick={handleDesmarcarInsignia} className="btn-desmarcar-insignia">
              Remover Seleção da Insígnia
          </button>
      )}

      {insignias.length === 0 && !loading && (
        <p>Nenhuma insígnia encontrada no sistema.</p>
      )}
      <div className="insignias-grid">
        {insignias.map(insignia => (
          <InsigniaCard
            key={insignia.ID_INSIGNIA}
            insignia={insignia}
            onSelecionar={handleSelecionarInsignia}
            // Desabilitar o clique se estiver em processo de seleção para evitar cliques duplos
            // desabilitado={/* alguma condição de loading da seleção, se necessário */}
          />
        ))}
      </div>
    </div>
  );
}