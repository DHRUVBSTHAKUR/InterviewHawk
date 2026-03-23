import { useState } from 'react'
import axios from 'axios'
import InterviewRoom from './components/InterviewRoom'
import './App.css'

export default function App() {
  const [question, setQuestion] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

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

    try {
      // 👇 THE FIX: Point directly to the Django server on port 8000
      const { data } = await axios.post('http://127.0.0.1:8000/api/generate-question/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      
      // Send the generated question down to the InterviewRoom
      setQuestion(data.question)
      
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to generate question.'
      setError(msg)
      console.error("Upload Error:", err)
    } finally {
      setUploading(false)
      // Reset the file input so you can upload the same file again if needed
      e.target.value = null
    }
  }

  return (
    <div className="app">
      <header className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px' }}>
        <h1 style={{ margin: 0, color: '#00ffff' }}>InterviewHawk</h1>
        
        <label 
          className="upload-btn" 
          style={{ 
            background: uploading ? '#444' : '#bd00ff', 
            color: '#fff', 
            padding: '10px 20px', 
            borderRadius: '8px', 
            cursor: uploading ? 'wait' : 'pointer',
            fontWeight: 'bold'
          }}
        >
          <input
            type="file"
            accept=".pdf"
            onChange={handleUpload}
            disabled={uploading}
            style={{ display: 'none' }}
          />
          {uploading ? '⚙️ Analyzing Resume...' : '📄 Upload Resume'}
        </label>
      </header>

      {error && (
        <div style={{ background: '#330000', color: '#ff3366', padding: '10px', textAlign: 'center', margin: '0 20px', borderRadius: '5px' }}>
          {error}
        </div>
      )}

      {/* Pass the AI-generated question to the room */}
      <InterviewRoom question={question} />
    </div>
  )
}