import React from 'react';

// Tile Component (Visual da Peça)
const DominoTile = ({ val1, val2, rotate, onClick, disabled }) => {
  // Renderiza os pontos
  const renderDots = (n) => {
    const dots = {
      1: ['center'], 2: ['tl', 'br'], 3: ['tl', 'center', 'br'],
      4: ['tl', 'tr', 'bl', 'br'], 5: ['tl', 'tr', 'center', 'bl', 'br'],
      6: ['tl', 'tr', 'ml', 'mr', 'bl', 'br']
    };
    const pos = {
        tl:'top-1 left-1', tr:'top-1 right-1', bl:'bottom-1 left-1', br:'bottom-1 right-1',
        ml:'top-1/2 left-1 -translate-y-1/2', mr:'top-1/2 right-1 -translate-y-1/2',
        center:'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
    };
    return (
        <div className="relative w-full h-full">
            {dots[n]?.map((p,i) => <div key={i} className={`absolute w-1.5 h-1.5 bg-black rounded-full ${pos[p]}`} />)}
        </div>
    );
  };

  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`
        bg-[#fdfdfd] border border-slate-400 rounded flex items-center justify-between p-1 shadow-md
        transition-all ${rotate ? 'flex-row w-16 h-8' : 'flex-col w-8 h-16'}
        ${!disabled && onClick ? 'hover:-translate-y-1 hover:shadow-lg cursor-pointer' : ''}
        ${disabled ? 'opacity-80' : ''}
      `}
    >
      <div className={`flex-1 w-full h-full flex items-center justify-center ${rotate?'border-r':'border-b'} border-slate-300`}>{renderDots(val1)}</div>
      <div className="flex-1 w-full h-full flex items-center justify-center">{renderDots(val2)}</div>
    </button>
  );
};

export default function DominoBoard({ gameState, onMove, isMyTurn }) {
  // Parsing seguro do gameState
  const state = typeof gameState === 'string' ? JSON.parse(gameState) : gameState;
  const table = state?.table || [];
  const myHand = state?.myHand || [[6,6], [6,1], [2,3]]; // Mock inicial se vazio

  return (
    <div className="flex flex-col w-full h-full bg-[#1e5c35] rounded-xl relative overflow-hidden shadow-[inset_0_0_40px_rgba(0,0,0,0.5)] border-8 border-[#143d23]">
      {/* Mesa */}
      <div className="flex-1 flex items-center justify-start overflow-x-auto p-8 gap-1 scrollbar-thin scrollbar-thumb-green-900 scrollbar-track-transparent">
         {table.length === 0 && <span className="text-white/20 text-2xl font-bold w-full text-center select-none">Mesa Vazia</span>}
         {table.map((t, i) => <DominoTile key={i} val1={t[0]} val2={t[1]} rotate={i % 2 !== 0} />)}
      </div>

      {/* Mão */}
      <div className="bg-black/30 backdrop-blur-md p-4 border-t border-white/10">
        <h3 className="text-white/70 text-xs font-bold uppercase mb-3 tracking-widest text-center">
            {isMyTurn ? "Sua Vez de Jogar" : "Aguardando Oponente..."}
        </h3>
        <div className="flex justify-center gap-3 overflow-x-auto pb-2">
          {myHand.map((t, i) => (
            <DominoTile 
                key={i} val1={t[0]} val2={t[1]} 
                onClick={() => isMyTurn && onMove(t)} 
                disabled={!isMyTurn} 
            />
          ))}
        </div>
      </div>
    </div>
  );
}