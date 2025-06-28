from flask import Blueprint, request, jsonify
from backend.langgraph_agent import MasterAgent
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

api_bp = Blueprint('api', __name__)

@api_bp.route('/health', methods=['GET'])
def health_check():
    logger.info("Health check endpoint called.")
    return jsonify({"status": "Running"}), 200

@api_bp.route('/prep_interview', methods=['POST'])
def prep_interview():
    """
    POST payload:
    {
      "resume": { ...parsed resume data... },
      "interviewer_name": "Name",
      "interviewer_position": "Interviewer Position",
      "company": "CompanyName",
      "job_description_url": "https://...",
      "position": "Title"
    }
    """
    data = request.get_json()
    logger.info(f"/prep_interview called with data: {data}")
    
    # Extract the required fields
    resume = data.get("resume", {})
    interviewer_name = data.get("interviewer_name", "")
    interviewer_position = data.get("interviewer_position", None)
    company = data.get("company", "")
    job_desc_url = data.get("job_description_url", "")
    position = data.get("position", "")
    
    master = MasterAgent()
    result = master.run(
        parsed_resume=resume,
        interviewer_name=interviewer_name,
        interviewer_position=interviewer_position,
        company=company,
        job_desc_url=job_desc_url,
        position=position
    )
    
    return result, 200, {'Content-Type': 'application/json'}
