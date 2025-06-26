import os
import logging
from backend.utils import TavilySearchClient

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class QuestionsSearchAgent:
    def __init__(self):
        self.tavily = TavilySearchClient()

    def questions_search(self, position: str, company: str):
        query = f"Past interview questions for {position} position at {company}"
        
        logger.info(f"QuestionsSearchAgent - Tavily Search Query: {query}")
        results = self.tavily.client.search(query=query, topic="general", max_results=10, include_answer=True, search_depth="advanced")
        
        # Extract answer and results
        answer = results.get("answer", "")
        search_results = results.get("results", [])
        
        # Create a structured response with both answer and sources
        structured_response = {
            "answer": answer,
            "sources": [
                {
                    "title": result.get("title", ""),
                    "url": result.get("url", ""),
                    "content": result.get("content", "")
                }
                for result in search_results
            ]
        }
        
        logger.info(f"QuestionsSearchAgent - Tavily response: {results}...")
        logger.info(f"QuestionsSearchAgent - Number of sources: {len(search_results)}")
        
        return structured_response

    def run(self, state: dict):
        position = state.get("position")
        company = state.get("company")
        
        questions_result = self.questions_search(position, company)
        return {"past_interview_questions": questions_result}
