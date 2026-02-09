import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'; // Adicionado updateDoc
import { auth, db } from './lib/firebase';
import useAuthStore, { initAuthListener } from './stores/useAuthStore';

// Importação das Páginas
import Lobby from './pages/Lobby';
import GameRoom from './pages/GameRoom';
import PlayerSelect from './pages/PlayerSelect';

// --- Componente de Login (CORRIGIDO) ---
const LoginScreen = () => {
  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Referência ao documento do usuário
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      // Dados que vêm do Google (Foto e Nome)
      const googleData = {
        name: user.displayName || 'Jogador Sem Nome',
        avatar: user.photoURL || null, // <--- AQUI PEGA A FOTO
        email: user.email,
        lastLogin: serverTimestamp()
      };

      if (!userDocSnap.exists()) {
        // Cenario 1: Primeiro Acesso (Cria tudo do zero)
        await setDoc(userDocRef, {
          uid: user.uid,
          ...googleData,
          wins: 0,
          losses: 0,
          createdAt: serverTimestamp()
        });
        console.log("Usuário criado com foto!");
      } else {
        // Cenario 2: Já existe (Atualiza só a foto e o nome)
        // Isso garante que se você mudar a foto no Google, muda aqui também
        await updateDoc(userDocRef, {
          name: googleData.name,
          avatar: googleData.avatar,
          email: googleData.email,
          lastLogin: serverTimestamp()
        });
        console.log("Usuário atualizado com a foto mais recente!");
      }

    } catch (error) {
      console.error("Erro no login:", error);
      alert("Falha ao fazer login com Google.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md text-center animate-fade-in">
        <div className="w-16 h-16 bg-indigo-600 rounded-xl mx-auto mb-6 flex items-center justify-center shadow-lg transform rotate-3">
          <span className="text-3xl">♟️</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Game Arena</h1>
        <p className="text-slate-500 mb-8">
          Jogue Xadrez, Damas e Dominó com amigos ou contra nossa IA avançada.
        </p>

        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold py-3 px-4 rounded-xl transition-all hover:shadow-md active:scale-95"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-6 h-6" alt="Google" />
          Entrar com Google
        </button>
      </div>
      <p className="mt-8 text-slate-500 text-sm">Plataforma Multiplayer Assíncrona</p>
    </div>
  );
};

// --- Componente de Rota Protegida ---
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

// --- App Principal ---
function App() {
  useEffect(() => {
    const unsubscribe = initAuthListener();
    return () => unsubscribe();
  }, []);

  const { user } = useAuthStore();

  return (
    <Router>
      <Routes>
        {/* Rota de Login */}
        <Route
          path="/login"
          element={!user ? <LoginScreen /> : <Navigate to="/" />}
        />

        {/* Rotas Protegidas */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Lobby />
            </ProtectedRoute>
          }
        />

        <Route
          path="/game/:matchId"
          element={
            <ProtectedRoute>
              <GameRoom />
            </ProtectedRoute>
          }
        />

        <Route 
          path="/lobby/players" 
          element={
            <ProtectedRoute>
              <PlayerSelect />
            </ProtectedRoute>
          } 
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;