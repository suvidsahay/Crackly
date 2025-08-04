from flask import Blueprint, request, jsonify
from backend.langgraph_agent import MasterAgent
import logging
import firebase_admin
from firebase_admin import credentials, auth as firebase_auth
from functools import wraps
import math
from backend.models import HistoryRepository
from uuid import uuid4
import json


# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

api_bp = Blueprint('api', __name__)

cred = credentials.Certificate('backend/firebase_service_account.json')
firebase_admin.initialize_app(cred)

history_repo = HistoryRepository()

def firebase_auth_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization', None)
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Unauthorized'}), 401
        id_token = auth_header.split('Bearer ')[1]
        try:
            decoded_token = firebase_auth.verify_id_token(id_token)
            request.user = decoded_token
        except Exception as e:
            return jsonify({'error': 'Invalid token'}), 401
        return f(*args, **kwargs)
    return decorated_function

@api_bp.route('/health', methods=['GET'])
def health_check():
    logger.info("Health check endpoint called.")
    return jsonify({"status": "Running"}), 200

@api_bp.route('/prep_interview', methods=['POST'])
@firebase_auth_required
def prep_interview():
    """
    POST payload:
    {
      "resume": { ...parsed resume data... },
      "interviewer_name": "Name",
      "interviewer_position": "Interviewer Position",
      "company": "CompanyName",
      "job_description_url": "https://...",
      "position": "Title",
      "interviewer_profile": "...profile info...",
      "job_description": "...job description..."
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
    interviewer_profile = data.get("interviewer_profile", None)
    job_description = data.get("job_description", None)
    
    master = MasterAgent()
    result = master.run(
        parsed_resume=resume,
        interviewer_name=interviewer_name,
        interviewer_position=interviewer_position,
        company=company,
        job_desc_url=job_desc_url,
        position=position,
        interviewer_profile=interviewer_profile,
        job_description=job_description
    )
    
    user_id = request.user['uid']  # fixed
    interview_id = str(uuid4())  # new interview ID

    search_result = {
        "resume": resume,   
        "interviewer_name": interviewer_name,
        "interviewer_position": interviewer_position,
        "company": company,
        "job_desc_url": job_desc_url,
        "position": position,
        "interviewer_profile": interviewer_profile,
        "job_description": job_description,
        "past_interview_questions": result.get("past_interview_questions"),
        "prospective_interview_questions": result.get("prospective_interview_questions"),
        "followup_questions": result.get("followup_questions")
    }

    history_repo.save(user_id, interview_id, search_result)
    

        # Return the result as JSON string
    return json.dumps(result, indent=2), 200, {'Content-Type': 'application/json'}

@api_bp.route('/extract_job_description', methods=['GET'])
@firebase_auth_required
def extract_job_description():
    # Get the url from query parameters
    url = request.args.get('url')
    if not url:
        return jsonify({'error': 'No URL provided'}), 400
    try:
        from backend.utils.job_description_extractor import JobDescriptionExtractor
        extractor = JobDescriptionExtractor()
        result = extractor.extract(url)
        # If any field is 'ERROR', return 422
        if any(result.get(field, '').strip() == 'ERROR' for field in ['job_description', 'job_title', 'company']):
            return jsonify(result), 422, {'Content-Type': 'application/json'}
        return jsonify(result), 200, {'Content-Type': 'application/json'}
    except FileNotFoundError as e:
        return jsonify({'error': str(e)}), 404, {'Content-Type': 'application/json'}
    except ValueError as e:
        return jsonify({'error': str(e)}), 422, {'Content-Type': 'application/json'}
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/history', methods=['GET'])
@firebase_auth_required
def get_history():
    print(request)
    user_id = request.user['uid']

    # Read pagination params
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
    except ValueError:
        return jsonify({'error': 'Invalid pagination parameters'}), 400

    if page < 1 or per_page < 1 or per_page > 100:
        return jsonify({'error': 'page/per_page must be positive integers (max per_page = 100)'}), 400

    skip = (page - 1) * per_page
    docs = history_repo.fetch_user(user_id, limit=per_page, skip=skip)

    # Format documents
    items = []
    for d in docs:
        result = d.get("search_results", {})
        filtered = {
            "company": result.get("company"),
            "position": result.get("position")
        }
        items.append({
            "interview_id": d.get("interview_id"),
            "timestamp": d.get("timestamp").isoformat() if d.get("timestamp") else None,
            "search_results": filtered
        })


    # Total count for pagination metadata
    total_count = history_repo.count(user_id)
    total_pages = math.ceil(total_count / per_page) if per_page else 1

    return jsonify({
        "data": items,
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total_count": total_count,
            "total_pages": total_pages
        }
    }), 200

@api_bp.route('/history/<interview_id>', methods=['GET'])
@firebase_auth_required
def get_history_by_id(interview_id):
    user_id = request.user['uid']

    # Use the repository method to fetch the interview doc
    doc = history_repo.fetch_interview(user_id, interview_id)

    # If doc not found or user mismatch, return 404
    if not doc:
        return jsonify({'error': 'Not found'}), 404

    return jsonify({
        'interview_id': doc.get('interview_id'),
        'timestamp': doc.get('timestamp').isoformat() if doc.get('timestamp') else None,
        'search_results': doc.get('search_results', {})
    }), 200