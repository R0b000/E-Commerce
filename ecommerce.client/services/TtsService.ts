import { axiosConfig } from 'shared-ui/axios/AxiosConfig';

class TtsService {
  private isMuted: boolean = false;
  private currentAudio: HTMLAudioElement | null = null;
  private isSpeaking: boolean = false;

  constructor() {
    this.isMuted = localStorage.getItem('tts_muted') === 'true';
  }

  get muted(): boolean {
    return this.isMuted;
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
    localStorage.setItem('tts_muted', String(muted));
  }

  toggleMuted(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  /**
   * Speak notification message using local Piper TTS (Amy / Nepali Google Voice 2)
   * with automatic browser SpeechSynthesis fallback if the python server is offline.
   */
  async speakNotification(title: string, message?: string) {
    if (this.isMuted) return;

    const cleanTitle = (title || '').trim();
    const cleanMsg = (message || '').trim();

    // Natural announcement formatting
    const textToSpeak = cleanMsg && cleanMsg !== cleanTitle
      ? `${cleanTitle}. ${cleanMsg}`
      : cleanTitle;

    if (!textToSpeak) return;

    // Detect language: check for Devanagari script for Nepali Google Voice 2
    const hasDevanagari = /[\u0900-\u097F]/.test(textToSpeak);
    const targetLang = hasDevanagari ? 'ne' : 'en';
    const targetVoice = hasDevanagari ? 'ne_NP-google-2' : 'en_US-amy-medium';

    try {
      // 1. Primary: High-fidelity Piper Neural TTS Server via Proxy
      const res = await axiosConfig.post(
        '/ecommerce/tts',
        {
          text: textToSpeak,
          lang: targetLang,
          voice: targetVoice,
          speed: 1.05,
        },
        {
          responseType: 'blob',
          timeout: 7000,
        }
      );

      if (res.data && res.data.size > 0) {
        if (this.currentAudio) {
          this.currentAudio.pause();
          this.currentAudio = null;
        }

        const audioUrl = URL.createObjectURL(res.data);
        const audio = new Audio(audioUrl);
        this.currentAudio = audio;
        this.isSpeaking = true;

        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          this.currentAudio = null;
          this.isSpeaking = false;
        };

        audio.onerror = () => {
          this.fallbackSpeech(textToSpeak, hasDevanagari);
        };

        await audio.play();
        return;
      }
    } catch {
      // Fallback if local TTS daemon is starting or offline
      this.fallbackSpeech(textToSpeak, hasDevanagari);
    }
  }

  private fallbackSpeech(text: string, isNepali: boolean) {
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.05;
        utterance.lang = isNepali ? 'ne-NP' : 'en-US';
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      console.warn('Native speech playback fallback:', err);
    }
  }
}

export const ttsService = new TtsService();
export default ttsService;
