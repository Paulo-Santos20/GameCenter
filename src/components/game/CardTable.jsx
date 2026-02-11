import React from 'react';

const Card = ({ suit, value, hidden }) => {
  const color = (suit === '♥' || suit === '♦') ? 'text-red-600' : 'text-slate-900';
  return (
    <div className={`
        w-28 h-44 rounded-xl border border-slate-200 shadow-2xl transition-all duration-300 select-none
        flex flex-col items-center justify-between p-3 bg-white
        ${hidden ? 'bg-[url("https://www.transparenttextures.com/patterns/cubes.png")] bg-blue-900 border-blue-950' : ''}
    `}>
      {!hidden ? (
        <>
          <div className={`self-start text-xl font-bold leading-none ${color}`}>{value}<br/>{suit}</div>
          <div className={`text-6xl ${color}`}>{suit}</div>
          <div className={`self-end text-xl font-bold leading-none rotate-180 ${color}`}>{value}<br/>{suit}</div>
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center opacity-20"><span className="text-4xl">♠</span></div>
      )}
    </div>
  );
};

export default function CardTable({ gameState, onMove, isMyTurn }) {
  const state = typeof gameState === 'string' ? JSON.parse(gameState) : gameState;
  const playerCard = state?.playerCard;
  const aiCard = state?.aiCard;
  const score = state?.score || { p1: 0, p2: 0 };

  return (
    <div className="bg-[#2c5e4f] w-full h-[600px] rounded-xl flex flex-col relative overflow-hidden shadow-inner border-[12px] border-[#22463b]">
       {/* Placar */}
       <div className="absolute top-4 left-4 right-4 flex justify-between text-white font-bold text-lg px-4">
          <div className="bg-black/40 px-4 py-2 rounded-lg">Oponente: {score.p2}</div>
          <div className="bg-black/40 px-4 py-2 rounded-lg">Você: {score.p1}</div>
       </div>

       {/* Área Oponente */}
       <div className="flex-1 flex items-center justify-center">
         <div className={`transform transition-all duration-500 ${aiCard ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-50'}`}>
            <Card hidden={!aiCard} suit={aiCard?.suit} value={aiCard?.value} />
         </div>
       </div>

       {/* Divisor */}
       <div className="h-px w-full bg-white/10 relative flex items-center justify-center">
          <span className="bg-[#2c5e4f] px-3 text-white/50 text-sm font-bold tracking-widest">VS</span>
       </div>

       {/* Área Jogador */}
       <div className="flex-1 flex flex-col items-center justify-center gap-6">
         <div className="transform hover:-translate-y-2 transition-transform duration-300">
            {playerCard ? (
                <Card suit={playerCard.suit} value={playerCard.value} />
            ) : (
                <div className="w-28 h-44 border-2 border-dashed border-white/20 rounded-xl flex items-center justify-center text-white/30 text-xs font-bold uppercase">Sua Carta</div>
            )}
         </div>

         <button
           onClick={() => onMove('DRAW')}
           disabled={!isMyTurn || playerCard}
           className="bg-yellow-500 hover:bg-yellow-400 text-yellow-950 px-8 py-3 rounded-full font-bold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
         >
           {isMyTurn ? 'JOGAR CARTA' : 'AGUARDE...'}
         </button>
       </div>
    </div>
  );
}