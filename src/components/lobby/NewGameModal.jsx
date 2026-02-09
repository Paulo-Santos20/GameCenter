// src/components/lobby/NewGameModal.jsx
import React, { useState } from 'react';
import { X, Cpu, Users, Smartphone, Layers } from 'lucide-react';

const GAMES = [
  { id: 'chess', name: 'Xadrez', icon: '♟️' },
  { id: 'checkers', name: 'Damas', icon: '⚪' },
  { id: 'domino', name: 'Dominó', icon: '🁘' },
  { id: 'cards', name: 'Baralho (War)', icon: '🃏' }
];

const DIFFICULTIES = [
  { id: 'easy', name: 'Fácil', color: 'bg-green-100 text-green-700 border-green-200' },
  { id: 'medium', name: 'Média', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { id: 'hard', name: 'Difícil', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { id: 'impossible', name: 'Impossível', color: 'bg-red-100 text-red-700 border-red-200' }
];

export default function NewGameModal({ onClose, onCreatePvP, onStartAi }) {
  const [selectedGame, setSelectedGame] = useState('chess');
  const [mode, setMode] = useState('pvp'); // 'pvp' or 'ai'
  const [difficulty, setDifficulty] = useState('medium');

  const handleStart = () => {
    // Fecha o modal primeiro
    onClose();

    if (mode === 'pvp') {
      // Redireciona para a lista de jogadores (PlayerSelect) passando o jogo escolhido
      onCreatePvP(selectedGame);
    } else {
      // Inicia o jogo local contra a IA
      onStartAi(selectedGame, difficulty);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
        
        {/* Header */}
        <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <Layers size={20} className="text-blue-400"/>
            <h2 className="font-bold text-lg">Nova Partida</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* 1. Seleção do Jogo */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Escolha o Jogo</label>
            <div className="grid grid-cols-2 gap-3">
              {GAMES.map(g => (
                <button
                  key={g.id}
                  onClick={() => setSelectedGame(g.id)}
                  className={`p-3 rounded-xl border flex items-center gap-3 transition-all duration-200 ${
                    selectedGame === g.id 
                      ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600 shadow-sm' 
                      : 'border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <span className="text-2xl filter drop-shadow-sm">{g.icon}</span>
                  <span className={`font-semibold ${selectedGame === g.id ? 'text-blue-700' : 'text-slate-700'}`}>
                    {g.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Modo de Jogo (Correção Aplicada Aqui) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Modo de Jogo</label>
            <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200">
              
              {/* Botão PVP */}
              <button 
                onClick={() => setMode('pvp')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                  mode === 'pvp' 
                    ? 'bg-white shadow-sm text-blue-600 ring-1 ring-black/5' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Users size={18} />
                <span>Vs Player</span>
              </button>

              {/* Botão IA */}
              <button
                onClick={() => setMode('ai')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                  mode === 'ai' 
                    ? 'bg-white shadow-sm text-purple-600 ring-1 ring-black/5' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Cpu size={18} />
                <span>Vs IA</span>
              </button>
            </div>
          </div>

          {/* 3. Dificuldade (Condicional) */}
          {mode === 'ai' && (
            <div className="animate-in slide-in-from-top-2 duration-300">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Nível da IA</label>
              <div className="grid grid-cols-2 gap-2">
                {DIFFICULTIES.map(d => (
                  <button
                    key={d.id}
                    onClick={() => setDifficulty(d.id)}
                    className={`py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${
                      difficulty === d.id 
                        ? `${d.color} shadow-sm scale-[1.02]` 
                        : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    {d.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Botão de Ação Principal */}
          <button
            onClick={handleStart}
            className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0 ${
                mode === 'pvp' 
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:shadow-blue-500/25' 
                : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:shadow-purple-500/25'
            }`}
          >
            {mode === 'pvp' ? 'Buscar Oponentes' : 'Iniciar Partida'}
          </button>
        </div>
      </div>
    </div>
  );
}