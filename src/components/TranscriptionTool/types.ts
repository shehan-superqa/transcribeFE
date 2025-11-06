export type InputMode = 'file' | 'youtube' | 'recording';

export interface TranscriptionToolProps {
  onTranscriptionStart?: () => void;
}

export interface Recording {
  id: string;
  blob: Blob;
  url: string;
  wavesurfer: any | null;
}

