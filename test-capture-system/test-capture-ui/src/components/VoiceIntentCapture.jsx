import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { useWebSocket } from '../contexts/WebSocketContext';

const VoiceIntentCapture = ({ isRecording }) => {
  const { sendVoiceIntent, voiceIntents } = useWebSocket();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) {
      console.error('Speech recognition not supported');
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      console.log('Speech recognition started');
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript + ' ';
        } else {
          interim += transcript;
        }
      }

      setInterimTranscript(interim);
      if (final) {
        setTranscript(prev => prev + final);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      console.log('Speech recognition ended');
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
  };

  const sendIntent = () => {
    if (transcript.trim()) {
      sendVoiceIntent(transcript.trim());
      setTranscript('');
      setInterimTranscript('');
    }
  };

  const clearTranscript = () => {
    setTranscript('');
    setInterimTranscript('');
  };

  if (!isRecording) return null;

  return (
    <div className="voice-intent-capture">
      <h3>
        <Volume2 size={20} />
        Voice Intent Capture
      </h3>

      <div className="voice-controls">
        <button
          className={`voice-button ${isListening ? 'listening' : ''}`}
          onClick={toggleListening}
        >
          {isListening ? <Mic size={24} /> : <MicOff size={24} />}
          {isListening ? 'Listening...' : 'Start Voice'}
        </button>

        <button
          className="btn btn-send"
          onClick={sendIntent}
          disabled={!transcript.trim()}
        >
          Send Intent
        </button>

        <button
          className="btn btn-clear"
          onClick={clearTranscript}
          disabled={!transcript && !interimTranscript}
        >
          Clear
        </button>
      </div>

      <div className="transcript-area">
        <div className="transcript">
          {transcript || interimTranscript || 'Say your test expectation...'}
        </div>
      </div>

      {voiceIntents.length > 0 && (
        <div className="intents-list">
          <h4>Captured Intents:</h4>
          {voiceIntents.map((intent, index) => (
            <div key={index} className="intent-item">
              "{intent.text}"
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VoiceIntentCapture;