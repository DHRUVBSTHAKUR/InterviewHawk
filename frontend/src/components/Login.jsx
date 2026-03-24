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
      const response = await fetch('https://interviewhawk-backend.onrender.com/api/token/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Invalid username or password.');
      }

      localStorage.setItem('access_token', data.access);
      if (data.refresh) {
        localStorage.setItem('refresh_token', data.refresh);
      }

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
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh', // Forces full screen height for perfect vertical centering
      width: '100vw',
      background: '#0a0a0a', // Dark theme background
      margin: 0,
      padding: 0
    }}>
      <div style={{
        background: '#1a1a1a', 
        padding: '40px', 
        borderRadius: '16px', 
        border: '1px solid #bd00ff', 
        width: '90%', 
        maxWidth: '400px',
        boxShadow: '0 15px 35px rgba(189, 0, 255, 0.2)',
        textAlign: 'center'
      }}>
        <h2 style={{ 
          color: '#00ffff', 
          fontSize: '28px',
          fontWeight: 'bold',
          marginBottom: '30px',
          letterSpacing: '1px'
        }}>
          🦅 InterviewHawk
        </h2>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ textAlign: 'left' }}>
            <label style={{ color: '#aaa', display: 'block', marginBottom: '8px', fontSize: '14px' }}>Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{
                width: '100%', padding: '12px', borderRadius: '8px', 
                border: '1px solid #333', background: '#000', color: '#fff',
                outline: 'none', transition: 'border 0.3s'
              }}
              onFocus={(e) => e.target.style.border = '1px solid #00ffff'}
              onBlur={(e) => e.target.style.border = '1px solid #333'}
            />
          </div>
          
          <div style={{ textAlign: 'left' }}>
            <label style={{ color: '#aaa', display: 'block', marginBottom: '8px', fontSize: '14px' }}>Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%', padding: '12px', borderRadius: '8px', 
                border: '1px solid #333', background: '#000', color: '#fff',
                outline: 'none', transition: 'border 0.3s'
              }}
              onFocus={(e) => e.target.style.border = '1px solid #00ffff'}
              onBlur={(e) => e.target.style.border = '1px solid #333'}
            />
          </div>

          {error && (
            <p style={{ 
              color: '#ff3366', 
              fontSize: '14px', 
              background: 'rgba(255, 51, 102, 0.1)', 
              padding: '10px', 
              borderRadius: '6px' 
            }}>
              ⚠️ {error}
            </p>
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            style={{
              padding: '14px', 
              marginTop: '10px', 
              borderRadius: '8px', 
              border: 'none', 
              background: isLoading ? '#444' : 'linear-gradient(45deg, #bd00ff, #00ffff)', 
              color: '#fff', 
              fontWeight: 'bold', 
              fontSize: '16px',
              cursor: isLoading ? 'wait' : 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={(e) => !isLoading && (e.target.style.transform = 'scale(1.02)')}
            onMouseLeave={(e) => !isLoading && (e.target.style.transform = 'scale(1)')}
          >
            {isLoading ? 'Authenticating...' : 'Enter the Nest'}
          </button>
        </form>
      </div>
    </div>
  );
}