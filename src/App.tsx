import { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppContext, AppState, ScanResult } from './context';
import Welcome from './screens/Welcome';
import Scan from './screens/Scan';
import Analysis from './screens/Analysis';
import Score from './screens/Score';

export default function App() {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedMediaType, setCapturedMediaType] = useState<string | null>(null);
  const [scanResult, setScanResultState] = useState<ScanResult | null>(null);

  const setCapturedImageWrapper = useCallback((dataUrl: string | null, mediaType: string | null) => {
    setCapturedImage(dataUrl);
    setCapturedMediaType(mediaType);
  }, []);

  const setScanResult = useCallback((result: ScanResult | null) => {
    setScanResultState(result);
  }, []);

  const appState: AppState = {
    capturedImage,
    capturedMediaType,
    scanResult,
    setCapturedImage: setCapturedImageWrapper,
    setScanResult,
  };

  return (
    <AppContext.Provider value={appState}>
      <BrowserRouter>
        <div className="min-h-screen flex justify-center">
          <div className="w-full max-w-[390px] min-h-screen relative overflow-hidden">
            <Routes>
              <Route path="/" element={<Welcome />} />
              <Route path="/scan" element={<Scan />} />
              <Route path="/analysis" element={<Analysis />} />
              <Route path="/score" element={<Score />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </AppContext.Provider>
  );
}
