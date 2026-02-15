import { useState, useRef } from 'react'
import { Upload, Image as ImageIcon, X, Loader2 } from 'lucide-react'
import { toast } from 'react-toastify'
import { predictImage } from '../services/api'

const UploadSection = ({ onPredictionComplete, isLoading, setIsLoading, backendStatus }) => {
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const fileInputRef = useRef(null)

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      validateAndSetFile(file)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      validateAndSetFile(file)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const validateAndSetFile = (file) => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPEG, PNG, or GIF)')
      return
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      toast.error('File size must be less than 10MB')
      return
    }

    // Set file and preview
    setSelectedFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result)
    }
    reader.readAsDataURL(file)

    toast.success('Image loaded successfully!')
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handlePredict = async () => {
    if (!selectedFile) {
      toast.error('Please select an image first')
      return
    }

    if (backendStatus !== 'online') {
      toast.error('Backend is not available. Please check the connection.')
      return
    }

    setIsLoading(true)

    try {
      // Call API
      const result = await predictImage(selectedFile)

      if (result.success) {
        toast.success('Prediction completed successfully!')
        onPredictionComplete({
          ...result.data.prediction,
          filename: selectedFile.name,
          previewUrl: previewUrl,
        })
      } else {
        toast.error(result.error || 'Prediction failed')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="max-w-4xl mx-auto mt-12 fade-in">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Upload Medical Image
        </h3>

        {/* Upload Area */}
        {!selectedFile ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border-3 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-all"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <div className="flex flex-col items-center space-y-4">
              <div className="bg-primary-100 rounded-full p-6">
                <Upload className="w-12 h-12 text-primary-600" />
              </div>
              
              <div>
                <p className="text-lg font-semibold text-gray-700 mb-2">
                  Drop your image here or click to browse
                </p>
                <p className="text-sm text-gray-500">
                  Supported formats: JPEG, PNG, GIF (Max 10MB)
                </p>
              </div>

              <button
                type="button"
                className="bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
              >
                Select Image
              </button>
            </div>
          </div>
        ) : (
          /* Preview Area */
          <div className="space-y-6">
            {/* Image Preview */}
            <div className="relative">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-96 object-contain bg-gray-100 rounded-xl"
              />
              
              {/* Remove Button */}
              <button
                onClick={handleRemoveFile}
                className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg transition-colors"
                title="Remove image"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* File Info */}
            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <ImageIcon className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="font-medium text-gray-800">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleRemoveFile}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-4 rounded-xl transition-colors"
                disabled={isLoading}
              >
                Change Image
              </button>
              
              <button
                onClick={handlePredict}
                disabled={isLoading || backendStatus !== 'online'}
                className="flex-1 bg-primary-500 hover:bg-primary-600 text-white font-semibold py-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <span>Analyze Image</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default UploadSection
