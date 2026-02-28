from pymongo import MongoClient
from bson import ObjectId  # type: ignore
from datetime import datetime
import os
import bcrypt  # type: ignore
import certifi
from dotenv import load_dotenv

load_dotenv()


class MongoDBService:
    def __init__(self):
        try:
            mongodb_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
            self.client = MongoClient(mongodb_uri, serverSelectionTimeoutMS=5000, tlsCAFile=certifi.where())
            # Test connection
            self.client.server_info()
            self.db = self.client[os.getenv('DATABASE_NAME', 'codebud')]
            print("[INFO] Connected to MongoDB successfully")

            # Create indexes
            self._ensure_indexes()
        except Exception as e:
            print(f"[WARNING] MongoDB connection failed: {e}")
            print("[INFO] Using in-memory mock database for development")
            self.client = None
            self.db = None
            self._init_mock_db()

    def _ensure_indexes(self):
        """Create indexes for performance"""
        if self.db is None:
            return
        try:
            self.db.users.create_index('email', unique=True)
            self.db.code_submissions.create_index('user_id')
            self.db.code_submissions.create_index([('submitted_at', -1)])
            self.db.analysis_results.create_index('submission_id')
            self.db.submissions.create_index('user_id')
            self.db.submissions.create_index([('submitted_at', -1)])
        except Exception as e:
            print(f"[WARNING] Index creation issue: {e}")

    def _init_mock_db(self):
        """Initialize mock database for testing without MongoDB"""
        self.mock_data = {
            'users': [],
            'code_submissions': [],
            'analysis_results': [],
            'submissions': []
        }
        # Persistent counters for auto-increment IDs
        self._mock_counters = {}
        self._seed_test_accounts()

    def _seed_test_accounts(self):
        """Seed default test accounts so login works with in-memory mock DB"""
        test_accounts = [
            {'email': 'test_student@codebud.dev', 'password': 'test123456', 'role': 'student', 'display_name': 'Test Student'},
            {'email': 'test_admin@codebud.dev', 'password': 'test123456', 'role': 'admin', 'display_name': 'Test Admin'},
            {'email': 'super_admin@codebud.dev', 'password': 'codebud_super_admin_2025', 'role': 'super_admin', 'display_name': 'Super Admin'},
        ]
        for acct in test_accounts:
            try:
                self.create_user(acct['email'], acct['password'], acct['role'], acct['display_name'])
                print(f"[SEED] Created test account: {acct['email']} ({acct['role']})")
            except ValueError:
                pass  # already exists
        print(f"[INFO] Mock DB seeded with {len(test_accounts)} test accounts")

    # ──────────── Collection Properties ────────────

    @property
    def users(self):
        if self.db is not None:
            return self.db.users
        return MockCollection('users', self.mock_data, self._mock_counters)

    @property
    def code_submissions(self):
        if self.db is not None:
            return self.db.code_submissions
        return MockCollection('code_submissions', self.mock_data, self._mock_counters)

    @property
    def analysis_results(self):
        if self.db is not None:
            return self.db.analysis_results
        return MockCollection('analysis_results', self.mock_data, self._mock_counters)

    @property
    def submissions(self):
        if self.db is not None:
            return self.db.submissions
        return MockCollection('submissions', self.mock_data, self._mock_counters)

    # ──────────── AUTH ────────────

    def hash_password(self, password):
        """Hash a password using bcrypt"""
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    def verify_password(self, password, password_hash):
        """Verify a password against its hash"""
        return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))

    def create_user(self, email, password, role='student', display_name=None):
        """Create a new user with hashed password"""
        if self.get_user_by_email(email):
            raise ValueError('An account with this email already exists')

        user_data = {
            'email': email,
            'password_hash': self.hash_password(password),
            'display_name': display_name or email.split('@')[0],
            'role': role,
            'created_at': datetime.utcnow(),
            'last_active': datetime.utcnow()
        }
        result = self.users.insert_one(user_data)
        user_data['_id'] = result.inserted_id
        return user_data

    def authenticate_user(self, email, password):
        """Authenticate user by email and password"""
        user = self.get_user_by_email(email)
        if not user:
            return None
        if not self.verify_password(password, user.get('password_hash', '')):
            return None
        # Update last active
        self.users.update_one(
            {'_id': user['_id']},
            {'$set': {'last_active': datetime.utcnow()}}
        )
        return user

    def get_user(self, user_id):
        """Get user by ID"""
        try:
            if isinstance(user_id, str):
                # Try ObjectId first, fall back to string match
                try:
                    oid = ObjectId(user_id)
                    result = self.users.find_one({'_id': oid})
                    if result:
                        return result
                except Exception:
                    pass
            return self.users.find_one({'_id': user_id})
        except Exception:
            return self.users.find_one({'_id': user_id})

    def get_user_by_email(self, email):
        """Get user by email"""
        return self.users.find_one({'email': email})

    def get_all_users(self):
        """Get all users (admin only)"""
        cursor = self.users.find({}, {'password_hash': 0})
        return list(cursor)

    def update_user_activity(self, user_id):
        """Update user's last active timestamp"""
        try:
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)
            self.users.update_one(
                {'_id': user_id},
                {'$set': {'last_active': datetime.utcnow()}}
            )
        except Exception:
            pass

    def update_user(self, user_id, updates):
        """Update user fields. Returns True on success."""
        try:
            # Try ObjectId first, then string
            original_id = user_id
            if isinstance(user_id, str):
                try:
                    oid = ObjectId(user_id)
                    user = self.users.find_one({'_id': oid})
                    if user:
                        user_id = oid
                    else:
                        user = self.users.find_one({'_id': user_id})
                except Exception:
                    user = self.users.find_one({'_id': user_id})
            else:
                user = self.users.find_one({'_id': user_id})
            if not user:
                return False
            updates['updated_at'] = datetime.utcnow()
            self.users.update_one(
                {'_id': user_id},
                {'$set': updates}
            )
            return True
        except Exception:
            return False

    # ──────────── CODE SUBMISSIONS (DSA) ────────────

    def save_code_submission(self, user_id, code, language, s3_key=None):
        submission = {
            'user_id': user_id,
            'code': code if not s3_key else None,
            's3_key': s3_key,
            'language': language,
            'submitted_at': datetime.utcnow()
        }
        return self.code_submissions.insert_one(submission)

    def get_user_code_submissions(self, user_id, limit=10):
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

    # ──────────── TEST SUBMISSIONS (Aptitude, etc.) ────────────

    def save_submission(self, user_id, submission_data):
        """Save a test submission"""
        submission = {
            'user_id': user_id,
            'test_type': submission_data.get('test_type', 'unknown'),
            'score': submission_data.get('score', 0),
            'total_questions': submission_data.get('total_questions', 0),
            'correct_answers': submission_data.get('correct_answers', 0),
            'answers': submission_data.get('answers', {}),
            'time_taken': submission_data.get('time_taken', 0),
            'submitted_at': datetime.utcnow()
        }
        result = self.submissions.insert_one(submission)
        submission['_id'] = result.inserted_id
        return submission

    def get_user_submissions(self, user_id, limit=50):
        """Get submissions for a specific user"""
        cursor = self.submissions.find(
            {'user_id': user_id}
        ).sort('submitted_at', -1).limit(limit)
        return list(cursor)

    def get_all_submissions(self, limit=200):
        """Get all submissions (admin)"""
        cursor = self.submissions.find({}).sort('submitted_at', -1).limit(limit)
        return list(cursor)


