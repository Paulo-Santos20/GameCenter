// src/stores/useAuthStore.js
import { create } from 'zustand';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';

const useAuthStore = create((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
}));

// Listener de inicialização (coloque isso no App.jsx ou num hook de efeito)
export const initAuthListener = () => {
  const { setUser, setLoading } = useAuthStore.getState();
  return onAuthStateChanged(auth, (user) => {
    setUser(user);
    setLoading(false);
  });
};

export default useAuthStore;