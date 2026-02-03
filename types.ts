
export interface UploadedImage {
  id: string;
  url: string;
  base64: string;
  mimeType: string;
  name: string;
  width?: number;
  height?: number;
}

export interface AppState {
  poster: UploadedImage | null;
  people: UploadedImage[];
  isProcessing: boolean;
  result: string | null;
  error: string | null;
}
