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
        const { data } = await axios.get('http://127.0.0.1:8000/api/history/', {
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

  if (loading) return <div style={{ color: '#00ffff', textAlign: 'center' }}>Loading your past flights... 🦅</div>;
  if (error) return <div style={{ color: '#ff3366', textAlign: 'center' }}>{error}</div>;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', color: '#fff' }}>
      <h2 style={{ color: '#bd00ff', borderBottom: '2px solid #333', paddingBottom: '10px' }}>
        📊 Your Interview History
      </h2>
      
      {history.length === 0 ? (
        <p style={{ color: '#aaa' }}>No interviews yet. Upload a resume to get started!</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
          {history.map((session) => (
            <div key={session.id} style={{
              background: '#111', padding: '20px', borderRadius: '10px',
              borderLeft: `5px solid ${parseInt(session.score) >= 7 ? '#00ff00' : '#ff3366'}`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ color: '#aaa', fontSize: '14px' }}>📅 {session.date}</span>
                <span style={{ fontWeight: 'bold', color: '#00ffff' }}>Score: {session.score}</span>
              </div>
              <p style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#fff' }}>
                <strong>Q:</strong> {session.question}
              </p>
              <p style={{ margin: 0, fontSize: '14px', color: '#ccc', fontStyle: 'italic' }}>
                <strong>Hawk Feedback:</strong> {session.feedback}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}