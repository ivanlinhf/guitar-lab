/** Guitar Lab custom score JSON — formatVersion 1. */

export type GuitarString = 1 | 2 | 3 | 4 | 5 | 6;

export interface TimeSignature {
  numerator: number;
  denominator: number;
}

export interface NoteEvent {
  type: 'note';
  beat: number;
  durationBeats: number;
  string: GuitarString;
  fret: number;
}

export interface RestEvent {
  type: 'rest';
  beat: number;
  durationBeats: number;
}

export type ScoreEvent = NoteEvent | RestEvent;

export interface Measure {
  index: number;
  chord?: string;
  events: ScoreEvent[];
}

export interface SongDocument {
  formatVersion: 1;
  id: string;
  title: string;
  description?: string;
  tuning: string[];
  bpm: number;
  timeSignature: TimeSignature;
  measures: Measure[];
}
