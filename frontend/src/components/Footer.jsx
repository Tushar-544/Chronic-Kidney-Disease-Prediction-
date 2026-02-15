import { Heart, Github, Mail } from 'lucide-react'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-white mt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About */}
          <div>
            <h4 className="font-bold text-lg mb-4">About</h4>
            <p className="text-gray-400 text-sm">
              AI-powered kidney disease classification system using deep learning
              for medical image analysis.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-lg mb-4">Resources</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  API Reference
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Model Details
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-lg mb-4">Connect</h4>
            <div className="flex space-x-4">
              <a
                href="#"
                className="bg-gray-800 hover:bg-gray-700 p-3 rounded-lg transition-colors"
                title="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="bg-gray-800 hover:bg-gray-700 p-3 rounded-lg transition-colors"
                title="Email"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between">
          <p className="text-gray-400 text-sm">
            © {currentYear} Kidney Disease Classifier. All rights reserved.
          </p>
          <p className="text-gray-400 text-sm flex items-center mt-4 md:mt-0">
            Made with <Heart className="w-4 h-4 text-red-500 mx-1" /> for healthcare
          </p>
        </div>

        {/* Disclaimer */}
        <div className="mt-6 bg-gray-800 rounded-lg p-4">
          <p className="text-xs text-gray-400 text-center">
            <strong className="text-yellow-400">⚠️ Medical Disclaimer:</strong> This tool is for research 
            and educational purposes only. Not intended for clinical diagnosis. Results should be verified 
            by qualified healthcare professionals. Do not use for actual medical decisions.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
