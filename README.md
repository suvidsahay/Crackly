# Crackly: AI-Powered Interview Preparation Assistant

Crackly is a full-stack AI-powered interview preparation assistant. It leverages advanced search and LLMs to generate tailored interview questions, company research, and follow-up prompts based on your resume, job description, and interviewer details.

## Features
- **Personalized Interview Questions**: Curated using your resume, job description, and company/interviewer info.
- **Company & Interviewer Research**: Gathers relevant info and news.
- **Modern UI**: Built with React (Vite) for a smooth user experience.
- **API-Driven**: Flask backend with clear endpoints.

---

## Quick Start (with Docker Compose)

### 1. Clone the Repository
```sh
git clone <your-repo-url>
cd Crackly
```

### 2. Set Up Environment Variables
Create a `.env` file in the `backend/` directory with your API keys and secrets similar to `.env.temp`


### 3. Build and Run with Docker Compose
```sh
docker-compose up --build
```
- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend: [http://localhost:8000](http://localhost:8000)

---

## Project Structure
```
Crackly/
├── backend/
│   ├── app.py
│   ├── agents/
│   ├── routes/
│   ├── utils.py
│   ├── requirements.txt
│   └── ...
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
├── docker-compose.yml
├── README.md
└── ...
```

---

## Backend API

### Base URL: `http://localhost:8000/api/`

#### **POST `/api/prep_interview`**
Generate interview preparation content.

**Request Body (JSON):**
```
{
  "interviewer_name": "Jane Smith",
  "interviewer_position": "Senior Engineer",
  "company": "OpenAI",
  "position": "Machine Learning Engineer",
  "job_desc_url": "https://example.com/job-description",
  "resume": "<paste your resume here>"
}
```

**Response:**
```
{
  "past_interview_questions": { ... },
  "prospective_interview_questions": { ... },
  "followup_questions": { ... }
}
```

- All responses are structured with answers and sources.

---

## Development Notes
- The backend uses Flask and expects API keys for Tavily and Gemini in the environment.
- The frontend is built with React (Vite) and communicates with the backend via REST API.
- For local development, you can run each service separately (see Dockerfiles for details).

---

## License
MIT
