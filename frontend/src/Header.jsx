import React, { useEffect, useState } from 'react';
import './Header.css';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { useNavigate } from 'react-router-dom';

function Header() {
  const navigate = useNavigate();
  const [user, setUser] = useState(auth.currentUser);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
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
    navigate('/');
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
          <div className="user-info">
            <img src={user.photoURL} alt="User" className="user-avatar" onClick={handleSignOut} title="Sign out" />
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
