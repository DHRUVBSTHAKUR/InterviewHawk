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
      const { data } = await axios.post('/api/generate-question/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setQuestion(data.question)
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to generate question.'
      setError(msg)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="app">
      <header className="header">
        <h1>InterviewHawk</h1>
        <label className="upload-btn">
          <input
            type="file"
            accept=".pdf"
            onChange={handleUpload}
            disabled={uploading}
            style={{ display: 'none' }}
          />
          {uploading ? 'Generating…' : 'Upload Resume'}
        </label>
      </header>

      {error && <p className="error">{error}</p>}

      <InterviewRoom question={question} />
    </div>
  )
}
