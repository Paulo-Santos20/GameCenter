// src/components/game/TicTacToeBoard.jsx
import React from 'react';
import { X, Circle } from 'lucide-react'; // Ícones
import { clsx } from 'clsx';

const TicTacToeBoard = ({ gameState, onMove, isMyTurn, disabled }) => {
  const board = gameState?.board || Array(9).fill(null);

  const handleCellClick = (index) => {
    if (board[index] || !isMyTurn || disabled) return;
    
    const newBoard = [...board];
    // Se for minha vez, eu sou o 'X' (jogador 1) ou 'O' (jogador 2)?
    // Simplificação: Vamos assumir que o frontend passa o símbolo correto
    onMove(index); 
  };

  return (
    <div className="grid grid-cols-3 gap-2 w-full max-w-[300px] mx-auto aspect-square bg-slate-200 p-2 rounded-xl">
      {board.map((cell, idx) => (
        <button
          key={idx}
          onClick={() => handleCellClick(idx)}
          disabled={!!cell || !isMyTurn || disabled}
          className={clsx(
            "flex items-center justify-center bg-white rounded-lg shadow-sm text-4xl transition-all",
            !cell && isMyTurn && !disabled && "hover:bg-blue-50 cursor-pointer",
            (cell || !isMyTurn || disabled) && "cursor-default"
          )}
        >
          {cell === 'X' && <X className="w-12 h-12 text-blue-500" />}
          {cell === 'O' && <Circle className="w-12 h-12 text-red-500" />}
        </button>
      ))}
    </div>
  );
};

export default TicTacToeBoard;