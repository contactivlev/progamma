import React, { useState, useCallback } from 'react';
import { Volume2, VolumeX, Music } from 'lucide-react';

// Note definitions
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Interval patterns (semitones)
const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11], // W W H W W W H
  minor: [0, 2, 3, 5, 7, 8, 10], // W H W W H W W (Natural Minor)
};

export default function App() {
  const [selectedRoot, setSelectedRoot] = useState(null); // Index 0-11
  const [mode, setMode] = useState('major'); // 'major' or 'minor'
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [audioCtx, setAudioCtx] = useState(null);

  // Initialize Audio Context on first interaction to comply with browser policies
  const initAudio = () => {
    if (!audioCtx) {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      setAudioCtx(ctx);
    }
  };

  const playTone = useCallback((freq) => {
    if (!audioEnabled || !audioCtx) return;
    
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
  }, [audioEnabled, audioCtx]);

  // Handle key click
  const handleKeyClick = (noteIndex, octave) => {
    initAudio();
    
    // Calculate frequency for sound (Simple equal temperament formula)
    // A4 is 440Hz (Index 9 in our array). Let's define C3 as the start.
    // C3 is roughly 130.81Hz.
    // Formula: freq = 130.81 * (2 ^ (n/12)) where n is semitones from C3
    const semitonesFromC3 = (octave * 12) + noteIndex;
    const frequency = 130.81 * Math.pow(2, semitonesFromC3 / 12);
    playTone(frequency);

    // Toggle logic
    if (selectedRoot === noteIndex) {
      setSelectedRoot(null);
    } else {
      setSelectedRoot(noteIndex);
    }
  };

  // Determine if a key is part of the currently selected scale
  const getScaleStatus = (noteIndex) => {
    if (selectedRoot === null) return { isActive: false, isRoot: false };

    const relativeIndex = (noteIndex - selectedRoot + 12) % 12;
    const isRoot = noteIndex === selectedRoot;
    const isActive = SCALES[mode].includes(relativeIndex);

    return { isActive, isRoot };
  };

  // Helper to get formatted scale name
  const getScaleName = () => {
    if (selectedRoot === null) return "Select a key";
    return `${NOTES[selectedRoot]} ${mode.charAt(0).toUpperCase() + mode.slice(1)}`;
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-4 font-sans select-none">
      
      {/* Header & Controls */}
      <div className="w-full max-w-4xl mb-10 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-orange-400 bg-clip-text text-transparent">
            Scale Visualizer
          </h1>
          <p className="text-slate-400">Select a root note to see the scale</p>
        </div>

        {/* Controls Bar */}
        <div className="bg-slate-800/50 p-6 rounded-2xl backdrop-blur-sm border border-slate-700 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Active Scale Display */}
          <div className="flex items-center gap-3 min-w-[200px]">
            <div className={`p-3 rounded-xl ${
              selectedRoot !== null 
                ? (mode === 'major' ? 'bg-blue-500/20 text-blue-300' : 'bg-orange-500/20 text-orange-300')
                : 'bg-slate-700/50 text-slate-500'
            }`}>
              <Music size={24} />
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Current Scale</div>
              <div className="text-xl font-bold">{getScaleName()}</div>
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setMode('major')}
              className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                mode === 'major' 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Major
            </button>
            <button
              onClick={() => setMode('minor')}
              className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                mode === 'minor' 
                  ? 'bg-orange-600 text-white shadow-lg' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Minor
            </button>
          </div>

          {/* Audio Toggle */}
          <button 
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`p-3 rounded-xl transition-colors ${audioEnabled ? 'bg-slate-700 text-green-400' : 'bg-slate-800 text-red-400'}`}
            title="Toggle Sound"
          >
            {audioEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
          </button>
        </div>
      </div>

      {/* Piano Container */}
      <div className="relative w-full max-w-5xl overflow-x-auto pb-8 custom-scrollbar">
        <div className="flex justify-center min-w-[800px]"> {/* min-w ensures scroll on mobile, center on desktop */}
          
          {/* Render 2 Octaves */}
          {[0, 1].map((octave) => (
            <div key={`octave-${octave}`} className="flex relative">
              {NOTES.map((note, index) => {
                const isBlackKey = note.includes('#');
                if (isBlackKey) return null; // We handle black keys within the white key map below or separate

                // Find the black key immediately following this white key (if any)
                // C has C#, D has D#, E has None, F has F#, G has G#, A has A#, B has None
                const nextNoteIndex = (index + 1) % 12;
                const hasBlackKey = NOTES[nextNoteIndex].includes('#');
                
                // Get status for the White Key
                const whiteStatus = getScaleStatus(index);
                
                // Get status for the Black Key (if exists)
                const blackStatus = hasBlackKey ? getScaleStatus(nextNoteIndex) : { isActive: false, isRoot: false };

                return (
                  <div key={`key-${octave}-${index}`} className="relative">
                    
                    {/* White Key */}
                    <button
                      onClick={() => handleKeyClick(index, octave)}
                      className={`
                        w-14 h-48 border-b-4 border-l border-r border-slate-300 rounded-b-lg active:scale-[0.98] active:border-b-0 transition-all duration-100 flex flex-col justify-end items-center pb-4 group relative z-0
                        ${whiteStatus.isRoot 
                           ? (mode === 'major' ? 'bg-blue-600 border-blue-800 shadow-[0_0_20px_rgba(37,99,235,0.6)] z-10' : 'bg-orange-600 border-orange-800 shadow-[0_0_20px_rgba(234,88,12,0.6)] z-10')
                           : ''}
                        ${!whiteStatus.isRoot && whiteStatus.isActive 
                           ? (mode === 'major' ? 'bg-blue-200 border-b-blue-300' : 'bg-orange-200 border-b-orange-300') 
                           : ''}
                        ${!whiteStatus.isActive && !whiteStatus.isRoot ? 'bg-white hover:bg-gray-100' : ''}
                      `}
                    >
                      <span className={`font-bold text-sm ${
                        whiteStatus.isRoot ? 'text-white' : 
                        whiteStatus.isActive ? 'text-slate-900' : 'text-slate-300 group-hover:text-slate-400'
                      }`}>
                        {note}{octave + 3}
                      </span>
                      {whiteStatus.isRoot && (
                        <div className="absolute bottom-2 w-2 h-2 rounded-full bg-white mb-6"></div>
                      )}
                    </button>

                    {/* Black Key (Positioned absolutely over the right border of the white key) */}
                    {hasBlackKey && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleKeyClick(nextNoteIndex, octave);
                        }}
                        className={`
                          absolute -right-4 top-0 w-8 h-32 border-b-8 border-slate-900 rounded-b-md z-20 active:scale-y-[0.98] active:border-b-0 transition-all duration-100 flex flex-col justify-end items-center pb-3 shadow-xl
                          ${blackStatus.isRoot 
                            ? (mode === 'major' ? 'bg-blue-600 border-blue-900 shadow-[0_0_15px_rgba(37,99,235,0.6)]' : 'bg-orange-600 border-orange-900 shadow-[0_0_15px_rgba(234,88,12,0.6)]')
                            : blackStatus.isActive 
                              ? (mode === 'major' ? 'bg-blue-400 border-blue-900' : 'bg-orange-400 border-orange-900')
                              : 'bg-slate-800 border-black hover:bg-slate-700'
                          }
                        `}
                      >
                         <span className={`text-[10px] font-bold ${blackStatus.isActive || blackStatus.isRoot ? 'text-white' : 'text-slate-600'}`}>
                           {NOTES[nextNoteIndex]}
                         </span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend / Instructions */}
      <div className="mt-8 flex gap-6 text-sm text-slate-400">
        <div className="flex items-center gap-2">
          <div className={`w-4 h-4 rounded-sm border ${mode === 'major' ? 'bg-blue-600 border-blue-800' : 'bg-orange-600 border-orange-800'}`}></div>
          <span>Root Note</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-4 h-4 rounded-sm border ${mode === 'major' ? 'bg-blue-200 border-blue-300' : 'bg-orange-200 border-orange-300'}`}></div>
          <span>Scale Note</span>
        </div>
      </div>

    </div>
  );
}