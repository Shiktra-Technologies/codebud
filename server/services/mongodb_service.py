from pymongo import MongoClient
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

class MongoDBService:
    def __init__(self):
        try:
            mongodb_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
            self.client = MongoClient(mongodb_uri, serverSelectionTimeoutMS=5000)
            # Test connection
            self.client.server_info()
            self.db = self.client[os.getenv('DATABASE_NAME', 'codebud_dev')]
            print("[INFO] Connected to MongoDB successfully")
        except Exception as e:
            print(f"[WARNING] MongoDB connection failed: {e}")
            print("[INFO] Using in-memory mock database for development")
            self.client = None
            self.db = None
            self._init_mock_db()
    
    def _init_mock_db(self):
        """Initialize mock database for testing without MongoDB"""
        self.mock_data = {
            'users': [],
            'code_submissions': [],
            'analysis_results': []
        }
    
    @property
    def users(self):
        if self.db:
            return self.db.users
        return MockCollection('users', self.mock_data)
    
    @property
    def code_submissions(self):
        if self.db:
            return self.db.code_submissions
        return MockCollection('code_submissions', self.mock_data)
    
    @property
    def analysis_results(self):
        if self.db:
            return self.db.analysis_results
        return MockCollection('analysis_results', self.mock_data)
    
    def create_user(self, user_data):
        user_data['created_at'] = datetime.utcnow()
        return self.users.insert_one(user_data)
    
    def get_user(self, user_id):
        return self.users.find_one({'_id': user_id})
    
    def get_user_by_email(self, email):
        return self.users.find_one({'email': email})
    
    def save_code_submission(self, user_id, code, language, s3_key=None):
        submission = {
            'user_id': user_id,
            'code': code if not s3_key else None,
            's3_key': s3_key,
            'language': language,
            'submitted_at': datetime.utcnow()
        }
        result = self.code_submissions.insert_one(submission)
        return result
    
    def get_user_submissions(self, user_id, limit=10):
        cursor = self.code_submissions.find(
            {'user_id': user_id}
        ).sort('submitted_at', -1).limit(limit)
        return list(cursor)
    
    def save_analysis(self, submission_id, analysis_data):
        analysis = {
            'submission_id': submission_id,
            'complexity': analysis_data.get('complexity', {}),
            'code_quality': analysis_data.get('code_quality', {}),
            'suggestions': analysis_data.get('suggestions', []),
            'issues': analysis_data.get('issues', []),
            'analyzed_at': datetime.utcnow()
        }
        return self.analysis_results.insert_one(analysis)
    
    def get_analysis(self, submission_id):
        return self.analysis_results.find_one({'submission_id': submission_id})


class MockCollection:
    """Mock MongoDB collection for testing without actual database"""
    def __init__(self, name, mock_data):
        self.name = name
        self.mock_data = mock_data
        self._counter = 1
    
    def insert_one(self, document):
        from types import SimpleNamespace
        document['_id'] = self._counter
        self._counter += 1
        self.mock_data[self.name].append(document)
        result = SimpleNamespace()
        result.inserted_id = document['_id']
        return result
    
    def find_one(self, query):
        for doc in self.mock_data[self.name]:
            if all(doc.get(k) == v for k, v in query.items()):
                return doc
        return None
    
    def find(self, query):
        results = [doc for doc in self.mock_data[self.name]
                   if all(doc.get(k) == v for k, v in query.items())]
        return MockCursor(results)


class MockCursor:
    """Mock MongoDB cursor"""
    def __init__(self, data):
        self.data = data
    
    def sort(self, key, direction):
        reverse = direction == -1
        self.data = sorted(self.data, key=lambda x: x.get(key, ''), reverse=reverse)
        return self
    
    def limit(self, n):
        self.data = self.data[:n]
        return self
    
    def __iter__(self):
        return iter(self.data)


db_service = MongoDBService()
