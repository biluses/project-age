import React, { useState, useRef, useEffect, ChangeEvent } from 'react';
import * as faceapi from 'face-api.js';
import styles from '../styles/Home.module.css'; // Assuming you have this CSS module file

// --- Constants ---
const POSE_SEQUENCE: ('Center' | 'Left' | 'Right')[] = ['Center', 'Left', 'Right', 'Center'];
const POSE_LR_RATIO_THRESHOLD_HIGH = 1.4;
const POSE_LR_RATIO_THRESHOLD_LOW = 0.7;
const POSE_CHECK_INTERVAL = 300;
const LIVENESS_TIMEOUT = 20000;
const CAPTURE_DELAY = 750;
const FEEDBACK_DURATION = 400;
const POSE_HOLD_CHECKS = 2;
const STEP_TRANSITION_DELAY = 600;
const AGE_THRESHOLD = 18; // Age limit for green/red border
const BORDER_COLOR_ADULT = 'lime'; // Color for age >= threshold
const BORDER_COLOR_MINOR = 'red';   // Color for age < threshold
const BORDER_WIDTH = '4px';         // Make border noticeable
// -------------------------------------

// --- Face Detector Confidence ---
const FACE_DETECTOR_CONFIDENCE = 0.6;
// -----------------------------------

// --- Types ---
interface DetectionResult { age: number; gender: 'male' | 'female'; genderProbability: number; box: { x: number; y: number; width: number; height: number }; }
type LivenessStatus = 'Pending' | 'Checking' | 'Confirmed' | 'Failed' | 'Timeout' | 'Capturing' | 'HoldStill' | 'Transitioning';
type HeadPose = 'Center' | 'Left' | 'Right' | 'Unknown';
// -------------

