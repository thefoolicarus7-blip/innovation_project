import React, { useEffect, useState, useRef, useCallback } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { io, Socket } from "socket.io-client";

export function InterviewPrepPage() {
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  const [socket, setSocket] = useState<Socket | null>(null);
  const [topic, setTopic] = useState("Software Engineering");
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const synthRef = useRef<SpeechSynthesis>(window.speechSynthesis);
  const transcriptRef = useRef(transcript);
  const socketRef = useRef<Socket | null>(null);

  // Sync refs with state for use in global event listeners
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  useEffect(() => {
    socketRef.current = socket;
  }, [socket]);

  // Function to speak AI response
  const speak = useCallback((text: string) => {
    if (!synthRef.current) return;

    // Cancel any ongoing speech
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    utterance.onstart = () => setIsAiSpeaking(true);
    utterance.onend = () => setIsAiSpeaking(false);
    utterance.onerror = () => setIsAiSpeaking(false);

    // Optional: Select a specific voice if available
    const voices = synthRef.current.getVoices();
    const preferredVoice = voices.find(v => v.name.includes("Google") && v.lang.startsWith("en")) || voices[0];
    if (preferredVoice) utterance.voice = preferredVoice;

    synthRef.current.speak(utterance);
  }, []);

  const handleStartPTT = useCallback(() => {
    if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
    resetTranscript();
    SpeechRecognition.startListening({ continuous: true });
  }, [resetTranscript]);

  const handleEndPTT = useCallback(() => {
    SpeechRecognition.stopListening();
    // Use a small timeout to ensure the final bit of transcript is captured
    setTimeout(() => {
      const currentTranscript = transcriptRef.current;
      const currentSocket = socketRef.current;
      if (currentTranscript.trim() && currentSocket) {
        currentSocket.emit("interview:message", { message: currentTranscript });
        resetTranscript();
      }
    }, 150);
  }, [resetTranscript]);

  // Keyboard support for spacebar
  useEffect(() => {
    if (!isInterviewActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Trigger if space is pressed and we aren't already listening
      if (e.code === "Space" && !e.repeat) {
        // Don't trigger if user is typing in an input (though none are visible during interview)
        if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") return;
        
        e.preventDefault();
        handleStartPTT();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        handleEndPTT();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isInterviewActive, handleStartPTT, handleEndPTT]);

  useEffect(() => {
    if (!isInterviewActive) return;

    const socketUrl = import.meta.env.VITE_API_BASE_URL?.replace("/api", "") || "http://localhost:3000";
    const newSocket = io(socketUrl, {
      withCredentials: true,
    });
    setSocket(newSocket);

    newSocket.on("connect", () => {
      newSocket.emit("interview:start", { topic });
    });

    newSocket.on("interview:reply", (data: { reply: string }) => {
      speak(data.reply);
    });

    newSocket.on("interview:error", (data: { message: string }) => {
      setError(data.message);
    });

    return () => {
      newSocket.disconnect();
      if (synthRef.current) synthRef.current.cancel();
    };
  }, [isInterviewActive, topic, speak]);

  const startInterview = () => {
    setError(null);
    setIsInterviewActive(true);
  };

  const stopInterview = () => {
    setIsInterviewActive(false);
    if (socket) socket.disconnect();
    setSocket(null);
    if (synthRef.current) synthRef.current.cancel();
    resetTranscript();
  };

  if (!browserSupportsSpeechRecognition) {
    return (
      <div className="centered-page">
        <div className="panel">
          <p>Your browser does not support speech recognition. Please try Chrome or Edge.</p>
        </div>
      </div>
    );
  }

  if (!isInterviewActive) {
    return (
      <div className="centered-page">
        <div className="meet-setup">
          <div className="meet-setup-icon">🎙️</div>
          <h1>AI Technical Interview</h1>
          <p>Ready to join? Practice your skills in a realistic voice call environment.</p>
          
          <div className="field-wrap" style={{ textAlign: "left" }}>
            <label>Interview Topic</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. React, Node.js, System Design"
            />
          </div>

          <button onClick={startInterview} className="primary-btn" style={{ padding: "16px" }}>
            Join Interview
          </button>
          
          {error && <p style={{ color: "var(--danger)", fontSize: "0.9rem" }}>{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="meet-layout">
      <div className="meet-main">
        <div className="meet-avatar-container">
          <div className={`meet-avatar ${isAiSpeaking ? "speaking" : ""}`}>
            <span>AI</span>
            <div className="meet-avatar-pulse"></div>
          </div>
          <div className="meet-participant-name">
            {isAiSpeaking ? "AI Interviewer is speaking..." : "AI Interviewer"}
          </div>
        </div>

        {error && (
          <div style={{ position: "absolute", top: "20px", background: "rgba(239, 68, 68, 0.9)", color: "white", padding: "10px 20px", borderRadius: "8px" }}>
            {error}
          </div>
        )}
      </div>

      <div className="meet-controls">
        <button 
          className={`meet-btn ptt ${listening ? "active" : ""}`}
          onMouseDown={handleStartPTT}
          onMouseUp={handleEndPTT}
          onTouchStart={handleStartPTT}
          onTouchEnd={handleEndPTT}
          title="Hold Spacebar to Speak"
        >
          {listening ? "🎤 Listening..." : "🎤 Hold Spacebar to Speak"}
        </button>

        <button 
          onClick={stopInterview} 
          className="meet-btn danger"
          title="End Call"
        >
          📞
        </button>
      </div>
    </div>
  );
}

export default InterviewPrepPage;
