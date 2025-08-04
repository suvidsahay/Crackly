import os
import logging
from backend.utils import TavilySearchClient, GeminiClient, JobDescriptionExtractor

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FutureQuestionsAgent:
    def __init__(self):
        self.tavily = TavilySearchClient()
        self.gemini = GeminiClient()
        self.job_extractor = JobDescriptionExtractor()

    def profile_search(self, name: str, company: str, position: str):
        if position:
            query = f"Give me details about {name} who works at {company} as a {position}"
        else:
            query = f"Give me details about {name} who works at {company}"
        
        logger.info(f"FutureQuestionsAgent - Tavily Search Query: {query}")
        results = self.tavily.client.search(query=query, topic="general", max_results=5, include_images=True, include_answer="advanced")
        profile_details = results["answer"]
        logger.info(f"FutureQuestionsAgent - Tavily Profile Result: {profile_details[:200]}...")
        return profile_details

    def curate_questions(self, position: str, company: str, resume: dict, interviewer_profile: str, job_description: str = None):
        # Compose a system instruction and prompt for Gemini
        system_instruction = (
            f"You are the interviewer with the following background: {interviewer_profile}\n"
            "Given a candidate's resume, the company, the position and the job description (if available), "
            "generate a list of possible questions that you could ask in the interview. "
            "Return the questions as a numbered list."
        )
        prompt = (
            f"Company: {company}\n"
            f"Position: {position}\n"
            f"Resume: {resume}\n"
        )
        if job_description:
            prompt += f"Job Description: {job_description}\n"
        prompt += "Generate possible interview questions:"
        
        logger.info(f"FutureQuestionsAgent - Gemini System Instruction: {system_instruction}...")
        logger.info(f"FutureQuestionsAgent - Gemini Prompt: {prompt}...")
        
        questions = self.gemini.generate_response(prompt, system_instruction=system_instruction)
        logger.info(f"FutureQuestionsAgent - Gemini Questions Result: {questions[:200]}...")
        return questions

    def run(self, state: dict):
        name = state.get("interviewer_name")
        company = state.get("company")
        interviewer_position = state.get("interviewer_position")
        position = state.get("position")
        resume = state.get("resume")
        job_description_url = state.get("job_desc_url")
        
        # Use interviewer_profile from state if provided, else search
        interviewer_profile = state.get("interviewer_profile")
        if not interviewer_profile:
            interviewer_profile = self.profile_search(name, company, interviewer_position)

        # Use job_description from state if provided, else extract
        job_description = state.get("job_description")
        if not job_description and job_description_url:
            try:
                job_description = self.job_extractor.extract(job_description_url)
            except (ValueError, RuntimeError, FileNotFoundError) as e:
                logger.error(f"Failed to extract job description: {e}")
                # Continue without job description rather than failing the entire process
        
        # Then, use the profile and job description to generate interview questions using Gemini
        questions = self.curate_questions(position, company, resume, interviewer_profile, job_description)
        
        return {"interviewer_profile": interviewer_profile, "prospective_interview_questions": questions}
