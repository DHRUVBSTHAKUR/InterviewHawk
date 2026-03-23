import React from 'react';

export default function LandingPage({ onStart }) {
  return (
    <div className="landing-container">
      <nav className="landing-nav">
        <div className="logo">Interview<span>Hawk</span></div>
        <button className="nav-btn" onClick={onStart}>Sign In</button>
      </nav>

      <main className="hero-section">
        <div className="hero-content">
          <span className="badge">AI-Powered Career Coach</span>
          <h1>Master Your Next <br /> <span className="highlight">Technical Interview</span></h1>
          <p>
            Upload your resume, get real-time facial stress analysis, 
            and receive instant AI grading on your technical answers.
          </p>
          <div className="hero-btns">
            <button className="primary-btn" onClick={onStart}>Start Mock Interview</button>
            <button className="secondary-btn">Watch Demo</button>
          </div>
        </div>
        
        <div className="hero-visual">
          {/* This represents the UI preview */}
          <div className="preview-card">
            <div className="scanner-line"></div>
            <div className="dot top-left"></div>
            <div className="dot top-right"></div>
            <div className="dot bottom-left"></div>
            <div className="dot bottom-right"></div>
            <p>Scanning Resume...</p>
          </div>
        </div>
      </main>

      <section className="features-grid">
        <div className="feature-item">
          <h3>Resume Sync</h3>
          <p>Questions tailored specifically to your internship and project history.</p>
        </div>
        <div className="feature-item">
          <h3>Stress Tracking</h3>
          <p>Real-time facial analysis to monitor confidence levels during high-pressure questions.</p>
        </div>
        <div className="feature-item">
          <h3>AI Grading</h3>
          <p>Get instant feedback and technical scores powered by GPT-4o.</p>
        </div>
      </section>
    </div>
  );
}