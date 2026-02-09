// src/hooks/useGameEngine.js
import { ChessAI } from '../lib/games/chessEngine';
import { CheckersAI } from '../lib/games/checkersEngine';
import { DominoAI } from '../lib/games/dominoEngine';
import { CardBattleAI } from '../lib/games/cardEngine';

export function getAiMove(gameType, difficulty, gameState) {
  let engine;

  switch (gameType) {
    case 'chess':
      // gameState aqui é a string FEN
      engine = new ChessAI(gameState, difficulty);
      return engine.getBestMove(); // Retorna string (ex: "e2e4") ou objeto moves

    case 'checkers':
      engine = new CheckersAI(gameState.board, difficulty);
      return engine.getBestMove(); // Retorna {from, to}

    case 'domino':
      engine = new DominoAI(gameState, difficulty);
      return engine.getBestMove(); // Retorna {tile, side}

    case 'cards':
      engine = new CardBattleAI(
        gameState.aiHand, 
        gameState.tableCard, 
        gameState.score.ai, 
        gameState.score.player, 
        difficulty
      );
      return engine.getBestCard(); // Retorna objeto card
      
    default:
      return null;
  }
}