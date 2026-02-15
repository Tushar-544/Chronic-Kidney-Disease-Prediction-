# Kidney Disease Classification API - Backend

Production-ready FastAPI backend for AI-powered kidney disease detection from medical images.

## 🎯 Overview

This backend service provides a REST API for classifying kidney medical images into four categories:
- **Cyst**: Kidney cyst detection
- **Normal**: Healthy kidney tissue
- **Stone**: Kidney stone detection
- **Tumor**: Kidney tumor detection

**Model**: ResNet18 (Transfer Learning)  
**Framework**: PyTorch  
**API**: FastAPI  
**Accuracy**: ~99.95%

---

## 📁 Project Structure

```
backend/
├── main.py                      # FastAPI application entry point
├── app/
│   ├── __init__.py
│   ├── models/
│   │   ├── __init__.py
│   │   └── predictor.py        # Model inference logic
│   └── core/
│       ├── __init__.py
│       ├── config.py            # Configuration settings
│       └── logger.py            # Logging configuration
├── models/                      # Trained model files (add your models here)
│   ├── model_weights.pth       # PyTorch model weights
│   └── class_names.json        # Class labels
├── logs/                        # Application logs
├── tests/                       # Unit tests
├── requirements.txt             # Python dependencies
├── Dockerfile                   # Docker configuration
├── docker-compose.yml          # Docker Compose setup
├── .env.example                # Environment variables template
└── README.md                   # This file
```

---

## 🚀 Quick Start

### Prerequisites

- Python 3.10+
- PyTorch 2.x
- Trained model files (`.pth` and `class_names.json`)

### 1. Clone and Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Add Model Files

Copy your trained model files to the `models/` directory:

```
models/
├── model_weights.pth        # Your trained model weights
└── class_names.json         # Class labels
```

**class_names.json format:**
```json
{
  "classes": ["Cyst", "Normal", "Stone", "Tumor"]
}
```

### 3. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your settings
nano .env
```

### 4. Run the Server

```bash
# Development mode (with auto-reload)
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Production mode
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

The API will be available at:
- **API**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc

---

## 📡 API Endpoints

### 1. Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-02-13T10:30:00",
  "model_loaded": true,
  "version": "1.0.0"
}
```

---

### 2. Single Image Prediction
```http
POST /predict
Content-Type: multipart/form-data
```

**Request:**
```bash
curl -X POST "http://localhost:8000/predict" \
     -H "accept: application/json" \
     -H "Content-Type: multipart/form-data" \
     -F "file=@kidney_image.jpg"
```

**Response:**
```json
{
  "success": true,
  "prediction": {
    "predicted_class": "Normal",
    "confidence": 0.9876,
    "probabilities": {
      "Cyst": 0.0034,
      "Normal": 0.9876,
      "Stone": 0.0045,
      "Tumor": 0.0045
    },
    "processing_time_ms": 123.45
  },
  "message": "Prediction completed successfully",
  "timestamp": "2026-02-13T10:35:00"
}
```

---

### 3. Batch Prediction
```http
POST /predict/batch
Content-Type: multipart/form-data
```

**Request:**
```bash
curl -X POST "http://localhost:8000/predict/batch" \
     -F "files=@image1.jpg" \
     -F "files=@image2.jpg" \
     -F "files=@image3.jpg"
```

**Response:**
```json
{
  "success": true,
  "total": 3,
  "results": [
    {
      "filename": "image1.jpg",
      "success": true,
      "prediction": { ... }
    },
    {
      "filename": "image2.jpg",
      "success": true,
      "prediction": { ... }
    },
    {
      "filename": "image3.jpg",
      "success": true,
      "prediction": { ... }
    }
  ],
  "timestamp": "2026-02-13T10:40:00"
}
```

---

### 4. Model Information
```http
GET /model/info
```

**Response:**
```json
{
  "model_architecture": "ResNet18",
  "classes": ["Cyst", "Normal", "Stone", "Tumor"],
  "num_classes": 4,
  "input_size": [224, 224],
  "device": "cuda",
  "normalization": {
    "mean": [0.485, 0.456, 0.406],
    "std": [0.229, 0.224, 0.225]
  }
}
```

---

## 🐳 Docker Deployment

### Build and Run with Docker

```bash
# Build image
docker build -t kidney-disease-api .

