import os
import logging
from backend.utils import TavilySearchClient, GeminiClient

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FutureQuestionsAgent:
    def __init__(self):
        self.tavily = TavilySearchClient()
        self.gemini = GeminiClient()

    def profile_search(self, name: str, company: str, position: str):
        if position:
            query = f"Give me details about {name} who works at {company} as a {position}"
        else:
            query = f"Give me details about {name} who works at {company}"
        
        logger.info(f"FutureQuestionsAgent - Tavily Search Query: {query}")
        results = self.tavily.client.search(query=query, topic="general", max_results=5, include_images=True, include_answer=True)
        profile_details = results["answer"]
        logger.info(f"FutureQuestionsAgent - Tavily Profile Result: {profile_details[:200]}...")
        return profile_details

    def curate_questions(self, position: str, company: str, resume: dict, interviewer_profile: str):
        # Compose a system instruction and prompt for Gemini
        system_instruction = (
            f"You are the interviewer. This is your background: {interviewer_profile}\n"
            "You are an expert interview question generator. "
            "Given a candidate's resume, the company, the position, and your background, "
            "generate a list of possible questions that could be asked in the interview. "
            "Return the questions as a numbered list."
        )
        prompt = (
            f"Company: {company}\n"
            f"Position: {position}\n"
            f"Resume: {resume}\n"
            "Generate possible interview questions:"
        )
        
        logger.info(f"FutureQuestionsAgent - Gemini System Instruction: {system_instruction[:200]}...")
        logger.info(f"FutureQuestionsAgent - Gemini Prompt: {prompt}")
        
        questions = self.gemini.generate_response(prompt, system_instruction=system_instruction)
        logger.info(f"FutureQuestionsAgent - Gemini Questions Result: {questions[:200]}...")
        return questions

    def run(self, state: dict):
        name = state.get("interviewer_name")
        company = state.get("company")
        interviewer_position = state.get("interviewer_position")
        position = state.get("position")
        resume = state.get("resume")
        
        # First, search for interviewer profile using Tavily
        interviewer_profile = self.profile_search(name, company, interviewer_position)
        
        # Then, use the profile to generate interview questions using Gemini
        questions = self.curate_questions(position, company, resume, interviewer_profile)
        
        return {"prospective_interview_questions": questions}
