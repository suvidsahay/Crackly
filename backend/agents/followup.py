import logging
from backend.utils import TavilySearchClient, GeminiClient

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FollowupCuratorAgent:
    def __init__(self):
        self.tavily = TavilySearchClient()
        self.gemini = GeminiClient()

    def company_search(self, position: str, company: str):
        query = f"Give me news about the {company} and it's latest advancement in the area of {position}"
        
        logger.info(f"FollowupCuratorAgent - Tavily Search Query: {query}")
        results = self.tavily.client.search(query=query, topic="news", max_results=5, include_images=False, include_answer=True, search_depth="advanced")
        company_news = results["answer"]
        logger.info(f"FollowupCuratorAgent - Tavily Company News Result: {company_news[:200]}...")
        return company_news

    def followup_curator(self, position: str, company: str, company_news: str):
        system_instruction = (
            "You are the interviewee. Your goal is to ask thoughtful follow-up questions at the end of a job interview. "
            "Given the company, the position, and recent company news, "
            "generate a list of insightful follow-up questions you could ask the interviewer. "
            "Be specific to the company and position, and you may use the company news for context. "
            "Return the questions as a numbered list."
        )
        prompt = (
            f"Company: {company}\n"
            f"Position: {position}\n"
            f"Company News: {company_news}\n"
            "Generate possible follow-up questions:"
        )
        
        logger.info(f"FollowupCuratorAgent - Gemini System Instruction: {system_instruction}")
        logger.info(f"FollowupCuratorAgent - Gemini Prompt: {prompt[:200]}...")
        
        followup_questions = self.gemini.generate_response(prompt, system_instruction=system_instruction)
        logger.info(f"FollowupCuratorAgent - Gemini Followup Questions Result: {followup_questions[:200]}...")
        return followup_questions

    def run(self, state: dict):
        position = state.get("position")
        company = state.get("company")
        
        # First, search for company news using Tavily
        company_news = self.company_search(position, company)
        
        # Then, use the news to generate followup questions using Gemini
        followup_questions = self.followup_curator(position, company, company_news)
        
        return {"followup_questions": followup_questions}
