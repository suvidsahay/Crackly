from datetime import datetime, timezone
from backend.db_client import db
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class HistoryRepository:
    def __init__(self, collection_name: str = 'user_history'):
        self.collection = db.get_collection(collection_name)

    def save(self, user_id: str, interview_id: str, results: dict):
        doc = {
            "user_id": user_id,
            "interview_id": interview_id,
            "timestamp": datetime.now(timezone.utc),
            "search_results": results
        }
        logger.info(f"Saving history: {doc}")
        return self.collection.insert_one(doc)

    def fetch_user(self, user_id: str, limit: int = 20, skip: int = 0):
        cursor = (
            self.collection
            .find({"user_id": user_id})
            .sort("timestamp", -1)
            .skip(skip)
            .limit(limit)
        )
        logger.info(f"Fetching history: {cursor}")
        return list(cursor)
    
    def fetch_interview(self, user_id, interview_id: str):
        doc = self.collection.find_one({
            'user_id': user_id,
            'interview_id': interview_id
        })
        return doc

    def count(self, user_id: str) -> int:
        return self.collection.count_documents({"user_id": user_id})
