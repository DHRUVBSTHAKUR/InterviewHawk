import { useState, useEffect } from 'react'
import axios from 'axios'
import InterviewRoom from './components/InterviewRoom'
import LandingPage from './components/LandingPage' 
import Login from './components/Login' 
import InterviewHistory from './components/InterviewHistory' // <-- Added History Import
import './App.css'

export default function App() {
  const [showInterview, setShowInterview] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false) 
  
  // NEW: State to toggle between the Interview Room and the History Dashboard
  const [currentView, setCurrentView] = useState('upload') // 'upload' or 'history'
  
  const [question, setQuestion] = useState('')
  const [sessionId, setSessionId] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setIsAuthenticated(false);
    setQuestion('');
    setSessionId(null);
    setCurrentView('upload'); // Reset view on logout
  };

  const handleUpload = async (e) => {
    const file = e?.target?.files?.[0]
    if (!file || !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please select a PDF file.')
      return
    }

    setError(null)
    setUploading(true)

    const formData = new FormData()
    formData.append('resume', file)

    const token = localStorage.getItem('access_token');

    try {
      const { data } = await axios.post('http://127.0.0.1:8000/api/generate-question/', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}` 
        },
      })
      
      setQuestion(data.question)
      setSessionId(data.session_id)
      
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to generate question.'
      setError(msg)
      
      if (err.response?.status === 401) {
        handleLogout();
      }
      
      console.error("Upload Error:", err)
    } finally {
      setUploading(false)
      e.target.value = null
    }
  }

  // --- LOGIC 1: LANDING PAGE ---
  if (!showInterview) {
    return <LandingPage onStart={() => setShowInterview(true)} />;
  }

  // --- LOGIC 2: LOGIN SCREEN ---
  if (!isAuthenticated) {
    return (
      <div className="app">
        <header className="header" style={{ padding: '20px', textAlign: 'center' }}>
          <h1 
            onClick={() => setShowInterview(false)} 
            style={{ margin: 0, color: '#00ffff', cursor: 'pointer' }}
          >
            InterviewHawk
          </h1>
        </header>
        <Login onLoginSuccess={() => setIsAuthenticated(true)} />
      </div>
    );
  }

  // --- LOGIC 3: MAIN APP (Upload or History) ---
  return (
    <div className="app">
      <header className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid #333', marginBottom: '20px' }}>
        <h1 
          onClick={() => setShowInterview(false)} 
          style={{ margin: 0, color: '#00ffff', cursor: 'pointer' }}
        >
          InterviewHawk
        </h1>
        
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          {/* NAVIGATION BUTTONS */}
          <button 
            onClick={() => setCurrentView('upload')}
            style={{ background: 'transparent', color: currentView === 'upload' ? '#00ffff' : '#aaa', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}
          >
            New Interview
          </button>
          
          <button 
            onClick={() => setCurrentView('history')}
            style={{ background: 'transparent', color: currentView === 'history' ? '#00ffff' : '#aaa', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}
          >
            History
          </button>

          {/* UPLOAD BUTTON (Only visible when taking a new interview) */}
          {currentView === 'upload' && (
            <label 
              className="upload-btn" 
              style={{ 
                background: uploading ? '#444' : '#bd00ff', 
                color: '#fff', 
                padding: '10px 20px', 
                borderRadius: '8px', 
                cursor: uploading ? 'wait' : 'pointer',
                fontWeight: 'bold',
                marginLeft: '10px'
              }}
            >
              <input type="file" accept=".pdf" onChange={handleUpload} disabled={uploading} style={{ display: 'none' }} />
              {uploading ? '⚙️ Analyzing...' : '📄 Upload Resume'}
            </label>
          )}

          {/* LOGOUT BUTTON */}
          <button 
            onClick={handleLogout}
            style={{
              background: 'transparent', color: '#ff3366', border: '1px solid #ff3366',
              padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginLeft: '10px'
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {error && (
        <div style={{ background: '#330000', color: '#ff3366', padding: '10px', textAlign: 'center', margin: '0 20px 20px 20px', borderRadius: '5px' }}>
          {error}
        </div>
      )}

      {/* CONDITIONALLY RENDER THE VIEW */}
      {currentView === 'upload' ? (
        <InterviewRoom question={question} sessionId={sessionId} />
      ) : (
        <InterviewHistory />
      )}
    </div>
  )
}