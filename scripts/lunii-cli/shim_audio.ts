// Remplace converters/audio.ts : les pistes sont déjà converties par ffmpeg (mono 44100, 64k, sans tags).
import { readFileSync } from "fs";
export async function convertAudioToMP3(inputFile: any): Promise<Uint8Array> {
  return new Uint8Array(readFileSync(inputFile.path));
}
export async function reworkAudio(inputFile: any): Promise<any> {
  return inputFile;
}
