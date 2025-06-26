import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';

function InterviewForm() {
  const [form, setForm] = useState({
    interviewer_name: '',
    interviewer_position: '',
    company: '',
    position: '',
    job_description_url: '',
    resume: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!form.interviewer_name || !form.company || !form.position || !form.resume) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/prep_interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (!response.ok) throw new Error('Server error');
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  function renderSection(title, content) {
    return (
      <div className="result-section" key={title}>
        <h3>{title}</h3>
        {typeof content === 'object' && content.answer ? (
          <>
            <div className="result-content">
              <ReactMarkdown>{content.answer}</ReactMarkdown>
            </div>
            {content.sources && content.sources.length > 0 && (
              <div className="sources-section">
                <h4>Sources:</h4>
                {content.sources.map((source, idx) => (
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
          </>
        ) : (
          <div className="result-content">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <div className="form-section">
        <h2>Interview Details</h2>
        <div className="form-group">
          <label htmlFor="interviewer_name">Interviewer Name *</label>
          <input
            type="text"
            id="interviewer_name"
            name="interviewer_name"
            value={form.interviewer_name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="interviewer_position">Interviewer Position</label>
          <input
            type="text"
            id="interviewer_position"
            name="interviewer_position"
            value={form.interviewer_position}
            onChange={handleChange}
            placeholder="e.g., Senior Software Engineer"
          />
        </div>
        <div className="form-group">
          <label htmlFor="company">Company *</label>
          <input
            type="text"
            id="company"
            name="company"
            value={form.company}
            onChange={handleChange}
            required
            placeholder="e.g., OpenAI"
          />
        </div>
        <div className="form-group">
          <label htmlFor="position">Position You're Interviewing For *</label>
          <input
            type="text"
            id="position"
            name="position"
            value={form.position}
            onChange={handleChange}
            required
            placeholder="e.g., Machine Learning Engineer"
          />
        </div>
        <div className="form-group">
          <label htmlFor="job_description_url">Job Description URL</label>
          <input
            type="url"
            id="job_description_url"
            name="job_description_url"
            value={form.job_description_url}
            onChange={handleChange}
            placeholder="https://example.com/job-description"
          />
        </div>
      </div>
      <div className="form-section">
        <h2>Your Resume</h2>
        <div className="form-group">
          <label htmlFor="resume">Resume Content *</label>
          <textarea
            id="resume"
            name="resume"
            rows={10}
            value={form.resume}
            onChange={handleChange}
            required
            placeholder="Paste your resume content here..."
          />
        </div>
      </div>
      <div className="form-actions">
        <button type="submit" className="btn-primary">
          Generate Interview Prep
        </button>
      </div>
      {loading && <div className="loading">Processing...</div>}
      {error && <div className="error-container">{error}</div>}
      {result && (
        <div className="results-container">
          <h2>Interview Preparation Results</h2>
          {result.past_interview_questions && renderSection('Past Interview Questions', result.past_interview_questions)}
          {result.prospective_interview_questions && renderSection('Prospective Interview Questions', result.prospective_interview_questions)}
          {result.followup_questions && renderSection('Follow-up Questions', result.followup_questions)}
        </div>
      )}
    </form>
  );
}

export default InterviewForm; 