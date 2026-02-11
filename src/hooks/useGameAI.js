import { useEffect, useRef } from 'react';
import { Chess } from 'chess.js';

/**
 * Hook Principal de Inteligência Artificial
 * Gerencia o ciclo de vida do turno da IA e seleciona o motor de jogo correto.
 */
export function useGameAI(gameType, difficulty, gameState, onMove, currentPlayerId) {
  const thinkingTimeoutRef = useRef(null);

  useEffect(() => {
    // 1. Verificação de Segurança e Turno
    // Aceita 'AI_BOT', 'cpu' ou 'b' (convenção interna chess.js)
    const isAiTurn = ['AI_BOT', 'cpu', 'b'].includes(currentPlayerId);
    
    if (!isAiTurn || !gameState) return;

    if (thinkingTimeoutRef.current) clearTimeout(thinkingTimeoutRef.current);

    // 2. Simulação de "Pensamento" Humano
    const baseDelay = difficulty === 'easy' ? 500 : 1000;
    const randomVar = Math.random() * 500;

    thinkingTimeoutRef.current = setTimeout(() => {
      try {
        let result = null;

        switch (gameType) {
          case 'chess':
            result = calculateChessMove(gameState, difficulty);
            break;
          case 'checkers':
            result = calculateCheckersMove(gameState, difficulty);
            break;
          case 'domino':
            result = { newState: calculateDominoMove(gameState, difficulty) };
            break;
          case 'cards':
            result = { newState: calculateCardMove(gameState, difficulty) };
            break;
          default:
            console.warn(`Tipo de jogo ${gameType} não suportado pela IA.`);
            break;
        }

        // 3. Execução do Movimento
        if (result && result.newState) {
          // Retorna o NOVO ESTADO e os DETALHES DO MOVIMENTO (para pintar de amarelo)
          onMove(result.newState, result.moveDetails);
        } else {
          // Se move for null (ex: sem jogadas no dominó), a IA passa a vez
          if (gameType === 'domino') onMove(null); 
        }

      } catch (error) {
        console.error("Erro na IA:", error);
      }
    }, baseDelay + randomVar);

    return () => {
      if (thinkingTimeoutRef.current) clearTimeout(thinkingTimeoutRef.current);
    };
  }, [gameState, currentPlayerId, gameType, difficulty, onMove]);
}

// ============================================================================
// 1. ENGINE DE XADREZ (Minimax com Poda Alpha-Beta)
// ============================================================================

const CHESS_PIECE_VALUES = { p: 10, n: 30, b: 30, r: 50, q: 90, k: 900 };

function calculateChessMove(fen, difficulty) {
  const game = new Chess(fen || 'start');
  
  if (game.isGameOver()) return null;

  const moves = game.moves({ verbose: true }); // Retorna array de objetos { from, to, ... }

  if (moves.length === 0) return null;

  // Nível Fácil: Totalmente Aleatório
  if (difficulty === 'easy') {
    const randomMove = moves[Math.floor(Math.random() * moves.length)];
    game.move(randomMove);
    return { 
        newState: game.fen(), 
        moveDetails: { from: randomMove.from, to: randomMove.to } 
    };
  }

  // Definição de Profundidade
  const depth = difficulty === 'medium' ? 2 : 3; 
  let bestMove = null;
  let bestValue = -Infinity;

  // Embaralha para variar jogadas
  moves.sort(() => Math.random() - 0.5);

  // Loop raiz do Minimax
  for (const move of moves) {
    game.move(move);
    const boardValue = minimaxChess(game, depth - 1, -Infinity, Infinity, false);
    game.undo();

    if (boardValue > bestValue) {
      bestValue = boardValue;
      bestMove = move;
    }
  }

  if (bestMove) {
      game.move(bestMove);
      return { 
          newState: game.fen(), 
          moveDetails: { from: bestMove.from, to: bestMove.to } 
      };
  }
  return null;
}

