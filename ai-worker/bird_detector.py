import torch
import torch.nn as nn
import torchvision.transforms as transforms
from PIL import Image
import numpy as np
import cv2
import os
import json
from typing import List, Dict, Tuple
import requests
from pathlib import Path

class BirdDetector:
    def __init__(self, model_path: str = None, device: str = 'auto'):
        self.device = self._get_device(device)
        self.model = None
        self.classes = []
        self.transform = self._get_transform()
        self.model_path = model_path or '/app/models/bird_model.pth'
        
        # Common bird species for demo (in production, this would be loaded from a trained model)
        self.bird_classes = [
            'American Robin', 'Blue Jay', 'Cardinal', 'Chickadee', 'Crow',
            'Eagle', 'Falcon', 'Finch', 'Hawk', 'Hummingbird', 'Jay',
            'Kingfisher', 'Magpie', 'Owl', 'Parrot', 'Peacock', 'Pelican',
            'Penguin', 'Pigeon', 'Raven', 'Robin', 'Sparrow', 'Stork',
            'Swallow', 'Swan', 'Toucan', 'Turkey', 'Vulture', 'Woodpecker',
            'Wren', 'No Bird Detected'
        ]
        
        self.load_model()
        
    def _get_device(self, device: str) -> torch.device:
        """Determine the best device to use"""
        if device == 'auto':
            if torch.cuda.is_available():
                return torch.device('cuda')
            elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
                return torch.device('mps')  # Apple Silicon
            else:
                return torch.device('cpu')
        return torch.device(device)
    
    def _get_transform(self):
        """Get image preprocessing transforms"""
        return transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                               std=[0.229, 0.224, 0.225])
        ])
    
    def load_model(self):
        """Load the bird detection model"""
        try:
            if os.path.exists(self.model_path):
                print(f"Loading model from {self.model_path}")
                self.model = torch.load(self.model_path, map_location=self.device)
                self.model.eval()
            else:
                print("No pre-trained model found, using EfficientNet-B3 with random weights")
                self._create_model()
                
        except Exception as e:
            print(f"Error loading model: {e}")
            print("Creating new model with random weights")
            self._create_model()
    
    def _create_model(self):
        """Create a new EfficientNet-B3 model"""
        try:
            import timm
            self.model = timm.create_model('efficientnet_b3', 
                                         pretrained=True, 
                                         num_classes=len(self.bird_classes))
            self.model.to(self.device)
            self.model.eval()
            print("Created EfficientNet-B3 model with ImageNet pretrained weights")
        except ImportError:
            print("timm not available, using basic ResNet")
            import torchvision.models as models
            self.model = models.resnet50(pretrained=True)
            self.model.fc = nn.Linear(self.model.fc.in_features, len(self.bird_classes))
            self.model.to(self.device)
            self.model.eval()
    
    def preprocess_image(self, image_path: str) -> torch.Tensor:
        """Preprocess image for model input"""
        try:
            image = Image.open(image_path).convert('RGB')
            image_tensor = self.transform(image).unsqueeze(0)
            return image_tensor.to(self.device)
        except Exception as e:
            print(f"Error preprocessing image {image_path}: {e}")
            return None
    
    def detect_birds(self, image_path: str, confidence_threshold: float = 0.5) -> List[Dict]:
        """Detect birds in an image"""
        if not os.path.exists(image_path):
            return []
        
        image_tensor = self.preprocess_image(image_path)
        if image_tensor is None:
            return []
        
        try:
            with torch.no_grad():
                outputs = self.model(image_tensor)
                probabilities = torch.softmax(outputs, dim=1)
                top_probs, top_indices = torch.topk(probabilities, 3)
                
                detections = []
                for i in range(top_probs.shape[1]):
                    prob = top_probs[0][i].item()
                    class_idx = top_indices[0][i].item()
                    class_name = self.bird_classes[class_idx]
                    
                    if prob > confidence_threshold and class_name != 'No Bird Detected':
                        detection = {
                            'species': class_name,
                            'confidence': prob,
                            'bounding_box': self._estimate_bounding_box(image_path)
                        }
                        detections.append(detection)
                
                return detections
                
        except Exception as e:
            print(f"Error during inference: {e}")
            return []
    
    def _estimate_bounding_box(self, image_path: str) -> Dict:
        """Estimate bounding box for detected bird (simplified)"""
        try:
            image = cv2.imread(image_path)
            height, width = image.shape[:2]
            
            # Simple heuristic: assume bird is in center 60% of image
            center_x = width // 2
            center_y = height // 2
            box_width = int(width * 0.6)
            box_height = int(height * 0.6)
            
            return {
                'x': max(0, center_x - box_width // 2),
                'y': max(0, center_y - box_height // 2),
                'width': min(width, box_width),
                'height': min(height, box_height)
            }
        except:
            return {'x': 0, 'y': 0, 'width': 100, 'height': 100}
    
    def download_pretrained_model(self, url: str = None):
        """Download a pretrained bird detection model"""
        if url is None:
            # Placeholder for actual model download
            print("No model URL provided. Using random weights.")
            return
        
        try:
            print(f"Downloading model from {url}")
            response = requests.get(url, stream=True)
            response.raise_for_status()
            
            os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
            
            with open(self.model_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            print(f"Model downloaded to {self.model_path}")
            self.load_model()
            
        except Exception as e:
            print(f"Error downloading model: {e}")
    
    def get_model_info(self) -> Dict:
        """Get information about the current model"""
        return {
            'device': str(self.device),
            'model_path': self.model_path,
            'num_classes': len(self.bird_classes),
            'classes': self.bird_classes[:10],  # Show first 10 classes
            'model_loaded': self.model is not None
        }

# Example usage and testing
if __name__ == "__main__":
    detector = BirdDetector()
    print("Bird Detector initialized:")
    print(json.dumps(detector.get_model_info(), indent=2))
    
    # Test with a sample image if available
    test_image = "/app/test_image.jpg"
    if os.path.exists(test_image):
        detections = detector.detect_birds(test_image)
        print(f"Detections: {detections}")
    else:
        print("No test image found. Model is ready for use.")