const Home: React.FC = () => {
    // --- State Variables ---
    const [modelsLoaded, setModelsLoaded] = useState<boolean>(false);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [detectionResults, setDetectionResults] = useState<DetectionResult[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isCameraMode, setIsCameraMode] = useState<boolean>(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [livenessStatus, setLivenessStatus] = useState<LivenessStatus>('Pending');
    const [livenessMessage, setLivenessMessage] = useState<string>('');
    const [currentPoseStepIndexState, setCurrentPoseStepIndexState] = useState<number>(0);
    const [showSuccessFeedback, setShowSuccessFeedback] = useState<boolean>(false);
    // *** NEW: State for Input Fields ***
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    // *** NEW: State for Canvas Border Color ***
    const [canvasBorderColor, setCanvasBorderColor] = useState<string | null>(null);
    // -----------------------

    // --- Refs ---
    const imageRef = useRef<HTMLImageElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const livenessIntervalId = useRef<NodeJS.Timeout | null>(null);
    const livenessTimeoutId = useRef<NodeJS.Timeout | null>(null);
    const isCapturingPhoto = useRef(false);
    const currentPoseStepIndexRef = useRef<number>(0);
    const captureTimeoutId = useRef<NodeJS.Timeout | null>(null);
    const feedbackTimeoutId = useRef<NodeJS.Timeout | null>(null);
    const poseHoldCounterRef = useRef<number>(0);
    const stepTransitionTimeoutId = useRef<NodeJS.Timeout | null>(null);
    const isTransitioning = useRef<boolean>(false);
    // -----------------

    // --- Helpers (euclideanDist, estimateHeadPose - Unchanged) ---
    const euclideanDist = (p1: faceapi.Point, p2: faceapi.Point): number => { return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2); };
    const estimateHeadPose = (landmarks: faceapi.FaceLandmarks68): HeadPose => { try { const noseTip = landmarks.getNose()[3]; const leftEyeCorner = landmarks.getLeftEye()[0]; const rightEyeCorner = landmarks.getRightEye()[3]; if (!noseTip || !leftEyeCorner || !rightEyeCorner) return 'Unknown'; const distLeft = Math.abs(noseTip.x - leftEyeCorner.x); const distRight = Math.abs(noseTip.x - rightEyeCorner.x); if (distRight < 1) return 'Center'; const ratio = distLeft / distRight; console.log(`... Pose Ratio (L/R): ${ratio.toFixed(2)} (High: ${POSE_LR_RATIO_THRESHOLD_HIGH}, Low: ${POSE_LR_RATIO_THRESHOLD_LOW})`); if (ratio > POSE_LR_RATIO_THRESHOLD_HIGH) { return 'Left'; } else if (ratio < POSE_LR_RATIO_THRESHOLD_LOW) { return 'Right'; } else { return 'Center'; } } catch (err) { console.error("Error estimating head pose:", err); return 'Unknown'; } };

    // --- Helper Function to Stop Camera and Cleanup Liveness ---
    const stopCameraStream = (stopHard = true) => { /* ... unchanged, includes clearing all timeouts ... */
        console.log(`stopCameraStream called (stopHard: ${stopHard})`); if (livenessIntervalId.current) { clearInterval(livenessIntervalId.current); livenessIntervalId.current = null; console.log("Liveness interval cleared."); } if (livenessTimeoutId.current) { clearTimeout(livenessTimeoutId.current); livenessTimeoutId.current = null; console.log("Liveness timeout cleared."); } if (captureTimeoutId.current) { clearTimeout(captureTimeoutId.current); captureTimeoutId.current = null; console.log("Capture timeout cleared."); } if (feedbackTimeoutId.current) { clearTimeout(feedbackTimeoutId.current); feedbackTimeoutId.current = null; console.log("Feedback timeout cleared."); } if (stepTransitionTimeoutId.current) { clearTimeout(stepTransitionTimeoutId.current); stepTransitionTimeoutId.current = null; console.log("Step transition timeout cleared."); }
        if (stopHard) { console.log("Performing hard stop state reset."); setLivenessStatus('Pending'); setLivenessMessage(''); setCurrentPoseStepIndexState(0); currentPoseStepIndexRef.current = 0; isCapturingPhoto.current = false; setShowSuccessFeedback(false); poseHoldCounterRef.current = 0; isTransitioning.current = false; }
        if (stream) { stream.getTracks().forEach(track => track.stop()); setStream(null); console.log('Camera stream stopped.'); if (videoRef.current) { videoRef.current.srcObject = null; } }
    };

    // --- Effect for Loading Models ---
    useEffect(() => { /* ... unchanged ... */
        const loadModels = async () => { const MODEL_URL = '/models'; setIsLoading(true); setError(null); try { console.log('Loading models...'); await Promise.all([ faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL), faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL), faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL), faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL), faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)]); console.log('Models loaded!'); setModelsLoaded(true); } catch (err) { console.error('Error loading models:', err); setError('Failed to load models.'); } finally { setIsLoading(false); } };
        loadModels(); return () => { stopCameraStream(true); };
    }, []);

    // --- Auto Capture Photo Function ---
    const capturePhotoAndProceed = () => { /* ... unchanged ... */
        if (!videoRef.current || !stream ) { console.warn("Capture prevented: No video/stream."); return; } if (!isCapturingPhoto.current) { console.warn("Capture flag was not set, setting now."); isCapturingPhoto.current = true; } console.log("Attempting auto capture (after delay)..."); setLivenessStatus('Capturing'); setLivenessMessage('Capturing photo...'); const video = videoRef.current; const tempCanvas = document.createElement('canvas'); tempCanvas.width = video.videoWidth; tempCanvas.height = video.videoHeight; const context = tempCanvas.getContext('2d'); if (!context) { setError('Capture Error: Canvas context failed.'); isCapturingPhoto.current = false; setLivenessStatus('Failed'); return; } context.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height); const photoDataUrl = tempCanvas.toDataURL('image/jpeg'); console.log('Photo captured automatically.'); stopCameraStream(false); setIsCameraMode(false); setImageUrl(photoDataUrl); setDetectionResults([]);
    };

    // --- Function to Trigger Visual Feedback ---
    const triggerFeedback = () => { /* ... unchanged ... */
        setShowSuccessFeedback(true); if (feedbackTimeoutId.current) clearTimeout(feedbackTimeoutId.current); feedbackTimeoutId.current = setTimeout(() => { setShowSuccessFeedback(false); feedbackTimeoutId.current = null; }, FEEDBACK_DURATION);
    };


    // --- Effect to Handle Attaching Stream AND Starting Liveness Check ---
    useEffect(() => { /* ... logic inside largely unchanged, interval skipping fix is present ... */
        if (isCameraMode && stream && videoRef.current && modelsLoaded && !isCapturingPhoto.current && !isTransitioning.current) {
            console.log('Attaching stream and starting/resuming HEAD POSE liveness check.'); const videoElement = videoRef.current; videoElement.srcObject = stream; const playPromise = videoElement.play();
            playPromise?.then(() => {
                console.log('Video playback started/resumed. Starting pose detection interval.'); setLivenessStatus('Checking'); const initialStep = currentPoseStepIndexRef.current; if (initialStep < POSE_SEQUENCE.length) { setLivenessMessage(`(${initialStep + 1}/${POSE_SEQUENCE.length}) Please look ${POSE_SEQUENCE[initialStep].toUpperCase()}`); } else { setLivenessMessage('Sequence already complete?'); } setIsLoading(false);
                // @ts-ignore
                if (livenessStatus !== 'Confirmed' && livenessStatus !== 'HoldStill' && livenessStatus !== 'Capturing') { if (livenessTimeoutId.current) clearTimeout(livenessTimeoutId.current); livenessTimeoutId.current = setTimeout(() => { console.log("Pose Liveness check timed out."); /* @ts-ignore */ if (!isCapturingPhoto.current && livenessStatus !== 'Confirmed' && livenessStatus !== 'Capturing' && livenessStatus !== 'HoldStill') { setLivenessStatus('Timeout'); setLivenessMessage('Liveness check timed out. Please try again.'); } }, LIVENESS_TIMEOUT); }
                if (livenessIntervalId.current) clearInterval(livenessIntervalId.current);
                livenessIntervalId.current = setInterval(async () => {
                    const currentStep = currentPoseStepIndexRef.current;
                    if (currentStep >= POSE_SEQUENCE.length || !videoElement || videoElement.paused || videoElement.ended || !isCameraMode || isCapturingPhoto.current) { console.log("Pose interval stopping (complete/video stopped/mode changed/capturing)."); if (livenessIntervalId.current) { clearInterval(livenessIntervalId.current); livenessIntervalId.current = null; } return; }
                    if (isTransitioning.current) { console.log("Pose interval skipping frame (transitioning between steps)."); return; }
                    const requiredPose = POSE_SEQUENCE[currentStep]; console.log(`Pose check frame running. Required: ${requiredPose} (Step Ref: ${currentStep})`);
                    const detection = await faceapi.detectSingleFace(videoElement, new faceapi.SsdMobilenetv1Options({ minConfidence: FACE_DETECTOR_CONFIDENCE })).withFaceLandmarks();
                    if (detection && detection.landmarks) {
                        const currentPose = estimateHeadPose(detection.landmarks); console.log(`... Detected Pose: ${currentPose}`);
                        if (currentPose === requiredPose) {
                            poseHoldCounterRef.current += 1; console.log(`... Pose hold counter: ${poseHoldCounterRef.current} (Required: ${POSE_HOLD_CHECKS})`);
                            if (poseHoldCounterRef.current >= POSE_HOLD_CHECKS) {
                                console.log(`****** Correct Pose (${requiredPose}) HELD! Advancing step ref. ******`); poseHoldCounterRef.current = 0; triggerFeedback();
                                const nextStepIndex = currentStep + 1; currentPoseStepIndexRef.current = nextStepIndex; setCurrentPoseStepIndexState(nextStepIndex);
                                if (nextStepIndex >= POSE_SEQUENCE.length) {
                                    console.log("****** Pose Sequence Complete! Liveness Confirmed! Starting capture delay... ******"); setLivenessStatus('HoldStill'); setLivenessMessage('Liveness Confirmed! Hold Still...');
                                    if (livenessIntervalId.current) clearInterval(livenessIntervalId.current); if (livenessTimeoutId.current) clearTimeout(livenessTimeoutId.current); livenessIntervalId.current = null; livenessTimeoutId.current = null;
                                    isCapturingPhoto.current = true; if (captureTimeoutId.current) clearTimeout(captureTimeoutId.current); captureTimeoutId.current = setTimeout(() => { console.log("Capture delay finished."); capturePhotoAndProceed(); }, CAPTURE_DELAY);
                                } else {
                                    console.log("Starting step transition delay..."); isTransitioning.current = true; setLivenessStatus('Transitioning'); setLivenessMessage(`Great!`);
                                    if (stepTransitionTimeoutId.current) clearTimeout(stepTransitionTimeoutId.current); stepTransitionTimeoutId.current = setTimeout(() => { console.log("Step transition delay finished."); setLivenessMessage(`(${nextStepIndex + 1}/${POSE_SEQUENCE.length}) Please look ${POSE_SEQUENCE[nextStepIndex].toUpperCase()}`); setLivenessStatus('Checking'); isTransitioning.current = false; stepTransitionTimeoutId.current = null; }, STEP_TRANSITION_DELAY);
                                }
                            }
                        } else { poseHoldCounterRef.current = 0; const currentGuidance = `(${currentStep + 1}/${POSE_SEQUENCE.length}) Please look ${requiredPose.toUpperCase()}`; setLivenessMessage(prevMsg => prevMsg === currentGuidance ? prevMsg : currentGuidance); }
                    } else { poseHoldCounterRef.current = 0; console.log('... No face detected in pose check frame.'); const requiredPose = POSE_SEQUENCE[currentStep]; const currentGuidance = `(${currentStep + 1}/${POSE_SEQUENCE.length}) No face detected. Please look ${requiredPose.toUpperCase()}`; setLivenessMessage(prevMsg => prevMsg === currentGuidance ? prevMsg : currentGuidance); }
                }, POSE_CHECK_INTERVAL);
            }).catch(err => { console.error('Video play() failed:', err); setError('Could not play video.'); setIsLoading(false); stopCameraStream(true); setIsCameraMode(false); });
        } else if (!isCameraMode) { stopCameraStream(true); if (videoRef.current) videoRef.current.srcObject = null; }
        return () => { console.log("Cleaning up camera/pose effect."); stopCameraStream(true); };
    }, [isCameraMode, stream, modelsLoaded]); // Keep dependencies minimal


    // --- Function to Start Camera ---
    const startCamera = async () => {
        console.log("Start Camera button clicked."); setError(null); setImageUrl(null); setDetectionResults([]);
        setCanvasBorderColor(null); // *** NEW: Reset border color ***
        stopCameraStream(true);
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) { try { setIsLoading(true); console.log('Requesting camera access...'); const currentStream = await navigator.mediaDevices.getUserMedia({ video: true }); console.log('Camera access granted.'); setStream(currentStream); setIsCameraMode(true); } catch (err) { console.error('Error accessing camera:', err); if ((err as Error).name === 'NotAllowedError') { setError('Camera permission denied.'); } else if ((err as Error).name === 'NotFoundError') { setError('No camera found.'); } else { setError('Failed to access camera.'); } setIsCameraMode(false); setIsLoading(false); stopCameraStream(true); } } else { setError('Camera access not supported.'); setIsCameraMode(false); }
    };

    // --- Handler for File Input Change ---
    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (isCameraMode) { stopCameraStream(true); setIsCameraMode(false); }
        setCanvasBorderColor(null); // *** NEW: Reset border color ***
        const file = event.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onload = (e) => { setImageUrl(e.target?.result as string); setDetectionResults([]); setError(null); /* clear canvas */ }; reader.readAsDataURL(file); event.target.value = ''; }
    };

    // --- Handler for Face Detection on Static Image ---
    const handleDetectFaces = async () => {
        if (isCameraMode || !modelsLoaded || !imageRef.current || !imageUrl) { return; }
        setIsLoading(true); setError(null);
        setCanvasBorderColor(null); // Reset border before new detection

        const imageElement = imageRef.current; const canvasElement = canvasRef.current;
        if (!canvasElement) { setError('Canvas overlay not found.'); setIsLoading(false); return; }
        canvasElement.width = imageElement.naturalWidth; canvasElement.height = imageElement.naturalHeight;
        console.log('Detecting faces on captured/uploaded image...');
        try {
            const detections = await faceapi.detectAllFaces(imageElement, new faceapi.SsdMobilenetv1Options({ minConfidence: FACE_DETECTOR_CONFIDENCE })).withFaceLandmarks().withAgeAndGender();
            console.log(`Static Detections found: ${detections.length}`);
            const context = canvasElement.getContext('2d'); if (!context) { setError("Canvas context error."); setIsLoading(false); return; }
            context.clearRect(0, 0, canvasElement.width, canvasElement.height);

            if (detections.length === 0) {
                setError('No faces detected.'); setDetectionResults([]);
                setCanvasBorderColor(null); // *** Ensure border cleared ***
            } else {
                 // --- Age Border Logic ---
                 // Assuming we use the first detected face for the border color
                 const firstFaceAge = Math.round(detections[0].age);
                 console.log(`First detected age: ${firstFaceAge}`);
                 setCanvasBorderColor(firstFaceAge >= AGE_THRESHOLD ? BORDER_COLOR_ADULT : BORDER_COLOR_MINOR);
                 // ----------------------

                 const results: DetectionResult[] = detections.map(d => ({ age: Math.round(d.age), gender: d.gender, genderProbability: d.genderProbability, box: d.detection.box }));
                 setDetectionResults(results);
                 faceapi.matchDimensions(canvasElement, { width: imageElement.width, height: imageElement.height });
                 const resizedDetections = faceapi.resizeResults(detections, { width: imageElement.width, height: imageElement.height });
                 // Draw boxes for ALL detected faces
                 resizedDetections.forEach(detection => {
                     const box = detection.detection.box;
                     const drawBox = new faceapi.draw.DrawBox(box, { label: `${detection.gender} (~${Math.round(detection.age)} yrs)`, boxColor: BORDER_COLOR_ADULT, drawLabelOptions: { fontSize: 14, fontColor: 'white', padding: 3, backgroundColor: 'rgba(0, 0, 0, 0.5)' } });
                     drawBox.draw(canvasElement);
                 });
            }
        } catch (err) {
             console.error('Error during static face detection:', err); setError('Detection error.'); setDetectionResults([]);
             setCanvasBorderColor(null); // *** Ensure border cleared on error ***
             const context = canvasElement.getContext('2d'); context?.clearRect(0, 0, canvasElement?.width ?? 0, canvasElement?.height ?? 0);
        } finally {
            setIsLoading(false);
        }
    };

    // --- Get Liveness Status Message ---
    const getLivenessMessage = (): string => { /* ... unchanged ... */ switch (livenessStatus) { case 'Checking': return livenessMessage || 'Checking liveness...'; case 'Transitioning': return livenessMessage || 'Great!'; case 'HoldStill': return 'Liveness Confirmed! Hold Still...'; case 'Confirmed': return 'Liveness Confirmed! Preparing Capture...'; case 'Capturing': return 'Capturing photo...'; case 'Failed': return 'Liveness check failed.'; case 'Timeout': return 'Liveness check timed out. Please try again.'; case 'Pending': default: return ''; } };

    // --- JSX Rendering ---
    return (
        <div className={styles.container}>
            <main className={styles.main}>
                <h1 className={styles.title}>Face Age & Gender Recognition</h1>

                {/* Status Messages Area */}
                <div style={{ minHeight: '1.5em', margin: '10px 0', textAlign: 'center' }}>
                     {!modelsLoaded && isLoading && <p>Loading models...</p>} {isLoading && modelsLoaded && !isCameraMode && <p>Processing image...</p>} {modelsLoaded && !isLoading && !error && !isCameraMode && <p style={{ color: 'green' }}>Ready</p>} {error && <p style={{ color: 'red' }}>Error: {error}</p>}
                    {isCameraMode && livenessStatus !== 'Pending' && <p style={{ color: livenessStatus === 'HoldStill' || livenessStatus === 'Confirmed' || livenessStatus === 'Capturing' || livenessStatus === 'Transitioning' ? 'green' : (livenessStatus === 'Timeout' || livenessStatus === 'Failed' ? 'orange' : 'blue'), fontWeight: 'bold' }}>{getLivenessMessage()}</p>}
                </div>

                 {/* *** NEW: Input Fields Section *** */}
                <div className={styles.inputFields} style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '400px', width: '90%' }}>
                    <div>
                        <label htmlFor="fullName" style={{ marginRight: '10px', display: 'block', marginBottom: '3px' }}>Full Name:</label>
                        <input type="text" id="fullName" name="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                        <label htmlFor="email" style={{ marginRight: '10px', display: 'block', marginBottom: '3px' }}>Email:</label>
                        <input type="email" id="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                        <label htmlFor="phone" style={{ marginRight: '10px', display: 'block', marginBottom: '3px' }}>Phone:</label>
                        <input type="tel" id="phone" name="phone" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
                    </div>
                </div>
                {/* ****************************** */}


                {/* Action Buttons Area */}
                <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
                   <button onClick={startCamera} disabled={isLoading || !modelsLoaded || isCameraMode} className={styles.actionButton}>{isCameraMode ? "Restart Camera" : "Use Camera"}</button>
                   <label htmlFor="fileInput" className={styles.actionButton} style={{ cursor: (isLoading || !modelsLoaded) ? 'not-allowed' : 'pointer', opacity: (isLoading || !modelsLoaded) ? 0.6 : 1, display: 'inline-block', padding: '10px 20px' }}>Upload Image</label>
                   <input id="fileInput" type="file" accept="image/*" onChange={handleFileChange} disabled={isLoading || !modelsLoaded} style={{ display: 'none' }} />
                </div>

                {/* Camera View Area */}
                {isCameraMode && (<div className={styles.cameraContainer} style={{ marginTop: '10px', textAlign: 'center' }}> <video ref={videoRef} playsInline muted className={styles.videoFeed} style={{ maxWidth: '100%', maxHeight: '50vh', height: 'auto', border: showSuccessFeedback ? '3px solid lime' : '1px solid black', display: 'block', margin: '0 auto 10px auto', backgroundColor:'#333', transition: 'border-color 0.1s ease-in-out' }}/> </div>)}

                {/* Image Preview Area */}
                {!isCameraMode && imageUrl && (
                     <div className={styles.imageContainer} style={{ position: 'relative', marginTop: '20px' }}>
                        <img
                            ref={imageRef}
                            src={imageUrl}
                            alt="Preview"
                            onLoad={handleDetectFaces}
                            style={{ maxWidth: '100%', maxHeight: '70vh', height: 'auto', display: 'block' }} />
                        {/* Canvas for drawing overlays */}
                        <canvas
                            ref={canvasRef}
                            className={styles.overlayCanvas}
                            // *** UPDATED STYLE for conditional border ***
                            style={{
                                position: 'absolute', top: 0, left: 0, pointerEvents: 'none',
                                border: canvasBorderColor ? `${BORDER_WIDTH} solid ${canvasBorderColor}` : 'none',
                                boxSizing: 'border-box' // Ensure border is included in element dimensions
                             }}
                        />
                     </div>
                 )}
            </main>
        </div>
    );
};

export default Home;