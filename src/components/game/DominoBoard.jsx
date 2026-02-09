// src/components/game/DominoBoard.jsx
import React from 'react';

// Tile componente
const DominoTile = ({ val1, val2, rotate }) => (
  <div className={`w-10 h-20 bg-white border border-slate-800 rounded flex flex-col items-center justify-between p-1 shadow ${rotate ? 'rotate-90' : ''}`}>
    <span className="font-bold">{val1}</span>
    <div className="w-full h-px bg-slate-400"></div>
    <span className="font-bold">{val2}</span>
  </div>
);

export default function DominoBoard({ gameState, onMove, isMyTurn }) {
  const table = gameState?.table || []; // Array de pares [[6,6], [6,1]]
  const myHand = gameState?.myHand || [[1,1], [2,3], [5,5]];

  return (
    <div className="flex flex-col h-full bg-green-800 p-4 rounded-xl relative overflow-hidden">
      {/* Mesa (Scrollable) */}
      <div className="flex-1 flex items-center justify-center overflow-x-auto gap-1 p-10">
         {table.length === 0 && <div className="text-white/50">Mesa Vazia</div>}
         {table.map((tile, i) => (
           <DominoTile key={i} val1={tile[0]} val2={tile[1]} rotate={i % 2 !== 0} />
         ))}
      </div>

      {/* Minha Mão */}
      <div className="bg-black/30 p-2 rounded-lg flex justify-center gap-4 overflow-x-auto">
        {myHand.map((tile, i) => (
          <button 
            key={i} 
            onClick={() => onMove(tile)}
            disabled={!isMyTurn}
            className="hover:-translate-y-2 transition-transform disabled:opacity-50"
          >
            <DominoTile val1={tile[0]} val2={tile[1]} />
          </button>
        ))}
      </div>
    </div>
  );
}