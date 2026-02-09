import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Shield, AlertTriangle, Cpu, RotateCcw } from 'lucide-react';

// --- CONSTANTES ---
const SYMBOLS = {
  w: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
  b: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' }
};

const INITIAL_FEN_ARRAY = [
  ['br', 'bn', 'bb', 'bq', 'bk', 'bb', 'bn', 'br'], // Linha 0 (Pretas no Topo - Padrão)
  Array(8).fill('bp'),
  ...Array(4).fill(null).map(() => Array(8).fill(null)),
  Array(8).fill('wp'),
  ['wr', 'wn', 'wb', 'wq', 'wk', 'wb', 'wn', 'wr'], // Linha 7 (Brancas na Base - Padrão)
];

// --- ENGINE ---
const ChessAI = {
    PIECE_VALUES: { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 },
    PST: { /* ... (Mesma PST anterior para economizar espaço, mantida a lógica) ... */ 
        p: [[0,0,0,0,0,0,0,0],[50,50,50,50,50,50,50,50],[10,10,20,30,30,20,10,10],[5,5,10,25,25,10,5,5],[0,0,0,20,20,0,0,0],[5,-5,-10,0,0,-10,-5,5],[5,10,10,-20,-20,10,10,5],[0,0,0,0,0,0,0,0]],
        n: [[-50,-40,-30,-30,-30,-30,-40,-50],[-40,-20,0,0,0,0,-20,-40],[-30,0,10,15,15,10,0,-30],[-30,5,15,20,20,15,5,-30],[-30,0,15,20,20,15,0,-30],[-30,5,10,15,15,10,5,-30],[-40,-20,0,5,5,0,-20,-40],[-50,-40,-30,-30,-30,-30,-40,-50]],
        other: [[-20,-10,-10,-10,-10,-10,-10,-20],[-10,0,0,0,0,0,0,-10],[-10,0,5,10,10,5,0,-10],[-10,5,5,10,10,5,5,-10],[-10,0,10,10,10,10,0,-10],[-10,10,10,10,10,10,10,-10],[-10,5,0,0,0,0,5,-10],[-20,-10,-10,-10,-10,-10,-10,-20]]
    },
    evaluateBoard: (board) => {
        let total = 0;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = board[r][c];
                if (!p) continue;
                const type = p[1], isWhite = p[0] === 'w';
                let val = ChessAI.PIECE_VALUES[type] || 0;
                let pst = ChessAI.PST[type] || ChessAI.PST.other;
                total += isWhite ? (val + pst[r][c]) : -(val + pst[7-r][c]);
            }
        }
        return total;
    },
    minimax: (board, depth, alpha, beta, isMax, castling) => {
        if (depth === 0) return -ChessAI.evaluateBoard(board);
        const moves = ChessRules.getValidMoves(board, isMax ? 'b' : 'w', castling);
        if (moves.length === 0) return isMax ? -99999 : 99999;
        moves.sort((a,b) => (b.to.capture?1:0)-(a.to.capture?1:0));
        if (isMax) {
            let max = -Infinity;
            for (const m of moves) {
                const val = ChessAI.minimax(ChessRules.simulateMove(board, m), depth-1, alpha, beta, false, castling);
                max = Math.max(max, val); alpha = Math.max(alpha, val); if(beta<=alpha) break;
            }
            return max;
        } else {
            let min = Infinity;
            for (const m of moves) {
                const val = ChessAI.minimax(ChessRules.simulateMove(board, m), depth-1, alpha, beta, true, castling);
                min = Math.min(min, val); beta = Math.min(beta, val); if(beta<=alpha) break;
            }
            return min;
        }
    },
    getBestMove: (board, castling, diff) => {
        let d = diff==='impossible'?4:diff==='hard'?3:diff==='medium'?2:1;
        const moves = ChessRules.getValidMoves(board, 'b', castling);
        if(!moves.length) return null;
        if(diff==='easy' && Math.random()<0.4) return moves[Math.floor(Math.random()*moves.length)];
        let best=null, bestVal=-Infinity;
        for(const m of moves) {
            const val = ChessAI.minimax(ChessRules.simulateMove(board, m), d-1, -Infinity, Infinity, false, castling);
            if(val > bestVal) { bestVal = val; best = m; }
        }
        return best || moves[0];
    }
};

