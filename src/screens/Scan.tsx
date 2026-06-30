import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Camera, ArrowLeft, X, Aperture, RotateCcw } from 'lucide-react';
import { useAppState } from '../context';

export default function Scan() {
  const navigate = useNavigate();
  const { setCapturedImage } = useAppState();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImageLocal] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = s;
      setCameraActive(true);
    } catch (e) {
      setCameraError('Camera access denied. Please allow camera permission and try again.');
    }
  };

  // Assign srcObject AFTER the video element renders in DOM
  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play();
    }
  }, [cameraActive]);

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')!.drawImage(video, 0, 0);
    const base64 = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
    setCapturedImageLocal(base64);
    streamRef.current?.getTracks().forEach(t => t.stop());
    setCameraActive(false);
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    setCameraActive(false);
  };

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1];
      setCapturedImageLocal(base64);
    };
    reader.readAsDataURL(file);
  }, []);

  const analyzeImage = (base64: string) => {
    setCapturedImage(base64, 'image/jpeg');
    navigate('/analysis');
  };

  const handleRetake = () => {
    setCapturedImageLocal(null);
  };

  // Show captured image preview
  if (capturedImage) {
    return (
      <div className="min-h-screen flex flex-col px-6 py-8 page-enter">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={handleRetake}
            className="w-9 h-9 rounded-xl glass glass-hover flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-white/60" />
          </button>
          <h2 className="text-lg font-semibold">Preview</h2>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <div className="w-full rounded-2xl overflow-hidden glass p-1">
            <img
              src={`data:image/jpeg;base64,${capturedImage}`}
              alt="Captured label"
              className="w-full rounded-xl object-contain max-h-[50vh]"
            />
          </div>

          <div className="flex gap-3 w-full">
            <button
              onClick={handleRetake}
              className="flex-1 py-3.5 rounded-2xl glass glass-hover flex items-center justify-center gap-2 text-white/60 font-semibold text-sm transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Retake
            </button>
            <button
              onClick={() => analyzeImage(capturedImage)}
              className="flex-1 py-3.5 rounded-2xl bg-mint text-[#0a0a0f] font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform glow-mint-soft"
            >
              Analyze
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Camera active view
  if (cameraActive) {
    return (
      <div className="min-h-screen flex flex-col page-enter">
        <div className="relative flex-1 bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[85%] h-[60%] border-2 border-mint/30 rounded-xl" />
            </div>
          </div>
          <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
            <button
              onClick={stopCamera}
              className="w-9 h-9 rounded-xl glass flex items-center justify-center"
            >
              <X className="w-4 h-4 text-white/60" />
            </button>
            <span className="text-xs text-white/40 font-medium">Position label in frame</span>
          </div>
        </div>

        <div className="p-6 flex items-center justify-center gap-6 bg-[#0a0a0f]">
          <button
            onClick={capturePhoto}
            className="w-16 h-16 rounded-full bg-mint flex items-center justify-center active:scale-95 transition-transform glow-mint"
          >
            <Aperture className="w-7 h-7 text-[#0a0a0f]" strokeWidth={2} />
          </button>
        </div>
      </div>
    );
  }

  // Choose mode (default)
  return (
    <div className="min-h-screen flex flex-col px-6 py-8 page-enter">
      <div className="flex items-center gap-3 mb-10">
        <button
          onClick={() => navigate('/')}
          className="w-9 h-9 rounded-xl glass glass-hover flex items-center justify-center transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-white/60" />
        </button>
        <h2 className="text-lg font-semibold">Scan Label</h2>
      </div>

      <p className="text-white/40 text-sm mb-8">
        Choose how you'd like to scan the ingredient label.
      </p>

      {cameraError && (
        <div className="glass rounded-xl p-4 mb-5 border border-amber-500/20">
          <p className="text-xs text-amber-400">{cameraError}</p>
        </div>
      )}

      <div className="flex-1 flex flex-col gap-5">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="rounded-2xl p-8 flex flex-col items-center gap-4 transition-all duration-300 active:scale-[0.98] group dashed-glow-zone"
        >
          <div className="w-16 h-16 rounded-2xl bg-mint/10 flex items-center justify-center group-hover:bg-mint/20 transition-colors">
            <Upload className="w-8 h-8 text-mint" strokeWidth={1.5} />
          </div>
          <div className="text-center">
            <p className="font-semibold text-base mb-1">Upload Image</p>
            <p className="text-xs text-white/30">Select from gallery</p>
          </div>
        </button>

        <button
          onClick={startCamera}
          className="glass glass-hover rounded-2xl p-8 flex flex-col items-center gap-4 transition-all duration-300 active:scale-[0.98] group relative overflow-hidden"
        >
          <div className="w-16 h-16 rounded-2xl bg-mint/10 flex items-center justify-center group-hover:bg-mint/20 transition-colors relative">
            <Camera className="w-8 h-8 text-mint" strokeWidth={1.5} />
            <div className="absolute inset-0 rounded-2xl animate-pulse-ring" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-base mb-1">Take Photo</p>
            <p className="text-xs text-white/30">Use your camera</p>
          </div>
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      <p className="text-center text-xs text-white/20 mt-6">
        For best results, ensure the label is clearly visible
      </p>
    </div>
  );
}
