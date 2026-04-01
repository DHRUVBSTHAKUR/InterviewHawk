import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function InterviewHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      const token = localStorage.getItem('access_token');
      try {
        const { data } = await axios.get('https://interviewhawk-backend.onrender.com/api/history/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setHistory(data);
      } catch (err) {
        setError('Failed to load history.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) return <div style={{ color: '#00ffff', textAlign: 'center', marginTop: '50px' }}>Loading your past flights... 🦅</div>;
  if (error) return <div style={{ color: '#ff3366', textAlign: 'center', marginTop: '50px' }}>{error}</div>;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', color: '#fff', padding: '20px' }}>
      <h2 style={{ color: '#bd00ff', borderBottom: '2px solid #333', paddingBottom: '10px', marginBottom: '30px' }}>
        📊 Team Interview History
      </h2>
      
      {history.length === 0 ? (
        <p style={{ color: '#aaa' }}>No interviews yet. Upload a resume to get started!</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {history.map((session) => (
            <div key={session.id} style={{
              background: '#161616', 
              padding: '20px', 
              borderRadius: '12px',
              borderLeft: `6px solid ${parseInt(session.score) >= 7 ? '#00ffcc' : '#ff3366'}`,
              boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <span style={{ 
                    background: '#bd00ff', 
                    color: '#fff', 
                    padding: '4px 12px', 
                    borderRadius: '20px', 
                    fontSize: '12px', 
                    fontWeight: 'bold',
                    textTransform: 'uppercase'
                  }}>
                    👤 {session.username}
                  </span>
                  <span style={{ color: '#666', fontSize: '13px' }}>📅 {session.date}</span>
                </div>
                <span style={{ 
                  fontWeight: 'bold', 
                  color: parseInt(session.score) >= 7 ? '#00ffcc' : '#ff3366',
                  fontSize: '18px'
                }}>
                  {session.score}
                </span>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <p style={{ margin: '0 0 5px 0', color: '#888', fontSize: '12px', fontWeight: 'bold' }}>QUESTION</p>
                <p style={{ margin: 0, fontSize: '15px', lineHeight: '1.5', color: '#eee' }}>{session.question}</p>
              </div>

              <div style={{ background: '#000', padding: '15px', borderRadius: '8px', border: '1px solid #333' }}>
                <p style={{ margin: '0 0 5px 0', color: '#bd00ff', fontSize: '12px', fontWeight: 'bold' }}>HAWK FEEDBACK</p>
                <p style={{ margin: 0, fontSize: '14px', color: '#ccc', lineHeight: '1.4' }}>{session.feedback}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}