const ChessRules = {
    clone: (b) => b.map(r => [...r]),
    simulateMove: (board, move) => {
        const nb = ChessRules.clone(board);
        const p = nb[move.from.r][move.from.c];
        nb[move.to.r][move.to.c] = p;
        nb[move.from.r][move.from.c] = null;
        if (p[1] === 'p' && (move.to.r === 0 || move.to.r === 7)) nb[move.to.r][move.to.c] = p[0] + 'q';
        if (move.to.isCastle) {
            if (move.to.c === 6) { nb[move.from.r][5] = nb[move.from.r][7]; nb[move.from.r][7] = null; } 
            else { nb[move.from.r][3] = nb[move.from.r][0]; nb[move.from.r][0] = null; }
        }
        return nb;
    },
    isAttacked: (board, r, c, byColor) => {
       const dir = byColor === 'w' ? 1 : -1;
       if (board[r-dir]?.[c-1] === byColor+'p') return true;
       if (board[r-dir]?.[c+1] === byColor+'p') return true;
       const steps = [{t:'n',m:[[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]]},{t:'k',m:[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]}];
       for(const s of steps) for(const [dr,dc] of s.m) { const tr=r+dr, tc=c+dc; if(tr>=0&&tr<8&&tc>=0&&tc<8 && board[tr][tc] === byColor+s.t) return true; }
       const slides = [{d:[[0,1],[0,-1],[1,0],[-1,0]],t:['r','q']},{d:[[1,1],[1,-1],[-1,1],[-1,-1]],t:['b','q']}];
       for(const s of slides) for(const [dr,dc] of s.d) { let nr=r+dr, nc=c+dc; while(nr>=0&&nr<8&&nc>=0&&nc<8) { const p = board[nr][nc]; if(p) { if(p[0] === byColor && s.t.includes(p[1])) return true; break; } nr+=dr; nc+=dc; } }
       return false;
    },
    getValidMoves: (board, color, castling) => {
        const moves = [], enemy = color==='w'?'b':'w';
        for (let r=0; r<8; r++) for (let c=0; c<8; c++) {
            const p = board[r][c];
            if (!p || p[0] !== color) continue;
            const type = p[1], rawMoves = [];
            if (type === 'p') {
                const dir = color === 'w' ? -1 : 1;
                if (!board[r+dir]?.[c]) { rawMoves.push({r:r+dir,c}); if((color==='w'&&r===6||color==='b'&&r===1) && !board[r+dir*2]?.[c]) rawMoves.push({r:r+dir*2,c}); }
                if (board[r+dir]?.[c-1]?.[0] === enemy) rawMoves.push({r:r+dir,c:c-1,capture:true});
                if (board[r+dir]?.[c+1]?.[0] === enemy) rawMoves.push({r:r+dir,c:c+1,capture:true});
            } else if (type === 'n') { [[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]].forEach(([dr,dc]) => { const nr=r+dr,nc=c+dc; if(nr>=0&&nr<8&&nc>=0&&nc<8&&(!board[nr][nc]||board[nr][nc][0]===enemy)) rawMoves.push({r:nr,c:nc,capture:!!board[nr][nc]}); });
            } else if (type === 'k') { 
                [[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]].forEach(([dr,dc]) => { const nr=r+dr,nc=c+dc; if(nr>=0&&nr<8&&nc>=0&&nc<8&&(!board[nr][nc]||board[nr][nc][0]===enemy)) rawMoves.push({r:nr,c:nc,capture:!!board[nr][nc]}); });
                if (castling?.[color].k && !board[r][5] && !board[r][6] && !ChessRules.isAttacked(board,r,4,enemy) && !ChessRules.isAttacked(board,r,5,enemy)) rawMoves.push({r,c:6,isCastle:true});
                if (castling?.[color].q && !board[r][1] && !board[r][2] && !board[r][3] && !ChessRules.isAttacked(board,r,4,enemy) && !ChessRules.isAttacked(board,r,3,enemy)) rawMoves.push({r,c:2,isCastle:true});
            } else { const dirs = type==='r'?[[0,1],[0,-1],[1,0],[-1,0]]:type==='b'?[[1,1],[1,-1],[-1,1],[-1,-1]]:[[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]]; dirs.forEach(([dr,dc])=>{ let nr=r+dr,nc=c+dc; while(nr>=0&&nr<8&&nc>=0&&nc<8) { if(!board[nr][nc]) rawMoves.push({r:nr,c:nc}); else { if(board[nr][nc][0]===enemy) rawMoves.push({r:nr,c:nc,capture:true}); break; } nr+=dr; nc+=dc; } }); }
            for (const m of rawMoves) {
                const temp = ChessRules.simulateMove(board, {from:{r,c}, to:m});
                let kR, kC; for(let i=0;i<8;i++) for(let j=0;j<8;j++) if(temp[i][j]===color+'k'){kR=i;kC=j;break;}
                if (!ChessRules.isAttacked(temp, kR, kC, enemy)) moves.push({from:{r,c}, to:m});
            }
        }
        return moves;
    }
};

