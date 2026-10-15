import React, { useState } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export function SpeechRecognitionButton({ onResult, placeholder = '' }) {
  const { lang, t } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(
    'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
  );

  const startListening = () => {
    if (!supported) {
      alert(
        lang === 'ta'
          ? 'உங்கள் உலாவியில் குரல் அறிதல் ஆதரிக்கப்படவில்லை (ஆஃப்லைன் பயன்முறை).'
          : 'Speech recognition not supported in this offline browser environment.'
      );
      return;
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = lang === 'ta' ? 'ta-IN' : 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const text = event.results[0][0].transcript;
        if (onResult) {
          onResult(text);
        }
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.warn('[Speech Recognition Note]', err);
      setIsListening(false);
    }
  };

  return (
    <button
      type="button"
      onClick={startListening}
      className={`btn-speech-mic ${isListening ? 'listening' : ''}`}
      title={lang === 'ta' ? 'குரல் உள்ளீடு (சோதனை முறை)' : 'Voice input (experimental)'}
    >
      {isListening ? <MicOff size={18} className="text-red-500 animate-pulse" /> : <Mic size={18} />}
    </button>
  );
}
