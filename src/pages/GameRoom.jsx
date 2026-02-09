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
import { auth } from '../lib/firebase'; // Garanta que o caminho está correto

// --- ÍCONES SVG ---
const IconBack = () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>;
const IconReplay = () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>;
const IconEnterFull = () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>;
const IconExitFull = () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>;

const GameRoom = () => {
  const { matchId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const gameContainerRef = useRef(null);

  // --- LÓGICA DO JOGO ---
  // Detecta se é IA Local baseado no state da navegação ou ID da URL
  const isLocalAi = location.state?.mode === 'ai' || matchId?.startsWith('local-');
  const gameType = location.state?.gameType || 'chess';
  const difficulty = location.state?.difficulty || 'medium';

  // Estados locais
  const [localGameState, setLocalGameState] = useState(null);
  const [localTurn, setLocalTurn] = useState('PLAYER'); // PLAYER (White) ou AI_BOT (Black)
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [gameKey, setGameKey] = useState(0);

  // Hook Firebase (só executa se NÃO for IA e se houver usuário logado)
  const currentUserId = auth.currentUser?.uid;
  const firestoreMatch = useMatch(isLocalAi ? null : matchId, currentUserId); 

  // Dados unificados
  const currentGameState = isLocalAi ? localGameState : firestoreMatch.matchData?.gameState;
  
  // Verifica turno
  const isMyTurn = isLocalAi 
    ? localTurn === 'PLAYER' 
    : firestoreMatch.matchData?.currentTurn === currentUserId;

  // Listener de Tela Cheia
  useEffect(() => {
    const handleChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  // --- Handler de Movimento (CRÍTICO) ---
  const handleMove = (newData) => {
    if (isLocalAi) {
      setLocalGameState(newData);
      setLocalTurn('AI_BOT'); // Passa a vez para a IA
    } else {
      // Modo Online: Calcula quem é o próximo jogador
      if (firestoreMatch?.matchData?.playerIds) {
        const playerIds = firestoreMatch.matchData.playerIds;
        // Encontra o ID que NÃO é o meu
        const nextTurnId = playerIds.find(id => id !== currentUserId);
        
        if (nextTurnId) {
          firestoreMatch.makeMove(newData, nextTurnId); 
        } else {
          console.error("Erro: Não foi possível determinar o próximo turno.");
        }
      }
    }
  };

  const handleReplay = () => {
    if (window.confirm("Reiniciar partida?")) {
      setLocalGameState(null);
      setLocalTurn('PLAYER');
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

  // Hook da IA (Só roda se for local)
  useGameAI(
    gameType, 
    difficulty, 
    localGameState, 
    (aiMove) => {
      setLocalGameState(aiMove); 
      setLocalTurn('PLAYER');
    }, 
    localTurn 
  );

  const renderBoard = () => {
    const props = { 
        gameState: currentGameState, 
        onMove: handleMove, 
        isMyTurn,
        difficulty,
        isVsAi: isLocalAi // Passa essa prop para bloquear a IA no modo online
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
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-center p-4">
      {/* Container do Jogo */}
      <div 
        ref={gameContainerRef}
        className={`relative w-full max-w-5xl transition-all duration-300 ease-in-out bg-gray-900 border-gray-800 flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 h-screen w-screen rounded-none border-none justify-center' : 'h-[80vh] rounded-xl shadow-2xl border'}`}
      >
        <div className="absolute top-4 left-0 right-0 flex justify-center items-center gap-3 z-10 pointer-events-none">
           <h1 className="text-xl font-bold uppercase tracking-wider text-white drop-shadow-md bg-black/30 px-4 py-1 rounded-full backdrop-blur-sm">{gameType}</h1>
           {isLocalAi ? (
             <span className="bg-purple-600/90 text-white px-3 py-1 rounded-full text-xs font-bold border border-purple-400/50 backdrop-blur-sm shadow-lg">IA: {difficulty}</span>
           ) : (
             <span className="bg-blue-600/90 text-white px-3 py-1 rounded-full text-xs font-bold border border-blue-400/50 backdrop-blur-sm shadow-lg">ONLINE</span>
           )}
        </div>

        <div className="flex-1 flex items-center justify-center p-4 overflow-hidden" key={gameKey}>
            {renderBoard()}
        </div>

        {isFullscreen && (
            <div className="absolute bottom-6 right-6 opacity-50 hover:opacity-100 transition-opacity pointer-events-auto z-50">
                <button onClick={toggleFullscreen} className="bg-black/50 p-2 rounded-full text-white hover:bg-black/80 backdrop-blur"><IconExitFull /></button>
            </div>
        )}
      </div>

      {/* Controles Externos */}
      {!isFullscreen && (
        <div className="w-full max-w-5xl mt-4 flex justify-between items-center bg-gray-800 p-3 rounded-xl shadow-lg border border-gray-700">
          <div className="flex gap-3">
            <button onClick={() => navigate('/')} className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors font-medium border border-transparent hover:border-gray-600">
              <IconBack /> <span className="hidden sm:inline">Voltar</span>
            </button>
          </div>
          <div className="flex gap-3">
            {isLocalAi && (
                <button onClick={handleReplay} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-700 text-teal-400 font-semibold hover:bg-gray-600 hover:-translate-y-0.5 transition-all shadow-sm">
                <IconReplay /> <span className="hidden sm:inline">Rejogar</span>
                </button>
            )}
            <button onClick={toggleFullscreen} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-200">
              <IconEnterFull /> <span className="hidden sm:inline">Tela Cheia</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameRoom;