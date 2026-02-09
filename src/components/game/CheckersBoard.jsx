import React, { useState, useEffect } from 'react';
import { Circle, Crown } from 'lucide-react';

const BOARD_SIZE = 8;

// Configuração inicial padrão (Damas 8x8)
const INITIAL_CHECKERS = Array.from({ length: BOARD_SIZE }, (_, r) => 
    Array.from({ length: BOARD_SIZE }, (_, c) => {
        if ((r + c) % 2 === 1) {
            if (r < 3) return { color: 'b', isKing: false }; // Black (Pretas/AI)
            if (r > 4) return { color: 'w', isKing: false }; // White (Brancas/Player)
        }
        return null;
    })
);

export default function CheckersBoard({ gameState, onMove, isMyTurn, playerColor = 'w' }) {
    // Se receber estado do banco, usa. Senão, inicia tabuleiro padrão.
    const [board, setBoard] = useState(gameState ? JSON.parse(gameState) : INITIAL_CHECKERS);
    const [selected, setSelected] = useState(null);

    // Sincroniza com Firebase/Pai
    useEffect(() => {
        if (gameState) setBoard(JSON.parse(gameState));
    }, [gameState]);

    // Lógica visual de seleção e movimento (Simplificada para UI)
    const handleSquareClick = (r, c) => {
        if (!isMyTurn) return;

        const piece = board[r][c];

        // 1. Selecionar peça
        if (piece && piece.color === playerColor) {
            setSelected({ r, c });
            return;
        }

        // 2. Mover peça (Lógica visual apenas, validação real deveria ser na engine)
        if (!piece && selected) {
            // Verifica se é um movimento diagonal simples (placeholder)
            const dr = r - selected.r;
            const dc = c - selected.c;
            
            // Movimento simples básico para atualizar a UI e enviar ao servidor
            if (Math.abs(dr) === 1 && Math.abs(dc) === 1) {
                const newBoard = board.map(row => [...row]);
                newBoard[r][c] = newBoard[selected.r][selected.c];
                newBoard[selected.r][selected.c] = null;
                
                // Promoção simples
                if ((playerColor === 'w' && r === 0) || (playerColor === 'b' && r === 7)) {
                    newBoard[r][c].isKing = true;
                }

                setBoard(newBoard);
                setSelected(null);
                onMove(JSON.stringify(newBoard));
            }
            // Aqui você adicionaria a lógica de captura (pular peças)
        }
    };

    // --- RENDERIZAÇÃO ESPELHADA (Igual ao Xadrez) ---
    const displayRows = playerColor === 'b' ? [7,6,5,4,3,2,1,0] : [0,1,2,3,4,5,6,7];
    const displayCols = playerColor === 'b' ? [7,6,5,4,3,2,1,0] : [0,1,2,3,4,5,6,7];

    return (
        <div className="flex flex-col items-center justify-center p-4 bg-[#2b2118] rounded-xl shadow-2xl border-4 border-[#4a3525]">
            <div className="grid grid-cols-8 border-[8px] border-[#5c4033] bg-[#eecfa1]">
                {displayRows.map((r) => 
                    displayCols.map((c) => {
                        const piece = board[r][c];
                        const isDark = (r + c) % 2 === 1;
                        const isSelected = selected?.r === r && selected?.c === c;

                        return (
                            <div 
                                key={`${r}-${c}`}
                                onClick={() => isDark && handleSquareClick(r, c)}
                                className={`
                                    w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center relative
                                    ${isDark ? 'bg-[#5c4033]' : 'bg-[#eecfa1]'}
                                    ${isSelected ? 'ring-inset ring-4 ring-yellow-400' : ''}
                                `}
                            >
                                {piece && (
                                    <div className={`
                                        w-[80%] h-[80%] rounded-full shadow-[0_4px_2px_rgba(0,0,0,0.5)] flex items-center justify-center
                                        transition-transform duration-200
                                        ${piece.color === 'w' 
                                            ? 'bg-slate-200 border-[3px] border-slate-300 ring-1 ring-slate-400' 
                                            : 'bg-red-700 border-[3px] border-red-800 ring-1 ring-red-900'}
                                        ${isSelected ? 'scale-110' : ''}
                                    `}>
                                        {piece.isKing && <Crown size={20} className={piece.color === 'w' ? 'text-slate-500' : 'text-black/40'} strokeWidth={3} />}
                                        {/* Detalhe estético (sulco interno) */}
                                        <div className={`absolute w-[60%] h-[60%] rounded-full border-2 opacity-30 ${piece.color === 'w' ? 'border-slate-400' : 'border-red-950'}`}></div>
                                    </div>
                                )}
                                
                                {/* Highlight de movimento possível (opcional) */}
                                {selected && !piece && isDark && Math.abs(r - selected.r) === 1 && Math.abs(c - selected.c) === 1 && (
                                    <div className="w-4 h-4 bg-green-500/50 rounded-full animate-pulse"></div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}