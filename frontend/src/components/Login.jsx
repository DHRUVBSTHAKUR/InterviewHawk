import React, { useState } from 'react';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Assuming you are using djangorestframework-simplejwt
      // and this is your standard token endpoint
      const response = await fetch('https://interviewhawk-backend.onrender.com/api/token/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Invalid username or password.');
      }

      // THE MAGIC: Save the VIP passes to the browser
      localStorage.setItem('access_token', data.access);
      if (data.refresh) {
        localStorage.setItem('refresh_token', data.refresh);
      }

      // Tell App.jsx we are good to go!
      onLoginSuccess();
      
    } catch (err) {
      setError(err.message);
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh'
    }}>
      <div style={{
        background: '#1a1a1a', padding: '40px', borderRadius: '12px', 
        border: '1px solid #bd00ff', width: '100%', maxWidth: '400px',
        boxShadow: '0 10px 30px rgba(189, 0, 255, 0.2)'
      }}>
        <h2 style={{ color: '#00ffff', textAlign: 'center', marginBottom: '20px' }}>
          🦅 InterviewHawk Login
        </h2>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ color: '#ccc', display: 'block', marginBottom: '5px' }}>Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{
                width: '100%', padding: '10px', borderRadius: '6px', 
                border: '1px solid #444', background: '#111', color: '#fff'
              }}
            />
          </div>
          
          <div>
            <label style={{ color: '#ccc', display: 'block', marginBottom: '5px' }}>Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%', padding: '10px', borderRadius: '6px', 
                border: '1px solid #444', background: '#111', color: '#fff'
              }}
            />
          </div>

          {error && <p style={{ color: '#ff3366', fontSize: '14px', margin: 0 }}>⚠️ {error}</p>}

          <button 
            type="submit" 
            disabled={isLoading}
            style={{
              padding: '12px', marginTop: '10px', borderRadius: '6px', border: 'none', 
              background: isLoading ? '#444' : 'linear-gradient(45deg, #bd00ff, #00ffff)', 
              color: '#fff', fontWeight: 'bold', cursor: isLoading ? 'wait' : 'pointer'
            }}
          >
            {isLoading ? 'Authenticating...' : 'Enter the Nest'}
          </button>
        </form>
      </div>
    </div>
  );
}