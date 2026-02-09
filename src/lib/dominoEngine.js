// src/lib/games/dominoEngine.js

export class DominoAI {
  constructor(gameState, difficulty) {
    // gameState: { table: [[1,6], [6,6]], aiHand: [[1,1], ...], history: [] }
    this.table = gameState.table;
    this.hand = gameState.aiHand;
    this.history = gameState.history; // Histórico de quem passou a vez
    this.difficulty = difficulty;
  }

  getBestMove() {
    const validMoves = this.getValidMoves();
    if (validMoves.length === 0) return null; // Passar a vez

    // FÁCIL: Primeira peça que encaixar
    if (this.difficulty === 'easy') return validMoves[0];

    // MÉDIA: Jogar a peça mais pesada (soma maior) para ficar com menos pontos
    if (this.difficulty === 'medium') {
      return validMoves.sort((a, b) => (b.tile[0] + b.tile[1]) - (a.tile[0] + a.tile[1]))[0];
    }

    // DIFÍCIL: Manter variedade na mão
    // Tenta não jogar uma peça que te deixe sem um naipe específico
    if (this.difficulty === 'hard') {
      return this.getBalancedMove(validMoves);
    }

    // IMPOSSÍVEL: Contagem de Cartas e Inferência
    if (this.difficulty === 'impossible') {
      return this.getProbabilityMove(validMoves);
    }

    return validMoves[0];
  }

  getValidMoves() {
    if (this.table.length === 0) return this.hand.map(t => ({ tile: t, side: 'start' }));
    
    const leftVal = this.table[0][0];
    const rightVal = this.table[this.table.length - 1][1];
    
    let moves = [];
    this.hand.forEach(tile => {
      if (tile[0] === leftVal) moves.push({ tile, side: 'left', rotate: true });
      else if (tile[1] === leftVal) moves.push({ tile, side: 'left', rotate: false });
      
      if (tile[0] === rightVal) moves.push({ tile, side: 'right', rotate: false });
      else if (tile[1] === rightVal) moves.push({ tile, side: 'right', rotate: true });
    });
    return moves;
  }

  getProbabilityMove(moves) {
    // 1. Analisar o que o oponente NÃO tem baseando-se em passes anteriores
    const opponentMissingSuits = this.analyzeHistory(); 
    
    // 2. Escolher a jogada que força o oponente a usar um naipe que ele não tem (bloqueio)
    // Se sabemos que ele não tem 5, tentamos deixar pontas com 5.
    
    for (let move of moves) {
      const exposedEnd = move.side === 'left' ? move.tile[1] : move.tile[0]; // Simplificação
      if (opponentMissingSuits.includes(exposedEnd)) {
        return move; // BLOQUEIO PERFEITO
      }
    }
    
    // Fallback para estratégia média
    return moves.sort((a, b) => (b.tile[0] + b.tile[1]) - (a.tile[0] + a.tile[1]))[0];
  }

  analyzeHistory() {
    // Retorna array de números que o oponente provavalmente não tem
    // Ex: se oponente passou quando pontas eram 2 e 5, retorna [2, 5]
    let missing = [];
    this.history.forEach(event => {
      if (event.action === 'pass' && event.player === 'opponent') {
        missing.push(...event.boardEnds);
      }
    });
    return [...new Set(missing)];
  }
}