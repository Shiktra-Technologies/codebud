# Face Detection Models

This directory should contain the face-api.js models for face detection.

To use face detection, you need to download the following model files from the face-api.js repository:
https://github.com/justadudewhohacks/face-api.js/tree/master/weights

Required files:
- tiny_face_detector_model-weights_manifest.json
- tiny_face_detector_model-shard1
- face_landmark_68_model-weights_manifest.json  
- face_landmark_68_model-shard1
- face_recognition_model-weights_manifest.json
- face_recognition_model-shard1
- face_recognition_model-shard2

Place these files directly in this /public/models/ directory.

For development, the component will fallback to basic webcam functionality if models are not found.
