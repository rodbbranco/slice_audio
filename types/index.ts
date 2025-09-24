export interface AudioFile {
  file: File;
  name: string;
  size: number;
  type: string;
}

export interface SplitSegment {
  name: string;
  url: string;
  size: number;
  duration: number;
}

export interface AudioSplitProgress {
  progress: number;
  segments?: SplitSegment[];
  error?: string;
}

export interface AudioUploaderProps {
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
  maxSize?: number;
  allowedTypes?: string[];
}

export interface AudioSplitterProps {
  audioFile: File;
  splitDuration: number;
  onDurationChange: (duration: number) => void;
}

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export type ProcessingState = 'idle' | 'processing' | 'completed' | 'error';