import React, { useState } from 'react';
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

const ChordRow = ({ degree, chordName, notes, playChord, mode }) => {
  const formattedNotes = notes.map(n => NOTES[n.note]).join('-');

  return (
    <tr className="border-b border-slate-700 last:border-b-0">
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
  const [chordType, setChordType] = useState('triads');

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
          ? getTriad(selectedRoot, scale, i + 1)
          : getSeventhChord(selectedRoot, scale, i + 1)
      )
    : [];

  const playChord = (chordNotes) => {
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
      <table className="w-full table-fixed text-left bg-slate-800/50 rounded-2xl border-collapse">
        <thead>
          <tr className="border-b border-slate-700">
            <th className="p-4 w-[10%]">Degree</th>
            <th className="p-4 w-[20%]">Chord</th>
            <th className="p-4 w-[10%]">Notes</th>
            <th className="p-4 w-[50%]">Visualization</th>
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
