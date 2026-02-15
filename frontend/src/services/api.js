/**
 * API Service
 * =============
 * Centralized API communication layer for the Kidney Disease Classification System
 */

import axios from 'axios';

// Get base URL from environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds (model inference may take time)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor (add auth tokens, logging, etc.)
api.interceptors.request.use(
  (config) => {
    // Add API key if available
    const apiKey = import.meta.env.VITE_API_KEY;
    if (apiKey) {
      config.headers['X-API-Key'] = apiKey;
    }

    // Log request in development
    if (import.meta.env.VITE_ENV === 'development') {
      console.log('📤 API Request:', config.method.toUpperCase(), config.url);
    }

    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor (handle errors, transform responses)
api.interceptors.response.use(
  (response) => {
    // Log response in development
    if (import.meta.env.VITE_ENV === 'development') {
      console.log('📥 API Response:', response.status, response.config.url);
    }
    return response;
  },
  (error) => {
    // Handle different error scenarios
    if (error.response) {
      // Server responded with error status
      console.error('❌ API Error:', error.response.status, error.response.data);
    } else if (error.request) {
      // Request made but no response
      console.error('❌ Network Error: No response from server');
    } else {
      // Something else went wrong
      console.error('❌ Error:', error.message);
    }
    return Promise.reject(error);
  }
);

/**
 * API Service Methods
 */
const apiService = {
  /**
   * Health Check
   * GET /health
   */
  healthCheck: async () => {
    try {
      const response = await api.get('/health');
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  },

  /**
   * Get Model Information
   * GET /model/info
   */
  getModelInfo: async () => {
    try {
      const response = await api.get('/model/info');
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  },

  /**
   * Predict Single Image
   * POST /predict
   * @param {File} imageFile - Image file to predict
   */
  predictImage: async (imageFile) => {
    try {
      // Create FormData
      const formData = new FormData();
      formData.append('file', imageFile);

      // Send request
      const response = await api.post('/predict', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
        detail: error.response?.data?.detail,
      };
    }
  },

  /**
   * Predict Multiple Images (Batch)
   * POST /predict/batch
   * @param {File[]} imageFiles - Array of image files
   */
  predictBatch: async (imageFiles) => {
    try {
      // Create FormData
      const formData = new FormData();
      imageFiles.forEach((file) => {
        formData.append('files', file);
      });

      // Send request
      const response = await api.post('/predict/batch', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
        detail: error.response?.data?.detail,
      };
    }
  },
};

export default apiService;

// Export individual methods for convenience
export const {
  healthCheck,
  getModelInfo,
  predictImage,
  predictBatch,
} = apiService;
