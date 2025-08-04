import './App.css';
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, useNavigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage/LandingPage';
import InterviewForm from './pages/InterviewForm/InterviewForm';
import InterviewDetail from './pages/InterviewDetail/InterviewDetail';
import Sidebar from './components/Sidebar/Sidebar';
import Header from './components/Header/Header';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

function ProtectedLayout({ token }) {
  const navigate = useNavigate();

  // Redirect to home page if no token (user not signed in)
  useEffect(() => {
    if (!token) {
      navigate('/');
    }
  }, [token, navigate]);

  return (
    // The height is adjusted to fill the viewport *below* the header.
    <div style={{ display: 'flex', width: '100%' }}>
      {token && <Sidebar token={token} />}
      <div className="app-content">
        <Outlet />
      </div>
    </div>
  );
}

function App() {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        try {
          const fetchedToken = await user.getIdToken(true); // Force token refresh
          setToken(fetchedToken);
        } catch (err) {
          console.error("Error fetching token:", err);
          setToken(null);
        } finally {
          setLoading(false);
        }
      } else {
        setToken(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div className="loading">Loading authentication...</div>;

  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route element={<ProtectedLayout token={token} />}>
          <Route path="/app" element={<InterviewForm />} />
          <Route path="/interview/:id" element={<InterviewDetail />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;