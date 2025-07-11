import React, { useEffect } from 'react';
import './LandingPage.css';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'; // Import Firebase Auth modules
import { auth } from './firebase'; // Assuming you exported 'auth' from src/lib/firebase.js
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import { onAuthStateChanged } from 'firebase/auth';
import { track } from '@vercel/analytics';

function LandingPage() {
  const navigate = useNavigate();

  const handleGetStarted = async () => {
    track('get_started_clicked');
    if (auth.currentUser) {
      // User is already signed in, go straight to /app
      navigate('/app');
      return;
    }
    // Otherwise, sign in
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      navigate('/app');
    } catch (error) {
      alert("Google sign-in failed. Please try again.");
    }
  };

  return (
    <div className="landing-bg">      
      <main className="landing-main">
        <div className="main-card">
          <div className="tagline">Crack Every Interview with Confidence.</div>
          <p className="desc">
            Crackedly is an AI-powered platform that helps you prepare for interviews by generating personalized, curated questions based on your profile and job description.
          </p>
          <button className="get-started-btn" onClick={handleGetStarted}>
            Get Started
          </button>
        </div>
      </main>
      <footer className="landing-footer">
        <span>Made with ❤️ for interviewees</span>
      </footer>
    </div>
  );
}

export default LandingPage;
