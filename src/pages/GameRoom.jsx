import React, { useState, useRef, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';

// Componentes do Jogo
import ChessBoardWrapper from '../components/game/ChessBoardWrapper';
import CheckersBoard from '../components/game/CheckersBoard';
import DominoBoard from '../components/game/DominoBoard';
import CardTable from '../components/game/CardTable';

// Hooks e Utils
import { useMatch } from '../hooks/useMatch';
import { useGameAI } from '../hooks/useGameAI';
import { auth } from '../lib/firebase';

// Ícones
import { ArrowLeft, RefreshCw, Maximize, Minimize } from 'lucide-react';

const GameRoom = () => {
  const { matchId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const gameContainerRef = useRef(null);

  // --- LÓGICA DO JOGO ---
  const isLocalAi = location.state?.mode === 'ai' || matchId?.startsWith('local-');
  const gameType = location.state?.gameType || 'chess';
  const difficulty = location.state?.difficulty || 'medium';
  const currentUserId = auth.currentUser?.uid;

  const [localGameState, setLocalGameState] = useState(null);
  const [localTurn, setLocalTurn] = useState('PLAYER');
  const [lastMove, setLastMove] = useState(null); // Armazena a última jogada para highlight
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [gameKey, setGameKey] = useState(0);

  // Hook Firebase
  const firestoreMatch = useMatch(isLocalAi ? null : matchId, currentUserId); 

  const currentGameState = isLocalAi ? localGameState : firestoreMatch.matchData?.gameState;
  
  let myColor = 'w';
  if (!isLocalAi && firestoreMatch?.matchData?.players?.[currentUserId]) {
      myColor = firestoreMatch.matchData.players[currentUserId].color;
  }

  const isMyTurn = isLocalAi 
    ? localTurn === 'PLAYER' 
    : firestoreMatch.matchData?.currentTurn === currentUserId;

  useEffect(() => {
    const handleChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  const handleMove = (newData, moveDetails) => {
    if (isLocalAi) {
      setLocalGameState(newData);
      setLocalTurn(prev => prev === 'PLAYER' ? 'AI_BOT' : 'PLAYER');
      if (moveDetails) setLastMove(moveDetails); // Atualiza highlight local
    } else {
      if (firestoreMatch?.matchData?.playerIds) {
        const nextTurnId = firestoreMatch.matchData.playerIds.find(id => id !== currentUserId);
        if (nextTurnId) firestoreMatch.makeMove(newData, nextTurnId); 
      }
    }
  };

  const handleReplay = () => {
    if (window.confirm("Reiniciar partida?")) {
      setLocalGameState(null);
      setLocalTurn('PLAYER');
      setLastMove(null);
      setGameKey(p => p + 1);
    }
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      if (gameContainerRef.current.requestFullscreen) await gameContainerRef.current.requestFullscreen();
    } else {
      if (document.exitFullscreen) await document.exitFullscreen();
    }
  };

  // Callback da IA
  useGameAI(gameType, difficulty, localGameState, (aiMove, moveDetails) => {
      setLocalGameState(aiMove); 
      setLocalTurn('PLAYER');
      if (moveDetails) setLastMove(moveDetails); // Highlight da IA
    }, localTurn
  );

  const renderBoard = () => {
    const props = { 
        gameState: currentGameState, 
        onMove: handleMove, 
        isMyTurn, 
        difficulty, 
        isVsAi: isLocalAi, 
        playerColor: myColor,
        externalLastMove: lastMove // Passa o highlight para o componente
    };

    switch (gameType) {
      case 'chess': return <ChessBoardWrapper {...props} />;
      case 'checkers': return <CheckersBoard {...props} />;
      case 'domino': return <DominoBoard {...props} />;
      case 'cards': return <CardTable {...props} />;
      default: return <div className="text-white">Jogo não suportado</div>;
    }
  };

  return (
    // Layout Flexbox Vertical que ocupa 100% da viewport (h-dvh)
    <div className="h-dvh w-screen bg-slate-950 text-gray-100 flex flex-col overflow-hidden">
      
      <div 
        ref={gameContainerRef}
        className={`
          flex flex-col w-full h-full bg-slate-900 transition-all duration-300
          ${isFullscreen ? 'fixed inset-0 z-50' : 'max-w-6xl mx-auto md:my-4 md:rounded-2xl shadow-2xl border border-slate-800'}
        `}
      >
        
        {/* HEADER FIXO NO TOPO */}
        <div className="shrink-0 bg-slate-800 border-b border-slate-700 p-3 md:p-4 flex justify-between items-center z-20 shadow-md">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={24} />
          </button>

          <div className="flex flex-col items-center">
            <h1 className="text-lg md:text-xl font-black uppercase tracking-widest text-white drop-shadow-md">
              {gameType}
            </h1>
            <div className="flex gap-2 mt-1">
              <span className={`text-[10px] px-2 py-0.5 rounded border uppercase font-bold ${isLocalAi ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-blue-500/20 text-blue-300 border-blue-500/30'}`}>
                {isLocalAi ? `IA: ${difficulty}` : 'PvP Online'}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            {isLocalAi && <button onClick={handleReplay} className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-emerald-400"><RefreshCw size={20} /></button>}
            <button onClick={toggleFullscreen} className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white hidden md:block"><Maximize size={20} /></button>
          </div>
        </div>

        {/* ÁREA DO TABULEIRO (Scrollável se necessário) */}
        <div className="flex-1 flex items-center justify-center p-2 md:p-6 bg-slate-900/50 relative overflow-y-auto overflow-x-hidden w-full" key={gameKey}>
            <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
            {renderBoard()}
        </div>

      </div>
    </div>
  );
};

export default GameRoom;