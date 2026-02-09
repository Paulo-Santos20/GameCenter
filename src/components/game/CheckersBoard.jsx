import React, { useState, useEffect } from 'react';
import { RotateCcw, Crown, Brain } from 'lucide-react';

const BOARD_SIZE = 8;

// --- ENGINE ---
const CheckersEngine = {
    createBoard: () => {
        return Array.from({ length: BOARD_SIZE }, (_, r) => 
            Array.from({ length: BOARD_SIZE }, (_, c) => {
                if ((r + c) % 2 === 1) {
                    if (r < 3) return { color: 'b', isKing: false };
                    if (r > 4) return { color: 'w', isKing: false };
                }
                return null;
            })
        );
    },

    isValidPos: (r, c) => r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE,

    getPieceMoves: (board, r, c, mustCaptureFrom = null) => {
        const piece = board[r][c];
        if (!piece) return [];
        if (mustCaptureFrom && (mustCaptureFrom.r !== r || mustCaptureFrom.c !== c)) return [];

        const moves = [];
        const directions = piece.isKing ? [[-1, -1], [-1, 1], [1, -1], [1, 1]] : 
                           (piece.color === 'w' ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]]);

        directions.forEach(([dr, dc]) => {
            let dist = 1;
            const maxDist = piece.isKing ? 7 : 1;

            while (dist <= maxDist) {
                const nr = r + (dr * dist);
                const nc = c + (dc * dist);

                if (!CheckersEngine.isValidPos(nr, nc)) break;
                const target = board[nr][nc];

                if (target === null) {
                    if (!mustCaptureFrom) moves.push({ r: nr, c: nc, isCapture: false });
                } else {
                    if (target.color === piece.color) break;
                    const jumpR = nr + dr;
                    const jumpC = nc + dc;
                    if (CheckersEngine.isValidPos(jumpR, jumpC) && board[jumpR][jumpC] === null) {
                        moves.push({ r: jumpR, c: jumpC, isCapture: true, captured: { r: nr, c: nc } });
                    }
                    break;
                }
                if (!piece.isKing) break;
                dist++;
            }
        });
        
        // Adiciona captura para trás para peças comuns (Regra internacional padrão)
        if (!piece.isKing) {
             const backDirs = piece.color === 'w' ? [[1, -1], [1, 1]] : [[-1, -1], [-1, 1]];
             backDirs.forEach(([dr, dc]) => {
                const nr = r + dr, nc = c + dc;
                const jr = r + (dr * 2), jc = c + (dc * 2);
                if (CheckersEngine.isValidPos(jr, jc) && CheckersEngine.isValidPos(nr, nc)) {
                    if (board[nr][nc] && board[nr][nc].color !== piece.color && board[jr][jc] === null) {
                         moves.push({ r: jr, c: jc, isCapture: true, captured: { r: nr, c: nc } });
                    }
                }
             });
        }
        return moves;
    },

    getAllMoves: (board, color, mustCaptureFrom) => {
        let moves = [];
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                if (board[r][c]?.color === color) {
                    const pm = CheckersEngine.getPieceMoves(board, r, c, mustCaptureFrom);
                    pm.forEach(m => moves.push({ from: {r,c}, ...m }));
                }
            }
        }
        const captures = moves.filter(m => m.isCapture);
        return captures.length > 0 ? captures : moves;
    },

    simulateMove: (currentBoard, move) => {
        const newBoard = JSON.parse(JSON.stringify(currentBoard));
        const piece = newBoard[move.from.r][move.from.c];
        newBoard[move.r][move.c] = piece;
        newBoard[move.from.r][move.from.c] = null;

        let extraTurn = false;
        let nextStart = null;

        if (move.isCapture) {
            newBoard[move.captured.r][move.captured.c] = null;
            const followUp = CheckersEngine.getPieceMoves(newBoard, move.r, move.c);
            if (followUp.some(m => m.isCapture)) {
                extraTurn = true;
                nextStart = { r: move.r, c: move.c };
            }
        }
        if (!extraTurn && !piece.isKing && ((piece.color === 'w' && move.r === 0) || (piece.color === 'b' && move.r === 7))) {
            piece.isKing = true;
        }
        return { newBoard, extraTurn, nextStart };
    },

    evaluate: (board) => {
        let score = 0;
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const p = board[r][c];
                if (!p) continue;
                const val = p.isKing ? 50 : 10;
                score += p.color === 'b' ? val : -val;
            }
        }
        return score;
    },

    minimax: (board, depth, alpha, beta, isMax, mustCaptureFrom) => {
        if (depth === 0) return { score: CheckersEngine.evaluate(board) };
        const color = isMax ? 'b' : 'w';
        const moves = CheckersEngine.getAllMoves(board, color, mustCaptureFrom);
        if (moves.length === 0) return { score: isMax ? -10000 : 10000 };

        let bestMove = moves[0];
        let bestScore = isMax ? -Infinity : Infinity;

        for (const move of moves) {
            const { newBoard, extraTurn, nextStart } = CheckersEngine.simulateMove(board, move);
            const result = CheckersEngine.minimax(newBoard, extraTurn ? depth : depth - 1, alpha, beta, extraTurn ? isMax : !isMax, nextStart);
            
            if (isMax) {
                if (result.score > bestScore) { bestScore = result.score; bestMove = move; }
                alpha = Math.max(alpha, result.score);
            } else {
                if (result.score < bestScore) { bestScore = result.score; bestMove = move; }
                beta = Math.min(beta, result.score);
            }
            if (beta <= alpha) break;
        }
        return { score: bestScore, move: bestMove };
    }
};

