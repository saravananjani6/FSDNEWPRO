import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { soundManager } from '../../audio/soundManager';
import { useLanguage } from '../../context/LanguageContext';

export function AudioSpeakerButton({ soundKey, spokenText = '', label = null, size = 'default' }) {
  const { lang, t } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);

  const handleClick = (e) => {
    e.stopPropagation();
    setIsPlaying(true);
    soundManager.playQuestionAudio(soundKey, lang, spokenText, () => {
      setIsPlaying(false);
    });

    // Safety timeout in case audio is interrupted
    setTimeout(() => {
      setIsPlaying(false);
    }, 4500);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`btn-audio-speaker ${isPlaying ? 'playing' : ''} size-${size}`}
      title={label || t('btn_listen_question')}
      aria-label={label || t('btn_listen_question')}
    >
      <Volume2 size={size === 'large' ? 26 : 20} className={isPlaying ? 'wave-animation' : ''} />
      {label && <span className="audio-label">{label}</span>}
    </button>
  );
}
