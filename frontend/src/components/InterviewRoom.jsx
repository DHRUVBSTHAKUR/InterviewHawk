import { useEffect, useRef, useState } from 'react';
import FaceMonitor from './FaceMonitor';

const PLACEHOLDER = 'Upload a resume to get your first question.';

export default function InterviewRoom({ question }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  
  // NEW STATES FOR GRADING
  const [isGrading, setIsGrading] = useState(false);
  const [evaluation, setEvaluation] = useState(null);

  // Keeps a stable reference to the active SpeechRecognition instance.
  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);
  const finalTranscriptRef = useRef('');

  useEffect(() => {
    // If a new question arrives, stop listening and clear the old grade
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
      recognitionRef.current = null;
    }
    isListeningRef.current = false;
    setIsListening(false);
    finalTranscriptRef.current = '';
    setTranscript('');
    setEvaluation(null); // Clear old report card

    if (!question || question === PLACEHOLDER) return;

    window.speechSynthesis.cancel();

    const speak = () => {
      const utterance = new SpeechSynthesisUtterance(question);
      utterance.rate = 0.9;
      const voices = window.speechSynthesis.getVoices();
      const enVoice = voices.find((v) => v.lang.startsWith('en-US') && v.default) || voices.find((v) => v.lang.startsWith('en-US')) || voices.find((v) => v.lang.startsWith('en'));
      if (enVoice) utterance.voice = enVoice;
      window.speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis.getVoices().length > 0) {
      speak();
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        speak();
        window.speechSynthesis.onvoiceschanged = null;
      };
    }

    return () => window.speechSynthesis.cancel();
  }, [question]);

  const startSpeechToText = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error('SpeechRecognition is not supported in this browser.');
      return;
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
      recognitionRef.current = null;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    isListeningRef.current = true;
    setIsListening(true);
    finalTranscriptRef.current = '';
    setTranscript('');
    setEvaluation(null); // Clear previous grade when starting a new answer

    recognition.onresult = (event) => {
      if (!isListeningRef.current) return;
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const text = result?.[0]?.transcript || '';

        if (result.isFinal) {
          const trimmed = text.trim();
          if (!trimmed) continue;
          const current = finalTranscriptRef.current;
          const spacer = current && !current.endsWith(' ') ? ' ' : '';
          finalTranscriptRef.current = current + spacer + trimmed;
        } else {
          interim = text.trim();
        }
      }

      const composed = interim ? `${finalTranscriptRef.current}${finalTranscriptRef.current ? ' ' : ''}${interim}` : finalTranscriptRef.current;
      setTranscript(composed);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event);
      isListeningRef.current = false;
      setIsListening(false);
    };

    recognition.onend = () => {
      isListeningRef.current = false;
      setIsListening(false);
      recognitionRef.current = null;
    };

    try { recognition.start(); } catch (err) {
      console.error('Failed to start SpeechRecognition:', err);
      isListeningRef.current = false;
      setIsListening(false);
      recognitionRef.current = null;
    }
  };

  // NEW FUNCTION: Stop recording and send data to Django Brain
  const stopAndGrade = async () => {
    if (recognitionRef.current) {
      isListeningRef.current = false;
      setIsListening(false);
      try { recognitionRef.current.stop(); } catch (err) {}
      recognitionRef.current = null;
    }

    // Don't grade if they didn't say anything
    const finalAnswer = transcript || finalTranscriptRef.current;
    if (!finalAnswer.trim()) {
      alert("Please say something before stopping the answer!");
      return;
    }

    setIsGrading(true);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/grade-answer/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question,
          answer: finalAnswer
        })
      });

      if (!response.ok) throw new Error("Failed to fetch grade");
      
      const data = await response.json();
      setEvaluation(data); // Save the score and feedback to show on screen
      
    } catch (error) {
      console.error("Grading Error:", error);
      setEvaluation({ score: "Error", feedback: "Could not connect to the AI Grader." });
    } finally {
      setIsGrading(false);
    }
  };

  return (
    <div className="interview-room">
      <div className="question-panel">
        <h2>Interview Question</h2>
        <p className="question-text">{question || PLACEHOLDER}</p>
      </div>

      <div className="camera-panel">
        <h3>Your Camera</h3>
        {question && <FaceMonitor />}

        <div className="transcript-box-wrap">
          <div className="transcript-label">Transcript</div>
          <div className="transcript-box" aria-live="polite">
            {transcript || <span className="transcript-placeholder">Your words will appear here...</span>}
          </div>
        </div>

        <div className="recording-controls">
          <button
            type="button"
            onClick={startSpeechToText}
            disabled={isListening || isGrading}
            className={isListening ? 'listening-start' : undefined}
          >
            {isListening ? '🎙️ Listening...' : '▶️ Start Answer'}
          </button>
          
          <button
            type="button"
            onClick={stopAndGrade} // <-- Changed this to our new function!
            disabled={!isListening}
            className={isListening ? 'listening-stop' : undefined}
          >
            ⏹️ Stop & Grade
          </button>
        </div>

        {/* --- NEW: THE REPORT CARD --- */}
        {isGrading && (
          <div style={{ marginTop: '20px', padding: '15px', background: '#333', borderRadius: '8px', textAlign: 'center', color: '#00ffff' }}>
            ⚙️ AI is analyzing your technical accuracy...
          </div>
        )}

        {evaluation && (
          <div style={{ 
            marginTop: '20px', padding: '20px', borderRadius: '10px', 
            background: '#111', border: '1px solid #bd00ff',
            boxShadow: '0 0 15px rgba(189, 0, 255, 0.2)'
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#bd00ff' }}>📊 AI Report Card</h3>
            <p style={{ fontSize: '18px', margin: '10px 0' }}>
              <strong>Technical Score:</strong> <span style={{ color: '#00ffff', fontWeight: 'bold' }}>{evaluation.score}</span>
            </p>
            <p style={{ fontSize: '16px', lineHeight: '1.5', color: '#ccc', margin: 0 }}>
              <strong>Feedback:</strong> {evaluation.feedback}
            </p>
          </div>
        )}
        
      </div>
    </div>
  );
}