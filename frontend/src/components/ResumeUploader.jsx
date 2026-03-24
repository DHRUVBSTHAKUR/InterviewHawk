import React, { useState } from 'react';

export default function ResumeUploader({ onQuestionGenerated }) {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setError(null);
    } else {
      setFile(null);
      setError("Please select a valid PDF file.");
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('resume', file);

    // Get the token from localStorage (assuming you store it there after login)
    const token = localStorage.getItem('access_token') || localStorage.getItem('token');

    try {
      const response = await fetch('http://127.0.0.1:8000/api/generate-question/', {
        method: 'POST',
        headers: {
          // IMPORTANT: This allows the @permission_classes([IsAuthenticated]) to work
          'Authorization': `Bearer ${token}` 
        },
        body: formData,
      });

      if (response.status === 401) {
        throw new Error('Unauthorized: Please log in again.');
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Server error occurred.');
      }

      // Pass BOTH the question and session_id back to the parent
      // Your parent component needs the session_id to submit the answer later!
      if (data.question && data.session_id) {
        onQuestionGenerated(data.question, data.session_id);
      } else {
         setError("Backend didn't return a question. Check terminal.");
      }

    } catch (err) {
      setError(err.message || "Connection failed. Is the server running?");
      console.error("Upload Error:", err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{
      background: '#1a1a1a', 
      padding: '20px', 
      borderRadius: '10px', 
      marginBottom: '20px', 
      border: '1px solid #333',
      boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
    }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#00ffff', fontFamily: 'sans-serif' }}>
        🦅 InterviewHawk: Upload Resume
      </h3>
      
      <div style={{ 
        display: 'flex', 
        flexDirection: window.innerWidth < 600 ? 'column' : 'row',
        gap: '15px', 
        alignItems: 'center' 
      }}>
        <input 
          type="file" 
          accept="application/pdf" 
          onChange={handleFileChange}
          style={{ 
            color: '#ccc',
            background: '#222',
            padding: '10px',
            borderRadius: '5px',
            border: '1px dashed #444',
            width: '100%'
          }}
        />
        
        <button 
          onClick={handleUpload} 
          disabled={!file || isUploading}
          style={{
            padding: '12px 24px', 
            borderRadius: '6px', 
            border: 'none', 
            fontWeight: 'bold', 
            cursor: (!file || isUploading) ? 'not-allowed' : 'pointer',
            background: (!file || isUploading) ? '#444' : 'linear-gradient(45deg, #bd00ff, #00ffff)', 
            color: '#fff',
            whiteSpace: 'nowrap',
            transition: 'transform 0.2s'
          }}
          onMouseOver={(e) => !isUploading && (e.target.style.transform = 'scale(1.02)')}
          onMouseOut={(e) => (e.target.style.transform = 'scale(1)')}
        >
          {isUploading ? 'Analyzing...' : 'Analyze Resume'}
        </button>
      </div>

      {error && (
        <p style={{ color: '#ff3366', marginTop: '12px', fontSize: '14px', fontWeight: '500' }}>
          ⚠️ {error}
        </p>
      )}
      
      {file && !error && !isUploading && (
        <p style={{ color: '#00ff00', marginTop: '12px', fontSize: '14px' }}>
          ✅ Selected: {file.name}
        </p>
      )}
    </div>
  );
}