// src/lib/games/cardEngine.js

const CARD_VALUE_MAP = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
  'J': 11, 'Q': 12, 'K': 13, 'A': 14
};

export class CardBattleAI {
  constructor(aiHand, tableCard, roundsWonAI, roundsWonPlayer, difficulty) {
    this.hand = aiHand; // Ex: [{val: 'K', suit: 'H'}, {val: '2', suit: 'D'}]
    this.opponentCard = tableCard; // Se oponente já jogou, senão null
    this.score = { ai: roundsWonAI, player: roundsWonPlayer };
    this.difficulty = difficulty;
  }

  getBestCard() {
    // Ordenar mão por força
    const sortedHand = [...this.hand].sort((a, b) => 
      CARD_VALUE_MAP[a.value] - CARD_VALUE_MAP[b.value]
    );

    // Se oponente já jogou
    if (this.opponentCard) {
      const oppVal = CARD_VALUE_MAP[this.opponentCard.value];
      
      // Encontrar a menor carta que ganha da carta do oponente
      const winningCards = sortedHand.filter(c => CARD_VALUE_MAP[c.value] > oppVal);
      
      if (winningCards.length > 0) {
        // FÁCIL: Joga qualquer uma que ganhe (ou aleatória)
        if (this.difficulty === 'easy') return winningCards[winningCards.length -1]; 

        // MÉDIO/DIFÍCIL: Joga a MENOR carta possível que garanta a vitória (Economia)
        return winningCards[0]; 
      } else {
        // Se vou perder de qualquer jeito, descarto a minha pior carta (Lixo)
        return sortedHand[0]; 
      }
    } 
    
    // Se eu (IA) jogo primeiro
    else {
      // FÁCIL: Aleatório
      if (this.difficulty === 'easy') return sortedHand[Math.floor(Math.random() * sortedHand.length)];
      
      // MÉDIO: Joga carta média para "sondar"
      if (this.difficulty === 'medium') return sortedHand[Math.floor(sortedHand.length / 2)];

      // IMPOSSÍVEL/DIFÍCIL: Bluff ou Agressão
      // Se eu tenho As ou Rei, jogo logo pra garantir 1 ponto e pressionar
      // Ou jogo uma carta baixa (isca) se tenho certeza que ganho as próximas
      return sortedHand[sortedHand.length - 1]; // Agressivo: joga a maior
    }
  }
}