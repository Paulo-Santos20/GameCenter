import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { AlertTriangle, Cpu, Crown } from 'lucide-react';

const SYMBOLS = {
  w: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
  b: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' }
};

export default function ChessBoardWrapper({ isVsAi, gameState, onMove, isMyTurn, playerColor = 'w', externalLastMove }) {
    const [game, setGame] = useState(new Chess());
    const [board, setBoard] = useState(game.board());
    const [selectedSquare, setSelectedSquare] = useState(null);
    const [possibleMoves, setPossibleMoves] = useState([]);
    const [status, setStatus] = useState('');

    useEffect(() => {
        if (gameState) {
            try {
                const newGame = new Chess(gameState);
                setGame(newGame);
                setBoard(newGame.board());
                if (newGame.isCheckmate()) setStatus('checkmate');
                else if (newGame.isCheck()) setStatus('check');
                else setStatus('');
            } catch (e) { console.error(e); }
        }
    }, [gameState]);

    const getSquareId = (r, c) => `${String.fromCharCode(97 + c)}${8 - r}`;

    const handleSquareClick = (r, c) => {
        if (!isMyTurn && !isVsAi) return;
        if (game.isGameOver()) return;

        const squareId = getSquareId(r, c);
        const piece = game.get(squareId);

        if (selectedSquare) {
            try {
                const moveResult = game.move({ from: selectedSquare, to: squareId, promotion: 'q' });
                if (moveResult) {
                    setBoard(game.board());
                    setSelectedSquare(null);
                    setPossibleMoves([]);
                    // Envia FEN e o objeto de movimento para highlight
                    onMove(game.fen(), { from: moveResult.from, to: moveResult.to });
                    return;
                }
            } catch (e) {}
        }

        if (piece && (isVsAi || piece.color === playerColor) && piece.color === game.turn()) {
            setSelectedSquare(squareId);
            setPossibleMoves(game.moves({ square: squareId, verbose: true }).map(m => m.to));
        } else {
            setSelectedSquare(null);
            setPossibleMoves([]);
        }
    };

    const displayRows = playerColor === 'b' ? [7,6,5,4,3,2,1,0] : [0,1,2,3,4,5,6,7];
    const displayCols = playerColor === 'b' ? [7,6,5,4,3,2,1,0] : [0,1,2,3,4,5,6,7];

    return (
        <div className="flex flex-col items-center select-none">
            {/* Barra de Status */}
            <div className="w-full max-w-[400px] flex justify-between items-center mb-2 px-3 h-8 bg-slate-800 rounded-t-lg border-x border-t border-slate-700">
                <div className="flex items-center gap-2 text-sm font-bold">
                    {(game.turn() === playerColor) ? 
                        <span className="text-emerald-400 animate-pulse">SUA VEZ</span> : 
                        <span className="text-slate-500">{isVsAi ? "IA PENSANDO..." : "AGUARDANDO..."}</span>
                    }
                </div>
                {status === 'check' && <span className="text-red-400 text-xs font-bold flex items-center gap-1"><AlertTriangle size={12}/> XEQUE</span>}
            </div>

            {/* Tabuleiro */}
            <div className="bg-[#262421] p-2 rounded-b-lg shadow-2xl border-4 border-[#262421]">
                <div className="grid grid-cols-8 border-[4px] border-[#404040]">
                    {displayRows.map((r) => displayCols.map((c) => {
                        const squareId = getSquareId(r, c);
                        const p = board[r][c];
                        const isBlack = (r + c) % 2 === 1;
                        const isSelected = selectedSquare === squareId;
                        const isPossible = possibleMoves.includes(squareId);
                        
                        // Lógica de Highlight (Amarelo)
                        const isLastMove = externalLastMove && (externalLastMove.from === squareId || externalLastMove.to === squareId);

                        let bg = isBlack ? 'bg-[#769656]' : 'bg-[#eeeed2]'; 
                        if (isLastMove) bg = isBlack ? 'bg-[#bbcb2b]' : 'bg-[#f7f769]'; // Highlight amarelo
                        if (isSelected) bg = 'bg-[#baca2b]'; // Verde Seleção

                        return (
                            <div key={squareId} onClick={() => handleSquareClick(r, c)} className={`w-9 h-9 sm:w-12 sm:h-12 md:w-14 md:h-14 flex items-center justify-center relative ${bg} ${isPossible && 'cursor-pointer'}`}>
                                {p && <span className={`z-10 text-3xl sm:text-4xl select-none ${p.color==='w'?'text-white drop-shadow-md':'text-black'}`}>{SYMBOLS[p.color][p.type]}</span>}
                                {isPossible && !p && <div className="w-3 h-3 bg-black/20 rounded-full"/>}
                                {isPossible && p && <div className="absolute inset-0 border-[4px] border-black/10 rounded-full"/>}
                            </div>
                        );
                    }))}
                </div>
            </div>
        </div>
    );
}