const CheckersBoard = () => {
    const [board, setBoard] = useState(CheckersEngine.createBoard());
    const [turn, setTurn] = useState('w');
    const [selected, setSelected] = useState(null);
    const [possibleMoves, setPossibleMoves] = useState([]);
    const [mustCaptureFrom, setMustCaptureFrom] = useState(null);
    const [difficulty, setDifficulty] = useState('medium');
    const [isThinking, setIsThinking] = useState(false);
    const [winner, setWinner] = useState(null);

    useEffect(() => {
        if (turn === 'b' && !winner) {
            setIsThinking(true);
            setTimeout(() => {
                const depthMap = { easy: 1, medium: 3, hard: 5, extreme: 7 };
                const result = CheckersEngine.minimax(board, depthMap[difficulty], -Infinity, Infinity, true, mustCaptureFrom);
                if (result.move) executeMove(result.move);
                else setWinner('w');
                setIsThinking(false);
            }, 500);
        } else if (turn === 'w' && !winner) {
            if (CheckersEngine.getAllMoves(board, 'w', mustCaptureFrom).length === 0) setWinner('b');
        }
    }, [turn, mustCaptureFrom, board, winner]);

    const executeMove = (move) => {
        const { newBoard, extraTurn, nextStart } = CheckersEngine.simulateMove(board, move);
        setBoard(newBoard);
        setSelected(null);
        setPossibleMoves([]);
        if (extraTurn) {
            setMustCaptureFrom(nextStart);
            if (turn === 'w') {
                setSelected(nextStart);
                setPossibleMoves(CheckersEngine.getPieceMoves(newBoard, nextStart.r, nextStart.c, nextStart));
            }
        } else {
            setMustCaptureFrom(null);
            setTurn(prev => prev === 'w' ? 'b' : 'w');
        }
    };

    const handleClick = (r, c) => {
        if (turn !== 'w' || isThinking || winner) return;
        const move = possibleMoves.find(m => m.r === r && m.c === c);
        if (move) {
            executeMove({ from: selected, ...move });
            return;
        }
        const piece = board[r][c];
        if (piece?.color === 'w') {
            const allMoves = CheckersEngine.getAllMoves(board, 'w', mustCaptureFrom);
            const capturesOnly = allMoves.some(m => m.isCapture);
            const pieceMoves = CheckersEngine.getPieceMoves(board, r, c, mustCaptureFrom);
            if (capturesOnly && !pieceMoves.some(m => m.isCapture)) return;
            if (pieceMoves.length > 0) {
                setSelected({ r, c });
                setPossibleMoves(pieceMoves);
            }
        } else if (!mustCaptureFrom) {
            setSelected(null);
            setPossibleMoves([]);
        }
    };

    return (
        <div className="flex flex-col items-center bg-[#2b2118] p-4 rounded-xl shadow-2xl max-w-lg mx-auto select-none">
            <div className="w-full flex justify-between items-center mb-4 text-white">
                <span className="font-bold text-xl">Damas</span>
                <div className="flex gap-1">
                    {['easy', 'medium', 'hard', 'extreme'].map(d => (
                        <button key={d} onClick={() => setDifficulty(d)} className={`w-3 h-3 rounded-full ${difficulty === d ? 'bg-amber-500 scale-125' : 'bg-gray-600'}`} title={d}/>
                    ))}
                </div>
                <button onClick={() => { setBoard(CheckersEngine.createBoard()); setWinner(null); setTurn('w'); }} className="p-2 hover:bg-white/10 rounded"><RotateCcw size={18}/></button>
            </div>
            <div className="relative">
                {winner && <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur rounded-lg text-white text-3xl font-bold">{winner === 'w' ? 'VOCÊ VENCEU!' : 'GAME OVER'}</div>}
                <div className="grid grid-cols-8 gap-0 border-[12px] border-[#5c4033] rounded shadow-lg bg-[#3d2b1f]" style={{ width: 'min(80vw, 400px)', height: 'min(80vw, 400px)' }}>
                    {board.map((row, r) => row.map((piece, c) => {
                        const isBlack = (r + c) % 2 === 1;
                        const isSel = selected?.r === r && selected?.c === c;
                        const isMove = possibleMoves.find(m => m.r === r && m.c === c);
                        return (
                            <div key={`${r}-${c}`} onClick={() => handleClick(r, c)} className={`relative flex items-center justify-center ${isBlack ? 'bg-[#4a3525]' : 'bg-[#eecfa1]'} ${isMove ? 'cursor-pointer after:absolute after:w-3 after:h-3 after:bg-green-500 after:rounded-full after:animate-pulse' : ''} ${isMove?.isCapture ? '!after:bg-red-600 !after:w-full !after:h-full !after:opacity-30 !after:rounded-none' : ''}`}>
                                {piece && <div className={`w-[80%] h-[80%] rounded-full shadow-inner flex items-center justify-center transition-transform ${piece.color === 'w' ? 'bg-[#f0f0f0] border-[3px] border-[#dcdcdc]' : 'bg-[#c93636] border-[3px] border-[#8b0000]'} ${isSel ? 'ring-4 ring-yellow-400 scale-110' : ''}`}>{piece.isKing && <Crown size={20} className={piece.color === 'w' ? 'text-gray-400' : 'text-black/40'} />}</div>}
                            </div>
                        );
                    }))}
                </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-amber-100/80 text-sm h-6">
                {isThinking ? <span className="flex items-center gap-2"><Brain size={14} className="animate-spin"/> IA Pensando...</span> : turn === 'w' ? (mustCaptureFrom ? "COMBO! Capture novamente!" : "Sua vez") : "Aguarde..."}
            </div>
        </div>
    );
};

export default CheckersBoard;