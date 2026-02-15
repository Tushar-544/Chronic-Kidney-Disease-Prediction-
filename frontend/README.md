# Kidney Disease Classification - Frontend

Modern, responsive React frontend for the AI-powered Kidney Disease Classification System.

## 🎨 Features

- ✅ **Drag & Drop Upload** - Easy image upload interface
- ✅ **Real-time Predictions** - Instant AI-powered analysis
- ✅ **Beautiful UI** - Modern design with Tailwind CSS
- ✅ **Responsive** - Works on desktop, tablet, and mobile
- ✅ **Backend Status** - Live connection monitoring
- ✅ **Detailed Results** - Confidence scores and probabilities
- ✅ **Model Information** - View model architecture and specs
- ✅ **Toast Notifications** - User-friendly feedback
- ✅ **Error Handling** - Graceful error management

## 🛠️ Tech Stack

- **Framework:** React 18
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **HTTP Client:** Axios
- **Icons:** Lucide React
- **Notifications:** React Toastify

## 📁 Project Structure

```
frontend/
├── public/                  # Static assets
├── src/
│   ├── components/         # React components
│   │   ├── Header.jsx
│   │   ├── Hero.jsx
│   │   ├── UploadSection.jsx
│   │   ├── ResultsSection.jsx
│   │   ├── ModelInfo.jsx
│   │   └── Footer.jsx
│   ├── services/          # API service layer
│   │   └── api.js         # Axios configuration and API calls
│   ├── App.jsx            # Main app component
│   ├── main.jsx           # React entry point
│   └── index.css          # Global styles
├── .env.example           # Environment variables template
├── package.json           # Dependencies
├── vite.config.js         # Vite configuration
├── tailwind.config.js     # Tailwind configuration
└── README.md             # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Backend API running on `http://localhost:8000`

### Installation

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   # Copy environment template
   cp .env.example .env

   # Edit .env file
   # Set VITE_API_BASE_URL to your backend URL
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

## 📝 Environment Variables

Create a `.env` file in the frontend directory:

```bash
# Backend API URL
VITE_API_BASE_URL=http://localhost:8000

# Optional: API Key (if backend requires authentication)
# VITE_API_KEY=your-api-key-here

# Environment
VITE_ENV=development
```

## 🔌 API Integration

### API Service (`src/services/api.js`)

The API service handles all communication with the backend:

```javascript
import apiService from './services/api'

// Health check
const result = await apiService.healthCheck()

// Get model info
const info = await apiService.getModelInfo()

// Predict single image
const prediction = await apiService.predictImage(imageFile)

// Predict multiple images
const batchResults = await apiService.predictBatch(imageFiles)
```

### Adding New API Endpoints

1. Add method to `src/services/api.js`:

```javascript
export const newEndpoint = async (data) => {
  try {
    const response = await api.post('/new-endpoint', data)
    return { success: true, data: response.data }
  } catch (error) {
    return { success: false, error: error.message }
  }
}
```

2. Use in components:

```javascript
import { newEndpoint } from './services/api'

const result = await newEndpoint(myData)
```

## 🎨 Customization

### Changing Colors

Edit `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        500: '#your-color',
        600: '#your-darker-color',
      },
    },
  },
}
```

### Adding Components

1. Create component in `src/components/`:

```jsx
// src/components/MyComponent.jsx
const MyComponent = () => {
  return (
    <div>
      {/* Your content */}
    </div>
  )
}

export default MyComponent
```

2. Import in `App.jsx`:

```jsx
import MyComponent from './components/MyComponent'
```

## 🧪 Testing the Frontend

### Manual Testing

1. **Start backend**
   ```bash
   cd ../backend
   uvicorn main:app --reload
   ```

2. **Start frontend**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test features:**
   - Upload an image
   - Check predictions
   - View model info
   - Test with invalid files

### Testing API Connectivity

The frontend automatically checks backend connectivity on load and displays status in the header.

## 📦 Building for Production

```bash
# Build production bundle
npm run build

# Preview production build
npm run preview
```

The build output will be in the `dist/` directory.

## 🌐 Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

### Deploy to Netlify

```bash
# Build
npm run build

# Deploy dist/ folder via Netlify UI or CLI
```

### Environment Variables in Production

Make sure to set:
- `VITE_API_BASE_URL` to your production backend URL
- `VITE_API_KEY` if using authentication

## 🔧 Troubleshooting

### Backend Connection Failed

**Issue:** "Cannot connect to backend"

**Solutions:**
1. Check backend is running: `http://localhost:8000/health`
2. Verify `VITE_API_BASE_URL` in `.env`
3. Check CORS settings in backend
4. Clear browser cache

### CORS Errors

**Issue:** CORS policy blocking requests

**Solution:** Update backend CORS configuration in `backend/.env`:
```bash
ALLOWED_ORIGINS=http://localhost:3000
```

### Image Upload Fails

**Issue:** "File size too large" or "Invalid file type"

**Solutions:**
1. Check file is under 10MB
2. Ensure file type is JPEG, PNG, or GIF
3. Check backend logs for errors

### Vite Port Already in Use

**Issue:** Port 3000 already in use

**Solution:**
```bash
# Use different port
npm run dev -- --port 3001
```

Or update `vite.config.js`:
```javascript
server: {
  port: 3001
}
```

## 📚 Key Dependencies

| Package | Purpose |
|---------|---------|
| `react` | UI framework |
| `vite` | Build tool |
| `tailwindcss` | CSS framework |
| `axios` | HTTP client |
| `react-toastify` | Notifications |
| `lucide-react` | Icons |

## 🔄 Running Frontend & Backend Together

### Option 1: Separate Terminals

**Terminal 1 - Backend:**
```bash
cd backend
uvicorn main:app --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Option 2: Using Concurrently (from project root)

1. Install concurrently:
   ```bash
   npm install -g concurrently
   ```

2. Run both:
   ```bash
   concurrently "cd backend && uvicorn main:app --reload" "cd frontend && npm run dev"
   ```

## 🎯 User Flow

1. User opens frontend (`http://localhost:3000`)
2. Frontend checks backend status
3. User uploads kidney image
4. Frontend validates file
5. Frontend sends image to backend API
6. Backend processes and returns prediction
7. Frontend displays results with confidence scores
8. User can analyze another image

## 📱 Responsive Breakpoints

| Device | Breakpoint | Grid Columns |
|--------|-----------|--------------|
| Mobile | < 768px | 1 column |
| Tablet | 768px - 1024px | 2 columns |
| Desktop | > 1024px | 3 columns |

## 🎨 Color Scheme

| Color | Usage |
|-------|-------|
| Primary Blue | Main actions, links |
| Green | Success, Normal condition |
| Yellow | Warnings, Cyst condition |
| Orange | Stone condition |
| Red | Errors, Tumor condition |
| Gray | Text, borders, backgrounds |

## 📄 License

[Your License]

## 👥 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open pull request

## 📧 Support

For issues and questions:
- Open an issue on GitHub
- Contact: [your-email]

---

**Built with ❤️ for better healthcare**
