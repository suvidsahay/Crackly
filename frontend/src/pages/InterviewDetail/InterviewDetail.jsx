import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './InterviewDetail.css';
import { API_BASE_URL } from '../../config';
import { getAuth } from 'firebase/auth';
import ReactMarkdown from 'react-markdown';


function InterviewDetail() {
  const { id } = useParams();
  const [interviewData, setInterviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) {
          setError("You must be signed in to view this interview.");
          setLoading(false);
          return;
        }
        const idToken = await user.getIdToken();

        const response = await fetch(`${API_BASE_URL}/history/${id}`, {
          headers: {
            'Authorization': `Bearer ${idToken}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch interview results');
        const data = await response.json();
        setInterviewData(data);
      } catch (err) {
        setError(err.message || 'Failed to fetch interview results');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!interviewData) return <div>No interview data available.</div>;

  const search_results = interviewData.search_results;

  return (
    <div className="form-container" style={{ flex: 1, padding: '1rem' }}>
      <h1>{search_results.position} interview at {search_results.company}</h1>
      <div className="form-columns">
        <div className="form-col">
          <div className="form-section">
            <h2>Interviewer Details</h2>
            <div style={{ fontSize: '0.75em', color: '#6b7280', marginBottom: '12px' }}>
              Interviewer information retrieved for this session.
            </div>
            <div className="form-group">
              <label>Interviewer Name</label>
              <input
                type="text"
                value={search_results.interviewer_name || 'N/A'}
                readOnly
              />
            </div>
            <div className="form-group">
              <label>Interviewer Position</label>
              <input
                type="text"
                value={search_results.interviewer_position || 'N/A'}
                readOnly
              />
            </div>
            <div className="form-group">
              <label>Interviewer Profile</label>
              <textarea
                value={search_results.interviewer_profile || 'N/A'}
                readOnly
                rows={4}
              />
            </div>
          </div>
        </div>
        <div className="form-col">
          <div className="form-section">
            <h2>Job Details</h2>
            <div className="form-group">
              <label>Company</label>
              <input
                type="text"
                value={search_results.company || 'N/A'}
                readOnly
              />
            </div>
            <div className="form-group">
              <label>Position</label>
              <input
                type="text"
                value={search_results.position || 'N/A'}
                readOnly
              />
            </div>
            <div className="form-group">
              <label>Job Description URL</label>
              <input
                type="text"
                value={search_results.job_desc_url || 'N/A'}
                readOnly
              />
            </div>
            <div className="form-group">
              <label>Job Description</label>
              <textarea
                value={search_results.job_description || 'N/A'}
                readOnly
                rows={4}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="form-section resume-section">
        <h2>Resume</h2>
        <div className="form-group">
          <label>Resume Content</label>
          <textarea
            value={search_results.resume ? JSON.stringify(search_results.resume) : 'N/A'}
            readOnly
            rows={12}
          />
        </div>
      </div>
      <div className="form-section">
        <h2>Interview Preparation Results</h2>
        {search_results.past_interview_questions && (
          <div className="result-section">
            <h3>Past Interview Questions</h3>
            <div className="result-content">
              <ReactMarkdown>{search_results.past_interview_questions.answer || 'No data available'}</ReactMarkdown>
            </div>
            {search_results.past_interview_questions.sources && search_results.past_interview_questions.sources.length > 0 && (
              <div className="sources-section">
                <h4>Sources:</h4>
                {search_results.past_interview_questions.sources.map((source, idx) => (
                  <div className="source-item" key={idx}>
                    {source.title && source.url && (
                      <a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a>
                    )}
                    {source.content && (
                      <div className="source-content">
                        {source.content.length > 150
                          ? source.content.substring(0, 150) + '...'
                          : source.content}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {search_results.prospective_interview_questions && (
          <div className="result-section">
            <h3>Prospective Interview Questions</h3>
            <div className="result-content">
              <ReactMarkdown>{search_results.prospective_interview_questions || 'No data available'}</ReactMarkdown>
            </div>
          </div>
        )}
        {search_results.followup_questions && (
          <div className="result-section">
            <h3>Follow-up Questions</h3>
            <div className="result-content">
              <ReactMarkdown>{search_results.followup_questions || 'No data available'}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
      {error && <div className="error-container">{error}</div>}
    </div>
  );
}

export default InterviewDetail;