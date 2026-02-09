// src/hooks/useGameAI.js
import { useEffect, useRef } from 'react';
import { Chess } from 'chess.js';

/**
 * Hook Principal de Inteligência Artificial
 * Gerencia o ciclo de vida do turno da IA e seleciona o motor de jogo correto.
 */
export function useGameAI(gameType, difficulty, gameState, onMove, currentPlayerId) {
  // useRef evita que o timer seja recriado desnecessariamente se props mudarem rápido demais
  const thinkingTimeoutRef = useRef(null);

  useEffect(() => {
    // 1. Verificação de Segurança e Turno
    // Assumimos que 'AI_BOT' é o ID fixo da IA ou passado via prop
    const isAiTurn = currentPlayerId === 'AI_BOT' || currentPlayerId === 'cpu'; 
    
    if (!isAiTurn || !gameState) return;

    // Cancela pensamento anterior se houver mudança de estado brusca
    if (thinkingTimeoutRef.current) clearTimeout(thinkingTimeoutRef.current);

    // 2. Simulação de "Pensamento" Humano
    // Dificuldades maiores pensam um pouco mais para dar feedback visual
    const baseDelay = difficulty === 'easy' ? 500 : 1500;
    const randomVar = Math.random() * 500;
    
    thinkingTimeoutRef.current = setTimeout(async () => {
      try {
        let move = null;

        // 3. Roteamento para o Motor Específico (Engine)
        switch (gameType) {
          case 'chess':
            move = calculateChessMove(gameState, difficulty);
            break;
          case 'checkers':
            move = calculateCheckersMove(gameState, difficulty);
            break;
          case 'domino':
            move = calculateDominoMove(gameState, difficulty);
            break;
          case 'cards':
            move = calculateCardMove(gameState, difficulty);
            break;
          default:
            console.warn(`Tipo de jogo ${gameType} não suportado pela IA.`);
            break;
        }

        // 4. Execução do Movimento
        if (move) {
          onMove(move);
        } else {
          // Se move for null (ex: sem jogadas no dominó), a IA deve "Passar"
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
// MOTORES DE JOGO (GAME ENGINES)
// ============================================================================

// --- 1. XADREZ (Minimax com Poda Alpha-Beta) ---

const PIECE_VALUES = { p: 10, n: 30, b: 30, r: 50, q: 90, k: 900 };

function calculateChessMove(fen, difficulty) {
  const game = new Chess(fen || 'start');
  const moves = game.moves(); // Retorna array de strings (San)

  if (game.isGameOver() || moves.length === 0) return null;

  // Nível Fácil: Totalmente Aleatório
  if (difficulty === 'easy') {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  // Definição de Profundidade baseada na dificuldade
  // JS puro trava se depth > 3 no browser main thread.
  const depth = difficulty === 'medium' ? 2 : 3; 
  
  // Para 'impossible', usamos uma heurística mais agressiva na avaliação
  const isImpossible = difficulty === 'impossible';

  let bestMove = null;
  let bestValue = -Infinity;

  // Loop raiz do Minimax
  for (const move of moves) {
    game.move(move);
    // O oponente tenta minimizar nossa pontuação, então chamamos minimize
    const boardValue = minimaxChess(game, depth - 1, -Infinity, Infinity, false, isImpossible);
    game.undo();

    if (boardValue > bestValue) {
      bestValue = boardValue;
      bestMove = move;
    }
  }

  return bestMove || moves[0];
}

// Algoritmo Minimax Recursivo
function minimaxChess(game, depth, alpha, beta, isMaximizing, isAggressive) {
  if (depth === 0 || game.isGameOver()) {
    return evaluateChessBoard(game.board(), isAggressive);
  }

  const moves = game.moves();

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      game.move(move);
      const evalVal = minimaxChess(game, depth - 1, alpha, beta, false, isAggressive);
      game.undo();
      maxEval = Math.max(maxEval, evalVal);
      alpha = Math.max(alpha, evalVal);
      if (beta <= alpha) break; // Poda Alpha
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      game.move(move);
      const evalVal = minimaxChess(game, depth - 1, alpha, beta, true, isAggressive);
      game.undo();
      minEval = Math.min(minEval, evalVal);
      beta = Math.min(beta, evalVal);
      if (beta <= alpha) break; // Poda Beta
    }
    return minEval;
  }
}

function evaluateChessBoard(board, isAggressive) {
  let totalEvaluation = 0;
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = board[i][j];
      if (piece) {
        // Se a IA joga com Pretas (b), somamos valor. Se Brancas (w), subtraímos.
        // Assumindo que a IA aqui é a MAXIMIZER e joga com as peças do turno atual.
        // (Simplificação: Avaliação estática baseada em material)
        const val = PIECE_VALUES[piece.type] || 0;
        
        // Se for modo agressivo (Impossível), valoriza Rainha e Avanço
        const aggressiveBonus = isAggressive && piece.type === 'q' ? 5 : 0;
        
        totalEvaluation += (piece.color === 'b' ? 1 : -1) * (val + aggressiveBonus);
      }
    }
  }
  // Retorna negativo se a IA for Brancas (ajuste necessário dependendo de quem é a IA)
  // Assumiremos aqui que números positivos favorecem as Pretas (Black)
  return totalEvaluation; 
}


// --- 2. DAMAS (Heurística Posicional) ---

function calculateCheckersMove(gameState, difficulty) {
  // gameState espera { board: number[][] }
  // 0: vazio, 1: Player, 2: AI
  const board = gameState.board;
  const aiPiece = 2; 

  const validMoves = getCheckersValidMoves(board, aiPiece);
  
  if (validMoves.length === 0) return null;

  // Obrigação de captura (Regra oficial)
  const captureMoves = validMoves.filter(m => Math.abs(m.from[0] - m.to[0]) > 1);
  if (captureMoves.length > 0) {
    // Se tiver captura, é obrigado a capturar.
    // Dificuldade define QUAL captura escolher se houver múltiplas
    if (difficulty === 'easy') return captureMoves[0];
    return captureMoves.sort((a,b) => b.to[0] - a.to[0])[0]; // Pega a que avança mais
  }

  if (difficulty === 'easy') {
    return validMoves[Math.floor(Math.random() * validMoves.length)];
  }

  // Lógica Avançada (Medium/Hard)
  // Escolhe movimento que:
  // 1. Evita ser comido (segurança)
  // 2. Avança para virar Dama (linha 7)
  
  const scoredMoves = validMoves.map(move => {
    let score = 0;
    // Avançar é bom
    score += move.to[0]; 
    // Virar dama é ótimo
    if (move.to[0] === 7) score += 50;
    // Bordas são seguras
    if (move.to[1] === 0 || move.to[1] === 7) score += 5;
    
    // Análise simples de perigo (se mover para cá, o inimigo me come?)
    if (difficulty === 'hard' || difficulty === 'impossible') {
       if (isSpotDangerous(board, move.to)) score -= 20;
    }

    return { move, score };
  });

  scoredMoves.sort((a, b) => b.score - a.score);
  return scoredMoves[0].move;
}

function getCheckersValidMoves(board, player) {
  let moves = [];
  // Lógica simplificada de movimento (apenas para frente se não for Dama)
  // Assumindo que IA (2) começa em cima e desce (row aumenta)
  const directions = [[1, -1], [1, 1]]; 

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] === player) {
        directions.forEach(([dr, dc]) => {
          const nr = r + dr, nc = c + dc;
          // Movimento Simples
          if (isValidPos(nr, nc) && board[nr][nc] === 0) {
            moves.push({ from: [r, c], to: [nr, nc] });
          }
          // Captura (Pula 2 casas)
          const jr = r + (dr*2), jc = c + (dc*2);
          if (isValidPos(jr, jc) && board[jr][jc] === 0) {
            const midR = r + dr, midC = c + dc;
            const enemy = player === 1 ? 2 : 1;
            if (board[midR][midC] === enemy) {
              moves.push({ from: [r, c], to: [jr, jc], capture: [midR, midC] });
            }
          }
        });
      }
    }
  }
  return moves;
}

