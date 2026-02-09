import React from 'react';
import { X, Circle } from 'lucide-react';

export default function TicTacToeBoard({ gameState, onMove, isMyTurn }) {
  const board = gameState?.board || Array(9).fill(null);
  
  // Combinações de vitória para highlight (opcional)
  const winningLines = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];

  return (
    <div className="bg-slate-800 p-6 rounded-2xl shadow-2xl inline-block">
      <div className="grid grid-cols-3 gap-3">
        {board.map((cell, i) => (
          <button
            key={i}
            onClick={() => isMyTurn && !cell && onMove(i)}
            disabled={!!cell || !isMyTurn}
            className={`
              w-24 h-24 bg-slate-700 rounded-xl flex items-center justify-center text-5xl shadow-inner
              transition-all duration-200
              ${!cell && isMyTurn ? 'hover:bg-slate-600 cursor-pointer' : ''}
              ${cell ? 'bg-slate-900 shadow-none' : ''}
            `}
          >
            {cell === 'X' && <X size={64} className="text-blue-500 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]" />}
            {cell === 'O' && <Circle size={56} className="text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" />}
          </button>
        ))}
      </div>
    </div>
  );
}