import { Stethoscope, Brain, Zap } from 'lucide-react'

const Hero = () => {
  return (
    <section className="text-center py-12 fade-in">
      <div className="max-w-4xl mx-auto">
        {/* Main Title */}
        <h2 className="text-5xl font-bold mb-4">
          <span className="gradient-text">AI-Powered</span> Kidney Disease Detection
        </h2>
        
        {/* Subtitle */}
        <p className="text-xl text-gray-600 mb-8">
          Upload kidney medical images for instant AI-powered classification
        </p>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {/* Feature 1 */}
          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Brain className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-bold text-lg mb-2">Deep Learning</h3>
            <p className="text-gray-600 text-sm">
              Powered by ResNet18 trained on thousands of kidney images
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="font-bold text-lg mb-2">Instant Results</h3>
            <p className="text-gray-600 text-sm">
              Get predictions in seconds with confidence scores
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Stethoscope className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="font-bold text-lg mb-2">4 Conditions</h3>
            <p className="text-gray-600 text-sm">
              Detects Cysts, Stones, Tumors, and Normal kidneys
            </p>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>⚠️ Disclaimer:</strong> This tool is for research and educational purposes only. 
            Not intended for clinical diagnosis. Always consult healthcare professionals.
          </p>
        </div>
      </div>
    </section>
  )
}

export default Hero
