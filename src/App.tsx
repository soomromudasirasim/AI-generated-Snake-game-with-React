import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, RotateCcw } from 'lucide-react';

// --- Constants & Types ---
const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 0, y: -1 }; // Up
const GAME_SPEED = 80;

type Point = { x: number; y: number };

const TRACKS = [
  {
    id: 1,
    title: "Neon Circuit",
    artist: "AI Synthwave",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
  },
  {
    id: 2,
    title: "Digital Horizon",
    artist: "Cyber AI",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
  },
  {
    id: 3,
    title: "Quantum Groove",
    artist: "Neural Net",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"
  }
];

export default function App() {
  // --- Game State ---
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [direction, setDirection] = useState<Point>(INITIAL_DIRECTION);
  const [food, setFood] = useState<Point>({ x: 15, y: 5 });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  // --- Music State ---
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const directionRef = useRef(direction);

  // --- Music Player Logic ---
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.log("Audio play failed:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrackIndex]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  
  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    setIsPlaying(true);
  };
  
  const prevTrack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    setIsPlaying(true);
  };

  const handleTrackEnd = () => {
    nextTrack();
  };

  // --- Game Logic ---
  const generateFood = useCallback((currentSnake: Point[]) => {
    let newFood: Point;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
      // Ensure food doesn't spawn on snake
      const onSnake = currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
      if (!onSnake) break;
    }
    return newFood;
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    directionRef.current = INITIAL_DIRECTION;
    setScore(0);
    setGameOver(false);
    setFood(generateFood(INITIAL_SNAKE));
    setGameStarted(true);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default scrolling for arrow keys
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        e.preventDefault();
      }

      if (!gameStarted && e.key === " ") {
        resetGame();
        return;
      }

      if (gameOver && e.key === " ") {
        resetGame();
        return;
      }

      const currentDir = directionRef.current;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (currentDir.y !== 1) directionRef.current = { x: 0, y: -1 };
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (currentDir.y !== -1) directionRef.current = { x: 0, y: 1 };
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (currentDir.x !== 1) directionRef.current = { x: -1, y: 0 };
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (currentDir.x !== -1) directionRef.current = { x: 1, y: 0 };
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameOver, gameStarted]);

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const moveSnake = () => {
      setSnake(prevSnake => {
        const head = prevSnake[0];
        const newHead = {
          x: head.x + directionRef.current.x,
          y: head.y + directionRef.current.y
        };

        // Check wall collision
        if (
          newHead.x < 0 || 
          newHead.x >= GRID_SIZE || 
          newHead.y < 0 || 
          newHead.y >= GRID_SIZE
        ) {
          setGameOver(true);
          return prevSnake;
        }

        // Check self collision
        if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
          setGameOver(true);
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        // Check food collision
        if (newHead.x === food.x && newHead.y === food.y) {
          setScore(s => s + 10);
          setFood(generateFood(newSnake));
        } else {
          newSnake.pop(); // Remove tail if no food eaten
        }

        return newSnake;
      });
    };

    const gameLoop = setInterval(moveSnake, GAME_SPEED);
    return () => clearInterval(gameLoop);
  }, [food, gameOver, gameStarted, generateFood]);

  const currentTrack = TRACKS[currentTrackIndex];

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-950 text-gray-100 font-sans relative p-4 lg:p-6 flex flex-col">
      {/* App Shell */}
      <div className="relative z-10 w-full h-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[320px_1fr] grid-rows-[auto_1fr] lg:grid-rows-[80px_1fr] gap-6">
        
        {/* Header */}
        <header id="app-header" className="col-span-1 lg:col-span-2 flex items-center justify-between px-6 bg-gray-900 border border-gray-800 rounded-2xl h-20 shrink-0 shadow-sm">
          <div className="text-2xl font-display font-bold tracking-tight text-white">
            SynthSnake
          </div>
          <div className="flex gap-8">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">High Score</div>
              <div className="text-xl font-mono font-bold text-gray-300">012,450</div>
            </div>
            <div className="text-right" id="score-display">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Score</div>
              <div className="text-3xl font-mono font-bold text-emerald-400">
                {score.toString().padStart(6, '0')}
              </div>
            </div>
          </div>
        </header>

        {/* Sidebar */}
        <aside id="music-player-sidebar" className="flex flex-col gap-6 lg:row-start-2 overflow-y-auto lg:overflow-hidden">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex-1 flex flex-col min-h-0 shadow-sm">
            {/* Album Art */}
            <div className="w-full aspect-square bg-gray-800 rounded-xl mb-6 relative overflow-hidden shrink-0 shadow-inner">
              <img 
                src={`https://picsum.photos/seed/${currentTrack.title.replace(/\s+/g, '').toLowerCase()}/400/400`} 
                alt={`${currentTrack.title} Album Art`} 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Now Playing */}
            <div className="mb-6 shrink-0">
              <div className="text-xl font-display font-bold text-white mb-1 truncate">{currentTrack.title}</div>
              <div className="text-sm text-gray-400 truncate">{currentTrack.artist}</div>
              
              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-gray-800 rounded-full my-4 overflow-hidden">
                <div className="w-[42%] h-full bg-indigo-500 rounded-full" />
              </div>
            </div>

            {/* Playlist */}
            <ul className="mt-auto flex flex-col gap-1 overflow-y-auto pr-2">
              {TRACKS.map((track, idx) => (
                <li 
                  key={track.id}
                  className={`flex items-center p-3 rounded-xl text-sm font-medium cursor-pointer transition-colors ${
                    idx === currentTrackIndex 
                      ? 'bg-indigo-500/10 text-indigo-400' 
                      : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                  }`}
                  onClick={() => {
                    setCurrentTrackIndex(idx);
                    setIsPlaying(true);
                  }}
                >
                  <span className="w-6 text-xs opacity-50 font-mono">{(idx + 1).toString().padStart(2, '0')}</span>
                  <span className="truncate">{track.title}</span>
                  <span className="ml-auto text-xs opacity-50 font-mono">3:45</span>
                </li>
              ))}
            </ul>
            
            {/* Volume Control */}
            <div className="flex items-center gap-4 text-gray-400 mt-6 pt-6 border-t border-gray-800 shrink-0">
              <button onClick={() => setIsMuted(!isMuted)} className="hover:text-white transition-colors p-1">
                {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01" 
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(parseFloat(e.target.value));
                  setIsMuted(false);
                }}
                className="w-full h-1.5 bg-gray-800 rounded-full appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
          </div>
        </aside>

        {/* Main Stage */}
        <main id="snake-game-stage" className="bg-gray-900 border border-gray-800 rounded-2xl flex flex-col items-center justify-center relative lg:row-start-2 p-6 min-h-[500px] lg:min-h-0 shadow-sm">
          
          {/* Snake Grid */}
          <div className="w-full max-w-[480px] aspect-square bg-gray-950 rounded-xl border border-gray-800 relative shrink-0 overflow-hidden shadow-inner">
            {!gameStarted ? (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gray-950/80 backdrop-blur-sm">
                <h1 className="text-4xl font-display font-bold text-white mb-8 tracking-tight">
                  Ready to Play
                </h1>
                <button 
                  onClick={resetGame}
                  className="px-8 py-3.5 bg-emerald-500 text-gray-950 text-sm font-bold tracking-wide uppercase rounded-full hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
                >
                  Start Game
                </button>
              </div>
            ) : gameOver ? (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gray-950/80 backdrop-blur-sm">
                <h2 className="text-4xl font-display font-bold text-white mb-3 tracking-tight">
                  Game Over
                </h2>
                <p className="text-gray-400 mb-8 font-mono text-lg">Score: {score}</p>
                <button 
                  onClick={resetGame}
                  className="flex items-center gap-2 px-8 py-3.5 bg-gray-800 text-white text-sm font-bold tracking-wide uppercase rounded-full hover:bg-gray-700 transition-colors border border-gray-700"
                >
                  <RotateCcw size={18} />
                  Play Again
                </button>
              </div>
            ) : null}

            {/* Game Canvas */}
            <div className="relative w-full h-full">
              {/* Food */}
              <div 
                className="absolute bg-rose-500 rounded-full shadow-[0_0_12px_rgba(244,63,94,0.6)]"
                style={{
                  width: `${100 / GRID_SIZE}%`,
                  height: `${100 / GRID_SIZE}%`,
                  left: `${(food.x / GRID_SIZE) * 100}%`,
                  top: `${(food.y / GRID_SIZE) * 100}%`,
                  transform: 'scale(0.8)'
                }}
              />
              
              {/* Snake */}
              {snake.map((segment, index) => {
                const isHead = index === 0;
                const trailFactor = 1 - (index / Math.max(snake.length, 1));
                const opacity = isHead ? 1 : Math.max(0.3, trailFactor);
                const scale = isHead ? 1 : Math.max(0.6, 0.7 + (trailFactor * 0.3));
                
                return (
                  <div 
                    key={`${segment.x}-${segment.y}-${index}`}
                    className={`absolute rounded-sm transition-all duration-75 ${
                      isHead 
                        ? 'bg-emerald-400 z-10 shadow-[0_0_10px_rgba(52,211,153,0.5)]' 
                        : 'bg-emerald-500'
                    }`}
                    style={{
                      width: `${100 / GRID_SIZE}%`,
                      height: `${100 / GRID_SIZE}%`,
                      left: `${(segment.x / GRID_SIZE) * 100}%`,
                      top: `${(segment.y / GRID_SIZE) * 100}%`,
                      opacity: opacity,
                      transform: `scale(${scale})`,
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* Instructions */}
          <div className="absolute top-6 right-6 text-xs font-medium text-gray-500 uppercase tracking-wider text-right hidden sm:block">
            <p className="mb-1">W A S D / Arrows to move</p>
            <p>Space to start</p>
          </div>

          {/* Player Controls */}
          <div id="player-controls" className="mt-10 flex items-center gap-6 shrink-0">
            <button 
              onClick={prevTrack} 
              className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-800 hover:bg-gray-700 transition-colors text-gray-300 hover:text-white"
              aria-label="Previous Track"
            >
              <SkipBack size={20} />
            </button>
            
            <button 
              onClick={togglePlay}
              className="w-16 h-16 rounded-full bg-indigo-500 text-white flex items-center justify-center hover:bg-indigo-400 transition-colors shadow-lg shadow-indigo-500/25 hover:scale-105 transform duration-200"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause size={28} className="fill-current" /> : <Play size={28} className="fill-current ml-1" />}
            </button>

            <button 
              onClick={nextTrack} 
              className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-800 hover:bg-gray-700 transition-colors text-gray-300 hover:text-white"
              aria-label="Next Track"
            >
              <SkipForward size={20} />
            </button>
          </div>

        </main>
      </div>
      
      <audio 
        ref={audioRef} 
        src={currentTrack.url} 
        onEnded={handleTrackEnd}
        className="hidden"
      />
    </div>
  );
}
