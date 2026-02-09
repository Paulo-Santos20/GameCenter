// src/components/game/CardTable.jsx
import React from 'react';

const Card = ({ suit, value, hidden }) => (
  <div className={`w-24 h-36 rounded-lg border-2 shadow-lg flex items-center justify-center text-xl font-bold bg-white ${hidden ? 'bg-blue-800' : ''}`}>
    {hidden ? '🂠' : `${value}${suit}`}
  </div>
);

export default function CardTable({ gameState, onMove, isMyTurn }) {
  // gameState: { playerCard: null, aiCard: null, score: { p1: 0, p2: 0 } }
  
  return (
    <div className="bg-green-700 w-full h-[500px] rounded-xl flex flex-col items-center justify-between p-6 shadow-inner">
       {/* Oponente */}
       <div className="flex flex-col items-center">
         <span className="text-white text-sm mb-2">Oponente</span>
         <Card hidden={!gameState?.aiCard} suit={gameState?.aiCard?.suit} value={gameState?.aiCard?.value} />
       </div>

       {/* Área de Batalha */}
       <div className="text-white font-bold text-2xl flex items-center gap-4">
          VS
       </div>

       {/* Jogador */}
       <div className="flex flex-col items-center">
         <div className="mb-4">
           {gameState?.playerCard ? (
             <Card suit={gameState.playerCard.suit} value={gameState.playerCard.value} />
           ) : (
             <div className="w-24 h-36 border-2 border-dashed border-white/30 rounded-lg flex items-center justify-center text-white/50">
               Espaço da Carta
             </div>
           )}
         </div>
         
         <button
           onClick={() => onMove('DRAW')}
           disabled={!isMyTurn || !!gameState?.playerCard}
           className="bg-yellow-400 text-yellow-900 px-6 py-2 rounded-full font-bold shadow-lg hover:scale-105 transition disabled:opacity-50 disabled:scale-100"
         >
           JOGAR CARTA
         </button>
       </div>
    </div>
  );
}