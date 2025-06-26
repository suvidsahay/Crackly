import logging
from datetime import datetime

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CurateAgent:
    def __init__(self):
        pass

    def curate_results(self, profile_info: str, questions_info: dict, followup_info: str, prospective_questions: str):
        """
        Combine all search results into a comprehensive interview preparation document
        """
        curated_output = {
            "interviewer_profile": profile_info,
            "past_questions": questions_info,
            "prospective_questions": prospective_questions,
            "followup_questions": followup_info
        }
        
        return {
            "curated_data": curated_output
        }

    def run(self, state: dict):
        # print("curate", state)
        # Extract results from the three search agents
        profile_info = state.get("profile", "")
        questions_info = state.get("questions", "")
        followup_info = state.get("followup_search", "")
        prospective_info = state.get("prospective_interview_questions", "")
    
        
        return self.curate_results(profile_info, questions_info, followup_info, prospective_info)
