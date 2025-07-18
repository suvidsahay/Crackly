import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import pdfToText from 'react-pdftotext'
import './InterviewForm.css';
import { getAuth } from "firebase/auth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

function InterviewForm() {
  const [form, setForm] = useState({
    interviewer_name: '',
    interviewer_position: '',
    interviewer_profile: '', // new optional field
    company: '',
    position: '',
    job_description_url: '',
    job_description_text: '', // new optional field
    resume: '',
    resume_text: '' // new optional field
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null); // To store the file object for display
  const [isDragActive, setIsDragActive] = useState(false); // To track drag-over state
  const [extracting, setExtracting] = useState(false);
  const [extractWarning, setExtractWarning] = useState(false);
  const [extractWarningMsg, setExtractWarningMsg] = useState('');
  const inputRef = useRef(null); // To programmatically trigger the file input click


  function handleChange(e) {
    const { name, value } = e.target;
    setError('');
    setForm(prev => ({ ...prev, [name]: value }));
  }

  function handleFile(file) {
    if (!file) return;
    setError('');
    // File type validation
    if (file.type !== "application/pdf" && file.type !== "text/plain") {
      alert("Please upload a .pdf or .txt file.");
      return;
    }

    setSelectedFile(file); // Show the file name in the UI
    setFileLoading(true);

    if (file.type === "text/plain") {
      const reader = new FileReader();
      reader.onload = (event) => {
        setForm(prev => ({ ...prev, resume: event.target.result, resume_text: event.target.result }));
        setFileLoading(false);
      };
      reader.onerror = (err) => {
        alert("Failed to read text file.");
        setFileLoading(false);
        console.error("Failed to read text file", err);
        setSelectedFile(null); // Clear on error
      };
      reader.readAsText(file);
    } else if (file.type === "application/pdf") {
      pdfToText(file)
        .then(text => {
          setForm(prev => ({ ...prev, resume: text, resume_text: text }));
          setFileLoading(false);
        })
        .catch(error => {
          alert("Failed to extract text from PDF.");
          setFileLoading(false);
          console.error("Failed to extract text from pdf", error);
          setSelectedFile(null); // Clear on error
        });
    }
  }

  function handleFileChange(e) {
    e.preventDefault();
    setError('');
    const file = e.target.files[0];
    handleFile(file);
  }

  // --- NEW DRAG-AND-DROP HANDLERS ---
  function handleDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    setError('');
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setError('');
    setIsDragActive(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }

  // --- NEW HELPER FUNCTIONS ---
  function onUploadButtonClick(e) {
    // Prevent the click from bubbling up to the label and triggering a second click
    e.preventDefault();
    // Programmatically click the hidden file input
    setError('');
    inputRef.current.click();
  }

  function removeSelectedFile() {
    setSelectedFile(null);
    setForm(prev => ({ ...prev, resume: '' }));
    // Also clear the file input's value
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setResult(null);

    // Use pasted resume if provided, otherwise use uploaded file
    const resumeToSend = form.resume_text.trim() ? form.resume_text : form.resume;
    // Use pasted job description if provided, otherwise use URL
    const jobDescToSend = form.job_description_text.trim() ? form.job_description_text : form.job_description_url;

    if (!form.interviewer_name || !form.company || !form.position || !resumeToSend) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        setError("You must be signed in to submit.");
        setLoading(false);
        return;
      }
      const idToken = await user.getIdToken();

      const payload = {
        interviewer_name: form.interviewer_name,
        interviewer_position: form.interviewer_position,
        interviewer_profile: form.interviewer_profile,
        company: form.company,
        position: form.position,
        job_description_url: form.job_description_url, // always the URL field
        job_description: form.job_description_text,    // always the text field
        resume: resumeToSend
      };

      const response = await fetch(`${API_BASE_URL}/prep_interview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify(payload)
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

  async function handleExtractJobDescription() {
    if (!form.job_description_url) return;
    // Reset job-related fields before extraction
    setForm(prev => ({
      ...prev,
      job_description_text: '',
      position: '',
      company: ''
    }));
    setExtracting(true);
    setError('');
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        setError("You must be signed in to extract.");
        setExtracting(false);
        return;
      }
      const idToken = await user.getIdToken();

      const response = await fetch(`${API_BASE_URL}/extract_job_description`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ url: form.job_description_url })
      });
      if (!response.ok) {
        if (response.status === 404) {
          setExtractWarningMsg('The URL could not be found. Please provide a different URL or fill the fields manually.');
        } else {
          const data = await response.json();
          setForm(prev => ({
            ...prev,
            job_description_text: data.job_description && data.job_description !== 'ERROR' ? data.job_description : '',
            position: data.job_title && data.job_title !== 'ERROR' ? data.job_title : '',
            company: data.company && data.company !== 'ERROR' ? data.company : ''
          }));
          setExtractWarningMsg("Some fields couldn't be extracted. Please fill them manually.");
        }
        setExtractWarning(true);
        setTimeout(() => setExtractWarning(false), 5000);
        throw new Error('Failed to extract job description');
      }
      const data = await response.json();
      // Set each field only if not 'ERROR', otherwise leave blank
      setForm(prev => ({
        ...prev,
        job_description_text: data.job_description && data.job_description !== 'ERROR' ? data.job_description : '',
        position: data.job_title && data.job_title !== 'ERROR' ? data.job_title : '',
        company: data.company && data.company !== 'ERROR' ? data.company : ''
      }));
      // Show warning if any field is 'ERROR'
      if ([data.job_description, data.job_title, data.company].some(v => v && v.trim() === 'ERROR')) {
        setExtractWarningMsg("Some fields couldn't be extracted. Please fill them manually.");
        setExtractWarning(true);
        setTimeout(() => setExtractWarning(false), 5000);
      }
    } catch (err) {
      setError(err.message || 'Failed to extract job description');
    } finally {
      setExtracting(false);
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

  // Add a simple loading spinner component
  function LoadingSpinner() {
    return (
      <span className="input-spinner" style={{ marginLeft: 8, display: 'inline-block', verticalAlign: 'middle' }}>
        <svg width="18" height="18" viewBox="0 0 50 50">
          <circle cx="25" cy="25" r="20" fill="none" stroke="#ad6800" strokeWidth="5" strokeDasharray="31.4 31.4" strokeLinecap="round">
            <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite" />
          </circle>
        </svg>
      </span>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <div className="form-columns">
        {/* Column 1: Interviewer Details, then Resume */}
        <div className="form-col">
          <div className="form-section">
            <h2>Interviewer Details</h2>
            <div style={{ fontSize: '0.75em', color: '#6b7280', marginBottom: '12px' }}>
              Add interviewer name and position and we will retrieve the details for you.<br/>
              <span style={{ fontStyle: 'italic' }}>You can also paste the LinkedIn profile by using the save to PDF for better results.</span>
            </div>
            <div className="form-group">
              <label htmlFor="interviewer_name">Interviewer Name*</label>
              <input
                type="text"
                id="interviewer_name"
                name="interviewer_name"
                value={form.interviewer_name}
                onChange={handleChange}
                placeholder="Sam Altman"
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
                placeholder="CEO"
              />
            </div>
            <div className="form-group">
              <label htmlFor="interviewer_profile">Interviewer Profile</label>
              <textarea
                id="interviewer_profile"
                name="interviewer_profile"
                value={form.interviewer_profile}
                onChange={handleChange}
                placeholder="Paste interviewer profile"
                rows={4}
              />
            </div>
          </div>
        </div>
        {/* Column 2: Job Details */}
        <div className="form-col">
          <div className="form-section">
            <h2>Job Details</h2>
            <div className="extract-warning-container">
              {extractWarning && (
                <div className="extract-warning">
                  {extractWarningMsg}
                </div>
              )}
            </div>
            <div style={{ fontSize: '0.75em', color: '#6b7280', marginBottom: '12px' }}>
              Add the job description url and we will fetch the details for you.<br/>
              <span style={{ fontStyle: 'italic' }}>You can only add the job responsibility and qualifications for better results.</span>
            </div>
            <div className="form-row" style={{ alignItems: 'flex-end' }}>
              <div className="form-group" style={{ flex: 3 }}>
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
              <div className="form-group" style={{ flex: 1, display: 'flex' }}>
                <button
                  type="button"
                  className="btn-primary extract-btn"
                  style={{ marginLeft: 'auto' }}
                  disabled={extracting || !form.job_description_url}
                  onClick={handleExtractJobDescription}
                >
                  {extracting ? "Extracting..." : "Extract"}
                </button>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="position">Job Title*</label>
                <div className="input-wrapper">

                <input
                  type="text"
                  id="position"
                  name="position"
                  value={form.position}
                  onChange={handleChange}
                  required
                  placeholder="Machine Learning Engineer"
                  disabled={extracting}
                />
                {extracting && <LoadingSpinner />}
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="company">Company*</label>
                <div className="input-wrapper">

                <input
                  type="text"
                  id="company"
                  name="company"
                  value={form.company}
                  onChange={handleChange}
                  required
                  placeholder="OpenAI"
                  disabled={extracting}
                />
                {extracting && <LoadingSpinner />}
                </div>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="job_description_text">Job Description</label>
              <div className="input-wrapper">
                <textarea
                  id="job_description_text"
                  name="job_description_text"
                  value={form.job_description_text}
                  onChange={handleChange}
                  placeholder="Paste job description here if you have it"
                  rows={4}
                  disabled={extracting}
                />
                {extracting && <LoadingSpinner />}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="form-section resume-section">
      <h2>Resume</h2>
        
        {/* The hidden file input */}
        <input
          type="file"
          id="resume"
          name="resume"
          accept=".pdf,.txt"
          onChange={handleFileChange}
          ref={inputRef}
          className="file-upload-input"
        />

        {/* Conditionally render the drop zone or the file preview */}
        {!selectedFile ? (
          <div className="file-upload-container">
            <label htmlFor="resume">
              <div
                className={`file-drop-zone ${isDragActive ? 'drag-active' : ''}`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={(e) => onUploadButtonClick(e)} // Trigger click on the div
              >
                <p>Drag and drop your resume here, or <span>click to select a file</span>.</p>
                <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '8px' }}>
                  Supported formats: PDF, TXT
                </p>
              </div>
            </label>
          </div>
        ) : (
          <div className="file-preview">
            <p>Selected File: {selectedFile.name}</p>
            <button type="button" onClick={removeSelectedFile} className="remove-file-btn">
              ×
            </button>
          </div>
        )}

        <div className="form-group" style={{marginTop: '1.5rem', position: 'relative'}}>
          <label htmlFor="resume_text">Or Paste Resume</label>
          <textarea
            id="resume_text"
            name="resume_text"
            value={form.resume_text}
            onChange={handleChange}
            placeholder="Paste your resume here if you prefer"
            rows={12}
            style={{ paddingRight: fileLoading ? 40 : undefined }}
          />
          {fileLoading && (
            <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
              <LoadingSpinner />
            </span>
          )}
        </div>
      </div>
      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={loading || fileLoading}>
          {fileLoading ? "Reading Resume..." : "Generate Interview Prep"}
        </button>
      </div>
      {loading && <div className="loading">Processing...</div>}
      {fileLoading && <div className="loading">Reading resume file...</div>}
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