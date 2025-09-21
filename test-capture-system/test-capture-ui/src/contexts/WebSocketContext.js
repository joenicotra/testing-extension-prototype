import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const WebSocketContext = createContext();

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [session, setSession] = useState(null);
  const [actions, setActions] = useState([]);
  const [voiceIntents, setVoiceIntents] = useState([]);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3001');

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      // Request current session data when connected
      ws.send(JSON.stringify({ type: 'GET_SESSION' }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleMessage(data);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, []);

  const handleMessage = (data) => {
    console.log('Received message:', data.type, data);
    switch (data.type) {
      case 'RECORDING_STARTED':
        setSession({
          id: data.sessionId,
          startTime: data.startTime,
          actions: [],
          voiceIntents: []
        });
        setActions([]);
        setVoiceIntents([]);
        break;

      case 'ACTION_CAPTURED':
        console.log('Action captured in React:', data.action);
        setActions(prev => [...prev, data.action]);
        setSession(prev => ({
          ...prev,
          actions: [...(prev?.actions || []), data.action]
        }));
        break;

      case 'VOICE_INTENT_CAPTURED':
        setVoiceIntents(prev => [...prev, data.intent]);
        setSession(prev => ({
          ...prev,
          voiceIntents: [...(prev?.voiceIntents || []), data.intent]
        }));
        break;

      case 'RECORDING_STOPPED':
        if (data.session) {
          setSession(data.session);
        }
        break;

      case 'SESSION_DATA':
        console.log('Session data received:', data.session);
        if (data.session) {
          setSession(data.session);
          setActions(data.session.actions || []);
          setVoiceIntents(data.session.voiceIntents || []);
        }
        break;

      default:
        console.log('Unknown message type:', data.type);
    }
  };

  const sendMessage = (message) => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  };

  const startRecording = () => {
    sendMessage({ type: 'START_RECORDING' });
  };

  const stopRecording = () => {
    sendMessage({ type: 'STOP_RECORDING' });
  };

  const sendVoiceIntent = (intent) => {
    sendMessage({
      type: 'VOICE_INTENT',
      intent: {
        text: intent,
        timestamp: new Date().toISOString()
      }
    });
  };

  const getSession = () => {
    sendMessage({ type: 'GET_SESSION' });
  };

  const value = {
    socket,
    isConnected,
    session,
    actions,
    voiceIntents,
    startRecording,
    stopRecording,
    sendVoiceIntent,
    getSession,
    sendMessage
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};