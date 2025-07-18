from flask import Blueprint, request, jsonify
from backend.langgraph_agent import MasterAgent
import logging
import firebase_admin
from firebase_admin import credentials, auth as firebase_auth
from functools import wraps

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

api_bp = Blueprint('api', __name__)

cred = credentials.Certificate('backend/firebase_service_account.json')
firebase_admin.initialize_app(cred)

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
    
    return result, 200, {'Content-Type': 'application/json'}

@api_bp.route('/extract_job_description', methods=['POST'])
@firebase_auth_required
def extract_job_description():
    data = request.get_json()
    url = data.get('url')
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
