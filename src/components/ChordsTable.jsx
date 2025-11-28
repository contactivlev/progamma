import React from 'react';
import { Play } from 'lucide-react';

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const MiniKeyboard = ({ notes, mode }) => {
  const octaves = [3, 4];

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
                    ? (mode === 'major' ? 'bg-blue-400' : 'bg-orange-400')
                    : 'bg-slate-200'
                  }
                `}
              ></div>
              {isBlackKey && (
                <div
                  className={`
                    absolute top-0 -ml-2 w-2.5 h-8
                    ${isHighlighted
                      ? (mode === 'major' ? 'bg-blue-600' : 'bg-orange-600')
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

const ChordRow = ({ degree, chordName, notes, playChord, mode }) => {

  const formattedNotes = notes.map(n => NOTES[n.note]).join('-');

  return (
    <tr className="border-b border-slate-700">
      <td className="p-4">{degree}</td>
      <td className="p-4">{chordName}</td>
      <td className="p-4">{formattedNotes}</td>
      <td className="p-4">
        <MiniKeyboard notes={notes} mode={mode} />
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

  const getChord = (root, scale, degree) => {
    const getNoteDetails = (scaleDegree) => {
        const totalSemitones = root.note + scale[scaleDegree % 7];
        const noteIndex = totalSemitones % 12;
        const octave = root.octave + Math.floor(totalSemitones / 12);
        return { note: noteIndex, octave };
    };

    const chordRoot = getNoteDetails(degree - 1);
    const third = getNoteDetails(degree + 1);
    const fifth = getNoteDetails(degree + 3);

    const thirdInterval = (third.note - chordRoot.note + 12) % 12;
    const fifthInterval = (fifth.note - chordRoot.note + 12) % 12;

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
      name: `${NOTES[chordRoot.note]} ${triad}`,
      notes: [chordRoot, third, fifth],
      degree,
      triad
    };
  };

  const chords = selectedRoot
    ? Array.from({ length: 7 }, (_, i) => getChord(selectedRoot, scale, i + 1))
    : [];

  const playChord = (chordNotes) => {
    console.log('--- Playing Chord ---');
    console.log('Using notes:', chordNotes.map(n => `${NOTES[n.note]}${n.octave}`));
    chordNotes.forEach(note => {
        playTone(note.note, note.octave);
    });
  };

  return (
    <div className="w-full max-w-5xl mt-8">
      <h2 className="text-2xl font-bold mb-4 text-center">Diatonic Chords</h2>
      <table className="w-full table-fixed text-left bg-slate-800/50 rounded-2xl border-collapse">
        <thead>
          <tr className="border-b border-slate-700">
            <th className="p-4 w-[10%]">Degree</th>
            <th className="p-4 w-[20%]">Chord</th>
            <th className="p-4 w-[25%]">Notes</th>
            <th className="p-4 w-[35%]">Visualization</th>
            <th className="p-4 w-[10%]">Play</th>
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
