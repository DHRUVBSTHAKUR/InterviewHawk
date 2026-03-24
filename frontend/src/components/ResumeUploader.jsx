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

    try {
      // Send the file to your Django backend
      const response = await fetch('http://127.0.0.1:8000/api/generate-question/', {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header manually when sending FormData, 
        // the browser does it automatically with the correct boundary.
      });

      if (!response.ok) {
        throw new Error('Server responded with an error.');
      }

      const data = await response.json();
      
      // Pass the new question up to the main InterviewRoom component
      if (data.question) {
        onQuestionGenerated(data.question);
      } else if (data.error) {
         setError(data.error);
      }

    } catch (err) {
      setError("Failed to connect to the backend. Is the server running?");
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{
      background: '#1a1a1a', padding: '20px', borderRadius: '10px', 
      marginBottom: '20px', border: '1px solid #333'
    }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#00ffff' }}>📄 Upload Resume (PDF)</h3>
      
      <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
        <input 
          type="file" 
          accept="application/pdf" 
          onChange={handleFileChange}
          style={{ color: '#ccc' }}
        />
        
        <button 
          onClick={handleUpload} 
          disabled={!file || isUploading}
          style={{
            padding: '8px 16px', borderRadius: '6px', border: 'none', 
            fontWeight: 'bold', cursor: (!file || isUploading) ? 'not-allowed' : 'pointer',
            background: (!file || isUploading) ? '#444' : '#bd00ff', 
            color: '#fff'
          }}
        >
          {isUploading ? 'Analyzing...' : 'Generate Custom Question'}
        </button>
      </div>

      {error && <p style={{ color: '#ff3366', marginTop: '10px', fontSize: '14px' }}>{error}</p>}
      {file && !error && <p style={{ color: '#00ff00', marginTop: '10px', fontSize: '14px' }}>Ready to analyze: {file.name}</p>}
    </div>
  );
}