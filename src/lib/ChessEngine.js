// src/lib/games/chessEngine.js
import { Chess } from 'chess.js';

// Pesos posicionais simplificados (Peça no centro vale mais)
const PAWN_TABLE = [
  0,  0,  0,  0,  0,  0,  0,  0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
  5,  5, 10, 25, 25, 10,  5,  5,
  0,  0,  0, 20, 20,  0,  0,  0,
  5, -5,-10,  0,  0,-10, -5,  5,
  5, 10, 10,-20,-20, 10, 10,  5,
  0,  0,  0,  0,  0,  0,  0,  0
];

const PIECE_VALUES = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

export class ChessAI {
  constructor(fen, difficulty) {
    this.game = new Chess(fen);
    this.difficulty = difficulty;
    this.nodeCount = 0;
  }

  getBestMove() {
    const moves = this.game.moves();
    if (moves.length === 0) return null;

    // Nível FÁCIL: Aleatório Puro
    if (this.difficulty === 'easy') {
      return moves[Math.floor(Math.random() * moves.length)];
    }

    // Configuração de profundidade baseada na dificuldade
    let depth = 2; // Medium
    if (this.difficulty === 'hard') depth = 3;
    if (this.difficulty === 'impossible') depth = 4; // Em JS puro, 4 é pesado sem WebAssembly

    return this.minimaxRoot(depth, true);
  }

  evaluateBoard(moveColor) {
    let totalEvaluation = 0;
    const board = this.game.board();

    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const piece = board[i][j];
        if (piece) {
          // Valor base da peça
          const value = PIECE_VALUES[piece.type];
          
          // Ajuste posicional (apenas para peões no exemplo, mas aplicável a todos)
          const positionScore = piece.type === 'p' ? PAWN_TABLE[i * 8 + j] : 0;

          // Soma se for branca, subtrai se for preta (perspectiva absoluta)
          // Se a IA joga com Pretas, invertemos a lógica depois
          totalEvaluation += (piece.color === 'w' ? 1 : -1) * (value + positionScore);
        }
      }
    }
    // Retorna positivo se favorece o lado atual
    return moveColor === 'w' ? totalEvaluation : -totalEvaluation;
  }

  minimaxRoot(depth, isMaximizingPlayer) {
    const moves = this.game.moves();
    let bestMove = -9999;
    let bestMoveFound;

    for (let i = 0; i < moves.length; i++) {
      this.game.move(moves[i]);
      const value = this.minimax(depth - 1, -10000, 10000, !isMaximizingPlayer);
      this.game.undo();
      if (value >= bestMove) {
        bestMove = value;
        bestMoveFound = moves[i];
      }
    }
    return bestMoveFound;
  }

  minimax(depth, alpha, beta, isMaximizingPlayer) {
    if (depth === 0) {
      return -this.evaluateBoard(this.game.turn());
    }

    const moves = this.game.moves();
    
    if (isMaximizingPlayer) {
      let bestMove = -9999;
      for (let i = 0; i < moves.length; i++) {
        this.game.move(moves[i]);
        bestMove = Math.max(bestMove, this.minimax(depth - 1, alpha, beta, !isMaximizingPlayer));
        this.game.undo();
        alpha = Math.max(alpha, bestMove);
        if (beta <= alpha) return bestMove;
      }
      return bestMove;
    } else {
      let bestMove = 9999;
      for (let i = 0; i < moves.length; i++) {
        this.game.move(moves[i]);
        bestMove = Math.min(bestMove, this.minimax(depth - 1, alpha, beta, !isMaximizingPlayer));
        this.game.undo();
        beta = Math.min(beta, bestMove);
        if (beta <= alpha) return bestMove;
      }
      return bestMove;
    }
  }
}