import React from 'react';
import { Play } from 'lucide-react';

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const ChordRow = ({ degree, triad, chordName, notes, playChord, mode }) => {
  const MiniKeyboard = () => {
    const twoOctaves = [...NOTES, ...NOTES];

    return (
      <div className="flex">
        {twoOctaves.map((note, index) => {
          const isBlackKey = note.includes('#');
          const isHighlighted = notes.includes(index % 12);

          return (
            <div key={index} className="relative">
              <div
                className={`
                  w-5 h-16 border-l border-r border-b border-slate-300
                  ${isBlackKey ? 'hidden' : 'block'}
                  ${isHighlighted ? (mode === 'major' ? 'bg-blue-400' : 'bg-orange-400') : 'bg-white'}
                `}
              ></div>
              {isBlackKey && (
                <div
                  className={`
                    absolute top-0 -ml-2 w-3 h-10
                    ${isHighlighted ? (mode === 'major' ? 'bg-blue-600' : 'bg-orange-600') : 'bg-black'}
                  `}
                ></div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <tr className="border-b border-slate-700">
      <td className="p-4">{degree}</td>
      <td className="p-4">{triad}</td>
      <td className="p-4">{chordName}</td>
      <td className="p-4">
        <MiniKeyboard />
      </td>
      <td className="p-4">
        <button onClick={playChord} className="p-2 rounded-full bg-slate-700 hover:bg-slate-600">
          <Play size={20} />
        </button>
      </td>
    </tr>
  );
};

const ChordsTable = ({ selectedRoot, mode, scale, playTone }) => {
  if (selectedRoot === null) {
    return null;
  }

  const getChord = (root, scale, degree) => {
    const scaleNotes = scale.map(interval => (root + interval) % 12);
    const chordRoot = scaleNotes[degree - 1];
    const third = scaleNotes[(degree + 1) % 7];
    const fifth = scaleNotes[(degree + 3) % 7];

    const thirdInterval = (third - chordRoot + 12) % 12;
    const fifthInterval = (fifth - chordRoot + 12) % 12;

    let triad;
    if (thirdInterval === 4 && fifthInterval === 7) {
      triad = 'Major';
    } else if (thirdInterval === 3 && fifthInterval === 7) {
      triad = 'Minor';
    } else if (thirdInterval === 3 && fifthInterval === 6) {
      triad = 'Diminished';
    } else if (thirdInterval === 4 && fifthInterval === 8) {
      triad = 'Augmented';
    }

    return {
      name: `${NOTES[chordRoot]} ${triad}`,
      notes: [chordRoot, third, fifth],
      degree,
      triad
    };
  };

  const chords = Array.from({ length: 7 }, (_, i) => getChord(selectedRoot, scale, i + 1));

  const playChord = (chordNotes) => {
    chordNotes.forEach(noteIndex => {
      const octave = (selectedRoot + noteIndex) >= 12 ? 4 : 3;
      playTone(noteIndex, octave);
    });
  };

  return (
    <div className="w-full max-w-5xl mt-8">
      <h2 className="text-2xl font-bold mb-4 text-center">Diatonic Chords</h2>
      <table className="w-full text-left bg-slate-800/50 rounded-2xl border-collapse">
        <thead>
          <tr className="border-b border-slate-700">
            <th className="p-4">Degree</th>
            <th className="p-4">Triad</th>
            <th className="p-4">Chord</th>
            <th className.jsx="p-4">Visualization</th>
            <th className="p-4">Play</th>
          </tr>
        </thead>
        <tbody>
          {chords.map(chord => (
            <ChordRow
              key={chord.degree}
              degree={chord.degree}
              triad={chord.triad}
              chordName={chord.name}
              notes={chord.notes}
              playChord={() => playChord(chord.notes)}
              mode={mode}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ChordsTable;
