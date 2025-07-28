import React, { useState, useRef, useEffect } from 'react'
import * as tf from '@tensorflow/tfjs'

interface ImageClassifierProps {
  onImageClassified: (image: File, classification: string) => void
}

const ImageClassifier: React.FC<ImageClassifierProps> = ({
  onImageClassified,
}) => {
  const [model, setModel] = useState<tf.GraphModel | tf.LayersModel | null>(
    null
  )
  const [isModelLoading, setIsModelLoading] = useState(false)
  const [classNames, setClassNames] = useState<string[]>(['theft', 'Normal']) // Default classes
  const [classifiedImages, setClassifiedImages] = useState<
    Array<{
      file: File
      classification: string
      timestamp: number
      confidence: number
    }>
  >([])
  const [batchImages, setBatchImages] = useState<File[]>([])
  const [isBatchProcessing, setIsBatchProcessing] = useState(false)
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 })
  const batchFileInputRef = useRef<HTMLInputElement>(null)

  // Load the local model automatically on component mount
  useEffect(() => {
    loadLocalModel()
  }, [])

  // Load the Teachable Machine model from local assets
  const loadLocalModel = async () => {
    setIsModelLoading(true)
    try {
      // Load the model from the public folder
      const modelPath = '/model.json'
      console.log('Attempting to load model from:', modelPath)

      // Try loading as layers model first (for Teachable Machine models)
      let loadedModel
      try {
        loadedModel = await tf.loadLayersModel(modelPath)
        console.log('Model loaded as LayersModel')
      } catch (layersError) {
        console.log(
          'Failed to load as LayersModel, trying GraphModel:',
          layersError
        )
        loadedModel = await tf.loadGraphModel(modelPath)
        console.log('Model loaded as GraphModel')
      }

      setModel(loadedModel)
      console.log('Local model loaded successfully')

      // Load class names from metadata
      try {
        const metadataPath = '/metadata.json'
        console.log('Loading metadata from:', metadataPath)
        const response = await fetch(metadataPath)
        if (response.ok) {
          const metadata = await response.json()
          console.log('Metadata loaded:', metadata)
          if (metadata.labels) {
            setClassNames(metadata.labels)
            console.log('Loaded class names:', metadata.labels)
          }
        } else {
          console.error(
            'Failed to fetch metadata:',
            response.status,
            response.statusText
          )
        }
      } catch (metadataError) {
        console.log(
          'No metadata found, using default class names:',
          metadataError
        )
      }
    } catch (error) {
      console.error('Error loading local model:', error)
      alert(
        `Failed to load local model: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    } finally {
      setIsModelLoading(false)
    }
  }

  // Handle batch image selection
  const handleBatchImageSelect = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files || [])
    const imageFiles = files.filter((file) => file.type.startsWith('image/'))
    setBatchImages(imageFiles)
    console.log(`Selected ${imageFiles.length} images for batch processing`)
  }

  // Process batch of images
  const processBatchImages = async () => {
    if (!model || batchImages.length === 0) {
      alert(
        'Please wait for model to load and select images for batch processing'
      )
      return
    }

    setIsBatchProcessing(true)
    setBatchProgress({ current: 0, total: batchImages.length })

    const normalImages: File[] = []
    const theftImages: File[] = []
    const unidentifiedImages: File[] = []
    const processedImages: Array<{
      file: File
      classification: string
      timestamp: number
      confidence: number
    }> = []

    try {
      for (let i = 0; i < batchImages.length; i++) {
        const image = batchImages[i]
        setBatchProgress({ current: i + 1, total: batchImages.length })

        // Preprocess and classify image
        const imageTensor = await preprocessImage(image)
        const batchedImage = imageTensor.expandDims(0)
        const predictions = (await model.predict(batchedImage)) as tf.Tensor
        const probabilities = await predictions.data()

        // Find the class with highest probability
        let maxIndex = 0
        let maxProbability = probabilities[0]
        for (let j = 1; j < probabilities.length; j++) {
          if (probabilities[j] > maxProbability) {
            maxProbability = probabilities[j]
            maxIndex = j
          }
        }

        const classification = classNames[maxIndex] || `Class ${maxIndex}`
        const confidence = maxProbability
        const timestamp = Date.now()

        // Categorize image based on confidence threshold (100% = 1.0)
        if (confidence >= 1.0) {
          // 100% confidence - move to normal or theft
          if (classification.toLowerCase() === 'normal') {
            normalImages.push(image)
          } else {
            theftImages.push(image)
          }
        } else {
          // Less than 100% confidence - move to unidentified
          unidentifiedImages.push(image)
        }

        processedImages.push({
          file: image,
          classification,
          timestamp,
          confidence,
        })

        // Clean up tensors
        imageTensor.dispose()
        batchedImage.dispose()
        predictions.dispose()

        // Call the callback for each classified image
        onImageClassified(image, classification)
      }

      // Create organized folder structure
      const folderName = `filtered_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}`

      // Create ZIP file with organized structure
      const JSZip = (await import('jszip')).default
      const zip = new JSZip()

      // Add normal images to normal folder (100% confidence)
      if (normalImages.length > 0) {
        const normalFolder = zip.folder('normal')
        normalImages.forEach((image, index) => {
          normalFolder?.file(`normal_${Date.now()}_${index}.jpg`, image)
        })
      }

      // Add theft images to theft folder (100% confidence)
      if (theftImages.length > 0) {
        const theftFolder = zip.folder('theft')
        theftImages.forEach((image, index) => {
          theftFolder?.file(`theft_${Date.now()}_${index}.jpg`, image)
        })
      }

      // Add unidentified images to unidentified folder (< 100% confidence)
      if (unidentifiedImages.length > 0) {
        const unidentifiedFolder = zip.folder('unidentified')
        unidentifiedImages.forEach((image, index) => {
          unidentifiedFolder?.file(
            `unidentified_${Date.now()}_${index}.jpg`,
            image
          )
        })
      }

      // Generate and download ZIP file
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(zipBlob)
      link.download = `${folderName}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Update classified images list
      setClassifiedImages((prev) => [...prev, ...processedImages])
      setBatchImages([])

      alert(
        `Batch processing complete!\nNormal images (100% confidence): ${normalImages.length}\nTheft images (100% confidence): ${theftImages.length}\nUnidentified images (< 100% confidence): ${unidentifiedImages.length}\nDownloaded as: ${folderName}.zip`
      )
    } catch (error) {
      console.error('Error processing batch images:', error)
      alert('Failed to process batch images. Please try again.')
    } finally {
      setIsBatchProcessing(false)
      setBatchProgress({ current: 0, total: 0 })
    }
  }

  // Preprocess image for the model
  const preprocessImage = async (imageFile: File): Promise<tf.Tensor3D> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = 224 // Standard input size for many models
        canvas.height = 224
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, 224, 224)

        const tensor = tf.browser.fromPixels(canvas) as tf.Tensor3D
        const normalized = tensor.div(255.0) as tf.Tensor3D
        resolve(normalized)
      }
      img.src = URL.createObjectURL(imageFile)
    })
  }

  // Get classification statistics
  const getClassificationStats = () => {
    const normalCount = classifiedImages.filter(
      (item) =>
        item.classification.toLowerCase() === 'normal' && item.confidence >= 1.0
    ).length
    const theftCount = classifiedImages.filter(
      (item) =>
        item.classification.toLowerCase() === 'theft' && item.confidence >= 1.0
    ).length
    const unidentifiedCount = classifiedImages.filter(
      (item) => item.confidence < 1.0
    ).length
    return { normalCount, theftCount, unidentifiedCount }
  }

  const stats = getClassificationStats()

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6">
          <h2 className="text-3xl font-bold text-white mb-2">
            Image Classification Dashboard
          </h2>
          <p className="text-blue-100">
            Upload and classify images using AI-powered detection
          </p>
        </div>

        <div className="p-8">
          {/* Model Status Section */}
          <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mr-4">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-800">
                AI Model Status
              </h3>
            </div>

            {isModelLoading ? (
              <div className="flex items-center space-x-3 p-4 bg-white rounded-xl border border-blue-200">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                <span className="text-blue-700 font-medium">
                  Loading AI model...
                </span>
              </div>
            ) : model ? (
              <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-700 font-medium">
                  ✓ AI Model Ready
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-200">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                  <span className="text-red-700 font-medium">
                    ✗ Model failed to load
                  </span>
                </div>
                <button
                  onClick={loadLocalModel}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-sm hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md"
                >
                  Retry
                </button>
              </div>
            )}

            <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Model Source:</span>{' '}
                <code className="bg-gray-100 px-2 py-1 rounded text-blue-600">
                  public/
                </code>
              </p>
            </div>
          </div>

          {/* Classification Statistics */}
          {classifiedImages.length > 0 && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-semibold mb-3 text-blue-800">
                Classification Statistics
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-green-100 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {stats.normalCount}
                  </div>
                  <div className="text-sm text-green-800">Normal (100%)</div>
                </div>
                <div className="text-center p-3 bg-red-100 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {stats.theftCount}
                  </div>
                  <div className="text-sm text-red-800">Theft (100%)</div>
                </div>
                <div className="text-center p-3 bg-yellow-100 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {stats.unidentifiedCount}
                  </div>
                  <div className="text-sm text-yellow-800">
                    Unidentified (&lt;100%)
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Class Names Configuration */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Model Classes</h3>
            <div className="flex flex-wrap gap-2">
              {classNames.map((className, index) => (
                <span
                  key={index}
                  className={`px-3 py-1 rounded-full text-sm ${
                    className.toLowerCase() === 'normal'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {className}
                </span>
              ))}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Images will be automatically organized into three folders:
              <br />• <strong>normal</strong> - Images with 100% confidence as
              normal
              <br />• <strong>theft</strong> - Images with 100% confidence as
              theft
              <br />• <strong>unidentified</strong> - Images with less than 100%
              confidence
            </p>
          </div>

          {/* Batch Upload Section */}
          <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border border-blue-100">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full flex items-center justify-center mr-3">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  Batch Processing
                </h3>
                <p className="text-sm text-gray-600">
                  Upload multiple images for automated classification
                </p>
              </div>
            </div>

            <input
              ref={batchFileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleBatchImageSelect}
              className="hidden"
              aria-label="Select multiple image files"
            />

            <div className="flex flex-wrap gap-4 mb-6">
              <button
                onClick={() => batchFileInputRef.current?.click()}
                disabled={!model}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <div className="flex items-center space-x-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <span>Select Multiple Images</span>
                </div>
              </button>

              {batchImages.length > 0 && (
                <button
                  onClick={processBatchImages}
                  disabled={isBatchProcessing}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <div className="flex items-center space-x-2">
                    {isBatchProcessing ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    )}
                    <span>
                      {isBatchProcessing
                        ? 'Processing...'
                        : `Process ${batchImages.length} Images`}
                    </span>
                  </div>
                </button>
              )}
            </div>

            {/* Batch Progress */}
            {isBatchProcessing && (
              <div className="mb-6 p-4 bg-white rounded-xl border border-blue-200 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-semibold text-gray-700">
                    Processing Progress:
                  </span>
                  <span className="text-sm font-medium text-blue-600">
                    {batchProgress.current} / {batchProgress.total}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${(batchProgress.current / batchProgress.total) * 100}%`,
                    }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {Math.round(
                    (batchProgress.current / batchProgress.total) * 100
                  )}
                  % Complete
                </p>
              </div>
            )}

            {/* Selected Batch Images */}
            {batchImages.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <svg
                    className="w-4 h-4 mr-2 text-blue-500"
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
                  Selected Images ({batchImages.length})
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-32 overflow-y-auto">
                  {batchImages.map((file, index) => (
                    <div
                      key={index}
                      className="text-xs text-gray-600 truncate bg-gray-50 px-2 py-1 rounded"
                    >
                      {file.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Classified Images History */}
          {classifiedImages.length > 0 && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold">
                  Classified Images ({classifiedImages.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {classifiedImages.map((item, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      item.confidence >= 1.0
                        ? item.classification.toLowerCase() === 'normal'
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                        : 'bg-yellow-50 border-yellow-200'
                    }`}
                  >
                    <div className="text-sm text-gray-600">
                      {new Date(item.timestamp).toLocaleString()}
                    </div>
                    <div
                      className={`font-semibold ${
                        item.confidence >= 1.0
                          ? item.classification.toLowerCase() === 'normal'
                            ? 'text-green-600'
                            : 'text-red-600'
                          : 'text-yellow-600'
                      }`}
                    >
                      {item.classification} ({Math.round(item.confidence * 100)}
                      %)
                    </div>
                    <div className="text-xs text-gray-500">
                      {item.file.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="text-sm text-gray-600">
            <h4 className="font-semibold mb-2">Instructions:</h4>
            <ol className="list-decimal list-inside space-y-1">
              <li>Wait for the model to load automatically</li>
              <li>
                <strong>Batch Processing:</strong> Select multiple images and
                click "Process Images" to classify and organize them
              </li>
              <li>
                Batch processing creates a ZIP file with organized folders:
                filtered_[timestamp]/normal/, filtered_[timestamp]/theft/, and
                filtered_[timestamp]/unidentified/
              </li>
              <li>
                Images are automatically sorted based on confidence:
                <br />• <strong>100% confidence</strong> → normal or theft
                folders
                <br />• <strong>&lt;100% confidence</strong> → unidentified
                folder
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ImageClassifier
