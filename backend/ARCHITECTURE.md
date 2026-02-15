# Backend Architecture Documentation

## 📐 System Architecture

### High-Level Overview

```
┌─────────────────┐
│   Frontend      │
│  (React/Vue)    │
└────────┬────────┘
         │
         │ HTTP/REST
         │
┌────────▼────────────────────────────────────┐
│         FastAPI Application                 │
│  ┌──────────────────────────────────────┐  │
│  │  API Routes (main.py)                │  │
│  │  - /health                           │  │
│  │  - /predict                          │  │
│  │  - /predict/batch                    │  │
│  │  - /model/info                       │  │
│  └──────────┬───────────────────────────┘  │
│             │                                │
│  ┌──────────▼───────────────────────────┐  │
│  │  Predictor (app/models/predictor.py) │  │
│  │  - Model Loading                     │  │
│  │  - Image Preprocessing               │  │
│  │  - Inference                         │  │
│  └──────────┬───────────────────────────┘  │
│             │                                │
│  ┌──────────▼───────────────────────────┐  │
│  │  PyTorch Model (ResNet18)            │  │
│  │  - 4 Classes                         │  │
│  │  - GPU/CPU Support                   │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

---

## 🗂️ Project Structure Explained

```
backend/
│
├── main.py                          # FastAPI application entry point
│   ├── App initialization
│   ├── CORS configuration
│   ├── API routes definition
│   └── Exception handlers
│
├── app/                             # Application package
│   │
│   ├── models/                      # Model-related code
│   │   ├── __init__.py
│   │   └── predictor.py            # Core prediction logic
│   │       ├── KidneyDiseasePredictor class
│   │       ├── Image preprocessing
│   │       ├── Model loading
│   │       └── Inference methods
│   │
│   └── core/                        # Core utilities
│       ├── __init__.py
│       ├── config.py                # Configuration management
│       │   └── Settings (Pydantic)
│       └── logger.py                # Logging setup
│           └── setup_logger()
│
├── models/                          # Model files (Git-ignored)
│   ├── model_weights.pth           # PyTorch model weights (100MB+)
│   └── class_names.json            # Class labels
│
├── logs/                            # Application logs
│   └── api.log                     # Rotating log file
│
├── tests/                           # Unit tests
│   └── test_api.py                 # API test script
│
├── requirements.txt                 # Python dependencies
├── Dockerfile                       # Docker image definition
├── docker-compose.yml              # Docker Compose config
├── .env.example                    # Environment variables template
├── .gitignore                      # Git ignore rules
└── README.md                       # Documentation
```

---

## 🔄 Request Flow

### Single Prediction Flow

```
1. Client → POST /predict with image file
                │
2. FastAPI → Validate file type & size
                │
3. FastAPI → Read image bytes
                │
4. Predictor → Load image from bytes (PIL)
                │
5. Predictor → Preprocess image
                │   • Resize to 256x256
                │   • Center crop to 224x224
                │   • Convert to tensor
                │   • Normalize with ImageNet stats
                │
6. PyTorch → Forward pass through ResNet18
                │
7. PyTorch → Apply softmax for probabilities
                │
8. Predictor → Extract predictions
                │   • Predicted class
                │   • Confidence score
                │   • All class probabilities
                │
9. FastAPI → Format response (JSON)
                │
10. Client ← JSON response with prediction
```

---

## 🧩 Component Details

### 1. Main Application (main.py)

**Responsibilities:**
- Initialize FastAPI app
- Configure middleware (CORS)
- Define API routes
- Handle requests/responses
- Exception handling
- Application lifecycle (startup/shutdown)

**Key Features:**
- Pydantic models for request/response validation
- Automatic OpenAPI documentation
- Type hints for better IDE support
- Comprehensive error handling

**API Routes:**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/` | GET | Root information |
| `/health` | GET | Health check |
| `/predict` | POST | Single image prediction |
| `/predict/batch` | POST | Batch predictions |
| `/model/info` | GET | Model metadata |