function minimaxChess(game, depth, alpha, beta, isMaximizing) {
  if (depth === 0 || game.isGameOver()) {
    return evaluateChessBoard(game.board());
  }

  const moves = game.moves();

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      game.move(move);
      const evalVal = minimaxChess(game, depth - 1, alpha, beta, false);
      game.undo();
      maxEval = Math.max(maxEval, evalVal);
      alpha = Math.max(alpha, evalVal);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      game.move(move);
      const evalVal = minimaxChess(game, depth - 1, alpha, beta, true);
      game.undo();
      minEval = Math.min(minEval, evalVal);
      beta = Math.min(beta, evalVal);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

function evaluateChessBoard(board) {
  let totalEvaluation = 0;
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = board[i][j];
      if (piece) {
        // IA é Preta ('b'). Soma pontos se for 'b', subtrai se for 'w'.
        const val = CHESS_PIECE_VALUES[piece.type] || 0;
        totalEvaluation += (piece.color === 'b' ? 1 : -1) * val;
      }
    }
  }
  return totalEvaluation;
}


// ============================================================================
// 2. ENGINE DE DAMAS (Minimax + Captura Obrigatória + Comer pra trás)
// ============================================================================

function calculateCheckersMove(gameStateStr, difficulty) {
  const board = typeof gameStateStr === 'string' ? JSON.parse(gameStateStr) : gameStateStr;
  
  // IA joga com 'b' (Pretas)
  const moves = getCheckersValidMoves(board, 'b');

  if (moves.length === 0) return null;

  // REGRA: Captura Obrigatória (Lei do Sopro)
  const captureMoves = moves.filter(m => m.isCapture);
  const legalMoves = captureMoves.length > 0 ? captureMoves : moves;

  if (difficulty === 'easy') {
    const randomMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
    return {
        newState: JSON.stringify(executeCheckersMove(board, randomMove)),
        moveDetails: { from: randomMove.from, to: randomMove.to }
    };
  }

  // Minimax
  const depth = difficulty === 'impossible' ? 4 : difficulty === 'hard' ? 3 : 2;
  let bestMove = null;
  let bestValue = -Infinity;

  legalMoves.sort(() => Math.random() - 0.5);

  for (const move of legalMoves) {
    const nextBoard = executeCheckersMove(board, move);
    const value = minimaxCheckers(nextBoard, depth - 1, -Infinity, Infinity, false);

    if (value > bestValue) {
      bestValue = value;
      bestMove = move;
    }
  }

  const selectedMove = bestMove || legalMoves[0];
  return {
      newState: JSON.stringify(executeCheckersMove(board, selectedMove)),
      moveDetails: { from: selectedMove.from, to: selectedMove.to }
  };
}

function minimaxCheckers(board, depth, alpha, beta, isMaximizing) {
  if (depth === 0) return evaluateCheckers(board);

  const turn = isMaximizing ? 'b' : 'w';
  const moves = getCheckersValidMoves(board, turn);

  if (moves.length === 0) return isMaximizing ? -10000 : 10000;

  const captureMoves = moves.filter(m => m.isCapture);
  const legalMoves = captureMoves.length > 0 ? captureMoves : moves;

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of legalMoves) {
      const nextBoard = executeCheckersMove(board, move);
      const evalVal = minimaxCheckers(nextBoard, depth - 1, alpha, beta, false);
      maxEval = Math.max(maxEval, evalVal);
      alpha = Math.max(alpha, evalVal);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of legalMoves) {
      const nextBoard = executeCheckersMove(board, move);
      const evalVal = minimaxCheckers(nextBoard, depth - 1, alpha, beta, true);
      minEval = Math.min(minEval, evalVal);
      beta = Math.min(beta, evalVal);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

function evaluateCheckers(board) {
  let score = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p) continue;
      const val = p.isKing ? 50 : 10;
      // Posicional: Pretas querem descer (7), Brancas subir (0)
      const positional = p.color === 'b' ? r : (7 - r);
      score += (p.color === 'b' ? 1 : -1) * (val + positional);
    }
  }
  return score;
}

