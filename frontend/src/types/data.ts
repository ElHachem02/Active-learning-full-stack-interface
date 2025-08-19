export interface AudioFiles {
    files: string[];
}

export interface BirdLabel {
  timeChunk: number;
  birds: string[];
}

export interface Segment {
  id: number;
  spectrogram_url: string;
  start_time: number;
  uncertainty: number;
}

export interface AudioData {
  audio_url: string;
  duration: number;
  filename: string;
  segments: Segment[];
  location: string;
  id: number;
}

export type AudioDataArray = AudioData[];

export type Uncertainties = number[];
