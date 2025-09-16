# Face Age & Gender Recognition with Liveness Detection

A sophisticated web application built with Next.js, React, TypeScript, and face-api.js that provides real-time face detection, age/gender estimation, and advanced liveness detection to prevent spoofing attacks.

## 🚀 Features

### Core Functionality
- **Real-time Face Detection**: Detects multiple faces in images with high accuracy
- **Age & Gender Estimation**: Provides age and gender predictions for detected faces
- **Liveness Detection**: Advanced anti-spoofing system using head pose sequence verification
- **Dual Input Methods**: Camera capture and image upload support
- **Visual Feedback**: Real-time visual indicators and progress tracking

### Liveness Detection System
- **Head Pose Sequence**: Requires users to look Center → Left → Right → Center
- **Anti-Spoofing**: Prevents photo/video replay attacks
- **Real-time Validation**: Continuous pose verification with hold requirements
- **Visual Guidance**: Clear instructions and progress indicators
- **Timeout Protection**: Automatic timeout to prevent indefinite waiting

### User Experience
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Form Integration**: User data collection (name, email, phone)
- **Age-based Visual Indicators**: Color-coded borders based on age thresholds
- **Error Handling**: Comprehensive error messages and recovery options
- **Accessibility**: ARIA-compliant interface elements

## 🛠️ Technology Stack

- **Frontend**: Next.js 13.4.19, React 18.2.0, TypeScript 5.8.2
- **AI/ML**: face-api.js 0.22.2 for face detection and analysis
- **Styling**: CSS Modules for component-scoped styling
- **Build Tools**: ESLint, Next.js built-in optimizations

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager
- Modern web browser with camera support
- HTTPS connection (required for camera access in production)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/biluses/project-age.git
cd project-age
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Download AI Models
The application requires pre-trained models for face detection and analysis. Download the following models and place them in the `public/models/` directory:

**Required Models:**
- `ssd_mobilenetv1_model-weights_manifest.json` + `ssd_mobilenetv1_model-shard1`
- `age_gender_model-weights_manifest.json` + `age_gender_model-shard1`
- `face_landmark_68_model-weights_manifest.json` + `face_landmark_68_model-shard1`
- `face_recognition_model-weights_manifest.json` + `face_recognition_model-shard1` + `face_recognition_model-shard2`
- `face_expression_model-weights_manifest.json` + `face_expression_model-shard1`
- `mtcnn_model-weights_manifest.json` + `mtcnn_model-shard1`
- `tiny_face_detector_model-weights_manifest.json` + `tiny_face_detector_model-shard1`

**Model Sources:**
- [face-api.js GitHub Repository](https://github.com/justadudewhohacks/face-api.js)
- [face-api.js Models](https://github.com/justadudewhohacks/face-api.js/tree/master/weights)

### 4. Run the Development Server
```bash
npm run dev
```

### 5. Open the Application
Navigate to `http://localhost:3000` in your web browser.

## 📖 Usage Guide

### Camera Mode (Liveness Detection)
1. Click "Use Camera" to start the camera
2. Grant camera permissions when prompted
3. Follow the head pose sequence:
   - Look **Center** (hold for 2 frames)
   - Look **Left** (hold for 2 frames)
   - Look **Right** (hold for 2 frames)
   - Look **Center** (hold for 2 frames)
4. Hold still while the photo is captured
5. View the results with age/gender detection

### Image Upload Mode
1. Click "Upload Image" to select a file
2. The image will be processed automatically
3. View detected faces with age/gender annotations
4. Age-based color coding:
   - **Green border**: Age ≥ 18 years
   - **Red border**: Age < 18 years

### Form Data Collection
- Fill in the user information fields (Name, Email, Phone)
- Data is collected client-side (not sent to any server)
- Form validation and data handling can be extended

## ⚙️ Configuration

### Age Threshold
Modify the age threshold in `src/pages/index.tsx`:
```typescript
const AGE_THRESHOLD = 18; // Change this value as needed
```

### Liveness Detection Parameters
Adjust liveness detection sensitivity:
```typescript
const POSE_LR_RATIO_THRESHOLD_HIGH = 1.4; // Left pose threshold
const POSE_LR_RATIO_THRESHOLD_LOW = 0.7;  // Right pose threshold
const POSE_HOLD_CHECKS = 2;               // Frames to hold pose
const LIVENESS_TIMEOUT = 20000;           // Timeout in milliseconds
```

### Face Detection Confidence
Modify detection sensitivity:
```typescript
const FACE_DETECTOR_CONFIDENCE = 0.6; // 0.0 to 1.0
```

## 🔧 Development

### Project Structure
```
project-age/
├── public/
│   └── models/          # AI model files
├── src/
│   ├── pages/
│   │   └── index.tsx    # Main application component
│   └── styles/
│       └── Home.module.css
├── package.json
├── tsconfig.json
└── README.md
```

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Key Components
- **Home Component**: Main application logic and UI
- **Liveness Detection**: Head pose sequence verification
- **Face Detection**: Static image and camera-based detection
- **Form Handling**: User data collection and validation

## 🚨 Important Notes

### Privacy & Security
- **Client-side Processing**: All face detection runs in the browser
- **No Data Transmission**: Images are not sent to external servers
- **Local Storage**: No persistent storage of user data
- **HTTPS Required**: Camera access requires secure connection

### Performance Considerations
- **Model Loading**: Initial load time depends on model size (~50MB)
- **CPU Intensive**: Face detection requires significant processing power
- **Memory Usage**: Large models consume browser memory
- **Device Compatibility**: Performance varies by device capabilities

### Browser Compatibility
- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **Camera Support**: Requires getUserMedia API support
- **WebGL Support**: Required for face-api.js operations

## 🐛 Troubleshooting

### Common Issues

**Models Not Loading**
- Verify all model files are in `public/models/` directory
- Check browser console for 404 errors
- Ensure models are properly downloaded and extracted

**Camera Not Working**
- Check browser permissions
- Ensure HTTPS connection
- Try different browser or device

**Poor Detection Accuracy**
- Ensure good lighting conditions
- Position face clearly in frame
- Adjust `FACE_DETECTOR_CONFIDENCE` value
- Check image quality and resolution

**Liveness Detection Failing**
- Follow pose sequence exactly
- Hold each pose for the required duration
- Ensure single face in frame
- Check lighting and camera stability

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [face-api.js](https://github.com/justadudewhohacks/face-api.js) - Face detection and analysis library
- [Next.js](https://nextjs.org/) - React framework
- [React](https://reactjs.org/) - UI library
- [TypeScript](https://www.typescriptlang.org/) - Type safety

## 📞 Support

For support, questions, or feature requests, please open an issue on GitHub or contact the development team.

---

**Note**: This application is for educational and demonstration purposes. Age and gender estimation should not be used for critical decision-making without proper validation and consideration of potential biases in the underlying models.