# ──────────── MOCK CLASSES ────────────

class MockCollection:
    """Mock MongoDB collection for testing without actual database"""
    def __init__(self, name, mock_data, counters):
        self.name = name
        self.mock_data = mock_data
        self._counters = counters

    def insert_one(self, document):
        current = self._counters.get(self.name, 0) + 1
        self._counters[self.name] = current
        document['_id'] = str(current)
        self.mock_data[self.name].append(document)

        class InsertResult:
            def __init__(self, inserted_id):
                self.inserted_id = inserted_id

        return InsertResult(document['_id'])

    def find_one(self, query):
        for doc in self.mock_data[self.name]:
            if all(doc.get(k) == v for k, v in query.items()):
                return doc
        return None

    def find(self, query=None, projection=None):
        if query is None:
            query = {}
        results = [doc for doc in self.mock_data[self.name]
                    if all(doc.get(k) == v for k, v in query.items())]
        if projection:
            filtered = []
            for doc in results:
                filtered_doc = {k: v for k, v in doc.items() if k not in projection or projection[k] != 0}
                filtered.append(filtered_doc)
            results = filtered
        return MockCursor(results)

    def update_one(self, query, update):
        for doc in self.mock_data[self.name]:
            if all(doc.get(k) == v for k, v in query.items()):
                if '$set' in update:
                    doc.update(update['$set'])
                return
    
    def create_index(self, *args, **kwargs):
        pass


class MockCursor:
    """Mock MongoDB cursor"""
    def __init__(self, data):
        self.data = data

    def sort(self, key, direction=-1):
        if isinstance(key, list):
            key, direction = key[0]
        reverse = direction == -1
        self.data = sorted(self.data, key=lambda x: x.get(key, ''), reverse=reverse)
        return self

    def limit(self, n):
        self.data = self.data[:n]
        return self

    def __iter__(self):
        return iter(self.data)

    def __len__(self):
        return len(self.data)


db_service = MongoDBService()
