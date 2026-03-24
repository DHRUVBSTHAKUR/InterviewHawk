import { useState, useEffect } from 'react'
import axios from 'axios'
import InterviewRoom from './components/InterviewRoom'
import LandingPage from './components/LandingPage' 
import Login from './components/Login' 
import InterviewHistory from './components/InterviewHistory'
import './App.css'

export default function App() {
  const [showInterview, setShowInterview] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false) 
  const [currentView, setCurrentView] = useState('upload') 
  
  // NEW: State for difficulty
  const [difficulty, setDifficulty] = useState('Easy')
  
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
    setCurrentView('upload'); 
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
    // Send difficulty to the backend
    formData.append('difficulty', difficulty)

    const token = localStorage.getItem('access_token');

    try {
      const { data } = await axios.post('https://interviewhawk-backend.onrender.com/api/generate-question/', formData, {
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
      if (err.response?.status === 401) handleLogout();
    } finally {
      setUploading(false)
      e.target.value = null
    }
  }

  if (!showInterview) return <LandingPage onStart={() => setShowInterview(true)} />;
  if (!isAuthenticated) return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;

  return (
    <div className="app" style={{ background: '#0a0a0a', minHeight: '100vh', color: '#fff' }}>
      <header className="header" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '20px 40px', 
        borderBottom: '1px solid #333',
        background: '#111'
      }}>
        <h1 
          onClick={() => {setShowInterview(false); setQuestion('');}} 
          style={{ margin: 0, color: '#00ffff', cursor: 'pointer', fontSize: '24px' }}
        >
          🦅 InterviewHawk
        </h1>
        
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          {/* Difficulty Selector */}
          {currentView === 'upload' && !question && (
            <div style={{ display: 'flex', background: '#222', borderRadius: '8px', padding: '4px' }}>
              {['Easy', 'Medium', 'Hard'].map((level) => (
                <button
                  key={level}
                  onClick={() => setDifficulty(level)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    background: difficulty === level ? 'linear-gradient(45deg, #bd00ff, #00ffff)' : 'transparent',
                    color: difficulty === level ? '#fff' : '#888',
                    transition: '0.3s'
                  }}
                >
                  {level}
                </button>
              ))}
            </div>
          )}

          <button 
            onClick={() => setCurrentView('upload')}
            style={{ background: 'transparent', color: currentView === 'upload' ? '#00ffff' : '#aaa', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
          >
            New Interview
          </button>
          
          <button 
            onClick={() => setCurrentView('history')}
            style={{ background: 'transparent', color: currentView === 'history' ? '#00ffff' : '#aaa', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
          >
            History
          </button>

          {currentView === 'upload' && !question && (
            <label style={{ 
                background: uploading ? '#444' : '#bd00ff', 
                color: '#fff', 
                padding: '10px 20px', 
                borderRadius: '8px', 
                cursor: uploading ? 'wait' : 'pointer',
                fontWeight: 'bold'
              }}>
              <input type="file" accept=".pdf" onChange={handleUpload} disabled={uploading} style={{ display: 'none' }} />
              {uploading ? 'Analyzing...' : '📄 Upload Resume'}
            </label>
          )}

          <button 
            onClick={handleLogout}
            style={{ background: 'transparent', color: '#ff3366', border: '1px solid #ff3366', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Logout
          </button>
        </div>
      </header>

      <main style={{ padding: '20px' }}>
        {error && (
          <div style={{ background: 'rgba(255, 51, 102, 0.1)', color: '#ff3366', padding: '15px', textAlign: 'center', marginBottom: '20px', borderRadius: '8px', border: '1px solid #ff3366' }}>
            ⚠️ {error}
          </div>
        )}

        {currentView === 'upload' ? (
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <InterviewRoom question={question} sessionId={sessionId} difficulty={difficulty} />
          </div>
        ) : (
          <InterviewHistory />
        )}
      </main>
    </div>
  )
}