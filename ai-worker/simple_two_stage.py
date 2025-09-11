import os
import random
import json
from typing import List, Dict, Tuple

class SimpleTwoStageDetector:
    """
    Simplified two-stage bird detection for demonstration
    Stage 1: Binary classification (bird vs no bird) 
    Stage 2: Species identification (what kind of bird)
    """
    
    def __init__(self):
        # Stage 1: Binary classes
        self.binary_classes = ['No Bird', 'Bird Present']
        
        # Stage 2: Bird species
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
            'Pine Siskin', 'Common Grackle', 'Brown Thrasher', 'Gray Catbird'
        ]
        
        print("✅ Simple Two-Stage Detector initialized")
        print(f"   Stage 1: Binary classification ({len(self.binary_classes)} classes)")
        print(f"   Stage 2: Species identification ({len(self.bird_species)} species)")
    
    def stage1_detect_bird_presence(self, frame_path: str, threshold: float = 0.5) -> Tuple[bool, float]:
        """
        Stage 1: Determine if there's a bird in the image
        Mock implementation - in reality this would use a trained binary classifier
        """
        # Mock logic: 35% chance of detecting a bird
        bird_prob = random.uniform(0.1, 0.9)
        is_bird = bird_prob > threshold
        
        return is_bird, bird_prob
    
    def stage2_identify_species(self, frame_path: str, confidence_threshold: float = 0.3) -> List[Dict]:
        """
        Stage 2: Identify bird species (only called if Stage 1 detects bird)
        Mock implementation - in reality this would use a trained species classifier
        """
        detections = []
        
        # Mock: 80% chance of identifying species, 20% chance of multiple species
        if random.random() < 0.8:
            species = random.choice(self.bird_species)
            confidence = random.uniform(0.6, 0.95)
            
            detection = {
                'species': species,
                'confidence': confidence,
                'bounding_box': {
                    'x': random.randint(50, 150),
                    'y': random.randint(30, 100),
                    'width': random.randint(80, 120),
                    'height': random.randint(60, 100)
                }
            }
            detections.append(detection)
            
            # 20% chance of second species
            if random.random() < 0.2:
                species2 = random.choice(self.bird_species)
                confidence2 = random.uniform(0.4, 0.8)
                detection2 = {
                    'species': species2,
                    'confidence': confidence2,
                    'bounding_box': {
                        'x': random.randint(50, 150),
                        'y': random.randint(30, 100),
                        'width': random.randint(60, 100),
                        'height': random.randint(40, 80)
                    }
                }
                detections.append(detection2)
        
        return detections
    
    def process_frame(self, frame_path: str, 
                     stage1_threshold: float = 0.5, 
                     stage2_threshold: float = 0.3) -> Dict:
        """
        Process a single frame through both stages
        """
        frame_name = os.path.basename(frame_path)
        
        # Stage 1: Check if bird is present
        is_bird, bird_confidence = self.stage1_detect_bird_presence(frame_path, stage1_threshold)
        
        result = {
            'frame': frame_name,
            'bird_present': is_bird,
            'bird_confidence': bird_confidence,
            'species_detections': [],
            'processing_stage': 'stage1_only'
        }
        
        # Stage 2: Only if bird is detected
        if is_bird:
            species_detections = self.stage2_identify_species(frame_path, stage2_threshold)
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
        
        print(f"\n🔍 TWO-STAGE PIPELINE PROCESSING")
        print(f"📁 Processing {len(frame_files)} frames from {frames_directory}")
        print(f"🎯 Stage 1 threshold: {stage1_threshold} (bird presence)")
        print(f"🎯 Stage 2 threshold: {stage2_threshold} (species confidence)")
        print("-" * 60)
        
        results = []
        birds_detected = 0
        species_identified = 0
        stage2_processed = 0
        
        for i, frame_file in enumerate(frame_files):
            frame_path = os.path.join(frames_directory, frame_file)
            timestamp = i * 0.1  # Assuming 10 FPS
            
            result = self.process_frame(frame_path, stage1_threshold, stage2_threshold)
            result['timestamp'] = timestamp
            
            results.append(result)
            
            # Statistics
            if result['bird_present']:
                birds_detected += 1
                stage2_processed += 1
                
                if result['species_detections']:
                    species_identified += 1
                    species = result['primary_species']
                    conf = result['primary_confidence']
                    print(f"✅ t={timestamp:.1f}s: {species} (confidence: {conf:.2f})")
                else:
                    print(f"⚠️  t={timestamp:.1f}s: Bird detected but species unclear")
            else:
                print(f"❌ t={timestamp:.1f}s: No bird detected")
        
        # Summary statistics
        summary = {
            'total_frames': len(frame_files),
            'frames_with_birds': birds_detected,
            'frames_with_species': species_identified,
            'stage2_processed': stage2_processed,
            'bird_detection_rate': birds_detected / len(frame_files) * 100,
            'species_identification_rate': species_identified / len(frame_files) * 100,
            'stage2_efficiency': f"Stage 2 processed {stage2_processed}/{len(frame_files)} frames ({stage2_processed/len(frame_files)*100:.1f}%)",
            'computational_savings': f"Saved {len(frame_files) - stage2_processed} Stage 2 computations"
        }
        
        return {
            'summary': summary,
            'results': results
        }


# Test the two-stage pipeline
if __name__ == "__main__":
    detector = SimpleTwoStageDetector()
    
    # Test with sample frames
    frames_dir = "/app/frames/real_test"
    if os.path.exists(frames_dir):
        results = detector.process_video_frames(frames_dir, stage1_threshold=0.6, stage2_threshold=0.4)
        
        print("\n" + "="*60)
        print("🎯 TWO-STAGE PIPELINE RESULTS")
        print("="*60)
        
        summary = results['summary']
        print(f"📊 Summary:")
        print(f"   • Total frames: {summary['total_frames']}")
        print(f"   • Frames with birds (Stage 1): {summary['frames_with_birds']}")
        print(f"   • Frames with species ID (Stage 2): {summary['frames_with_species']}")
        print(f"   • Stage 2 processed: {summary['stage2_processed']}")
        print(f"   • Bird detection rate: {summary['bird_detection_rate']:.1f}%")
        print(f"   • Species ID rate: {summary['species_identification_rate']:.1f}%")
        print(f"   • Efficiency: {summary['stage2_efficiency']}")
        print(f"   • Computational savings: {summary['computational_savings']}")
        
        # Save results
        with open('/tmp/two_stage_results.json', 'w') as f:
            json.dump(results, f, indent=2)
        
        print(f"\n✅ Results saved to /tmp/two_stage_results.json")
        
        # Show species distribution
        species_count = {}
        for result in results['results']:
            if result['species_detections']:
                species = result['primary_species']
                species_count[species] = species_count.get(species, 0) + 1
        
        if species_count:
            print(f"\n🕊️  Species Distribution:")
            for species, count in sorted(species_count.items(), key=lambda x: x[1], reverse=True):
                percentage = (count / summary['frames_with_species']) * 100
                print(f"   • {species}: {count} detections ({percentage:.1f}%)")
    else:
        print(f"❌ Frames directory not found: {frames_dir}")
