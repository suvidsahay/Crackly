import React, { useEffect, useState, useRef } from 'react';
import './Header.css';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { useNavigate, useLocation } from 'react-router-dom';

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(auth.currentUser);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  // Close menu if clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      navigate('/app');
    } catch (error) {
      alert("Google sign-in failed. Please try again.");
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    if (location.pathname === '/app') {
      navigate('/');
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Are you sure you want to delete your account? This cannot be undone.")) {
      try {
        await user.delete();
        alert("Account deleted.");
        if (location.pathname === '/app') {
          navigate('/');
        }
      } catch (error) {
        if (error.code === 'auth/requires-recent-login') {
          alert("Please log in again to delete your account.");
          await signOut(auth);
          navigate('/');
        } else {
          alert("Failed to delete account: " + error.message);
        }
      }
    }
  };

  return (
    <header className="crackedly-header">
      <div
        className="crackedly-logo-row"
        style={{ cursor: 'pointer' }}
        onClick={() => navigate('/')}
        title="Go to Home"
      >
        <img src="/crackedly.png" alt="Crackedly Logo" className="crackedly-logo-img" />
      </div>
      <div className="crackedly-signin-row">
        {user ? (
          <div className="user-info" ref={menuRef}>
            <img
              src={user.photoURL}
              alt="User"
              className="user-avatar"
              onClick={() => setMenuOpen((open) => !open)}
              title="Account"
              style={{ cursor: 'pointer' }}
            />
            {menuOpen && (
              <div className="user-menu">
                <button onClick={handleSignOut}>Log out</button>
                <button onClick={handleDeleteAccount}>Delete account</button>
              </div>
            )}
          </div>
        ) : (
          <button className="signin-btn" onClick={handleSignIn}>
            Sign In
          </button>
        )}
      </div>
    </header>
  );
}

export default Header;
