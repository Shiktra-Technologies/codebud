import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

class S3Service:
    def __init__(self):
        self.use_mock = os.getenv('USE_MOCK_S3', 'true').lower() == 'true'
        
        if self.use_mock:
            self.mock_path = os.getenv('MOCK_S3_PATH', './mock_s3_storage')
            os.makedirs(self.mock_path, exist_ok=True)
            print(f"[INFO] Using Mock S3 (Local Storage): {self.mock_path}")
        else:
            # Production S3 setup (when credentials are provided)
            try:
                import boto3
                self.s3_client = boto3.client(
                    's3',
                    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
                    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
                    region_name=os.getenv('AWS_REGION')
                )
                self.bucket_name = os.getenv('S3_BUCKET_NAME')
                print("[INFO] Connected to AWS S3")
            except Exception as e:
                print(f"[WARNING] S3 connection failed: {e}")
                print("[INFO] Falling back to Mock S3")
                self.use_mock = True
                self.mock_path = os.getenv('MOCK_S3_PATH', './mock_s3_storage')
                os.makedirs(self.mock_path, exist_ok=True)
    
    def upload_code_file(self, user_id, code_content, filename):
        """Upload code file (mock or real S3)"""
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        key = f"code_submissions/{user_id}/{timestamp}_{filename}"
        
        if self.use_mock:
            return self._mock_upload(key, code_content)
        else:
            return self._s3_upload(key, code_content)
    
    def _mock_upload(self, key, content):
        """Save to local file system"""
        file_path = os.path.join(self.mock_path, key)
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"[INFO] Mock S3: Saved {key}")
        return key
    
    def _s3_upload(self, key, content):
        """Upload to real AWS S3"""
        try:
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=key,
                Body=content.encode('utf-8'),
                ContentType='text/plain'
            )
            print(f"[INFO] S3: Uploaded {key}")
            return key
        except Exception as e:
            print(f"[ERROR] S3 Upload error: {e}")
            return None
    
    def get_code_file(self, key):
        """Retrieve code file"""
        if self.use_mock:
            return self._mock_get(key)
        else:
            return self._s3_get(key)
    
    def _mock_get(self, key):
        """Read from local file system"""
        file_path = os.path.join(self.mock_path, key)
        if os.path.exists(file_path):
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        return None
    
    def _s3_get(self, key):
        """Get from real AWS S3"""
        try:
            response = self.s3_client.get_object(
                Bucket=self.bucket_name,
                Key=key
            )
            return response['Body'].read().decode('utf-8')
        except Exception as e:
            print(f"[ERROR] S3 Get error: {e}")
            return None
    
    def generate_presigned_url(self, key, expiration=3600):
        """Generate presigned URL (or mock URL)"""
        if self.use_mock:
            # Return local file path for dev
            return f"mock://localhost/{key}"
        else:
            try:
                url = self.s3_client.generate_presigned_url(
                    'get_object',
                    Params={'Bucket': self.bucket_name, 'Key': key},
                    ExpiresIn=expiration
                )
                return url
            except Exception as e:
                print(f"[ERROR] Presigned URL error: {e}")
                return None

    def upload_avatar(self, user_id, file_data, filename):
        """Upload user avatar image (mock or real S3)"""
        key = f"avatars/{user_id}/{filename}"

        if self.use_mock:
            file_path = os.path.join(self.mock_path, key)
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            with open(file_path, 'wb') as f:
                f.write(file_data if isinstance(file_data, bytes) else file_data.encode('utf-8'))
            print(f"[INFO] Mock S3: Saved avatar {key}")
            return key
        else:
            try:
                content_type = 'image/png'
                ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
                content_types = {'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png', 'gif': 'image/gif', 'webp': 'image/webp'}
                content_type = content_types.get(ext, 'image/png')

                self.s3_client.put_object(
                    Bucket=self.bucket_name,
                    Key=key,
                    Body=file_data,
                    ContentType=content_type
                )
                print(f"[INFO] S3: Uploaded avatar {key}")
                return key
            except Exception as e:
                print(f"[ERROR] S3 avatar upload error: {e}")
                return None

    def get_avatar_url(self, user_id, key=None):
        """Get avatar URL - returns API endpoint for mock or presigned URL for S3"""
        if self.use_mock:
            # In mock mode, serve through API endpoint
            return f"/api/profile/avatar/{user_id}"
        else:
            if key:
                return self.generate_presigned_url(key, expiration=86400)
            return None


s3_service = S3Service()
