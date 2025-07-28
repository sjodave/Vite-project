# Normal vs Tempered Image Classification System

A React-based web application that uses Teachable Machine models to classify images as either "normal" or "tempered" and automatically organizes them into appropriate folders.

## Features

- **Binary Classification**: Classify images as either "normal" or "tempered"
- **Automatic Folder Organization**: Images are automatically saved to "normal/" or "tempered/" folders
- **Real-time Statistics**: Track classification progress with live counters
- **Batch Processing**: Save multiple images at once with proper folder organization
- **Modern UI**: Clean, responsive interface with color-coded results
- **Teachable Machine Integration**: Load and use your trained classification models

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn
- A trained Teachable Machine model for normal/tempered classification

### Installation

1. Clone the repository or navigate to your project directory
2. Install dependencies:

    ```bash
    npm install
    ```

3. Start the development server:

    ```bash
    npm run dev
    ```

4. Open your browser and navigate to `http://localhost:5173`

## How to Use

### 1. Load Your Teachable Machine Model

1. Go to [Teachable Machine](https://teachablemachine.withgoogle.com/)
2. Train your model to classify images as "normal" or "tempered"
3. Export the model and get the model URL
4. In the application, paste the model URL in the "Load Model" section
5. Click "Load Model" to initialize the classifier

### 2. Classify Images

1. Click "Select Image" to choose an image file
2. Preview the selected image
3. Click "Classify Image" to run the model
4. View the classification result with confidence percentage
5. The result will be color-coded:
    - 🟢 **Green**: Normal images (safe, no tampering detected)
    - 🔴 **Red**: Tempered images (manipulation detected)

### 3. Automatic Folder Organization

- **Normal Images**: Automatically saved to the "normal/" folder
- **Tempered Images**: Automatically saved to the "tempered/" folder
- **Batch Save**: Use "Save All to Folders" to download all classified images at once
- **Individual Save**: Save each image individually with proper naming

### 4. Monitor Progress

The statistics dashboard shows:

- Total images classified
- Number of normal images (green counter)
- Number of tempered images (red counter)
- Number of folders created

## Model Requirements

Your Teachable Machine model should:

- Be trained for binary classification (normal vs tempered)
- Have two classes: "normal" and "tempered"
- Be exported as a TensorFlow.js model
- Have a valid model URL accessible via HTTP/HTTPS

## Expected Output Classes

The system expects your model to output these classes:

- **"normal"**: Images that are safe and show no signs of tampering
- **"tempered"**: Images that show signs of manipulation or don't meet quality standards

## File Structure

```
src/
├── components/
│   ├── ImageClassifier.tsx    # Main classification component
│   └── FolderManager.tsx      # Folder organization component
├── pages/
│   └── Home.tsx              # Main page with integrated components
└── file.json                 # Sample file structure data
```

## Folder Organization

The system automatically creates and organizes files as follows:

```
📁 normal/          # Images classified as normal
├── normal_1234567890.jpg
├── normal_1234567891.jpg
└── ...

📁 tempered/        # Images classified as tempered
├── tempered_1234567890.jpg
├── tempered_1234567891.jpg
└── ...
```

## Customization

### Model Input Size

The default input size is 224x224 pixels. If your model requires a different size, update the `preprocessImage` function in `ImageClassifier.tsx`:

```typescript
canvas.width = YOUR_MODEL_WIDTH;
canvas.height = YOUR_MODEL_HEIGHT;
```

### Class Names

If your model uses different class names, update them in the `ImageClassifier.tsx` component:

```typescript
const [classNames, setClassNames] = useState<string[]>([
    "your_normal_class",
    "your_tempered_class",
]);
```

## Use Cases

This system is ideal for:

- **Document Verification**: Detecting tampered documents or images
- **Quality Control**: Separating good images from manipulated ones
- **Security Applications**: Identifying potentially altered images
- **Content Moderation**: Filtering out manipulated content
- **Forensic Analysis**: Organizing images for further investigation

## Troubleshooting

### Model Loading Issues

- Ensure the model URL is accessible
- Check that the model is exported as TensorFlow.js format
- Verify CORS settings if loading from a different domain
- Make sure your model has exactly two classes: "normal" and "tempered"

### Classification Errors

- Make sure the model is properly loaded before classifying
- Check that images are in supported formats (JPEG, PNG, etc.)
- Verify that the model input size matches the preprocessing
- Ensure your model outputs the expected class names

### Browser Compatibility

- Use a modern browser with WebGL support
- Enable JavaScript and allow file access
- Consider using Chrome or Firefox for best performance

## Technologies Used

- **React 18**: Frontend framework
- **TypeScript**: Type safety and better development experience
- **TensorFlow.js**: Machine learning model inference
- **Tailwind CSS**: Styling and responsive design
- **Vite**: Build tool and development server

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.

## Support

For issues and questions:

1. Check the troubleshooting section
2. Review the console for error messages
3. Ensure your model is properly formatted for binary classification
4. Contact the development team if issues persist
