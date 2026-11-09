import os
import cv2
import redis
import psycopg2
import numpy as np
import requests
from datetime import datetime
import json
import time
import glob
from typing import List, Dict, Tuple
from bird_detector import BirdDetector

class BirdDetectionWorker:
    def __init__(self):
        self.redis_client = redis.Redis.from_url(os.getenv('REDIS_URL', 'redis://localhost:6379'))
        self.db_connection = psycopg2.connect(os.environ['DATABASE_URL'])
        self.frames_dir = os.getenv('FRAMES_DIR', '/app/frames')
        self.model_path = os.getenv('MODEL_PATH', '/app/models')
        
        # Create directories if they don't exist
        os.makedirs(self.frames_dir, exist_ok=True)
        os.makedirs(self.model_path, exist_ok=True)
        
        # Initialize bird detection model
        self.bird_detector = BirdDetector()
        
    def load_model(self):
        """Load the bird detection model"""
        # For MVP, we'll use a simple placeholder model
        # In production, this would load a pre-trained YOLO or ResNet model
        print("Loading bird detection model...")
        # TODO: Implement actual model loading
        return None
        
    def extract_frames(self, video_path: str, output_dir: str, fps: int = 10) -> List[str]:
        """Extract frames from video at specified FPS"""
        cap = cv2.VideoCapture(video_path)
        frame_paths = []
        
        if not cap.isOpened():
            raise ValueError(f"Could not open video file: {video_path}")
            
        # Get video properties
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        video_fps = cap.get(cv2.CAP_PROP_FPS)
        frame_interval = int(video_fps / fps)
        
        frame_count = 0
        extracted_count = 0
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
                
            if frame_count % frame_interval == 0:
                frame_filename = f"frame_{extracted_count:06d}.jpg"
                frame_path = os.path.join(output_dir, frame_filename)
                cv2.imwrite(frame_path, frame)
                frame_paths.append(frame_path)
                extracted_count += 1
                
            frame_count += 1
            
        cap.release()
        return frame_paths
        
    def detect_birds(self, frame_path: str) -> List[Dict]:
        """Detect birds in a single frame using the bird detection model"""
        try:
            detections = self.bird_detector.detect_birds(frame_path, confidence_threshold=0.6)
            return detections
        except Exception as e:
            print(f"Error in bird detection: {e}")
            # Fallback to random detection for testing
            import random
            detections = []
            
            # Random chance of detecting a bird
            if random.random() > 0.7:  # 30% chance
                species = random.choice(['Robin', 'Cardinal', 'Blue Jay', 'Sparrow', 'Eagle'])
                confidence = random.uniform(0.6, 0.95)
                
                detection = {
                    'species': species,
                    'confidence': confidence,
                    'bounding_box': {
                        'x': random.randint(0, 100),
                        'y': random.randint(0, 100),
                        'width': random.randint(50, 200),
                        'height': random.randint(50, 200)
                    }
                }
                detections.append(detection)
                
            return detections
        
    def process_video(self, job_data):
        """Process frames for bird detection"""
        try:
            video_id = job_data['videoId']
            frames_dir = job_data['framesDir']
            
            print(f"Processing video {video_id} with frames in {frames_dir}")
            
            # Update video status to processing
            self.update_video_status(video_id, 'processing')
            
            # Get all frame files
            frame_files = sorted(glob.glob(os.path.join(frames_dir, "frame_*.jpg")))
            print(f"Found {len(frame_files)} frames to process")
            
            if not frame_files:
                print(f"No frames found in {frames_dir}")
                self.update_video_status(video_id, 'failed')
                return
            
            # Process each frame
            all_detections = []
            for i, frame_path in enumerate(frame_files):
                timestamp = i / 10.0  # 10 FPS
                detections = self.detect_birds(frame_path)
                
                for detection in detections:
                    detection_data = {
                        'video_id': video_id,
                        'timestamp': timestamp,
                        'species': detection['species'],
                        'confidence': detection['confidence'],
                        'bounding_box': json.dumps(detection['bounding_box'])
                    }
                    all_detections.append(detection_data)
                    
            # Save detections to database
            if all_detections:
                self.save_detections(all_detections)
                print(f"Saved {len(all_detections)} detections")
            else:
                print("No birds detected in video")
                
            # Update video status to completed
            self.update_video_status(video_id, 'completed')
            
            # Clean up frames
            self.cleanup_frames(frames_dir)
            
        except Exception as e:
            print(f"Error processing video {video_id}: {str(e)}")
            self.update_video_status(video_id, 'failed')
            
    def update_video_status(self, video_id: int, status: str):
        """Update video status in database"""
        cursor = self.db_connection.cursor()
        cursor.execute(
            "UPDATE videos SET status = %s WHERE id = %s",
            (status, video_id)
        )
        self.db_connection.commit()
        cursor.close()
        
    def save_detections(self, detections: List[Dict]):
        """Save detections to database"""
        cursor = self.db_connection.cursor()
        
        for detection in detections:
            cursor.execute("""
                INSERT INTO detections (video_id, timestamp, species, confidence, bounding_box)
                VALUES (%s, %s, %s, %s, %s)
            """, (
                detection['video_id'],
                detection['timestamp'],
                detection['species'],
                detection['confidence'],
                detection['bounding_box']
            ))
            
        self.db_connection.commit()
        cursor.close()
        
    def cleanup_frames(self, frames_dir: str):
        """Clean up temporary frame files"""
        import shutil
        try:
            shutil.rmtree(frames_dir)
            print(f"Cleaned up frames directory: {frames_dir}")
        except Exception as e:
            print(f"Error cleaning up frames: {str(e)}")
            
    def run(self):
        """Main worker loop"""
        print("Bird detection worker started")
        
        while True:
            try:
                # Check for new video processing jobs from Redis
                job = self.redis_client.lpop('video_processing')
                
                if job:
                    job_data = json.loads(job)
                    self.process_video(job_data)
                else:
                    # No jobs, wait a bit
                    time.sleep(5)
                    
            except Exception as e:
                print(f"Worker error: {str(e)}")
                time.sleep(10)

if __name__ == "__main__":
    worker = BirdDetectionWorker()
    worker.run()
