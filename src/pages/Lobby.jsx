import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import NewGameModal from '../components/lobby/NewGameModal'; 
import { Swords, Clock, Plus, LogOut, User, Zap } from 'lucide-react'; // Ícones novos

const Lobby = () => {
  const navigate = useNavigate();
  const [showNewGameModal, setShowNewGameModal] = useState(false);
  const [activeMatches, setActiveMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, 'matches'),
      where('playerIds', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const matches = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Ordenação no cliente
      const sortedMatches = matches.sort((a, b) => {
         const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
         const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
         return dateB - dateA;
      });

      setActiveMatches(sortedMatches);
      setLoading(false);
    }, (error) => {
      console.error("Erro na busca do Lobby:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleCreatePvP = (gameType) => {
    setShowNewGameModal(false);
    navigate('/lobby/players', { state: { gameType } });
  };

  const handleStartAi = (gameType, difficulty) => {
    setShowNewGameModal(false);
    navigate(`/game/local-${Date.now()}`, { 
      state: { mode: 'ai', gameType, difficulty } 
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-gray-100 p-4">
      {/* Header */}
      <div className="max-w-4xl mx-auto flex justify-between items-center mb-8 pt-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Swords className="text-indigo-500"/> Minhas Partidas
        </h1>
        <button onClick={() => auth.signOut()} className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition-colors">
          <LogOut size={20}/>
        </button>
      </div>

      {/* Lista de Partidas */}
      <div className="max-w-4xl mx-auto grid gap-4">
        {loading ? (
          <div className="text-center py-8">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-2"></div>
             <p className="text-gray-500">Carregando partidas...</p>
          </div>
        ) : activeMatches.length === 0 ? (
          <div className="text-center py-16 bg-slate-800/50 rounded-2xl border border-dashed border-slate-700">
            <p className="text-gray-400 mb-6 text-lg">Você ainda não tem partidas ativas.</p>
            <button 
              onClick={() => setShowNewGameModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-indigo-500/25 transform hover:-translate-y-1"
            >
              Começar Novo Jogo
            </button>
          </div>
        ) : (
          activeMatches.map(match => {
            const myId = auth.currentUser?.uid;
            const opponentId = match.playerIds?.find(id => id !== myId);
            const opponentName = match.players?.[opponentId]?.name || 'Oponente';
            
            // --- LÓGICA DO STATUS (QUEM JOGA?) ---
            const isMyTurn = match.currentTurn === myId;
            const isFinished = match.status === 'finished'; // Exemplo futuro

            return (
              <div 
                key={match.id} 
                onClick={() => navigate(`/game/${match.id}`, { state: { gameType: match.gameType } })}
                className={`
                  relative p-4 rounded-xl border cursor-pointer transition-all flex justify-between items-center group
                  ${isMyTurn 
                    ? 'bg-slate-800 border-green-500/50 hover:bg-slate-800/80 shadow-[0_0_15px_rgba(34,197,94,0.1)]' 
                    : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                  }
                `}
              >
                {/* Indicador Lateral de Turno */}
                {isMyTurn && (
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-green-500 rounded-l-xl"></div>
                )}

                <div className="flex items-center gap-4 pl-2">
                  <div className="w-12 h-12 bg-slate-700 group-hover:bg-indigo-600/20 transition-colors rounded-full flex items-center justify-center text-2xl relative">
                    {match.gameType === 'chess' ? '♟️' : match.gameType === 'checkers' ? '⚪' : '🎮'}
                    
                    {/* Bolinha de notificação se for sua vez */}
                    {isMyTurn && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-slate-800 rounded-full animate-pulse"></span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold capitalize text-white group-hover:text-indigo-400 transition-colors flex items-center gap-2">
                      {match.gameType}
                      {isMyTurn && <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded uppercase font-bold tracking-wide">Sua Vez</span>}
                    </h3>
                    <p className="text-sm text-gray-400 flex items-center gap-1">
                      <User size={12}/> vs {opponentName}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                   <div className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock size={12}/> 
                      {match.createdAt?.toDate ? match.createdAt.toDate().toLocaleDateString() : 'Hoje'}
                   </div>
                   {!isMyTurn && (
                     <span className="text-xs text-slate-600 italic">Aguardando...</span>
                   )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {activeMatches.length > 0 && (
        <button 
          onClick={() => setShowNewGameModal(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 hover:bg-indigo-500 rounded-full flex items-center justify-center shadow-lg hover:shadow-indigo-500/40 hover:scale-110 transition-all z-10 text-white"
        >
          <Plus size={28}/>
        </button>
      )}

      {showNewGameModal && (
        <NewGameModal 
          onClose={() => setShowNewGameModal(false)}
          onCreatePvP={handleCreatePvP}
          onStartAi={handleStartAi}
        />
      )}
    </div>
  );
};

export default Lobby;