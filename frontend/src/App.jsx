import './App.css';
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './LandingPage';
import InterviewForm from './InterviewForm';
import Header from './Header';

function App() {
  return (
    <Router>
      <Header />
      <div className="app-content">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/app" element={<InterviewForm />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;