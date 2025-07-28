import ImageClassifier from '../components/ImageClassifier'
import { useState } from 'react'

export default function Home() {
  const [classifications, setClassifications] = useState<string[]>([])

  const handleImageClassified = (image: File, classification: string) => {
    console.log(`Image ${image.name} classified as: ${classification}`)
    setClassifications((prev) => [...prev, classification])
  }

  // Get statistics for normal vs theft
  const getStats = () => {
    const normalCount = classifications.filter(
      (c) => c.toLowerCase() === 'normal'
    ).length
    const theftCount = classifications.filter(
      (c) => c.toLowerCase() === 'theft'
    ).length
    return { normalCount, theftCount }
  }

  const stats = getStats()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4 shadow-lg">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
            AI Image Classifier
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload images in batches and automatically organize them into normal
            and theft categories
          </p>
        </div>

        {/* Image Classifier Section */}
        <div className="mb-12">
          <ImageClassifier onImageClassified={handleImageClassified} />
        </div>

        {/* Statistics Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-2xl shadow-xl p-6 text-center transform hover:scale-105 transition-all duration-300 border border-gray-100">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Total Images
            </h3>
            <p className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
              {classifications.length}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 text-center transform hover:scale-105 transition-all duration-300 border border-gray-100">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Normal Images
            </h3>
            <p className="text-3xl font-bold bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent">
              {stats.normalCount}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 text-center transform hover:scale-105 transition-all duration-300 border border-gray-100">
            <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Theft Images
            </h3>
            <p className="text-3xl font-bold bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">
              {stats.theftCount}
            </p>
          </div>
        </div>

        {/* Instructions Section */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">
            How It Works
          </h2>
          <div>
            <h3 className="text-lg font-semibold text-blue-600 mb-2">
              📦 Batch Processing
            </h3>
            <p className="text-gray-600">
              Upload multiple images at once. The system will classify each
              image and create a ZIP file with organized folders:{' '}
              <code>filtered_[timestamp]/normal/</code>,{' '}
              <code>filtered_[timestamp]/theft/</code>, and{' '}
              <code>filtered_[timestamp]/unidentified/</code>
            </p>
          </div>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-green-600 mb-2">
                📁 Normal Images
              </h3>
              <p className="text-gray-600">
                Images classified as "Normal" are automatically saved to the
                "normal" folder. These are images that show normal, safe
                conditions without any signs of theft or suspicious activity.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-600 mb-2">
                ⚠️ Theft Images
              </h3>
              <p className="text-gray-600">
                Images classified as "theft" are automatically saved to the
                "theft" folder. These are images that show signs of theft,
                suspicious activity, or security concerns.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
