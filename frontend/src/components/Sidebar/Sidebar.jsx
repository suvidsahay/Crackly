import React, { useEffect, useState } from 'react';
import { FaHistory } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './Sidebar.css';
import { API_BASE_URL } from '../../config';

function Sidebar({ token }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }
    async function fetchHistory() {
      try {
        const resp = await fetch(`${API_BASE_URL}/history?page=1&per_page=10`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!resp.ok) throw new Error(`Error: ${resp.statusText}`);
        const json = await resp.json();
        setHistory(json.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();

    // Listen for refresh event
    const handleRefresh = () => {
      setLoading(true); // Trigger re-fetch
      fetchHistory();
    };
    window.addEventListener('refreshSidebar', handleRefresh);

    // Cleanup event listener
    return () => window.removeEventListener('refreshSidebar', handleRefresh);
  }, [token]);

  const handleItemClick = (id) => {
    navigate(`/interview/${id}`);
  };

  if (loading) return <div className="sidebar">Loading history...</div>;
  if (error) return <div className="sidebar error">Error: {error}</div>;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h3>Interview History</h3>
        <FaHistory size={20} />
      </div>

      {loading && <div className="sidebar-message">Loading...</div>}
      {error && <div className="sidebar-message error">{error}</div>}
      
      {!loading && !error && (
        <ul className="history-list">
          {history.length === 0 ? (
            <li className="sidebar-message">No past interviews found.</li>
          ) : (
            history.map(item => {
              const details = item.search_results;
              return (
                <li 
                  key={item.interview_id} 
                  className="history-item"
                  onClick={() => handleItemClick(item.interview_id)}
                >
                  <div className="history-item-title">
                    {details.position || "Untitled Interview"}
                  </div>
                  <div className="history-item-subtitle">
                    {details.company}
                  </div>
                </li>
              );
            })
          )}
        </ul>
      )}
    </aside>
  );
}

export default Sidebar;