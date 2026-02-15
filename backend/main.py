"""
Kidney Disease Classification API
==================================
Production-ready FastAPI backend for kidney disease image classification.

Author: [Your Name]
Date: 2026-02-13
Model: ResNet18 (Transfer Learning)
Classes: Cyst, Normal, Stone, Tumor
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Dict, List, Optional
import uvicorn
import logging
from datetime import datetime

# Local imports
from app.models.predictor import KidneyDiseasePredictor
from app.core.config import settings
from app.core.logger import setup_logger

# Setup logging
logger = setup_logger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Kidney Disease Classification API",
    description="AI-powered kidney disease detection from medical images",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware (configure based on your frontend domain)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize model predictor (loaded once at startup)
predictor: Optional[KidneyDiseasePredictor] = None


# Pydantic models for request/response validation
class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    timestamp: str
    model_loaded: bool
    version: str


class PredictionResult(BaseModel):
    """Single prediction result"""
    predicted_class: str = Field(..., description="Predicted kidney condition")
    confidence: float = Field(..., ge=0, le=1, description="Prediction confidence (0-1)")
    probabilities: Dict[str, float] = Field(..., description="Probability for each class")
    processing_time_ms: float = Field(..., description="Processing time in milliseconds")


class PredictionResponse(BaseModel):
    """API response for prediction"""
    success: bool
    prediction: PredictionResult
    message: str = "Prediction completed successfully"
    timestamp: str


class ErrorResponse(BaseModel):
    """Error response model"""
    success: bool = False
    error: str
    detail: Optional[str] = None
    timestamp: str


# Application lifecycle events
@app.on_event("startup")
async def startup_event():
    """Load model on startup"""
    global predictor
    try:
        logger.info("Starting Kidney Disease Classification API...")
        logger.info(f"Loading model from: {settings.MODEL_PATH}")
        
        predictor = KidneyDiseasePredictor(
            model_path=settings.MODEL_PATH,
            class_names_path=settings.CLASS_NAMES_PATH,
            device=settings.DEVICE
        )
        
        logger.info("Model loaded successfully!")
        logger.info(f"Classes: {predictor.class_names}")
        logger.info(f"Device: {predictor.device}")
        
    except Exception as e:
        logger.error(f"Failed to load model: {str(e)}")
        raise


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down Kidney Disease Classification API...")


# API Routes
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Kidney Disease Classification API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """
    Health check endpoint
    
    Returns:
        HealthResponse: API health status
    """
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now().isoformat(),
        model_loaded=predictor is not None,
        version="1.0.0"
    )


@app.post(
    "/predict",
    response_model=PredictionResponse,
    tags=["Prediction"],
    responses={
        200: {"description": "Successful prediction"},
        400: {"description": "Invalid input"},
        500: {"description": "Server error"}
    }
)
async def predict_kidney_disease(
    file: UploadFile = File(..., description="Kidney medical image (JPG, PNG)")
):
    """
    Predict kidney disease from uploaded medical image
    
    Args:
        file: Uploaded image file (JPEG, PNG, etc.)
    
    Returns:
        PredictionResponse: Prediction results with confidence scores
    
    Example:
        ```bash
        curl -X POST "http://localhost:8000/predict" \\
             -H "accept: application/json" \\
             -H "Content-Type: multipart/form-data" \\
             -F "file=@kidney_image.jpg"
        ```
    """
    
    # Validate model is loaded
    if predictor is None:
        logger.error("Model not loaded")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Model not loaded. Please contact administrator."
        )
    
    # Validate file type
    if not file.content_type.startswith('image/'):
        logger.warning(f"Invalid file type: {file.content_type}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Expected image, got {file.content_type}"
        )
    
    try:
        # Log request
        logger.info(f"Processing prediction request for file: {file.filename}")
        
        # Read image file
        image_bytes = await file.read()
        
        # Validate file size (max 10MB)
        if len(image_bytes) > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size too large. Maximum size is 10MB."
            )
        
        # Make prediction
        result = predictor.predict_from_bytes(image_bytes)
        
        # Log successful prediction
        logger.info(
            f"Prediction: {result['predicted_class']} "
            f"(confidence: {result['confidence']:.2%})"
        )
        
        # Return response
        return PredictionResponse(
            success=True,
            prediction=PredictionResult(**result),
            timestamp=datetime.now().isoformat()
        )
        
    except HTTPException:
        raise
    
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction failed: {str(e)}"
        )


@app.post("/predict/batch", tags=["Prediction"])
async def predict_batch(
    files: List[UploadFile] = File(..., description="Multiple kidney images")
):
    """
    Predict kidney disease for multiple images (batch processing)
    
    Args:
        files: List of uploaded image files
    
    Returns:
        List of prediction results
        
    Note:
        Maximum 10 images per batch request
    """
    
    if predictor is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Model not loaded"
        )
    
    # Validate batch size
    if len(files) > 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 10 images per batch request"
        )
    
    try:
        results = []
        
        for file in files:
            # Validate file type
            if not file.content_type.startswith('image/'):
                results.append({
                    "filename": file.filename,
                    "success": False,
                    "error": "Invalid file type"
                })
                continue
            
            # Read and predict
            image_bytes = await file.read()
            
            try:
                result = predictor.predict_from_bytes(image_bytes)
                results.append({
                    "filename": file.filename,
                    "success": True,
                    "prediction": result
                })
            except Exception as e:
                results.append({
                    "filename": file.filename,
                    "success": False,
                    "error": str(e)
                })
        
        return {
            "success": True,
            "total": len(files),
            "results": results,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Batch prediction error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch prediction failed: {str(e)}"
        )


@app.get("/model/info", tags=["Model"])
async def get_model_info():
    """
    Get model information and metadata
    
    Returns:
        Model architecture, classes, and training information
    """
    
    if predictor is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Model not loaded"
        )
    
    return {
        "model_architecture": "ResNet18",
        "classes": predictor.class_names,
        "num_classes": len(predictor.class_names),
        "input_size": [224, 224],
        "device": str(predictor.device),
        "normalization": {
            "mean": [0.485, 0.456, 0.406],
            "std": [0.229, 0.224, 0.225]
        }
    }


# Exception handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Handle HTTP exceptions"""
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            error=exc.detail,
            timestamp=datetime.now().isoformat()
        ).dict()
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Handle general exceptions"""
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ErrorResponse(
            error="Internal server error",
            detail=str(exc) if settings.DEBUG else None,
            timestamp=datetime.now().isoformat()
        ).dict()
    )


# Run server (for development only)
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info"
    )
