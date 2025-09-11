import torch
import torch.nn as nn
import torchvision.transforms as transforms
from PIL import Image
import numpy as np
import os
import json
from typing import List, Dict, Tuple
import timm
from pathlib import Path

class TwoStageBirdDetector:
    """
    Two-stage bird detection pipeline:
    Stage 1: Binary classification (bird vs no bird)
    Stage 2: Species identification (what kind of bird)
    """
    
    def __init__(self, device: str = 'auto'):
        self.device = self._get_device(device)
        self.binary_model = None
        self.species_model = None
        self.transform = self._get_transform()
        
        # Stage 1: Binary classes
        self.binary_classes = ['No Bird', 'Bird Present']
        
        # Stage 2: Bird species (comprehensive list)
        self.bird_species = [
            'American Robin', 'Blue Jay', 'Northern Cardinal', 'Black-capped Chickadee', 
            'American Crow', 'Bald Eagle', 'Peregrine Falcon', 'House Finch', 
            'Red-tailed Hawk', 'Ruby-throated Hummingbird', 'Steller\'s Jay',
            'Belted Kingfisher', 'Black-billed Magpie', 'Great Horned Owl', 
            'Scarlet Macaw', 'Indian Peafowl', 'Brown Pelican', 'Emperor Penguin',
            'Rock Pigeon', 'Common Raven', 'European Robin', 'House Sparrow',
            'White Stork', 'Barn Swallow', 'Mute Swan', 'Toco Toucan', 
            'Wild Turkey', 'Turkey Vulture', 'Pileated Woodpecker', 'Carolina Wren',
            'Mallard Duck', 'Canada Goose', 'American Goldfinch', 'Dark-eyed Junco',
            'White-breasted Nuthatch', 'Tufted Titmouse', 'Red-winged Blackbird',
            'Northern Mockingbird', 'American Kestrel', 'Cooper\'s Hawk',
            'Barred Owl', 'Eastern Bluebird', 'Indigo Bunting', 'Purple Finch',
            'Pine Siskin', 'Common Grackle', 'Brown Thrasher', 'Gray Catbird',
            'Unknown Bird Species'
        ]
        
        self.load_models()
    
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
    
    def load_models(self):
        """Load both stage models"""
        print(f"Loading models on device: {self.device}")
        
        # Stage 1: Binary bird detection model
        self._load_binary_model()
        
        # Stage 2: Species identification model
        self._load_species_model()
        
        print("✅ Both models loaded successfully")
    
    def _load_binary_model(self):
        """Load Stage 1: Binary bird detection model"""
        try:
            # Use a robust model for binary classification
            # EfficientNet-B0 is good for binary tasks and faster than B3
            self.binary_model = timm.create_model(
                'efficientnet_b0', 
                pretrained=True, 
                num_classes=2  # Binary: bird or no bird
            )
            self.binary_model.to(self.device)
            self.binary_model.eval()
            print("✅ Stage 1: Binary bird detection model loaded (EfficientNet-B0)")
            
        except Exception as e:
            print(f"Error loading binary model: {e}")
            self._create_fallback_binary_model()
    
    def _load_species_model(self):
        """Load Stage 2: Species identification model"""
        try:
            # Use a larger model for fine-grained species classification
            # EfficientNet-B3 is good balance of accuracy and speed
            self.species_model = timm.create_model(
                'efficientnet_b3', 
                pretrained=True, 
                num_classes=len(self.bird_species)
            )
            self.species_model.to(self.device)
            self.species_model.eval()
            print("✅ Stage 2: Species identification model loaded (EfficientNet-B3)")
            
        except Exception as e:
            print(f"Error loading species model: {e}")
            self._create_fallback_species_model()
    
    def _create_fallback_binary_model(self):
        """Create fallback binary model"""
        print("Creating fallback binary model...")
        import torchvision.models as models
        self.binary_model = models.resnet50(pretrained=True)
        self.binary_model.fc = nn.Linear(self.binary_model.fc.in_features, 2)
        self.binary_model.to(self.device)
        self.binary_model.eval()
    
    def _create_fallback_species_model(self):
        """Create fallback species model"""
        print("Creating fallback species model...")
        import torchvision.models as models
        self.species_model = models.resnet50(pretrained=True)
        self.species_model.fc = nn.Linear(self.species_model.fc.in_features, len(self.bird_species))
        self.species_model.to(self.device)
        self.species_model.eval()
    
    def preprocess_image(self, image_path: str) -> torch.Tensor:
        """Preprocess image for model input"""
        try:
            image = Image.open(image_path).convert('RGB')
            image_tensor = self.transform(image).unsqueeze(0)
            return image_tensor.to(self.device)
        except Exception as e:
            print(f"Error preprocessing image {image_path}: {e}")
            return None
    
    def stage1_detect_bird_presence(self, image_path: str, threshold: float = 0.5) -> Tuple[bool, float]:
        """
        Stage 1: Determine if there's a bird in the image
        Returns: (is_bird_present, confidence)
        """
        if not os.path.exists(image_path):
            return False, 0.0
        
        image_tensor = self.preprocess_image(image_path)
        if image_tensor is None:
            return False, 0.0
        
        try:
            with torch.no_grad():
                outputs = self.binary_model(image_tensor)
                probabilities = torch.softmax(outputs, dim=1)
                
                # Get probability of "Bird Present" class (index 1)
                bird_prob = probabilities[0][1].item()
                is_bird = bird_prob > threshold
                
                return is_bird, bird_prob
                
        except Exception as e:
            print(f"Error in Stage 1 detection: {e}")
            return False, 0.0
    
    def stage2_identify_species(self, image_path: str, confidence_threshold: float = 0.3) -> List[Dict]:
        """
        Stage 2: Identify bird species (only called if Stage 1 detects bird)
        Returns: List of detections with species and confidence
        """
        if not os.path.exists(image_path):
            return []
        
        image_tensor = self.preprocess_image(image_path)
        if image_tensor is None:
            return []
        
        try:
            with torch.no_grad():
                outputs = self.species_model(image_tensor)
                probabilities = torch.softmax(outputs, dim=1)
                top_probs, top_indices = torch.topk(probabilities, 3)
                
                detections = []
                for i in range(top_probs.shape[1]):
                    prob = top_probs[0][i].item()
                    class_idx = top_indices[0][i].item()
                    species = self.bird_species[class_idx]
                    
                    if prob > confidence_threshold and species != 'Unknown Bird Species':
                        detection = {
                            'species': species,
                            'confidence': prob,
                            'bounding_box': self._estimate_bounding_box(image_path)
                        }
                        detections.append(detection)
                
                return detections
                
        except Exception as e:
            print(f"Error in Stage 2 identification: {e}")
            return []
    
    def process_frame(self, image_path: str, 
                     stage1_threshold: float = 0.5, 
                     stage2_threshold: float = 0.3) -> Dict:
        """
        Process a single frame through both stages
        Returns: Complete analysis result
        """
        frame_name = os.path.basename(image_path)
        
        # Stage 1: Check if bird is present
        is_bird, bird_confidence = self.stage1_detect_bird_presence(image_path, stage1_threshold)
        
        result = {
            'frame': frame_name,
            'bird_present': is_bird,
            'bird_confidence': bird_confidence,
            'species_detections': [],
            'processing_stage': 'stage1_only'
        }
        
        # Stage 2: Only if bird is detected
        if is_bird:
            species_detections = self.stage2_identify_species(image_path, stage2_threshold)
            result['species_detections'] = species_detections
            result['processing_stage'] = 'stage2_complete'
            
            if species_detections:
                result['primary_species'] = species_detections[0]['species']
                result['primary_confidence'] = species_detections[0]['confidence']
        
        return result
    
    def process_video_frames(self, frames_directory: str, 
                           stage1_threshold: float = 0.5,
                           stage2_threshold: float = 0.3) -> Dict:
        """
        Process all frames in a directory through two-stage pipeline
        """
        if not os.path.exists(frames_directory):
            return {'error': 'Frames directory not found'}
        
        frame_files = sorted([f for f in os.listdir(frames_directory) if f.endswith('.jpg')])
        
        print(f"🔍 Processing {len(frame_files)} frames through two-stage pipeline...")
        print(f"   Stage 1 threshold: {stage1_threshold}")
        print(f"   Stage 2 threshold: {stage2_threshold}")
        
        results = []
        birds_detected = 0
        species_identified = 0
        
        for i, frame_file in enumerate(frame_files):
            frame_path = os.path.join(frames_directory, frame_file)
            timestamp = i * 0.1  # Assuming 10 FPS
            
            result = self.process_frame(frame_path, stage1_threshold, stage2_threshold)
            result['timestamp'] = timestamp
            
            results.append(result)
            
            if result['bird_present']:
                birds_detected += 1
                if result['species_detections']:
                    species_identified += 1
                    species = result['primary_species']
                    conf = result['primary_confidence']
                    print(f"   t={timestamp:.1f}s: {species} ({conf:.2f})")
        
        # Summary statistics
        summary = {
            'total_frames': len(frame_files),
            'frames_with_birds': birds_detected,
            'frames_with_species': species_identified,
            'bird_detection_rate': birds_detected / len(frame_files) * 100,
            'species_identification_rate': species_identified / len(frame_files) * 100,
            'efficiency_gain': f"Stage 2 only processed {birds_detected}/{len(frame_files)} frames"
        }
        
        return {
            'summary': summary,
            'results': results
        }
    
    def _estimate_bounding_box(self, image_path: str) -> Dict:
        """Estimate bounding box for detected bird"""
        try:
            from PIL import Image
            image = Image.open(image_path)
            width, height = image.size
            
            # Simple heuristic: assume bird is in center 60% of image
            center_x = width // 2
            center_y = height // 2
            box_width = int(width * 0.6)
            box_height = int(height * 0.6)
            
            return {
                'x': max(0, center_x - box_width // 2),
                'y': max(0, center_y - box_height // 2),
                'width': box_width,
                'height': box_height
            }
        except:
            return {'x': 0, 'y': 0, 'width': 224, 'height': 224}


# Example usage
if __name__ == "__main__":
    detector = TwoStageBirdDetector()
    
    # Test with sample frames
    frames_dir = "/app/frames/real_test"
    if os.path.exists(frames_dir):
        results = detector.process_video_frames(frames_dir)
        
        print("\n" + "="*60)
        print("🎯 TWO-STAGE PIPELINE RESULTS")
        print("="*60)
        
        summary = results['summary']
        print(f"📊 Summary:")
        print(f"   • Total frames: {summary['total_frames']}")
        print(f"   • Frames with birds: {summary['frames_with_birds']}")
        print(f"   • Frames with species ID: {summary['frames_with_species']}")
        print(f"   • Bird detection rate: {summary['bird_detection_rate']:.1f}%")
        print(f"   • Species ID rate: {summary['species_identification_rate']:.1f}%")
        print(f"   • Efficiency: {summary['efficiency_gain']}")