function isValidPos(r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }
function isSpotDangerous(board, [r, c]) {
    // Implementação básica: verifica se há inimigo na diagonal pronto para pular
    // Para MVP, retornamos false ou aleatório ponderado
    return false; 
}


// --- 3. DOMINÓ (Bloqueio e Estatística) ---

function calculateDominoMove(gameState, difficulty) {
  // gameState: { table: [[1,6], [6,0]], aiHand: [[0,0], [2,3]], history: [] }
  const { table, aiHand } = gameState;

  // 1. Identificar movimentos possíveis
  if (table.length === 0) {
    // Primeira jogada: Maior carrossa (dublê) ou maior soma
    const doubles = aiHand.filter(t => t[0] === t[1]);
    if (doubles.length > 0) {
        return doubles.sort((a,b) => b[0] - a[0])[0];
    }
    return aiHand[0];
  }

  const leftEnd = table[0][0];
  const rightEnd = table[table.length - 1][1];

  const validMoves = [];
  aiHand.forEach(tile => {
    if (tile.includes(leftEnd)) validMoves.push({ tile, side: 'left' });
    else if (tile.includes(rightEnd)) validMoves.push({ tile, side: 'right' });
  });

  if (validMoves.length === 0) return null; // Passa a vez

  // --- Estratégias por Dificuldade ---

  // Fácil: Qualquer um
  if (difficulty === 'easy') return validMoves[0].tile;

  // Médio: Joga a peça com maior soma de pontos (se livra de peso)
  if (difficulty === 'medium') {
    validMoves.sort((a, b) => (b.tile[0] + b.tile[1]) - (a.tile[0] + a.tile[1]));
    return validMoves[0].tile;
  }

  // Difícil/Impossível: Tenta travar o jogo ou jogar onde tem mais opções
  // Conta quantas peças de cada número a IA tem na mão
  const counts = {};
  aiHand.flat().forEach(n => counts[n] = (counts[n] || 0) + 1);

  validMoves.sort((a, b) => {
    // O número que ficará exposto na ponta após a jogada
    const exposedA = a.tile[0] === (a.side === 'left' ? leftEnd : rightEnd) ? a.tile[1] : a.tile[0];
    const exposedB = b.tile[0] === (b.side === 'left' ? leftEnd : rightEnd) ? b.tile[1] : b.tile[0];

    // Prefira deixar exposto um número que eu tenho mais na mão (para garantir meu próximo turno)
    const countA = counts[exposedA] || 0;
    const countB = counts[exposedB] || 0;

    return countB - countA;
  });

  return validMoves[0].tile;
}


