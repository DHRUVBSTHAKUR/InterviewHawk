import { useEffect, useRef, useState } from 'react';
import FaceMonitor from './FaceMonitor';

const PLACEHOLDER = 'Upload a resume to get your first question.';

export default function InterviewRoom({ question, sessionId }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  
  // States for grading
  const [isGrading, setIsGrading] = useState(false);
  const [evaluation, setEvaluation] = useState(null);

  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);
  const finalTranscriptRef = useRef('');

  useEffect(() => {
    // Reset state when a new question or session arrives
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
      recognitionRef.current = null;
    }
    isListeningRef.current = false;
    setIsListening(false);
    finalTranscriptRef.current = '';
    setTranscript('');
    setEvaluation(null);

    if (!question || question === PLACEHOLDER) return;

    window.speechSynthesis.cancel();

    const speak = () => {
      const utterance = new SpeechSynthesisUtterance(question);
      utterance.rate = 0.9;
      const voices = window.speechSynthesis.getVoices();
      const enVoice = voices.find((v) => v.lang.startsWith('en-US') && v.default) || 
                      voices.find((v) => v.lang.startsWith('en-US')) || 
                      voices.find((v) => v.lang.startsWith('en'));
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
  }, [question, sessionId]);

  const startSpeechToText = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported in this browser. Try Chrome.');
      return;
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

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscriptRef.current += result[0].transcript + ' ';
        } else {
          interim += result[0].transcript;
        }
      }
      setTranscript(finalTranscriptRef.current + interim);
    };

    recognition.onerror = (err) => {
      console.error('Speech Error:', err);
      setIsListening(false);
    };

    recognition.onend = () => {
        setIsListening(false);
    };

    recognition.start();
  };

  const stopAndGrade = async () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const finalAnswer = transcript.trim();
    if (!finalAnswer) {
      alert("Please provide an answer first!");
      return;
    }

    setIsGrading(true);
    
    // Get token for authenticated request
    const token = localStorage.getItem('access_token') || localStorage.getItem('token');

    try {
      const response = await fetch('https://interviewhawk-backend.onrender.com/api/grade-answer/', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          session_id: sessionId, // CRITICAL: Links to the DB record
          question: question,
          answer: finalAnswer
        })
      });

      if (!response.ok) throw new Error("Grading failed");
      
      const data = await response.json();
      setEvaluation(data); 
      
    } catch (error) {
      console.error("Grading Error:", error);
      setEvaluation({ score: "N/A", feedback: "Connection to AI Grader lost. Please check your internet." });
    } finally {
      setIsGrading(false);
    }
  };

  return (
    <div className="interview-room" style={{ color: '#fff', maxWidth: '900px', margin: '0 auto' }}>
      <div className="question-panel" style={{ background: '#111', padding: '20px', borderRadius: '12px', borderLeft: '5px solid #bd00ff', marginBottom: '20px' }}>
        <h2 style={{ color: '#bd00ff', marginTop: 0 }}>🦅 InterviewHawk Question</h2>
        <p className="question-text" style={{ fontSize: '1.2rem', lineHeight: '1.6' }}>{question || PLACEHOLDER}</p>
      </div>

      <div className="camera-panel" style={{ position: 'relative' }}>
        <div style={{ borderRadius: '15px', overflow: 'hidden', border: '2px solid #333' }}>
            {question && question !== PLACEHOLDER && <FaceMonitor />}
        </div>

        <div className="transcript-box-wrap" style={{ marginTop: '20px' }}>
          <div className="transcript-label" style={{ color: '#00ffff', fontWeight: 'bold', marginBottom: '5px' }}>Live Transcript</div>
          <div className="transcript-box" style={{ background: '#000', padding: '15px', borderRadius: '8px', minHeight: '80px', border: '1px solid #222' }}>
            {transcript || <span style={{ opacity: 0.4 }}>Your response will appear here...</span>}
          </div>
        </div>

        <div className="recording-controls" style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
          <button
            onClick={startSpeechToText}
            disabled={isListening || isGrading || !question || question === PLACEHOLDER}
            style={{
              flex: 1, padding: '12px', borderRadius: '8px', border: 'none', fontWeight: 'bold',
              background: isListening ? '#444' : '#00ffcc', color: '#000', cursor: 'pointer'
            }}
          >
            {isListening ? '🎙️ Listening...' : '▶️ Start Speaking'}
          </button>
          
          <button
            onClick={stopAndGrade}
            disabled={!isListening}
            style={{
              flex: 1, padding: '12px', borderRadius: '8px', border: 'none', fontWeight: 'bold',
              background: '#ff3366', color: '#fff', cursor: 'pointer'
            }}
          >
            ⏹️ Finish & Grade
          </button>
        </div>

        {isGrading && (
          <div style={{ marginTop: '20px', padding: '15px', background: '#222', borderRadius: '8px', textAlign: 'center', border: '1px solid #00ffff' }}>
            <span style={{ animation: 'pulse 1.5s infinite' }}>⚙️ Analyzing your logic...</span>
          </div>
        )}

        {evaluation && (
          <div style={{ 
            marginTop: '25px', padding: '20px', borderRadius: '12px', 
            background: 'linear-gradient(145deg, #1a1a1a, #000)', border: '1px solid #bd00ff'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#bd00ff' }}>📊 AI Feedback Report</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <span style={{ fontSize: '24px' }}>🏆</span>
                <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#00ffff' }}>{evaluation.score}</span>
            </div>
            <p style={{ color: '#eee', lineHeight: '1.6', fontSize: '15px' }}>
              <strong>Critique:</strong> {evaluation.feedback}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}