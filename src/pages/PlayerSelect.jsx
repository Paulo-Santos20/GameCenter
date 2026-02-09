import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase'; // Verifique se o caminho para o firebase.js está correto
import { Search, Swords, User, Loader2 } from 'lucide-react';

const PlayerSelect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Estados
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [creatingMatch, setCreatingMatch] = useState(null); // Armazena ID do oponente enquanto cria a partida

  // Recupera o tipo de jogo (ex: chess, checkers) vindo do Lobby
  const gameType = location.state?.gameType || 'chess';

  // 1. Buscar Jogadores do Firestore
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const currentUserId = auth.currentUser?.uid;
        if (!currentUserId) return;

        // Busca a coleção completa de usuários
        const querySnapshot = await getDocs(collection(db, 'users'));
        
        // Mapeia e remove o próprio usuário da lista
        const playersList = querySnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(player => player.id !== currentUserId);

        setPlayers(playersList);
      } catch (error) {
        console.error("Erro ao buscar jogadores:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, []);

  // 2. Criar o Desafio (Partida)
  const handleChallenge = async (opponent) => {
    if (!auth.currentUser) return;
    setCreatingMatch(opponent.id); // Ativa loading no botão específico

    try {
      // Estrutura da Partida (Compatível com suas Regras de Segurança)
      const matchData = {
        gameType: gameType,
        
        // Dados visuais dos jogadores
        players: {
          [auth.currentUser.uid]: { 
            name: auth.currentUser.displayName || 'Eu', 
            avatar: auth.currentUser.photoURL,
            color: 'w' // Desafiante joga de brancas (no xadrez)
          },
          [opponent.id]: { 
            name: opponent.name || 'Oponente', 
            avatar: opponent.avatar || null,
            color: 'b' 
          }
        },

        // IMPORTANTE: Array simples de IDs para validar permissão de leitura/escrita nas Rules
        playerIds: [auth.currentUser.uid, opponent.id], 
        
        currentTurn: auth.currentUser.uid, // Desafiante começa
        gameState: null, // O jogo iniciará o estado depois
        status: 'active',
        createdAt: serverTimestamp(),
        winner: null
      };

      // Salva no Firestore
      const docRef = await addDoc(collection(db, 'matches'), matchData);

      // Redireciona para a Sala de Jogo
      navigate(`/game/${docRef.id}`, { 
        state: { 
          gameType, 
          mode: 'pvp',
          difficulty: 'human' 
        } 
      });

    } catch (error) {
      console.error("Erro ao criar desafio:", error);
      alert("Erro ao criar o desafio. Verifique sua conexão.");
      setCreatingMatch(null); // Destrava o botão em caso de erro
    }
  };

  // Filtro de busca local
  const filteredPlayers = players.filter(player => 
    player.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 flex flex-col items-center">
      
      {/* Cabeçalho */}
      <div className="w-full max-w-4xl mb-8 flex flex-col gap-2">
        <button 
          onClick={() => navigate('/')} 
          className="text-gray-400 hover:text-white self-start mb-4 flex items-center gap-2 transition-colors"
        >
          ← Voltar ao Lobby
        </button>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Swords className="text-red-500" /> 
          Desafiar Jogador 
          <span className="text-sm bg-gray-800 px-3 py-1 rounded-full text-gray-400 uppercase tracking-wider border border-gray-700">
            {gameType}
          </span>
        </h1>
        <p className="text-gray-400">Escolha um oponente online para iniciar uma partida.</p>
      </div>

      {/* Barra de Busca */}
      <div className="w-full max-w-4xl mb-6 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-500" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-3 border border-gray-700 rounded-xl leading-5 bg-gray-900 text-gray-300 placeholder-gray-500 focus:outline-none focus:bg-gray-800 focus:border-red-500 transition-colors shadow-sm"
          placeholder="Buscar por nome ou email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Grid de Jogadores */}
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {loading ? (
          <div className="col-span-full flex justify-center py-12">
            <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
          </div>
        ) : filteredPlayers.length > 0 ? (
          filteredPlayers.map((player) => (
            <div 
              key={player.id} 
              className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between hover:border-gray-600 hover:bg-gray-800/50 transition-all group shadow-sm"
            >
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center border-2 border-gray-700 overflow-hidden shrink-0">
                  {player.avatar ? (
                    <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="text-gray-500" />
                  )}
                </div>
                
                {/* Informações do Jogador */}
                <div className="min-w-0">
                  <h3 className="font-bold text-white group-hover:text-red-400 transition-colors truncate">
                    {player.name || 'Sem Nome'}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-xs text-gray-400">Online</span>
                  </div>
                </div>
              </div>

              {/* Botão de Ação */}
              <button
                onClick={() => handleChallenge(player)}
                disabled={creatingMatch === player.id}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md hover:shadow-red-500/20"
              >
                {creatingMatch === player.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Swords className="w-4 h-4" />
                    <span className="hidden sm:inline">Desafiar</span>
                  </>
                )}
              </button>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-gray-500 bg-gray-900/50 rounded-xl border border-dashed border-gray-800">
            <p>Nenhum jogador encontrado.</p>
            <p className="text-xs mt-2 text-gray-600">Peça para seu amigo se cadastrar!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerSelect;