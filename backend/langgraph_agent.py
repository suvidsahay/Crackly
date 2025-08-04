# backend/langgraph/master_agent.py
from langgraph.graph import StateGraph, START
from typing import TypedDict, Annotated

# Import your agent classes
from backend.agents import QuestionsSearchAgent, FollowupCuratorAgent, CurateAgent, FutureQuestionsAgent

class AgentState(TypedDict):
    resume: dict
    interviewer_name: str
    interviewer_position: str
    company: str
    job_desc_url: str
    position: str
    interviewer_profile: str
    job_description: str
    past_interview_questions: Annotated[dict, "past_questions_node"]
    prospective_interview_questions: Annotated[str, "future_questions_node"]
    followup_questions: Annotated[str, "followup_node"]

class MasterAgent:
    def __init__(self):
        pass

    def run(self, parsed_resume: dict, interviewer_name: str, interviewer_position: str, company: str,
            job_desc_url: str, position: str, interviewer_profile: str = None, job_description: str = None):
        """
        Run the agent pipeline with 3 start points:
        1. Past Questions search - search past interview questions for position
        2. Prospective Questions curator - curate prospective interview questions for the position
        3. Followup company news curator - search followup questions to ask based on the company search results
        """
        # Initialize agents
        questions_agent = QuestionsSearchAgent()
        prospective_questions_agent = FutureQuestionsAgent()
        followup_agent = FollowupCuratorAgent()
        curate_agent = CurateAgent()

        # Build LangGraph workflow
        graph = StateGraph(AgentState)

        graph.add_node("search_questions", questions_agent.run)
        graph.add_node("curate_questions", prospective_questions_agent.run)
        graph.add_node("curate_followup", followup_agent.run)
        graph.add_node("curate", curate_agent.run)

        # Set all 3 as entry points (they can run in parallel)
        graph.add_edge(START, "curate_questions")
        graph.add_edge(START, "search_questions")
        graph.add_edge(START, "curate_followup")

        # graph.add_edge("search_questions", "curate_questions")
        # Add edges from all 3 start points to curate
        graph.add_edge("curate_questions", "curate")
        graph.add_edge("search_questions", "curate")
        graph.add_edge("curate_followup", "curate")

        # Set curate as the finish point
        graph.set_finish_point("curate")

        chain = graph.compile()

        # Prepare inputs for all search nodes
        inputs = {
            "resume": parsed_resume,
            "interviewer_name": interviewer_name,
            "interviewer_position": interviewer_position,
            "company": company,
            "job_desc_url": job_desc_url,
            "position": position,
            "interviewer_profile": interviewer_profile,
            "job_description": job_description
        }

        # Run graph - all 3 search nodes will execute in parallel, then curate combines results
        result = chain.invoke(inputs)
        
        return result;


if __name__ == "__main__":
    # Example input data
    parsed_resume = {
        "name": "John Doe",
        "education": "MIT",
        "skills": ["Python", "AI", "ML"]
    }
    interviewer_name = "Jane Smith"
    interviewer_position = "Software Engineer"
    company = "OpenAI"
    job_desc_url = "https://www.dragonfruit.ai/company"
    position = "Machine Learning Engineer"

    agent = MasterAgent()
    result = agent.run(
        parsed_resume=parsed_resume,
        interviewer_name=interviewer_name,
        interviewer_position=interviewer_position,
        company=company,
        job_desc_url=job_desc_url,
        position=position
    )

    print(result)