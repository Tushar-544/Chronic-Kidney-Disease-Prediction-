import { CheckCircle, AlertCircle, BarChart3, Clock, RotateCcw } from 'lucide-react'

const ResultsSection = ({ prediction, onReset }) => {
  const { predicted_class, confidence, probabilities, processing_time_ms, previewUrl, filename } = prediction

  // Get color based on prediction
  const getStatusColor = (cls) => {
    const colors = {
      Normal: 'green',
      Cyst: 'yellow',
      Stone: 'orange',
      Tumor: 'red',
    }
    return colors[cls] || 'gray'
  }

  const statusColor = getStatusColor(predicted_class)
  const isNormal = predicted_class === 'Normal'

  return (
    <section className="max-w-6xl mx-auto mt-12 fade-in">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-bold text-gray-800">Analysis Results</h3>
          <button
            onClick={onReset}
            className="flex items-center space-x-2 bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>New Analysis</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Image */}
          <div>
            <img
              src={previewUrl}
              alt={filename}
              className="w-full h-96 object-contain bg-gray-100 rounded-xl"
            />
            <p className="text-sm text-gray-600 mt-2 text-center">{filename}</p>
          </div>

          {/* Right Column - Results */}
          <div className="space-y-6">
            {/* Main Prediction */}
            <div className={`bg-${statusColor}-50 border-2 border-${statusColor}-200 rounded-xl p-6`}>
              <div className="flex items-center space-x-3 mb-3">
                {isNormal ? (
                  <CheckCircle className={`w-8 h-8 text-${statusColor}-600`} />
                ) : (
                  <AlertCircle className={`w-8 h-8 text-${statusColor}-600`} />
                )}
                <div>
                  <p className="text-sm text-gray-600">Diagnosis</p>
                  <h4 className={`text-3xl font-bold text-${statusColor}-700`}>
                    {predicted_class}
                  </h4>
                </div>
              </div>
              
              {/* Confidence Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Confidence</span>
                  <span className="font-semibold text-gray-800">
                    {(confidence * 100).toFixed(2)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`bg-${statusColor}-500 h-3 rounded-full transition-all duration-500`}
                    style={{ width: `${confidence * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* All Probabilities */}
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center space-x-2 mb-4">
                <BarChart3 className="w-5 h-5 text-gray-600" />
                <h5 className="font-semibold text-gray-800">All Probabilities</h5>
              </div>
              
              <div className="space-y-3">
                {Object.entries(probabilities)
                  .sort(([, a], [, b]) => b - a)
                  .map(([cls, prob]) => (
                    <div key={cls}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700">{cls}</span>
                        <span className="font-medium text-gray-800">
                          {(prob * 100).toFixed(2)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${prob * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Processing Time */}
            <div className="flex items-center justify-center space-x-2 text-gray-600 bg-gray-50 rounded-lg p-4">
              <Clock className="w-4 h-4" />
              <span className="text-sm">
                Processed in <strong>{processing_time_ms.toFixed(0)}ms</strong>
              </span>
            </div>

            {/* Interpretation */}
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
              <h5 className="font-semibold text-blue-900 mb-2">Interpretation</h5>
              <p className="text-sm text-blue-800">
                {isNormal ? (
                  <>
                    The kidney appears <strong>normal</strong> with no signs of cysts, stones, or tumors detected.
                  </>
                ) : (
                  <>
                    <strong>{predicted_class}</strong> detected with {(confidence * 100).toFixed(1)}% confidence. 
                    Please consult a healthcare professional for proper diagnosis and treatment.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ResultsSection
