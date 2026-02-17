import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { SciFiButton } from '@/components/ui/sci-fi-button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface VoiceInputButtonProps {
  onTranscript: (text: string, detectedLanguage?: string) => void;
  disabled?: boolean;
  className?: string;
}

export default function VoiceInputButton({ 
  onTranscript, 
  disabled = false,
  className 
}: VoiceInputButtonProps) {
  const { currentLanguage, isVoiceSupported, voiceInputEnabled } = useLanguage();
  const haptic = useHapticFeedback();
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Map language codes to BCP 47 language tags for speech recognition
  const languageTagMap: Record<string, string> = {
    en: 'en-US',
    es: 'es-ES',
    fr: 'fr-FR',
    de: 'de-DE',
    it: 'it-IT',
    pt: 'pt-BR',
    ja: 'ja-JP',
    ko: 'ko-KR',
    zh: 'zh-CN',
    ar: 'ar-SA',
    hi: 'hi-IN',
    ru: 'ru-RU',
  };

  const startListening = useCallback(() => {
    if (!isVoiceSupported) {
      toast.error('Voice input is not supported in your browser');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      toast.error('Speech recognition not available');
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = languageTagMap[currentLanguage] || 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result: any) => result.transcript)
        .join('');

      if (event.results[0].isFinal) {
        setIsProcessing(true);
        onTranscript(transcript, currentLanguage);
        setIsProcessing(false);
        setIsListening(false);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        toast.error('Microphone access denied. Please enable microphone permissions.');
      } else if (event.error !== 'aborted') {
        toast.error(`Voice input error: ${event.error}`);
      }
      setIsListening(false);
      setIsProcessing(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      toast.error('Failed to start voice input');
      setIsListening(false);
    }
  }, [currentLanguage, isVoiceSupported, onTranscript]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  const toggleListening = useCallback(() => {
    haptic.trigger('medium');
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening, haptic]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  if (!isVoiceSupported) {
    return null;
  }

  return (
    <SciFiButton
      variant={isListening ? 'accent' : 'ghost'}
      size="icon"
      onClick={toggleListening}
      disabled={disabled || isProcessing}
      className={cn(
        'relative transition-all',
        isListening && 'ring-2 ring-neon-cyan animate-pulse',
        className
      )}
      title={isListening ? 'Stop listening' : 'Voice input'}
    >
      {isProcessing ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isListening ? (
        <MicOff className="w-4 h-4" />
      ) : (
        <Mic className="w-4 h-4" />
      )}
      
      {/* Listening indicator */}
      {isListening && (
        <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
      )}
    </SciFiButton>
  );
}
