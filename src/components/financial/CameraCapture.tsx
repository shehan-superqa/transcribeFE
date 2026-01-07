import { useState, useRef, useEffect } from 'react';
import { Box, Button, IconButton, Snackbar, Alert } from '@mui/material';
import { CameraAlt, Close, Check } from '@mui/icons-material';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

export default function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning' }>({
    open: false,
    message: '',
    severity: 'info',
  });

  useEffect(() => {
    // Check if mobile device
    const checkMobile = () => {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) || window.innerWidth < 768;
    };
    setIsMobile(checkMobile());
  }, []);

  useEffect(() => {
    if (!isMobile && !capturedImage) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isMobile, capturedImage]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // Use back camera on mobile
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setSnackbar({ open: true, message: 'Unable to access camera. Please check permissions.', severity: 'error' });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);

        canvas.toBlob((blob) => {
          if (blob) {
            const imageUrl = URL.createObjectURL(blob);
            setCapturedImage(imageUrl);
            stopCamera();
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCapturedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const confirmCapture = () => {
    if (capturedImage && canvasRef.current) {
      canvasRef.current.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `camera-capture-${Date.now()}.jpg`, {
            type: 'image/jpeg',
          });
          onCapture(file);
          handleClose();
        }
      }, 'image/jpeg', 0.9);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    if (!isMobile) {
      startCamera();
    }
  };

  const handleClose = () => {
    stopCamera();
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage);
    }
    onClose();
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <IconButton
        onClick={handleClose}
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          color: 'white',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
          },
        }}
      >
        <Close />
      </IconButton>

      {isMobile ? (
        <Box sx={{ textAlign: 'center', color: 'white', p: 3 }}>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileInput}
            style={{ display: 'none' }}
            id="mobile-camera-input"
          />
          <label htmlFor="mobile-camera-input">
            <Button
              variant="contained"
              component="span"
              startIcon={<CameraAlt />}
              sx={{ mb: 2 }}
            >
              Take Photo
            </Button>
          </label>
          {capturedImage && (
            <Box>
              <img
                src={capturedImage}
                alt="Captured"
                style={{
                  maxWidth: '100%',
                  maxHeight: '60vh',
                  borderRadius: '8px',
                  marginBottom: '16px',
                }}
              />
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button variant="outlined" onClick={retakePhoto} sx={{ color: 'white', borderColor: 'white' }}>
                  Retake
                </Button>
                <Button variant="contained" onClick={confirmCapture} startIcon={<Check />}>
                  Use Photo
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      ) : (
        <Box sx={{ textAlign: 'center', color: 'white' }}>
          {!capturedImage ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                style={{
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  borderRadius: '8px',
                }}
              />
              <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button variant="contained" onClick={capturePhoto} startIcon={<CameraAlt />}>
                  Capture
                </Button>
                <Button variant="outlined" onClick={handleClose} sx={{ color: 'white', borderColor: 'white' }}>
                  Cancel
                </Button>
              </Box>
            </>
          ) : (
            <>
              <img
                src={capturedImage}
                alt="Captured"
                style={{
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  borderRadius: '8px',
                  marginBottom: '16px',
                }}
              />
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button variant="outlined" onClick={retakePhoto} sx={{ color: 'white', borderColor: 'white' }}>
                  Retake
                </Button>
                <Button variant="contained" onClick={confirmCapture} startIcon={<Check />}>
                  Use Photo
                </Button>
              </Box>
            </>
          )}
        </Box>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}











