import { Activity, RefreshCw } from 'lucide-react'

const Header = ({ backendStatus, onRefresh }) => {
  const statusConfig = {
    online: {
      color: 'bg-green-500',
      text: 'Online',
      textColor: 'text-green-700',
    },
    offline: {
      color: 'bg-red-500',
      text: 'Offline',
      textColor: 'text-red-700',
    },
    checking: {
      color: 'bg-yellow-500',
      text: 'Checking',
      textColor: 'text-yellow-700',
    },
  }

  const status = statusConfig[backendStatus] || statusConfig.checking

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <div className="bg-primary-500 rounded-lg p-2">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">
                Kidney Disease Classifier
              </h1>
              <p className="text-sm text-gray-600">AI-Powered Medical Diagnosis</p>
            </div>
          </div>

          {/* Backend Status */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <div className={`w-3 h-3 ${status.color} rounded-full`}>
                  {backendStatus === 'online' && (
                    <div className={`absolute inset-0 ${status.color} rounded-full animate-ping opacity-75`}></div>
                  )}
                </div>
              </div>
              <span className={`text-sm font-medium ${status.textColor}`}>
                Backend: {status.text}
              </span>
            </div>

            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Refresh backend status"
            >
              <RefreshCw className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
