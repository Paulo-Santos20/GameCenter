import React from 'react';

// Componente Visual da Peça de Dominó
const DominoTile = ({ val1, val2, rotate, onClick, disabled }) => {
  // Função para desenhar os "pontos" (dots) do dominó
  const renderDots = (num) => {
    const dotPositions = {
      1: ['center'],
      2: ['tl', 'br'],
      3: ['tl', 'center', 'br'],
      4: ['tl', 'tr', 'bl', 'br'],
      5: ['tl', 'tr', 'center', 'bl', 'br'],
      6: ['tl', 'tr', 'ml', 'mr', 'bl', 'br']
    };
    
    // Mapeamento de posições CSS grid
    const posMap = {
      tl: 'top-1 left-1', tr: 'top-1 right-1',
      ml: 'top-1/2 left-1 -translate-y-1/2', mr: 'top-1/2 right-1 -translate-y-1/2',
      center: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
      bl: 'bottom-1 left-1', br: 'bottom-1 right-1'
    };

    return (
      <div className="relative w-full h-full">
        {dotPositions[num]?.map((pos, i) => (
          <div key={i} className={`absolute w-1.5 h-1.5 bg-black rounded-full shadow-sm ${posMap[pos]}`} />
        ))}
      </div>
    );
  };

  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`
        bg-[#fff8e7] border border-slate-300 rounded-sm shadow-[2px_2px_0px_rgba(0,0,0,0.3)]
        flex flex-col items-center justify-between p-1 transition-transform
        ${rotate ? 'w-16 h-8 flex-row' : 'w-8 h-16'}
        ${!disabled && onClick ? 'hover:-translate-y-1 hover:shadow-[3px_3px_2px_rgba(0,0,0,0.4)] cursor-pointer' : ''}
        ${disabled ? 'opacity-70 cursor-not-allowed' : ''}
      `}
    >
      <div className={`flex-1 w-full h-full flex items-center justify-center ${rotate ? 'border-r border-slate-400' : 'border-b border-slate-400'}`}>
        {renderDots(val1)}
      </div>
      <div className="flex-1 w-full h-full flex items-center justify-center">
        {renderDots(val2)}
      </div>
    </button>
  );
};

export default function DominoBoard({ gameState, onMove, isMyTurn }) {
  // Mock de dados se não houver gameState
  const table = gameState?.table || [[6,6], [6,2], [2,5], [5,5]]; 
  const myHand = gameState?.myHand || [[1,4], [3,3], [0,2]];

  return (
    <div className="flex flex-col w-full h-full bg-emerald-900 rounded-xl relative overflow-hidden shadow-inner border-8 border-emerald-950">
      
      {/* Textura de mesa */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
      </div>

      {/* Mesa (Área de Jogo Scrollável) */}
      <div className="flex-1 flex items-center justify-start overflow-x-auto p-8 gap-1 scrollbar-thin scrollbar-thumb-emerald-700">
         {table.length === 0 && <span className="text-emerald-400/50 text-xl font-bold w-full text-center">Mesa Limpa</span>}
         {table.map((tile, i) => (
           <DominoTile key={i} val1={tile[0]} val2={tile[1]} rotate={i % 2 !== 0} />
         ))}
      </div>

      {/* Minha Mão */}
      <div className="bg-black/40 backdrop-blur-sm p-4 border-t border-emerald-700/50">
        <h3 className="text-emerald-200 text-xs font-bold uppercase mb-2 tracking-widest text-center">Suas Peças ({isMyTurn ? 'Sua Vez' : 'Aguarde'})</h3>
        <div className="flex justify-center gap-4 overflow-x-auto pb-2">
          {myHand.map((tile, i) => (
            <DominoTile 
              key={i} 
              val1={tile[0]} 
              val2={tile[1]} 
              onClick={() => isMyTurn && onMove(tile)}
              disabled={!isMyTurn}
            />
          ))}
        </div>
      </div>
    </div>
  );
}