import React from 'react';

const Card = ({ suit, value, hidden, color }) => {
  const isRed = suit === '♥' || suit === '♦';
  
  return (
    <div className={`
      relative w-28 h-44 rounded-xl border border-slate-200 shadow-2xl transition-all duration-500
      flex flex-col items-center justify-between p-2 select-none
      ${hidden 
        ? 'bg-blue-900 bg-[repeating-linear-gradient(45deg,_#1e3a8a_0,_#1e3a8a_10px,_#172554_10px,_#172554_20px)] border-blue-950' 
        : 'bg-white'
      }
    `}>
      {!hidden ? (
        <>
          <div className={`self-start text-2xl font-bold ${isRed ? 'text-red-600' : 'text-slate-900'}`}>
            {value}<br/><span className="text-xl">{suit}</span>
          </div>
          <div className={`text-6xl ${isRed ? 'text-red-600' : 'text-slate-900'}`}>{suit}</div>
          <div className={`self-end text-2xl font-bold rotate-180 ${isRed ? 'text-red-600' : 'text-slate-900'}`}>
            {value}<br/><span className="text-xl">{suit}</span>
          </div>
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
           <div className="w-16 h-16 rounded-full border-4 border-blue-400/30 flex items-center justify-center">
             <span className="text-4xl">⚔️</span>
           </div>
        </div>
      )}
    </div>
  );
};

export default function CardTable({ gameState, onMove, isMyTurn }) {
  // Dados Mockados para visualização se não houver gameState
  const playerCard = gameState?.playerCard || null;
  const aiCard = gameState?.aiCard || null;
  const score = gameState?.score || { me: 0, opponent: 0 };

  return (
    <div className="bg-[#35654d] w-full h-[600px] rounded-xl flex flex-col relative overflow-hidden shadow-inner border-8 border-[#2a4d3b]">
       {/* Placar */}
       <div className="absolute top-4 left-4 bg-black/30 text-white px-4 py-2 rounded-lg backdrop-blur text-sm font-bold border border-white/10">
          Oponente: {score.opponent}
       </div>
       <div className="absolute bottom-4 right-4 bg-black/30 text-white px-4 py-2 rounded-lg backdrop-blur text-sm font-bold border border-white/10">
          Você: {score.me}
       </div>

       {/* Área do Oponente */}
       <div className="flex-1 flex items-center justify-center border-b border-white/5">
         <div className="transform scale-75 opacity-90 transition-all duration-500">
            {aiCard ? <Card suit={aiCard.suit} value={aiCard.value} /> : <Card hidden />}
         </div>
       </div>

       {/* Área de Batalha (Centro) */}
       <div className="h-10 flex items-center justify-center z-10">
          <span className="bg-red-600 text-white px-6 py-1 rounded-full font-black shadow-lg text-sm tracking-widest border-2 border-red-400">VS</span>
       </div>

       {/* Minha Área */}
       <div className="flex-1 flex flex-col items-center justify-center gap-6 bg-gradient-to-t from-black/20 to-transparent">
         <div className="transform transition-all hover:scale-105 duration-300">
            {playerCard ? (
                <Card suit={playerCard.suit} value={playerCard.value} />
            ) : (
                <div className="w-28 h-44 border-2 border-dashed border-white/20 rounded-xl flex items-center justify-center text-white/30 text-xs font-bold uppercase tracking-widest">
                    Sua Carta
                </div>
            )}
         </div>

         <button
           onClick={() => onMove('DRAW')}
           disabled={!isMyTurn || playerCard}
           className="bg-yellow-500 hover:bg-yellow-400 text-yellow-950 px-10 py-3 rounded-full font-bold shadow-[0_4px_0_rgb(161,98,7)] active:shadow-none active:translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0"
         >
           {isMyTurn ? 'JOGAR CARTA' : 'AGUARDE...'}
         </button>
       </div>
    </div>
  );
}