---

### 2. Predictor Module (app/models/predictor.py)

**KidneyDiseasePredictor Class:**

```python
class KidneyDiseasePredictor:
    def __init__(model_path, class_names_path, device)
        # Load model and prepare for inference
    
    def predict(image_path) -> dict
        # Predict from file path
    
    def predict_from_bytes(image_bytes) -> dict
        # Predict from bytes (API usage)
    
    def _preprocess_image(image) -> tensor
        # Image preprocessing pipeline
    
    def _predict(image) -> dict
        # Core prediction logic
```

**Image Preprocessing Pipeline:**
```python
transforms.Compose([
    transforms.Resize((256, 256)),      # Resize
    transforms.CenterCrop(224),         # Center crop
    transforms.ToTensor(),              # Convert to tensor
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],    # ImageNet mean
        std=[0.229, 0.224, 0.225]      # ImageNet std
    )
])
```

**Critical Notes:**
- Preprocessing MUST match training exactly
- Uses ImageNet normalization values
- Outputs 224x224 RGB tensor
- Runs on GPU if available, else CPU

---

### 3. Configuration (app/core/config.py)

**Settings Class (Pydantic):**
- Type-safe configuration
- Environment variable support
- Default values
- Validation

**Configuration Options:**
```python
- API settings (name, version, debug)
- Server settings (host, port)
- CORS settings (allowed origins)
- Model paths
- Device configuration (cuda/cpu)
- File upload limits
- Logging configuration
- Security settings
```

---

### 4. Logger (app/core/logger.py)

**Logging Setup:**
- Console output (INFO level)
- File output (DEBUG level)
- Rotating file handler (10MB max, 5 backups)
- Structured log format

**Log Locations:**
- Console: Immediate feedback
- File: `logs/api.log`

---

## 📊 Data Models

### Request Models

**File Upload:**
```python
UploadFile = File(
    ...,
    description="Kidney medical image (JPG, PNG)"
)
```

### Response Models

**PredictionResult:**
```python
{
    "predicted_class": str,      # e.g., "Normal"
    "confidence": float,          # 0.0 to 1.0
    "probabilities": {           # All class probabilities
        "Cyst": float,
        "Normal": float,
        "Stone": float,
        "Tumor": float
    },
    "processing_time_ms": float  # Inference time
}
```

**PredictionResponse:**
```python
{
    "success": bool,
    "prediction": PredictionResult,
    "message": str,
    "timestamp": str  # ISO 8601
}
```

**ErrorResponse:**
```python
{
    "success": false,
    "error": str,
    "detail": Optional[str],
    "timestamp": str
}
```

---

## 🔐 Security Features

### 1. Input Validation
- File type validation (images only)
- File size limits (10MB max)
- Content type checking
- Batch size limits (10 images max)

### 2. Error Handling
- Graceful error messages
- No sensitive information leak
- Proper HTTP status codes
- Structured error responses

### 3. CORS Configuration
- Configurable allowed origins
- Credential support
- Method restrictions

### 4. Optional API Key Authentication
- Can be enabled via config
- Environment-based secrets

---

## 🚀 Deployment Options

### Option 1: Direct Python

```bash
# Development
uvicorn main:app --reload

# Production
uvicorn main:app --workers 4 --host 0.0.0.0 --port 8000
```

**Pros:** Simple, fast iteration  
**Cons:** Manual process management

---

### Option 2: Docker

```bash
docker build -t kidney-api .
docker run -p 8000:8000 kidney-api
```

**Pros:** Containerized, reproducible  
**Cons:** Requires Docker knowledge

---

### Option 3: Docker Compose

```bash
docker-compose up -d
```

**Pros:** Easy configuration, multi-service  
**Cons:** Slight overhead

---

### Option 4: Cloud Deployment

**AWS:**
- Elastic Beanstalk
- ECS (Elastic Container Service)
- EC2 with Docker

**Google Cloud:**
- Cloud Run
- App Engine
- GKE (Kubernetes)