// --- COMPONENTE DO TABULEIRO ---
const ChessBoardWrapper = ({ difficulty = 'medium', isVsAi = false, gameState, onMove, isMyTurn, playerColor = 'w' }) => {
    
    // Inicialização do Tabuleiro
    const [board, setBoard] = useState(gameState ? JSON.parse(gameState) : INITIAL_FEN_ARRAY);
    
    // Estado de Turno Local (para controle visual imediato)
    // Se for PvP, assumimos que se o board veio do banco, a vez é do "próximo".
    // Se isMyTurn é true, então 'turn' deve ser igual a 'playerColor'.
    const [turn, setTurn] = useState(isMyTurn ? playerColor : (playerColor === 'w' ? 'b' : 'w')); 
    
    const [selected, setSelected] = useState(null);
    const [status, setStatus] = useState('playing');
    const [isThinking, setIsThinking] = useState(false);
    const [castling, setCastling] = useState({ w: { k: true, q: true }, b: { k: true, q: true } });

    // Atualiza tabuleiro quando chega dado novo do Firestore
    useEffect(() => {
        if (!isVsAi && gameState) {
            try {
                const parsedBoard = JSON.parse(gameState);
                setBoard(parsedBoard);
                // Se o board mudou, atualize o turno local baseado na prop isMyTurn
                setTurn(isMyTurn ? playerColor : (playerColor === 'w' ? 'b' : 'w'));
                setStatus('playing'); // Reseta status visual se necessário
            } catch (e) { console.error("Parse Error", e); }
        }
    }, [gameState, isVsAi, isMyTurn, playerColor]);

    const validMoves = useMemo(() => {
        if (status === 'checkmate' || status === 'stalemate') return [];
        return ChessRules.getValidMoves(board, turn, castling);
    }, [board, turn, castling, status]);

    // Lógica da IA (Apenas Local)
    useEffect(() => {
        if (!isVsAi) return;
        if (turn === 'b' && status === 'playing') {
            setIsThinking(true);
            const timer = setTimeout(() => {
                const bestMove = ChessAI.getBestMove(board, castling, difficulty);
                if (bestMove) executeMove(bestMove);
                else checkGameStatus('b', board);
                setIsThinking(false);
            }, 500); 
            return () => clearTimeout(timer);
        }
    }, [turn, board, castling, difficulty, status, isVsAi]);

    const checkGameStatus = useCallback((currentTurn, currentBoard) => {
        let kR, kC; for(let r=0;r<8;r++) for(let c=0;c<8;c++) if(currentBoard[r][c] === currentTurn+'k') { kR=r; kC=c; break; }
        const enemy = currentTurn === 'w' ? 'b' : 'w';
        const isCheck = ChessRules.isAttacked(currentBoard, kR, kC, enemy);
        const hasMoves = ChessRules.getValidMoves(currentBoard, currentTurn, castling).length > 0;
        if (isCheck && !hasMoves) setStatus('checkmate');
        else if (!isCheck && !hasMoves) setStatus('stalemate');
        else if (isCheck) setStatus('check');
        else setStatus('playing');
    }, [castling]);

    // Verifica status a cada mudança de tabuleiro
    useEffect(() => checkGameStatus(turn, board), [turn, board, checkGameStatus]);

    const executeMove = (move) => {
        const newBoard = ChessRules.simulateMove(board, move);
        const p = board[move.from.r][move.from.c];
        const newCastling = {...castling};
        if (p[1] === 'k') { newCastling[p[0]].k = false; newCastling[p[0]].q = false; }
        else if (p[1] === 'r') { if (move.from.c === 0) newCastling[p[0]].q = false; if (move.from.c === 7) newCastling[p[0]].k = false; }
        
        setBoard(newBoard);
        setCastling(newCastling);
        
        const nextTurn = turn === 'w' ? 'b' : 'w';
        setTurn(nextTurn);
        setSelected(null);

        if (onMove) onMove(JSON.stringify(newBoard));
    };

    const handleClick = (r, c) => {
        // Bloqueios
        if (isVsAi && isThinking) return;
        if (!isVsAi && !isMyTurn) return; // Bloqueia se não for minha vez online
        if (status === 'checkmate' || status === 'stalemate') return;

        // Se clicou em um movimento válido (destino)
        const move = validMoves.find(m => m.from.r === selected?.r && m.from.c === selected?.c && m.to.r === r && m.to.c === c);
        if (move) {
            executeMove(move);
            return;
        }

        // Seleção de peça
        const piece = board[r][c];
        // Se for online, só seleciona se a peça for da MINHA cor (playerColor)
        if (!isVsAi && piece && !piece.startsWith(playerColor)) {
            return; // Não pode selecionar peça do oponente
        }
        
        // Se for local (Vs IA), só seleciona se for da vez (turno)
        if (piece?.startsWith(turn)) {
            setSelected({r, c});
        } else {
            setSelected(null);
        }
    };

    const resetGame = () => {
        setBoard(INITIAL_FEN_ARRAY); setTurn('w'); setStatus('playing');
        setCastling({ w: { k: true, q: true }, b: { k: true, q: true } }); setSelected(null);
    };

    // --- LÓGICA DE ESPELHAMENTO VISUAL ---
    // Se eu for Preto ('b'), renderizo as linhas de 7 a 0 (de cima para baixo)
    const displayRows = playerColor === 'b' ? [0,1,2,3,4,5,6,7].reverse() : [0,1,2,3,4,5,6,7];
    // Se eu for Preto, também inverto as colunas (H na esquerda, A na direita)
    const displayCols = playerColor === 'b' ? [0,1,2,3,4,5,6,7].reverse() : [0,1,2,3,4,5,6,7];

    return (
        <div className="flex flex-col items-center bg-slate-900 p-6 rounded-xl shadow-2xl max-w-lg mx-auto select-none border border-slate-800">
            <div className="mb-4 flex justify-between w-full text-white items-center">
                <div className="flex items-center gap-3">
                    <span className="font-bold text-xl flex gap-2 items-center text-slate-100">
                        <Shield size={24} className="text-blue-500"/> Xadrez
                    </span>
                    {isVsAi ? (
                        <span className="text-[10px] px-2 py-0.5 rounded border uppercase font-bold tracking-wider bg-purple-600/20 text-purple-400 border-purple-500/50">
                            {difficulty}
                        </span>
                    ) : (
                        <span className={`text-[10px] px-2 py-0.5 rounded border uppercase font-bold tracking-wider ${playerColor==='w'?'bg-white/20 text-white':'bg-black/40 text-gray-300'}`}>
                            Você: {playerColor==='w'?'Brancas':'Pretas'}
                        </span>
                    )}
                </div>
                {isVsAi && <button onClick={resetGame} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"><RotateCcw size={20}/></button>}
            </div>

            {/* STATUS BAR (SUA VEZ / AGUARDANDO) */}
            <div className="w-full flex justify-between items-center mb-2 px-1 h-6">
                <div className="flex items-center gap-2 text-sm">
                    {isVsAi && isThinking ? (
                        <span className="text-blue-400 flex items-center gap-2 animate-pulse font-medium"><Cpu size={16}/> IA Calculando...</span>
                    ) : (
                        <span className={`font-bold flex items-center gap-2 ${turn === playerColor ? 'text-green-400' : 'text-slate-500'}`}>
                            {turn === playerColor ? "🟢 SUA VEZ" : "⏳ AGUARDANDO..."}
                        </span>
                    )}
                </div>
                {status === 'check' && <span className="text-red-400 font-bold text-sm flex items-center gap-1"><AlertTriangle size={14}/> XEQUE</span>}
                {status === 'checkmate' && <span className="text-red-500 font-bold text-sm bg-red-900/20 px-2 py-0.5 rounded">XEQUE-MATE</span>}
            </div>

            {/* TABULEIRO ESPELHADO */}
            <div className="grid grid-cols-8 border-[6px] border-slate-700 bg-slate-300 rounded-sm shadow-2xl relative">
                {displayRows.map((r) => (
                    displayCols.map((c) => {
                        // Importante: usamos 'r' e 'c' diretos do map, que já estão na ordem correta visualmente,
                        // mas representam os índices reais da matriz 'board'.
                        const p = board[r][c]; 
                        const isBlackSquare = (r + c) % 2 === 1;
                        const isSel = selected?.r === r && selected?.c === c;
                        const isValidDest = validMoves.some(m => m.from.r === selected?.r && m.from.c === selected?.c && m.to.r === r && m.to.c === c);
                        
                        return (
                            <div key={`${r}-${c}`} onClick={() => handleClick(r, c)} className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-3xl sm:text-4xl cursor-pointer relative transition-colors duration-150 ${isBlackSquare ? 'bg-slate-600' : 'bg-slate-300'} ${isSel ? '!bg-yellow-400/80 ring-inset ring-2 ring-yellow-600' : ''} ${isValidDest && !p ? 'after:content-[""] after:w-3 after:h-3 after:bg-green-500/50 after:rounded-full after:absolute' : ''} ${isValidDest && p ? '!bg-red-400/50 ring-inset ring-2 ring-red-500' : ''}`}>
                                <span className={`z-10 select-none transform transition-transform ${isSel ? 'scale-110' : ''} ${p?.startsWith('w') ? 'text-white drop-shadow-[0_2px_1px_rgba(0,0,0,0.8)]' : 'text-black drop-shadow-[0_1px_1px_rgba(255,255,255,0.5)]'}`}>{p ? SYMBOLS[p[0]][p[1]] : ''}</span>
                            </div>
                        );
                    })
                ))}
                {(status === 'checkmate' || status === 'stalemate') && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white z-20">
                        <h2 className="text-3xl font-bold mb-2">{status === 'checkmate' ? 'FIM DE JOGO' : 'EMPATE'}</h2>
                        {isVsAi && <button onClick={resetGame} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-bold transition-transform hover:scale-105">Jogar Novamente</button>}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChessBoardWrapper;