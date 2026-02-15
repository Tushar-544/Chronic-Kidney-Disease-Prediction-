"""
Configuration Settings
======================
Application configuration using pydantic settings.
"""

from pydantic_settings import BaseSettings
from typing import List
from pathlib import Path


class Settings(BaseSettings):
    """Application settings"""
    
    # API Configuration
    APP_NAME: str = "Kidney Disease Classification API"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # Server Configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # CORS Settings
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",  # React default
        "http://localhost:8080",  # Vue default
        "http://localhost:4200",  # Angular default
        # Add your frontend URL here
    ]
    
    # Model Configuration
    MODEL_DIR: Path = Path("models")
    MODEL_PATH: str = "models/model_weights.pth"
    CLASS_NAMES_PATH: str = "models/class_names.json"
    
    # Device Configuration
    DEVICE: str = "cuda"  # or "cpu"
    
    # File Upload Limits
    MAX_FILE_SIZE_MB: int = 10
    MAX_BATCH_SIZE: int = 10
    ALLOWED_IMAGE_TYPES: List[str] = [
        "image/jpeg",
        "image/png",
        "image/jpg"
    ]
    
    # Logging Configuration
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "logs/api.log"
    
    # Security
    API_KEY_ENABLED: bool = False
    API_KEY: str = ""  # Set if API_KEY_ENABLED is True
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Create settings instance
settings = Settings()
