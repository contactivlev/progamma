import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Play, RefreshCw, CheckCircle } from 'lucide-react';
import ChordsTable from './components/ChordsTable';
import { WebMidi } from 'webmidi';

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const SCALES = {
  major: {
    ionian: [0, 2, 4, 5, 7, 9, 11],
    lydian: [0, 2, 4, 6, 7, 9, 11],
    mixolydian: [0, 2, 4, 5, 7, 9, 10],
  },
  minor: {
    natural: [0, 2, 3, 5, 7, 8, 10],
    harmonic: [0, 2, 3, 5, 7, 8, 11],
    melodic: [0, 2, 3, 5, 7, 9, 11],
  },
};
const SCALE_VARIATIONS = {
  major: ['Ionian', 'Lydian', 'Mixolydian'],
  minor: ['Natural', 'Harmonic', 'Melodic'],
};

export default function App() {
  const [selectedRoot, setSelectedRoot] = useState(null);
  const [mode, setMode] = useState('major');
  const [scaleVariation, setScaleVariation] = useState({ major: 0, minor: 0 });
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [midiConnected, setMidiConnected] = useState(false);
  const audioCtxRef = useRef(null);
  const [playingKeys, setPlayingKeys] = useState([]);
  const [audioPromptState, setAudioPromptState] = useState('visible');
  const [scale, setScale] = useState(1);
  const [chordType, setChordType] = useState('triads');
  const [highlightedChord, setHighlightedChord] = useState(null);
  const [heldNotes, setHeldNotes] = useState(new Set());
  const recognitionTimeoutRef = useRef(null);
  const [currentScaleStep, setCurrentScaleStep] = useState(0);
  const [completedScales, setCompletedScales] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const scaleTimeoutRef = useRef(null);


  useEffect(() => {
    const handleResize = () => {
      const screenWidth = window.innerWidth;
      if (screenWidth < 896) {
        setScale(screenWidth / 896);
      } else {
        setScale(1);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Run on initial render

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const initAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  }, []);

  const handleEnableAudio = () => {
    initAudio();
    setAudioPromptState('confirmed');
    setTimeout(() => {
      setAudioPromptState('hidden');
    }, 1500);
  };

  const playTone = useCallback((noteIndex, octave) => {
    if (!audioEnabled || !audioCtxRef.current) return;

    const semitonesFromA4 = (octave - 4) * 12 + (noteIndex - 9);
    const frequency = 440 * Math.pow(2, semitonesFromA4 / 12);

    const osc = audioCtxRef.current.createOscillator();
    const gainNode = audioCtxRef.current.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, audioCtxRef.current.currentTime);
    gainNode.gain.setValueAtTime(0.3, audioCtxRef.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtxRef.current.currentTime + 1.5);
    osc.connect(gainNode);
    gainNode.connect(audioCtxRef.current.destination);

    osc.start();
    osc.stop(audioCtxRef.current.currentTime + 1.5);
  }, [audioEnabled]);

  const variationName = SCALE_VARIATIONS[mode][scaleVariation[mode]].toLowerCase();
  const currentScale = SCALES[mode][variationName];

  const getNoteDetails = (root, scale, scaleDegree) => {
    const octaveOffset = Math.floor(scaleDegree / 7);
    const scaleIndex = scaleDegree % 7;
    const totalSemitones = root.note + scale[scaleIndex];
    const noteIndex = totalSemitones % 12;
    const octave = root.octave + Math.floor(totalSemitones / 12) + octaveOffset;
    return { note: noteIndex, octave };
  };

  const getTriad = (root, scale, degree) => {
    const chordRoot = getNoteDetails(root, scale, degree - 1);
    const third = getNoteDetails(root, scale, degree + 1);
    const fifth = getNoteDetails(root, scale, degree + 3);

    const thirdInterval = (third.note - chordRoot.note + 12) % 12;
    const fifthInterval = (fifth.note - chordRoot.note + 12) % 12;

    let triad;
    if (thirdInterval === 4 && fifthInterval === 7) triad = 'Major';
    else if (thirdInterval === 3 && fifthInterval === 7) triad = 'Minor';
    else if (thirdInterval === 3 && fifthInterval === 6) triad = 'Diminished';
    else if (thirdInterval === 4 && fifthInterval === 8) triad = 'Augmented';

    return {
      name: `${NOTES[chordRoot.note]} ${triad}`,
      notes: [chordRoot, third, fifth],
      degree,
    };
  };

  const getSeventhChord = (root, scale, degree) => {
    const chordRoot = getNoteDetails(root, scale, degree - 1);
    const third = getNoteDetails(root, scale, degree + 1);
    const fifth = getNoteDetails(root, scale, degree + 3);
    const seventh = getNoteDetails(root, scale, degree + 5);

    const thirdInterval = (third.note - chordRoot.note + 12) % 12;
    const fifthInterval = (fifth.note - chordRoot.note + 12) % 12;
    const seventhInterval = (seventh.note - chordRoot.note + 12) % 12;

    let quality;
    if (thirdInterval === 4 && fifthInterval === 7 && seventhInterval === 11) quality = 'Major 7th';
    else if (thirdInterval === 3 && fifthInterval === 7 && seventhInterval === 10) quality = 'Minor 7th';
    else if (thirdInterval === 4 && fifthInterval === 7 && seventhInterval === 10) quality = 'Dominant 7th';
    else if (thirdInterval === 3 && fifthInterval === 6 && seventhInterval === 10) quality = 'Half-Diminished 7th';
    else if (thirdInterval === 3 && fifthInterval === 6 && seventhInterval === 9) quality = 'Diminished 7th';

    return {
      name: `${NOTES[chordRoot.note]} ${quality}`,
      notes: [chordRoot, third, fifth, seventh],
      degree,
    };
  };

  const chords = selectedRoot
    ? Array.from({ length: 7 }, (_, i) =>
      chordType === 'triads'
        ? getTriad(selectedRoot, currentScale, i + 1)
        : getSeventhChord(selectedRoot, currentScale, i + 1)
    )
    : [];

    const resetScaleCounter = useCallback(() => {
      if (completedScales > bestScore) {
        setBestScore(completedScales);
      }
      setCurrentScaleStep(0);
      setCompletedScales(0);
    }, [completedScales, bestScore]);
  

  const handleKeyClick = useCallback((noteIndex, octave, fromMidi = false) => {
    if (fromMidi && (!audioCtxRef.current || audioCtxRef.current.state === 'suspended')) return;

    initAudio();
    playTone(noteIndex, octave);
    const keyId = `${noteIndex}-${octave}`;

    if (fromMidi) {
      setPlayingKeys(prev => [...prev, keyId]);
      setTimeout(() => {
        setPlayingKeys(prev => prev.filter(k => k !== keyId));
      }, 200);
    } else {
      setSelectedRoot(prev => {
        if (prev && prev.note === noteIndex) {
          resetScaleCounter();
          return null;
        } else {
          resetScaleCounter();
          return { note: noteIndex, octave: octave };
        }
      });
    }
  }, [initAudio, playTone, resetScaleCounter]);

  const recognizeChord = useCallback((playedNotes) => {
    if (!chords.length) return;

    const playedNoteIndexes = new Set(Array.from(playedNotes).map(noteNumber => noteNumber % 12));

    for (const chord of chords) {
      const chordNoteIndexes = new Set(chord.notes.map(n => n.note));

      if (playedNoteIndexes.size === chordNoteIndexes.size && [...playedNoteIndexes].every(note => chordNoteIndexes.has(note))) {
        setHighlightedChord(chord.degree);
        setTimeout(() => {
          setHighlightedChord(null);
        }, 2000);
        return;
      }
    }
  }, [chords]);

  useEffect(() => {
    const handleNoteOn = (e) => {
      const { note } = e;
      const noteIndex = note.number % 12;
      const octave = Math.floor(note.number / 12) - 1;
      handleKeyClick(noteIndex, octave, true);

      if (selectedRoot) {
        if (scaleTimeoutRef.current) {
          clearTimeout(scaleTimeoutRef.current);
        }
  
        const expectedNoteIndex = (selectedRoot.note + currentScale[currentScaleStep]) % 12;
  
        if (noteIndex === expectedNoteIndex) {
          if (currentScaleStep === 6) {
            setCompletedScales(prev => prev + 1);
            setCurrentScaleStep(0);
          } else {
            setCurrentScaleStep(prev => prev + 1);
          }
        } else {
          resetScaleCounter();
        }
  
        scaleTimeoutRef.current = setTimeout(() => {
          resetScaleCounter();
        }, 2000);
      }

      setHeldNotes(prev => {
        const newHeldNotes = new Set(prev);
        newHeldNotes.add(note.number);
        return newHeldNotes;
      });
    };

    const handleNoteOff = (e) => {
      setHeldNotes(prev => {
        const newHeldNotes = new Set(prev);
        newHeldNotes.delete(e.note.number);
        return newHeldNotes;
      });
    };

    WebMidi.enable()
      .then(() => {
        console.log('WebMidi enabled!');
        setMidiConnected(WebMidi.inputs.length > 0);

        const setupListeners = () => {
          WebMidi.inputs.forEach(input => {
            input.removeListener('noteon');
            input.removeListener('noteoff');
            input.addListener('noteon', handleNoteOn);
            input.addListener('noteoff', handleNoteOff);
          });
        };

        WebMidi.addListener('connected', () => {
          setMidiConnected(true);
          setupListeners();
        });

        WebMidi.addListener('disconnected', () => {
          setMidiConnected(WebMidi.inputs.length > 0);
        });

        setupListeners();
      })
      .catch(err => {
        console.error('WebMidi could not be enabled.', err);
      });

    return () => {
      WebMidi.inputs.forEach(input => {
        input.removeListener('noteon');
        input.removeListener('noteoff');
      });
      if (scaleTimeoutRef.current) {
        clearTimeout(scaleTimeoutRef.current);
      }
    };
  }, [handleKeyClick, selectedRoot, currentScale, currentScaleStep, resetScaleCounter]);

  useEffect(() => {
    if (recognitionTimeoutRef.current) {
      clearTimeout(recognitionTimeoutRef.current);
    }

    recognitionTimeoutRef.current = setTimeout(() => {
      if (heldNotes.size > 2) {
        recognizeChord(heldNotes);
      }
    }, 100); // 100ms margin of error

    return () => {
      if (recognitionTimeoutRef.current) {
        clearTimeout(recognitionTimeoutRef.current);
      }
    };
  }, [heldNotes, recognizeChord]);

  const playScale = useCallback(() => {
    if (selectedRoot === null || isPlaying) return;

    initAudio();
    setIsPlaying(true);
    const scaleIntervals = [...currentScale, 12];

    scaleIntervals.forEach((interval, index) => {
      const totalSemitones = selectedRoot.note + interval;
      const noteIndex = totalSemitones % 12;
      const octave = selectedRoot.octave + Math.floor(totalSemitones / 12);
      const keyId = `${noteIndex}-${octave}`;

      setTimeout(() => {
        playTone(noteIndex, octave);
        setPlayingKeys(prev => [...prev, keyId]);
        setTimeout(() => {
          setPlayingKeys(prev => prev.filter(k => k !== keyId));
        }, 250);
      }, index * 300);
    });

    setTimeout(() => setIsPlaying(false), scaleIntervals.length * 300);
  }, [selectedRoot, isPlaying, currentScale, playTone, initAudio]);

  const getScaleStatus = (noteIndex) => {
    if (selectedRoot === null) return { isActive: false, isRoot: false };
    const relativeIndex = (noteIndex - selectedRoot.note + 12) % 12;
    const isRoot = noteIndex === selectedRoot.note;
    const isActive = currentScale.includes(relativeIndex);
    return { isActive, isRoot };
  };

  const getScaleName = () => {
    if (selectedRoot === null) return "Select a key";
    const variationName = SCALE_VARIATIONS[mode][scaleVariation[mode]];
    return `${NOTES[selectedRoot.note]} ${variationName}`;
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center p-4 font-sans select-none pt-10">
      {audioPromptState !== 'hidden' && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 p-8 rounded-2xl shadow-xl text-center flex flex-col items-center">
            {audioPromptState === 'visible' ? (
              <>
                <h2 className="text-2xl font-bold mb-4">Enable Audio</h2>
                <p className="text-slate-400 mb-6">Click the button to enable audio playback.</p>
                <button
                  onClick={handleEnableAudio}
                  className="bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors hover:bg-orange-700 flex items-center"
                >
                  <Volume2 className="inline-block mr-2" />
                  Enable Audio
                </button>
              </>
            ) : (
              <div className="flex items-center text-green-400">
                <CheckCircle className="mr-2" />
                <p className="text-xl font-medium">Audio Enabled!</p>
              </div>
            )}
          </div>
        </div>
      )}
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}>
        <div className="w-full max-w-4xl mb-10 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-blue-400 bg-clip-text text-transparent">Scale Visualizer</h1>
            <p className="text-slate-400">Select a root note to see the scale</p>
            {selectedRoot && (
              <p className="text-slate-300 text-lg">
                Scales played: <span className="font-bold text-orange-400">{currentScaleStep}/7</span> <span className="font-bold text-blue-400">{completedScales}</span>, best result: <span className="font-bold text-green-400">{bestScore}</span>
              </p>
            )}
          </div>

          <div className="bg-slate-800/50 p-6 rounded-2xl backdrop-blur-sm border border-slate-700 shadow-xl flex flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3 min-w-[200px]">
              <button
                onClick={playScale}
                disabled={selectedRoot === null || isPlaying}
                className={`p-3 rounded-xl transition-colors ${selectedRoot !== null && !isPlaying ? (mode === 'major' ? 'bg-orange-500/20 text-orange-300 hover:bg-orange-500/30' : 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30') : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'}`}>
                <Play size={24} />
              </button>
              <div>
                <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Current Scale</div>
                <div className="text-xl font-bold">{getScaleName()}</div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-700">
                <button
                  onClick={() => setMode('major')}
                  className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${mode === 'major' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                  Major
                </button>
                <button
                  onClick={() => setMode('minor')}
                  className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${mode === 'minor' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                  Minor
                </button>
              </div>
              <button
                onClick={() => setScaleVariation(prev => ({ ...prev, [mode]: (prev[mode] + 1) % SCALE_VARIATIONS[mode].length }))}
                className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-300 px-4 py-2 rounded-lg border border-slate-600"
                title="Change Scale Variation">
                <RefreshCw size={16} />
                <span>{SCALE_VARIATIONS[mode][scaleVariation[mode]]}</span>
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className={`w-3 h-3 rounded-full ${midiConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <button
                onClick={() => setAudioEnabled(!audioEnabled)}
                className={`p-3 rounded-xl transition-colors ${audioEnabled ? 'bg-slate-700 text-green-400' : 'bg-slate-800 text-red-400'}`}
                title="Toggle Sound">
                {audioEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
              </button>
            </div>
          </div>
        </div>

        <div className="relative w-full max-w-4xl overflow-x-auto pb-8 custom-scrollbar">
          <div className="flex justify-center min-w-[800px]">
            {[0, 1].map(octave => (
              <div key={`octave-${octave}`} className="flex relative">
                {NOTES.map((note, index) => {
                  const isBlackKey = note.includes('#');
                  if (isBlackKey) return null;
                  const nextNoteIndex = (index + 1) % 12;
                  const hasBlackKey = NOTES[nextNoteIndex].includes('#');
                  const currentOctave = octave + 3;

                  const whiteKeyId = `${index}-${currentOctave}`;
                  const isWhiteKeyPlaying = playingKeys.includes(whiteKeyId);
                  const whiteStatus = getScaleStatus(index);

                  const blackKeyId = hasBlackKey ? `${nextNoteIndex}-${currentOctave}` : null;
                  const isBlackKeyPlaying = hasBlackKey && playingKeys.includes(blackKeyId);
                  const blackStatus = hasBlackKey ? getScaleStatus(nextNoteIndex) : { isActive: false, isRoot: false };

                  return (
                    <div key={`key-${octave}-${index}`} className="relative">
                      <button
                        onClick={() => handleKeyClick(index, currentOctave)}
                        className={`w-14 h-48 border-b-4 border-l border-r rounded-b-lg active:scale-[0.98] active:border-b-0 transition-all duration-100 flex flex-col justify-end items-center pb-4 group relative z-0
                          ${
                            isWhiteKeyPlaying
                              ? (mode === 'major' ? 'bg-orange-300' : 'bg-blue-300')
                              : whiteStatus.isRoot
                                ? (mode === 'major' ? 'bg-orange-600 border-orange-800 shadow-[0_0_20px_rgba(234,88,12,0.6)] z-10' : 'bg-blue-600 border-blue-800 shadow-[0_0_20px_rgba(37,99,235,0.6)] z-10')
                                : !whiteStatus.isRoot && whiteStatus.isActive
                                  ? (mode === 'major' ? 'bg-orange-200 border-b-orange-300' : 'bg-blue-200 border-b-blue-300')
                                  : 'bg-white hover:bg-gray-100'
                          }
                        `}>
                        <span className={`font-bold text-sm ${whiteStatus.isRoot ? 'text-white' : whiteStatus.isActive ? 'text-slate-900' : 'text-slate-300 group-hover:text-slate-400'}`}>
                          {note}{currentOctave}
                        </span>
                        {whiteStatus.isRoot && <div className="absolute bottom-2 w-2 h-2 rounded-full bg-white mb-6"></div>}
                      </button>
                      {hasBlackKey && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleKeyClick(nextNoteIndex, currentOctave); }}
                          className={`absolute -right-4 top-0 w-8 h-32 border-b-8 rounded-b-md z-20 active:scale-y-[0.98] active:border-b-0 transition-all duration-100 flex flex-col justify-end items-center pb-3 shadow-xl
                            ${
                              isBlackKeyPlaying
                                ? (mode === 'major' ? 'bg-orange-500' : 'bg-blue-500')
                                : blackStatus.isRoot
                                  ? (mode === 'major' ? 'bg-orange-600 border-orange-900 shadow-[0_0_15px_rgba(234,88,12,0.6)]' : 'bg-blue-600 border-blue-900 shadow-[0_0_15px_rgba(37,99,235,0.6)]')
                                  : blackStatus.isActive
                                    ? (mode === 'major' ? 'bg-orange-400 border-orange-900' : 'bg-blue-400 border-blue-900')
                                    : 'bg-slate-800 border-black hover:bg-slate-700'
                            }
                          `}>
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
        <ChordsTable
          selectedRoot={selectedRoot}
          mode={mode}
          playTone={playTone}
          initAudio={initAudio}
          chords={chords}
          chordType={chordType}
          setChordType={setChordType}
          highlightedChord={highlightedChord}
        />
      </div>
    </div>
  );
}
