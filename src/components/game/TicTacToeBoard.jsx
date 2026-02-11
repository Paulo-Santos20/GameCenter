import React from 'react';
import { X, Circle } from 'lucide-react';

export default function TicTacToeBoard({ gameState, onMove, isMyTurn }) {
  const state = typeof gameState === 'string' ? JSON.parse(gameState) : gameState;
  const board = state?.board || Array(9).fill(null);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-white font-bold text-xl tracking-wider">
        {isMyTurn ? <span className="text-green-400">SUA VEZ</span> : <span className="text-slate-500">AGUARDANDO...</span>}
      </div>
      
      <div className="bg-slate-800 p-4 rounded-2xl shadow-2xl inline-block border border-slate-700">
        <div className="grid grid-cols-3 gap-3">
          {board.map((cell, i) => (
            <button
              key={i}
              onClick={() => isMyTurn && !cell && onMove(i)}
              disabled={!!cell || !isMyTurn}
              className={`
                w-24 h-24 bg-slate-700 rounded-xl flex items-center justify-center text-5xl shadow-inner
                transition-all duration-200
                ${!cell && isMyTurn ? 'hover:bg-slate-600 cursor-pointer hover:scale-105' : ''}
                ${cell ? 'bg-slate-900 shadow-none' : ''}
              `}
            >
              {cell === 'X' && <X size={64} className="text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.6)]" />}
              {cell === 'O' && <Circle size={56} className="text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.6)]" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}