'use client';

import { useEffect, useRef, useState } from 'react';
import Footer from '@/components/Footer';

export default function Home() {
  const [text, setText] = useState(''); // Transcribed user speech
  const [botResponse, setBotResponse] = useState(''); // Bot's reply
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]); // Available voices
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null); // Selected voice
  const [rate, setRate] = useState(1); // Speech rate
  const [isListening, setIsListening] = useState(false); // Microphone state

  // Reference to SpeechRecognition instance to persist across renders
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognitionConstructor =
      typeof window !== 'undefined' ? (window.SpeechRecognition || (window as any).webkitSpeechRecognition) : null;

    if (SpeechRecognitionConstructor) {
      recognitionRef.current = new SpeechRecognitionConstructor();
      const recognition = recognitionRef.current;

      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = async (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        setText(transcript);

        const response = await generateBotResponse(transcript.toLowerCase());
        setBotResponse(response);
        speakText(response);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      const englishVoices = allVoices.filter((voice) =>
        voice.lang.toLowerCase().includes('en')
      );
      setVoices(englishVoices);
      if (englishVoices.length > 0 && !selectedVoice) {
        setSelectedVoice(englishVoices[0]);
      }
    };

    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [selectedVoice]);

  const generateBotResponse = async (input: string): Promise<string> => {
    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      });
      console.log(res);
      const data = await res.json();
      return data.response;
    } catch (error) {
      console.error('Error generating response:', error);
      return "Sorry, I couldn't process that.";
    }
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const speakText = (textToSpeak: string) => {
    if (!textToSpeak.trim()) return;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.rate = rate;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    window.speechSynthesis.cancel();
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6 text-gray-300 font-sans">
      <div className="bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-md space-y-6 border border-gray-700">
        <h1 className="text-2xl font-bold text-center text-white tracking-wide">
          🗣️ English Speaker Bot
        </h1>

        <div className="border border-gray-700 rounded-md p-4 h-40 overflow-auto bg-gray-900 text-sm">
          <p className="mb-2">
            <span className="font-semibold text-indigo-400">You said:</span>{' '}
            {text || <span className="text-gray-500 italic">Nothing yet...</span>}
          </p>
          <p>
            <span className="font-semibold text-indigo-400">Bot response:</span>{' '}
            {botResponse || <span className="text-gray-500 italic">Waiting for your input...</span>}
          </p>
        </div>

        <div className="flex flex-col space-y-4">
          <label className="block">
            <span className="text-gray-300 font-medium">Voice:</span>
            <select
              className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-900 text-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={selectedVoice?.name || ''}
              onChange={(e) =>
                setSelectedVoice(voices.find((v) => v.name === e.target.value) || null)
              }
            >
              {voices.map((voice) => (
                <option key={voice.name} value={voice.name}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-gray-300 font-medium">Speed: {rate.toFixed(1)}</span>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(parseFloat(e.target.value))}
              className="w-full mt-1 accent-indigo-500"
            />
          </label>

          <div className="flex justify-center space-x-6">
            <button
              onClick={startListening}
              disabled={isListening || !recognitionRef.current}
              className={`p-4 rounded-full transition
                ${isListening ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'}
                disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold shadow-md`}
            >
              {isListening ? '🎙️ Listening...' : '🎙️ Speak'}
            </button>

            <button
              onClick={stopListening}
              className="p-4 rounded-full bg-gray-700 text-white hover:bg-gray-600 font-semibold shadow-md"
            >
              🛑 Stop
            </button>
          </div>
        </div>
      <Footer />
      </div>
    </div>
  );
}