function getCheckersValidMoves(board, color) {
  const moves = [];
  
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p || p.color !== color) continue;

      // Movimento Simples: Apenas para frente (se não for dama)
      const moveDirs = p.isKing 
        ? [[1, -1], [1, 1], [-1, -1], [-1, 1]] 
        : (color === 'b' ? [[1, -1], [1, 1]] : [[-1, -1], [-1, 1]]);

      // Captura: TODAS as direções (Regra Brasileira permite comer pra trás)
      const captureDirs = [[1, -1], [1, 1], [-1, -1], [-1, 1]];

      // 1. Movimentos Simples
      moveDirs.forEach(([dr, dc]) => {
        const nr = r + dr, nc = c + dc;
        if (isValidPos(nr, nc) && board[nr][nc] === null) {
          moves.push({ from: { r, c }, to: { r: nr, c: nc }, isCapture: false });
        }
      });

      // 2. Capturas
      captureDirs.forEach(([dr, dc]) => {
        const nr = r + dr, nc = c + dc;       // Peça comida
        const jr = r + (dr * 2), jc = c + (dc * 2); // Pouso

        if (isValidPos(jr, jc) && board[jr][jc] === null) {
          const midPiece = board[nr][nc];
          if (midPiece && midPiece.color !== color) {
             moves.push({ 
               from: { r, c }, 
               to: { r: jr, c: jc }, 
               isCapture: true, 
               captured: { r: nr, c: nc } 
             });
          }
        }
      });
    }
  }
  return moves;
}

function executeCheckersMove(originalBoard, move) {
  const newBoard = originalBoard.map(row => row.map(cell => cell ? { ...cell } : null));
  const piece = newBoard[move.from.r][move.from.c];
  
  newBoard[move.to.r][move.to.c] = piece;
  newBoard[move.from.r][move.from.c] = null;

  if (move.isCapture) {
    newBoard[move.captured.r][move.captured.c] = null;
  }

  // Promoção Dama
  if (!piece.isKing) {
    if ((piece.color === 'w' && move.to.r === 0) || (piece.color === 'b' && move.to.r === 7)) {
      piece.isKing = true;
    }
  }
  return newBoard;
}

function isValidPos(r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }


// ============================================================================
// 3. ENGINE DE DOMINÓ
// ============================================================================

function calculateDominoMove(gameState, difficulty) {
  const state = typeof gameState === 'string' ? JSON.parse(gameState) : gameState;
  const { table, aiHand } = state;

  if (table.length === 0) {
    const doubles = aiHand.filter(t => t[0] === t[1]).sort((a,b) => b[0] - a[0]);
    return doubles.length > 0 ? doubles[0] : aiHand[0];
  }

  const left = table[0][0];
  const right = table[table.length - 1][1];
  const valid = [];

  aiHand.forEach(tile => {
    if (tile[0] === left || tile[1] === left) valid.push(tile);
    else if (tile[0] === right || tile[1] === right) valid.push(tile);
  });

  if (valid.length === 0) return null;

  if (difficulty === 'easy') return valid[Math.floor(Math.random() * valid.length)];
  
  valid.sort((a, b) => (b[0] + b[1]) - (a[0] + a[1]));
  return valid[0];
}


// ============================================================================
// 4. ENGINE DE CARTAS
// ============================================================================

function calculateCardMove(gameState, difficulty) {
  const state = typeof gameState === 'string' ? JSON.parse(gameState) : gameState;
  if (!state || !state.aiHand) return null;

  const { aiHand, tableCard } = state;
  const getVal = (v) => ({'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':11,'Q':12,'K':13,'A':14}[v] || 0);
  const sorted = [...aiHand].sort((a, b) => getVal(a.value) - getVal(b.value));

  if (tableCard) {
    const oppVal = getVal(tableCard.value);
    const wins = sorted.filter(c => getVal(c.value) > oppVal);
    
    if (wins.length === 0) return sorted[0]; 
    return difficulty === 'easy' ? wins[wins.length - 1] : wins[0];
  } else {
    return difficulty === 'easy' ? sorted[Math.floor(Math.random() * sorted.length)] : sorted[sorted.length - 1];
  }
}