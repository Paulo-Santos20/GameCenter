import React, { useState, useEffect, useMemo } from 'react';
import { Crown } from 'lucide-react';

const INITIAL_CHECKERS = Array.from({ length: 8 }, (_, r) => 
    Array.from({ length: 8 }, (_, c) => {
        if ((r + c) % 2 === 1) {
            if (r < 3) return { color: 'b', isKing: false }; 
            if (r > 4) return { color: 'w', isKing: false }; 
        }
        return null;
    })
);

export default function CheckersBoard({ gameState, onMove, isMyTurn, playerColor = 'w', externalLastMove }) {
    const [board, setBoard] = useState(gameState ? JSON.parse(gameState) : INITIAL_CHECKERS);
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        if (gameState) setBoard(JSON.parse(gameState));
    }, [gameState]);

    const validMoves = useMemo(() => {
        const moves = [];
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = board[r][c];
                if (!p || p.color !== playerColor) continue;

                // MoveDirs: Só pra frente se não for rei. Rei pra todo lado.
                const moveDirs = p.isKing 
                    ? [[1, -1], [1, 1], [-1, -1], [-1, 1]] 
                    : (playerColor === 'b' ? [[1, -1], [1, 1]] : [[-1, -1], [-1, 1]]);
                
                // CaptureDirs: Todo mundo captura pra todo lado (Regra BR)
                const captureDirs = [[1, -1], [1, 1], [-1, -1], [-1, 1]];

                // Simples
                moveDirs.forEach(([dr, dc]) => {
                    const nr = r+dr, nc = c+dc;
                    if (nr>=0 && nr<8 && nc>=0 && nc<8 && !board[nr][nc]) 
                        moves.push({ from: {r,c}, to: {r:nr,c:nc}, isCapture: false });
                });

                // Captura
                captureDirs.forEach(([dr, dc]) => {
                    const jr = r+dr*2, jc = c+dc*2;
                    const mr = r+dr, mc = c+dc;
                    if (jr>=0 && jr<8 && jc>=0 && jc<8 && !board[jr][jc]) {
                        const mid = board[mr][mc];
                        if (mid && mid.color !== playerColor) 
                            moves.push({ from: {r,c}, to: {r:jr,c:jc}, isCapture: true, captured: {r:mr, c:mc} });
                    }
                });
            }
        }
        // Filtra Obrigatórias
        const captures = moves.filter(m => m.isCapture);
        return captures.length > 0 ? captures : moves;
    }, [board, playerColor]);

    const handleSquareClick = (r, c) => {
        if (!isMyTurn) return;
        const piece = board[r][c];

        // Selecionar
        if (piece) {
            if (piece.color === playerColor) {
                if (validMoves.some(m => m.from.r === r && m.from.c === c)) setSelected({ r, c });
            }
            return;
        }

        // Mover
        if (!piece && selected) {
            const move = validMoves.find(m => m.from.r === selected.r && m.from.c === selected.c && m.to.r === r && m.to.c === c);
            if (move) {
                const newBoard = board.map(row => row.map(p => p ? {...p} : null));
                const movingPiece = newBoard[selected.r][selected.c];
                newBoard[r][c] = movingPiece;
                newBoard[selected.r][selected.c] = null;
                if (move.isCapture) newBoard[move.captured.r][move.captured.c] = null;
                if ((movingPiece.color==='w' && r===0) || (movingPiece.color==='b' && r===7)) movingPiece.isKing = true;
                
                setBoard(newBoard);
                setSelected(null);
                // Envia estado e detalhe do movimento
                onMove(JSON.stringify(newBoard), { from: {r: selected.r, c: selected.c}, to: {r, c} });
            } else {
                setSelected(null);
            }
        }
    };

    const displayRows = playerColor === 'b' ? [7,6,5,4,3,2,1,0] : [0,1,2,3,4,5,6,7];
    const displayCols = playerColor === 'b' ? [7,6,5,4,3,2,1,0] : [0,1,2,3,4,5,6,7];

    return (
        <div className="flex flex-col items-center">
            {/* Status Bar */}
            <div className="w-full max-w-[400px] flex justify-center items-center mb-2 h-8 bg-[#2b2118] text-[#eecfa1] rounded-t-lg border-t border-x border-[#4a3525]">
                <span className="font-bold text-sm tracking-widest">{isMyTurn ? "SUA VEZ" : "AGUARDANDO..."}</span>
            </div>

            {/* Tabuleiro */}
            <div className="bg-[#2b2118] p-3 rounded-b-lg shadow-2xl border-4 border-[#4a3525]">
                <div className="grid grid-cols-8 border-[6px] border-[#5c4033] bg-[#eecfa1]">
                    {displayRows.map((r) => displayCols.map((c) => {
                        const p = board[r][c];
                        const isDark = (r + c) % 2 === 1;
                        const isSel = selected?.r === r && selected?.c === c;
                        const isDest = selected && validMoves.some(m => m.from.r===selected.r && m.to.r===r && m.to.c===c);
                        
                        // Highlight Amarelo da Última Jogada
                        const isLastMove = externalLastMove && (
                            (externalLastMove.from.r === r && externalLastMove.from.c === c) ||
                            (externalLastMove.to.r === r && externalLastMove.to.c === c)
                        );

                        return (
                            <div key={`${r}-${c}`} onClick={() => isDark && handleSquareClick(r, c)} className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center relative ${isDark?'bg-[#5c4033]':'bg-[#eecfa1]'} ${isSel?'ring-inset ring-4 ring-yellow-400':''}`}>
                                
                                {isLastMove && <div className="absolute inset-0 bg-yellow-400/40"></div>}

                                {p && <div className={`w-[80%] h-[80%] rounded-full shadow-lg flex items-center justify-center ${p.color==='w'?'bg-slate-200 border-slate-300':'bg-red-700 border-red-900'} border-[3px] ${isSel?'scale-110':''} relative z-10`}>
                                    {p.isKing && <Crown size={20} className="opacity-50"/>}
                                </div>}
                                
                                {isDest && <div className={`w-3 h-3 rounded-full ${validMoves.find(m=>m.to.r===r&&m.to.c===c)?.isCapture?'bg-red-500':'bg-green-500/50'} relative z-10`}/>}
                            </div>
                        );
                    }))}
                </div>
            </div>
        </div>
    );
}