# Run container
docker run -d \
  -p 8000:8000 \
  -v $(pwd)/models:/app/models:ro \
  -v $(pwd)/logs:/app/logs \
  --name kidney-api \
  kidney-disease-api
```

### Using Docker Compose (Recommended)

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## 🧪 Testing the API

### Using cURL

```bash
# Health check
curl http://localhost:8000/health

# Predict
curl -X POST http://localhost:8000/predict \
  -F "file=@test_kidney_image.jpg"
```

### Using Python

```python
import requests

# Single prediction
with open('kidney_image.jpg', 'rb') as f:
    files = {'file': f}
    response = requests.post(
        'http://localhost:8000/predict',
        files=files
    )
    print(response.json())
```

### Using JavaScript/Fetch

```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

fetch('http://localhost:8000/predict', {
  method: 'POST',
  body: formData
})
  .then(res => res.json())
  .then(data => console.log(data));
```

---

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `HOST` | Server host | `0.0.0.0` |
| `PORT` | Server port | `8000` |
| `DEBUG` | Debug mode | `False` |
| `DEVICE` | Inference device | `cuda` |
| `MODEL_PATH` | Model weights path | `models/model_weights.pth` |
| `CLASS_NAMES_PATH` | Class names path | `models/class_names.json` |
| `MAX_FILE_SIZE_MB` | Max upload size | `10` |
| `LOG_LEVEL` | Logging level | `INFO` |

---

## 🔒 Security Considerations

### For Production:

1. **Enable HTTPS**
   - Use nginx reverse proxy with SSL certificates
   - Or use cloud load balancer with SSL termination

2. **Add Authentication**
   - Implement API key authentication
   - Or use OAuth2/JWT tokens

3. **Rate Limiting**
   - Add rate limiting middleware
   - Prevent abuse and DoS attacks

4. **Input Validation**
   - Already implemented: file type validation
   - Already implemented: file size limits
   - Already implemented: error handling

5. **CORS Configuration**
   - Update `ALLOWED_ORIGINS` in `.env`
   - Restrict to your frontend domain only

---

## 📊 Performance Optimization

### CPU Mode
```bash
# In .env
DEVICE=cpu
```

### GPU Mode
```bash
# In .env
DEVICE=cuda

# Ensure CUDA is installed
```

### Multiple Workers
```bash
# Run with 4 workers for better throughput
uvicorn main:app --workers 4 --host 0.0.0.0 --port 8000
```

---

## 🐛 Troubleshooting

### Model Not Loading

```bash
# Check model files exist
ls -la models/

# Check file permissions
chmod 644 models/model_weights.pth
chmod 644 models/class_names.json
```

### CUDA Out of Memory

```python
# Switch to CPU in .env
DEVICE=cpu
```

### Port Already in Use

```bash
# Change port in .env
PORT=8001
```

---

## 📝 API Response Format

### Success Response
```json
{
  "success": true,
  "prediction": {
    "predicted_class": "string",
    "confidence": 0.95,
    "probabilities": {},
    "processing_time_ms": 100
  },
  "message": "string",
  "timestamp": "ISO 8601 datetime"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "detail": "Detailed error info",
  "timestamp": "ISO 8601 datetime"
}
```

---

## 🔄 Model Update Process

1. Train new model using the Colab notebook
2. Export model weights and class names
3. Backup existing models
4. Replace `models/model_weights.pth`
5. Restart the API server

```bash
# Backup
cp models/model_weights.pth models/model_weights.pth.backup

# Replace
cp new_model_weights.pth models/model_weights.pth

# Restart
docker-compose restart
```

---

## 📚 Additional Resources

- **FastAPI Documentation**: https://fastapi.tiangolo.com/
- **PyTorch Documentation**: https://pytorch.org/docs/
- **Interactive API Docs**: http://localhost:8000/docs

---

## 📄 License

[Specify your license]

---

## 👥 Contributors

[Your name/team]

---

## 📧 Support

For issues and questions:
- Create an issue in the repository
- Contact: [your-email@example.com]

---

## ⚠️ Important Disclaimer

**This model is for research and educational purposes only.**

- NOT validated for clinical use
- NOT FDA/CE approved
- Requires medical expert validation
- Should NOT be used for actual diagnosis
- Always consult qualified healthcare professionals

---

**Built with ❤️ using FastAPI and PyTorch**