// --- 4. CARTAS (Gestão de Recursos) ---

function calculateCardMove(gameState, difficulty) {
  // gameState: { aiHand: [{val, suit}], tableCard: {val, suit} | null }
  const { aiHand, tableCard } = gameState;

  // Função auxiliar para converter valor da carta em força numérica
  const getVal = (card) => {
    const map = {'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':11,'Q':12,'K':13,'A':14};
    return map[card.value] || 0;
  };

  // Ordena mão da mais fraca para a mais forte
  const sortedHand = [...aiHand].sort((a, b) => getVal(a) - getVal(b));

  // CENÁRIO 1: Oponente já jogou
  if (tableCard) {
    const oppVal = getVal(tableCard);
    const winningCards = sortedHand.filter(c => getVal(c) > oppVal);

    // Se não tenho como ganhar
    if (winningCards.length === 0) {
      // Joga a carta mais fraca (lixo) para guardar as fortes
      return sortedHand[0];
    }

    // Se tenho como ganhar
    if (difficulty === 'easy') {
      // Joga a mais forte (desperdício de recurso)
      return winningCards[winningCards.length - 1];
    } else {
      // Médio/Difícil: Joga a menor carta necessária para vencer (Economia)
      return winningCards[0];
    }
  } 
  
  // CENÁRIO 2: IA joga primeiro
  else {
    if (difficulty === 'easy') {
      return sortedHand[Math.floor(Math.random() * sortedHand.length)];
    }
    if (difficulty === 'hard' || difficulty === 'impossible') {
      // Joga a maior para tentar garantir a rodada (Agressivo)
      return sortedHand[sortedHand.length - 1];
    }
    // Médio: Joga carta média
    return sortedHand[Math.floor(sortedHand.length / 2)];
  }
}