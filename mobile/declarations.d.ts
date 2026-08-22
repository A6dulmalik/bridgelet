declare module 'lucide-react-native';
declare module 'expo-camera';
declare module 'expo-speech' {
  export interface Voice {
    identifier: string;
    name: string;
    quality: string;
    language: string;
  }
  export function getAvailableVoicesAsync(): Promise<Voice[]>;
  export function isSpeakingAsync(): Promise<boolean>;
  export function stop(): Promise<void>;
  export function speak(text: string, options?: any): void;
}
declare module 'expo-av';
declare module 'zustand';
