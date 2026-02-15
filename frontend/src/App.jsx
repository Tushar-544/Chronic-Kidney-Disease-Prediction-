import { useState, useEffect } from 'react'
import { ToastContainer, toast } from 'react-toastify'
import Header from './components/Header'
import Hero from './components/Hero'
import UploadSection from './components/UploadSection'
import ResultsSection from './components/ResultsSection'
import ModelInfo from './components/ModelInfo'
import Footer from './components/Footer'
import { healthCheck } from './services/api'

function App() {
  const [backendStatus, setBackendStatus] = useState('checking')
  const [prediction, setPrediction] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  // Check backend health on mount
  useEffect(() => {
    checkBackendHealth()
  }, [])

  const checkBackendHealth = async () => {
    const result = await healthCheck()
    if (result.success) {
      setBackendStatus('online')
      toast.success('Connected to backend successfully!', {
        position: 'bottom-right',
        autoClose: 3000,
      })
    } else {
      setBackendStatus('offline')
      toast.error('Cannot connect to backend. Please ensure the API server is running.', {
        position: 'bottom-right',
        autoClose: false,
      })
    }
  }

  const handlePredictionComplete = (result) => {
    setPrediction(result)
  }

  const handleReset = () => {
    setPrediction(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Toast Notifications */}
      <ToastContainer />

      {/* Header */}
      <Header backendStatus={backendStatus} onRefresh={checkBackendHealth} />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <Hero />

        {/* Upload Section */}
        {!prediction && (
          <UploadSection
            onPredictionComplete={handlePredictionComplete}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            backendStatus={backendStatus}
          />
        )}

        {/* Results Section */}
        {prediction && (
          <ResultsSection
            prediction={prediction}
            onReset={handleReset}
          />
        )}

        {/* Model Info */}
        <ModelInfo />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}

export default App
