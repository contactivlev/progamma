import React from 'react';
import { Play } from 'lucide-react';

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const MiniKeyboard = ({ notes, mode }) => {
  const octaves = [3, 4, 5];

  return (
    <div className="flex items-start">
      {octaves.flatMap(octave =>
        NOTES.map((note, noteIndex) => {
          const isBlackKey = note.includes('#');
          const isHighlighted = notes.some(n => n.note === noteIndex && n.octave === octave);

          return (
            <div key={`${octave}-${noteIndex}`} className="relative">
              <div
                className={`
                  w-4 h-12 border-l border-r border-b border-slate-400
                  ${isBlackKey ? 'hidden' : 'block'}
                  ${isHighlighted
                    ? (mode === 'major' ? 'bg-orange-400' : 'bg-blue-400')
                    : 'bg-slate-200'
                  }
                `}
              ></div>
              {isBlackKey && (
                <div
                  className={`
                    absolute top-0 -ml-2 w-2.5 h-8
                    ${isHighlighted
                      ? (mode === 'major' ? 'bg-orange-600' : 'bg-blue-600')
                      : 'bg-black'
                    }
                  `}
                ></div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

const ChordRow = ({ degree, chordName, notes, playChord, mode, isHighlighted }) => {
  const formattedNotes = notes.map(n => NOTES[n.note]).join('-');

  return (
    <tr className={`border-b border-slate-700 last:border-b-0 transition-colors duration-300 ${isHighlighted ? 'bg-slate-700' : ''}`}>
      <td className="p-4">{degree}</td>
      <td className="p-4">{chordName}</td>
      <td className="p-4">{formattedNotes}</td>
      <td className="p-4">
        <MiniKeyboard notes={notes} mode={mode} />
      </td>
      <td className="p-0">
        <button onClick={playChord} className="w-full h-20 flex items-center justify-center bg-slate-800 hover:bg-slate-700 transition-colors">
          <Play size={20} />
        </button>
      </td>
    </tr>
  );
};

const ChordsTable = ({ selectedRoot, mode, playTone, initAudio, chords, chordType, setChordType, highlightedChord }) => {

  const playChord = (chordNotes) => {
    initAudio();
    chordNotes.forEach(note => {
      playTone(note.note, note.octave);
    });
  };

  return (
    <div className="w-full max-w-4xl mt-8">
      <div className="flex justify-center mb-4">
        <div className="flex rounded-lg bg-slate-700 p-1">
          <button
            onClick={() => setChordType('triads')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              chordType === 'triads' ? (mode === 'major' ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white') : 'text-slate-300 hover:bg-slate-600'
            }`}
          >
            Diatonic Triads
          </button>
          <button
            onClick={() => setChordType('sevenths')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              chordType === 'sevenths' ? (mode === 'major' ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white') : 'text-slate-300 hover:bg-slate-600'
            }`}
          >
            Diatonic Seventh Chords
          </button>
        </div>
      </div>
      <table className="w-[56rem] table-fixed text-left bg-slate-800/50 rounded-2xl border-collapse overflow-hidden">
        <thead>
          <tr className="border-b border-slate-700">
            <th className="p-4 w-[5.5rem]">Degree</th>
            <th className="p-4 w-[13.5rem]">Chord</th>
            <th className="p-4 w-[8rem]">Notes</th>
            <th className="p-4 w-[24rem]">Visualization</th>
            <th className="p-4 w-20 text-right">Play</th>
          </tr>
        </thead>
        <tbody>
          {selectedRoot ? (
            chords.map(chord => (
              <ChordRow
                key={chord.degree}
                degree={chord.degree}
                chordName={chord.name}
                notes={chord.notes}
                playChord={() => playChord(chord.notes)}
                mode={mode}
                isHighlighted={highlightedChord === chord.degree}
              />
            ))
          ) : (
            <tr>
              <td colSpan="5" className="p-8 text-center text-slate-400">
                Select a root note on the piano to see the diatonic chords.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ChordsTable;