**Azure:**
- App Service
- Container Instances
- AKS (Kubernetes)

**Heroku:**
- Simple deployment
- Container support

---

## ⚡ Performance Considerations

### Model Loading
- Model loaded once at startup
- Kept in memory for fast inference
- No re-loading per request

### Inference Speed
- GPU: ~50-100ms per image
- CPU: ~200-500ms per image

### Batch Processing
- Processes images sequentially
- Can be optimized for true batching

### Scalability
- Horizontal scaling: Multiple workers
- Vertical scaling: Better GPU
- Load balancer: Multiple instances

---

## 🔍 Monitoring & Logging

### Application Logs
```
logs/api.log
```

### Log Levels
- DEBUG: Detailed diagnostics
- INFO: General information
- WARNING: Warning messages
- ERROR: Error messages

### What Gets Logged
- API requests
- Predictions (class, confidence)
- Errors and exceptions
- Startup/shutdown events

---

## 🧪 Testing Strategy

### Unit Tests
- Test predictor class
- Test preprocessing
- Test model loading

### Integration Tests
- Test API endpoints
- Test request/response formats
- Test error handling

### Load Tests
- Concurrent requests
- Large file uploads
- Batch processing limits

---

## 📈 Future Enhancements

### Potential Improvements
1. **Caching**: Cache frequent predictions
2. **Authentication**: JWT/OAuth2 support
3. **Rate Limiting**: Prevent abuse
4. **Metrics**: Prometheus/Grafana
5. **Database**: Store predictions
6. **Webhooks**: Async notifications
7. **Model Versioning**: A/B testing
8. **Batch Optimization**: True batch inference
9. **Image Storage**: S3/Cloud Storage
10. **Monitoring**: Health metrics, alerts

---

## 🐛 Common Issues & Solutions

### Issue 1: Model Not Loading
**Symptom:** "Model file not found"  
**Solution:** 
```bash
# Check model files
ls -la models/
# Verify paths in .env
```

### Issue 2: CUDA Out of Memory
**Symptom:** "RuntimeError: CUDA out of memory"  
**Solution:**
```bash
# Switch to CPU
DEVICE=cpu
```

### Issue 3: Port Already in Use
**Symptom:** "Address already in use"  
**Solution:**
```bash
# Change port
PORT=8001
# Or kill existing process
lsof -ti:8000 | xargs kill -9
```

### Issue 4: Import Errors
**Symptom:** "ModuleNotFoundError"  
**Solution:**
```bash
# Reinstall dependencies
pip install -r requirements.txt
```

---

## 📚 API Documentation

### Automatic Documentation

FastAPI provides automatic interactive documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

These are generated from:
- Route definitions
- Pydantic models
- Docstrings
- Type hints

---

## 🔄 Model Update Workflow

```
1. Train new model in Colab
        ↓
2. Export weights (model_weights.pth)
        ↓
3. Backup current model
        ↓
4. Upload new weights to models/
        ↓
5. Restart API server
        ↓
6. Test with test_api.py
        ↓
7. Monitor logs for issues
```

---

## 💡 Best Practices

### Code Quality
- ✅ Type hints everywhere
- ✅ Docstrings for all functions
- ✅ Meaningful variable names
- ✅ Consistent formatting (black)
- ✅ Linting (flake8)

### API Design
- ✅ RESTful endpoints
- ✅ Proper HTTP status codes
- ✅ Consistent response format
- ✅ Version your API (/v1/predict)
- ✅ Pagination for lists

### Security
- ✅ Input validation
- ✅ Error handling
- ✅ CORS configuration
- ✅ HTTPS in production
- ✅ API key authentication

### Performance
- ✅ Model loaded once
- ✅ Async where possible
- ✅ Connection pooling
- ✅ Caching strategies
- ✅ Load balancing

---

**Architecture designed for:**
- ✅ Scalability
- ✅ Maintainability
- ✅ Performance
- ✅ Security
- ✅ Ease of deployment
