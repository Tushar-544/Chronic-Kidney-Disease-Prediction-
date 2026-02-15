"""
Kidney Disease Predictor Module
================================
Handles model loading, image preprocessing, and inference.
"""

import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import io
import time
import logging
from typing import Dict, Union
from pathlib import Path

logger = logging.getLogger(__name__)


class KidneyDiseasePredictor:
    """
    Kidney Disease Image Classification Predictor
    
    This class handles:
    - Loading the trained ResNet18 model
    - Image preprocessing (same as training)
    - Inference and probability calculation
    """
    
    def __init__(
        self,
        model_path: str,
        class_names_path: str,
        device: str = 'cuda'
    ):
        """
        Initialize the predictor
        
        Args:
            model_path: Path to trained model weights (.pth file)
            class_names_path: Path to class_names.json file
            device: Device to run inference on ('cuda' or 'cpu')
        """
        self.device = device if torch.cuda.is_available() else 'cpu'
        logger.info(f"Initializing predictor on device: {self.device}")
        
        # Load class names
        self.class_names = self._load_class_names(class_names_path)
        logger.info(f"Loaded {len(self.class_names)} classes: {self.class_names}")
        
        # Create and load model
        self.model = self._create_model(len(self.class_names))
        self._load_weights(model_path)
        
        # Set model to evaluation mode
        self.model.eval()
        
        # Define image preprocessing transform (MUST match training)
        self.transform = transforms.Compose([
            transforms.Resize((256, 256)),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],  # ImageNet mean
                std=[0.229, 0.224, 0.225]    # ImageNet std
            )
        ])
        
        logger.info("Predictor initialized successfully")
    
    def _load_class_names(self, class_names_path: str) -> list:
        """Load class names from JSON file"""
        import json
        
        try:
            with open(class_names_path, 'r') as f:
                data = json.load(f)
                return data['classes']
        except FileNotFoundError:
            logger.error(f"Class names file not found: {class_names_path}")
            raise
        except Exception as e:
            logger.error(f"Error loading class names: {e}")
            raise
    
    def _create_model(self, num_classes: int) -> nn.Module:
        """
        Create ResNet18 model architecture
        
        CRITICAL: This MUST match the training architecture exactly
        """
        # Load base ResNet18 (no pretrained weights yet)
        model = models.resnet18(weights=None)
        
        # Replace final fully connected layer
        # This matches the training configuration
        num_features = model.fc.in_features
        model.fc = nn.Sequential(
            nn.Dropout(0.5),
            nn.Linear(num_features, num_classes)
        )
        
        # Move model to device
        model = model.to(self.device)
        
        return model
    
    def _load_weights(self, model_path: str):
        """Load trained model weights"""
        try:
            logger.info(f"Loading model weights from: {model_path}")
            
            # Load checkpoint
            checkpoint = torch.load(
                model_path,
                map_location=self.device
            )
            
            # Handle different checkpoint formats
            if isinstance(checkpoint, dict):
                if 'model_state_dict' in checkpoint:
                    state_dict = checkpoint['model_state_dict']
                elif 'state_dict' in checkpoint:
                    state_dict = checkpoint['state_dict']
                else:
                    state_dict = checkpoint
            else:
                state_dict = checkpoint
            
            # Load weights into model
            self.model.load_state_dict(state_dict)
            logger.info("Model weights loaded successfully")
            
        except FileNotFoundError:
            logger.error(f"Model file not found: {model_path}")
            raise
        except Exception as e:
            logger.error(f"Error loading model weights: {e}")
            raise
    
    def _preprocess_image(self, image: Image.Image) -> torch.Tensor:
        """
        Preprocess image for model input
        
        Args:
            image: PIL Image
            
        Returns:
            Preprocessed image tensor
        """
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Apply transforms
        image_tensor = self.transform(image)
        
        # Add batch dimension [1, 3, 224, 224]
        image_tensor = image_tensor.unsqueeze(0)
        
        # Move to device
        image_tensor = image_tensor.to(self.device)
        
        return image_tensor
    
    def predict(self, image_path: str) -> Dict[str, Union[str, float, dict]]:
        """
        Predict kidney disease from image file path
        
        Args:
            image_path: Path to image file
            
        Returns:
            Dictionary containing:
                - predicted_class: str
                - confidence: float (0-1)
                - probabilities: dict of class probabilities
                - processing_time_ms: float
        """
        # Load image
        image = Image.open(image_path)
        
        # Predict
        return self._predict(image)
    
    def predict_from_bytes(self, image_bytes: bytes) -> Dict[str, Union[str, float, dict]]:
        """
        Predict kidney disease from image bytes
        
        Args:
            image_bytes: Image data as bytes
            
        Returns:
            Prediction results dictionary
        """
        # Load image from bytes
        image = Image.open(io.BytesIO(image_bytes))
        
        # Predict
        return self._predict(image)
    
    def _predict(self, image: Image.Image) -> Dict[str, Union[str, float, dict]]:
        """
        Internal prediction method
        
        Args:
            image: PIL Image
            
        Returns:
            Prediction results
        """
        start_time = time.time()
        
        try:
            # Preprocess image
            image_tensor = self._preprocess_image(image)
            
            # Run inference
            with torch.no_grad():
                # Forward pass
                output = self.model(image_tensor)
                
                # Apply softmax to get probabilities
                probabilities = torch.softmax(output, dim=1)[0]
                
                # Get predicted class
                predicted_idx = torch.argmax(probabilities).item()
                confidence = probabilities[predicted_idx].item()
            
            # Calculate processing time
            processing_time = (time.time() - start_time) * 1000  # ms
            
            # Prepare results
            result = {
                'predicted_class': self.class_names[predicted_idx],
                'confidence': float(confidence),
                'probabilities': {
                    class_name: float(prob)
                    for class_name, prob in zip(self.class_names, probabilities.cpu().numpy())
                },
                'processing_time_ms': float(processing_time)
            }
            
            return result
            
        except Exception as e:
            logger.error(f"Prediction error: {e}", exc_info=True)
            raise
    
    def predict_batch(self, image_paths: list) -> list:
        """
        Predict multiple images in batch
        
        Args:
            image_paths: List of image file paths
            
        Returns:
            List of prediction results
        """
        results = []
        
        for image_path in image_paths:
            try:
                result = self.predict(image_path)
                results.append({
                    'path': image_path,
                    'success': True,
                    'prediction': result
                })
            except Exception as e:
                results.append({
                    'path': image_path,
                    'success': False,
                    'error': str(e)
                })
        
        return results
    
    def get_model_info(self) -> dict:
        """Get model information"""
        return {
            'architecture': 'ResNet18',
            'classes': self.class_names,
            'num_classes': len(self.class_names),
            'device': str(self.device),
            'input_size': [224, 224]
        }


# Example usage
if __name__ == "__main__":
    # Initialize predictor
    predictor = KidneyDiseasePredictor(
        model_path="models/model_weights.pth",
        class_names_path="models/class_names.json",
        device='cuda'
    )
    
    # Predict single image
    result = predictor.predict("test_image.jpg")
    print(f"Prediction: {result['predicted_class']}")
    print(f"Confidence: {result['confidence']:.2%}")
    print(f"Processing time: {result['processing_time_ms']:.2f}ms")
    print(f"All probabilities: {result['probabilities']}")
