import React, { useState, useEffect } from 'react';
import { Smile, Frown, Bomb, Flag } from 'lucide-react';

const CONFIG = { rows: 10, cols: 10, mines: 15 };

const MinesweeperBoard = () => {
    const [grid, setGrid] = useState([]);
    const [gameOver, setGameOver] = useState(false);
    const [win, setWin] = useState(false);
    const [mineCount, setMineCount] = useState(CONFIG.mines);
    const [isFirstClick, setIsFirstClick] = useState(true);

    useEffect(() => { resetGame(); }, []);

    const resetGame = () => {
        setGrid(Array.from({ length: CONFIG.rows }, () => Array.from({ length: CONFIG.cols }, () => ({ isMine: false, isOpen: false, isFlagged: false, count: 0 }))));
        setGameOver(false);
        setWin(false);
        setMineCount(CONFIG.mines);
        setIsFirstClick(true);
    };

    const placeMines = (initialGrid, safeR, safeC) => {
        let placed = 0;
        const newGrid = [...initialGrid];
        while (placed < CONFIG.mines) {
            const r = Math.floor(Math.random() * CONFIG.rows);
            const c = Math.floor(Math.random() * CONFIG.cols);
            if (!newGrid[r][c].isMine && (r !== safeR || c !== safeC)) {
                newGrid[r][c].isMine = true;
                placed++;
            }
        }
        for(let r=0; r<CONFIG.rows; r++) for(let c=0; c<CONFIG.cols; c++) if(!newGrid[r][c].isMine) {
            let count = 0;
            for(let i=-1; i<=1; i++) for(let j=-1; j<=1; j++) if(newGrid[r+i]?.[c+j]?.isMine) count++;
            newGrid[r][c].count = count;
        }
        return newGrid;
    };

    const reveal = (startGrid, startR, startC) => {
        const stack = [[startR, startC]];
        const newGrid = [...startGrid];
        while(stack.length > 0) {
            const [r, c] = stack.pop();
            if (r < 0 || r >= CONFIG.rows || c < 0 || c >= CONFIG.cols) continue;
            const cell = newGrid[r][c];
            if (cell.isOpen || cell.isFlagged) continue;
            cell.isOpen = true;
            if (cell.count === 0 && !cell.isMine) {
                for(let i=-1; i<=1; i++) for(let j=-1; j<=1; j++) if (!(i===0 && j===0) && !newGrid[r+i]?.[c+j]?.isOpen) stack.push([r+i, c+j]);
            }
        }
        return newGrid;
    };

    const handleClick = (r, c) => {
        if (gameOver || win || grid[r][c].isFlagged) return;
        let currentGrid = [...grid];
        if (isFirstClick) { currentGrid = placeMines(currentGrid, r, c); setIsFirstClick(false); }
        if (currentGrid[r][c].isMine) {
            currentGrid[r][c].isOpen = true;
            currentGrid.forEach(row => row.forEach(cell => { if(cell.isMine) cell.isOpen = true; }));
            setGrid(currentGrid); setGameOver(true);
        } else {
            const revealedGrid = reveal(currentGrid, r, c);
            setGrid(revealedGrid);
            if (revealedGrid.flat().filter(cell => !cell.isMine && !cell.isOpen).length === 0) setWin(true);
        }
    };

    const handleFlag = (e, r, c) => {
        e.preventDefault();
        if (gameOver || win || grid[r][c].isOpen) return;
        const newGrid = [...grid];
        newGrid[r][c].isFlagged = !newGrid[r][c].isFlagged;
        setMineCount(p => newGrid[r][c].isFlagged ? p - 1 : p + 1);
        setGrid(newGrid);
    };

    return (
        <div className="bg-slate-200 p-4 rounded-lg shadow-xl inline-block border-4 border-white border-b-slate-400 border-r-slate-400 select-none">
            <div className="bg-slate-300 border-4 border-slate-400 border-b-white border-r-white p-2 mb-4 flex justify-between items-center">
                <div className="bg-black text-red-500 font-mono text-2xl px-2 w-16 text-right">{mineCount.toString().padStart(3, '0')}</div>
                <button onClick={resetGame} className="active:scale-95 transition-transform">{gameOver ? <Frown size={32} className="text-yellow-600 fill-yellow-400"/> : win ? <div className="text-2xl">😎</div> : <Smile size={32} className="text-yellow-600 fill-yellow-400"/>}</button>
                <div className="bg-black text-red-500 font-mono text-2xl px-2 w-16 text-right">{win ? 'WIN' : '000'}</div>
            </div>
            <div className="grid grid-cols-10 gap-0 border-4 border-slate-400 border-b-white border-r-white">
                {grid.map((row, r) => row.map((cell, c) => (
                    <div key={`${r}-${c}`} onClick={() => handleClick(r, c)} onContextMenu={(e) => handleFlag(e, r, c)} className={`w-8 h-8 flex items-center justify-center font-bold text-sm cursor-default ${cell.isOpen ? 'bg-slate-300 border border-slate-400/20' : 'bg-slate-200 border-4 border-white border-b-slate-400 border-r-slate-400 hover:bg-slate-100 active:border-none'} ${cell.isMine && cell.isOpen ? 'bg-red-500' : ''}`}>
                        {cell.isOpen && cell.isMine && <Bomb size={18} />}
                        {cell.isOpen && !cell.isMine && cell.count > 0 && <span style={{ color: ['blue','green','red','darkblue','brown'][cell.count-1] }}>{cell.count}</span>}
                        {!cell.isOpen && cell.isFlagged && <Flag size={16} className="text-red-600 fill-red-600" />}
                    </div>
                )))}
            </div>
        </div>
    );
};

export default MinesweeperBoard;