import { useState, useEffect } from 'react'
import { Info, Cpu, Layers, Target } from 'lucide-react'
import { getModelInfo } from '../services/api'

const ModelInfo = () => {
  const [modelInfo, setModelInfo] = useState(null)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && !modelInfo) {
      fetchModelInfo()
    }
  }, [isOpen])

  const fetchModelInfo = async () => {
    setLoading(true)
    const result = await getModelInfo()
    if (result.success) {
      setModelInfo(result.data)
    }
    setLoading(false)
  }

  return (
    <section className="max-w-4xl mx-auto mt-12">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white rounded-xl shadow-md p-4 flex items-center justify-between hover:shadow-lg transition-shadow"
      >
        <div className="flex items-center space-x-3">
          <Info className="w-5 h-5 text-primary-600" />
          <span className="font-semibold text-gray-800">Model Information</span>
        </div>
        <svg
          className={`w-5 h-5 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Model Info Content */}
      {isOpen && (
        <div className="bg-white rounded-xl shadow-md p-6 mt-2 fade-in">
          {loading ? (
            <div className="text-center py-8">
              <div className="spinner w-8 h-8 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading model information...</p>
            </div>
          ) : modelInfo ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Architecture */}
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 rounded-lg p-3">
                  <Layers className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h5 className="font-semibold text-gray-800 mb-1">Architecture</h5>
                  <p className="text-gray-600">{modelInfo.model_architecture}</p>
                </div>
              </div>

              {/* Classes */}
              <div className="flex items-start space-x-3">
                <div className="bg-green-100 rounded-lg p-3">
                  <Target className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h5 className="font-semibold text-gray-800 mb-1">Classes ({modelInfo.num_classes})</h5>
                  <p className="text-gray-600">{modelInfo.classes.join(', ')}</p>
                </div>
              </div>

              {/* Device */}
              <div className="flex items-start space-x-3">
                <div className="bg-purple-100 rounded-lg p-3">
                  <Cpu className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h5 className="font-semibold text-gray-800 mb-1">Device</h5>
                  <p className="text-gray-600 capitalize">{modelInfo.device}</p>
                </div>
              </div>

              {/* Input Size */}
              <div className="flex items-start space-x-3">
                <div className="bg-orange-100 rounded-lg p-3">
                  <Info className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h5 className="font-semibold text-gray-800 mb-1">Input Size</h5>
                  <p className="text-gray-600">
                    {modelInfo.input_size[0]} × {modelInfo.input_size[1]} px
                  </p>
                </div>
              </div>

              {/* Normalization */}
              <div className="col-span-full bg-gray-50 rounded-lg p-4">
                <h5 className="font-semibold text-gray-800 mb-2">Preprocessing</h5>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 mb-1">Mean</p>
                    <code className="bg-gray-200 px-2 py-1 rounded text-xs">
                      [{modelInfo.normalization.mean.map(v => v.toFixed(3)).join(', ')}]
                    </code>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Std</p>
                    <code className="bg-gray-200 px-2 py-1 rounded text-xs">
                      [{modelInfo.normalization.std.map(v => v.toFixed(3)).join(', ')}]
                    </code>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-600 py-8">
              Failed to load model information
            </p>
          )}
        </div>
      )}
    </section>
  )
}

export default ModelInfo
