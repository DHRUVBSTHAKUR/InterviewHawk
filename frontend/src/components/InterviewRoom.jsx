import { useEffect, useRef, useState } from 'react';
import FaceMonitor from './FaceMonitor';

const PLACEHOLDER = 'Upload a resume to get your first question.';

export default function InterviewRoom({ question }) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);

  useEffect(() => {
    if (!question || question === PLACEHOLDER) return;

    window.speechSynthesis.cancel();

    const speak = () => {
      const utterance = new SpeechSynthesisUtterance(question);
      utterance.rate = 0.9;

      const voices = window.speechSynthesis.getVoices();
      const enVoice =
        voices.find((v) => v.lang.startsWith('en-US') && v.default) ||
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
  }, [question]);

  const startRecording = async () => {
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(audioStream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          // Will connect to backend later
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording:', err);
    }
  };

  const stopRecording = () => {
    const mediaRecorder = mediaRecorderRef.current;
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      console.log('Recording finished');
      setIsRecording(false);
      mediaRecorderRef.current = null;
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

        <div className="recording-controls">
          <button
            type="button"
            onClick={startRecording}
            disabled={isRecording}
          >
            Start Answer
          </button>
          <button
            type="button"
            onClick={stopRecording}
            disabled={!isRecording}
          >
            Stop Answer
          </button>
        </div>
      </div>
    </div>
  );
}
