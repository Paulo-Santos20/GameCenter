import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const useMatch = (matchId, currentUserId) => {
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!matchId) return;

    const unsubscribe = onSnapshot(doc(db, 'matches', matchId), (doc) => {
      if (doc.exists()) {
        setMatchData({ id: doc.id, ...doc.data() });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [matchId]);

  const makeMove = async (newGameState, nextTurnId) => {
    if (!matchId) return;

    try {
      // Validação de segurança para não enviar undefined
      const updatePayload = {
        gameState: newGameState,
        lastMoveAt: serverTimestamp()
      };

      // Só atualiza o turno se um ID válido for passado
      if (nextTurnId) {
        updatePayload.currentTurn = nextTurnId;
      }

      await updateDoc(doc(db, 'matches', matchId), updatePayload);
    } catch (error) {
      console.error("Erro ao fazer movimento:", error);
    }
  };

  return { matchData, loading, makeMove };
};