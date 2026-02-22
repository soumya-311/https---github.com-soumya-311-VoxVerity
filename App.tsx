
import React, { useState, useRef, useCallback } from 'react';
import { 
  ShieldCheckIcon, 
  MicrophoneIcon, 
  ArrowUpTrayIcon, 
  DocumentMagnifyingGlassIcon,
  ExclamationCircleIcon,
  CheckBadgeIcon,
  ChartBarIcon,
  CodeBracketIcon
} from '@heroicons/react/24/outline';
import { AudioVisualizer } from './components/AudioVisualizer';
import { detectVoice } from './services/geminiService';
import { DetectionResult, PredictionType } from './types';

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'detector' | 'docs'>('detector');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMediaStream(stream);
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/mp3' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        const recordedFile = new File([blob], "recording.mp3", { type: "audio/mp3" });
        setFile(recordedFile);
        stream.getTracks().forEach(track => track.stop());
        setMediaStream(null);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setError(null);
      setResult(null);
    } catch (err) {
      setError("Microphone access denied or not available.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("File too large. Max 10MB allowed.");
        return;
      }
      setFile(selectedFile);
      setAudioUrl(URL.createObjectURL(selectedFile));
      setResult(null);
      setError(null);
    }
  };

  const analyzeAudio = async () => {
    if (!file) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = (reader.result as string).split(',')[1];
        try {
          const detectionResult = await detectVoice(base64String);
          setResult(detectionResult);
        } catch (err: any) {
          setError(err.message || "Failed to analyze audio. Please try again.");
        } finally {
          setIsAnalyzing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError("Error processing file.");
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setFile(null);
    setAudioUrl(null);
    setResult(null);
    setError(null);
    chunksRef.current = [];
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-600 rounded-lg">
              <ShieldCheckIcon className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">VoxVerity <span className="text-zinc-500 font-normal">AI</span></h1>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <button 
              onClick={() => setActiveTab('detector')}
              className={`text-sm font-medium transition-colors ${activeTab === 'detector' ? 'text-blue-500' : 'text-zinc-400 hover:text-zinc-100'}`}
            >
              Detector
            </button>
            <button 
              onClick={() => setActiveTab('docs')}
              className={`text-sm font-medium transition-colors ${activeTab === 'docs' ? 'text-blue-500' : 'text-zinc-400 hover:text-zinc-100'}`}
            >
              API Reference
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto px-4 py-8 w-full">
        {activeTab === 'detector' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Left: Input */}
            <section className="space-y-6">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <DocumentMagnifyingGlassIcon className="w-5 h-5 text-blue-500" />
                  Voice Sample Analysis
                </h2>
                
                {!audioUrl ? (
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-zinc-700 rounded-xl p-8 text-center hover:border-blue-500/50 transition-colors group relative">
                      <input 
                        type="file" 
                        accept="audio/*" 
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <ArrowUpTrayIcon className="w-10 h-10 text-zinc-500 mx-auto mb-4 group-hover:text-blue-500 transition-colors" />
                      <p className="text-zinc-400 mb-1">Upload MP3, WAV or AAC</p>
                      <p className="text-xs text-zinc-600">Max file size: 10MB (approx 30s)</p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex-grow h-px bg-zinc-800"></div>
                      <span className="text-xs text-zinc-600 uppercase font-bold tracking-widest">or</span>
                      <div className="flex-grow h-px bg-zinc-800"></div>
                    </div>

                    <button
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`w-full py-4 rounded-xl flex items-center justify-center gap-3 transition-all ${
                        isRecording 
                          ? 'bg-red-500/10 text-red-500 border border-red-500/50' 
                          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100'
                      }`}
                    >
                      <MicrophoneIcon className={`w-5 h-5 ${isRecording ? 'animate-pulse' : ''}`} />
                      {isRecording ? 'Stop Recording' : 'Record Live Sample'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-zinc-300">Preview Sample</span>
                        <button 
                          onClick={reset}
                          className="text-xs text-red-400 hover:text-red-300 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                      <audio 
                        ref={audioRef}
                        src={audioUrl} 
                        controls 
                        className="w-full mb-4"
                        onPlay={() => setIsRecording(false)}
                      />
                      <AudioVisualizer 
                        audioElement={audioRef.current} 
                        stream={mediaStream}
                        isActive={isRecording || (audioRef.current ? !audioRef.current.paused : false)} 
                      />
                    </div>
                    
                    <button
                      onClick={analyzeAudio}
                      disabled={isAnalyzing}
                      className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
                    >
                      {isAnalyzing ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                          Analyzing Spectral Features...
                        </>
                      ) : (
                        <>
                          <ChartBarIcon className="w-5 h-5" />
                          Run Full Detection
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl flex items-start gap-3">
                  <ExclamationCircleIcon className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {/* Specs Info */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                <h3 className="text-zinc-300 font-medium mb-3 text-sm">Processing Pipeline</h3>
                <ul className="space-y-3">
                  {[
                    "Normalization & WAV Conversion",
                    "MFCC Feature Extraction",
                    "Spectral Contrast Analysis",
                    "CNN-LSTM Model Inference"
                  ].map((step, i) => (
                    <li key={i} className="flex items-center gap-3 text-xs text-zinc-500">
                      <span className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-400">{i+1}</span>
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Right: Results */}
            <section className="space-y-6">
              {!result && !isAnalyzing && (
                <div className="h-[400px] flex flex-col items-center justify-center text-center p-8 border border-zinc-800 border-dashed rounded-2xl bg-zinc-900/20">
                  <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                    <ChartBarIcon className="w-8 h-8 text-zinc-600" />
                  </div>
                  <h3 className="text-zinc-400 font-medium">No results to display</h3>
                  <p className="text-zinc-600 text-sm max-w-xs mt-2">Upload or record an audio sample to see the neural network analysis.</p>
                </div>
              )}

              {isAnalyzing && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-zinc-800">
                    <div className="h-full bg-blue-500 animate-[loading_2s_ease-in-out_infinite] w-1/3"></div>
                  </div>
                  <style>{`
                    @keyframes loading {
                      0% { transform: translateX(-100%); }
                      100% { transform: translateX(300%); }
                    }
                  `}</style>
                  <div className="space-y-6 animate-pulse">
                    <div className="h-8 bg-zinc-800 rounded-lg w-1/2"></div>
                    <div className="h-24 bg-zinc-800 rounded-lg"></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="h-16 bg-zinc-800 rounded-lg"></div>
                      <div className="h-16 bg-zinc-800 rounded-lg"></div>
                    </div>
                    <div className="h-20 bg-zinc-800 rounded-lg"></div>
                  </div>
                </div>
              )}

              {result && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden transition-all animate-in fade-in slide-in-from-bottom-4">
                  {/* Status Banner */}
                  <div className={`absolute top-0 right-0 px-6 py-2 text-xs font-bold uppercase tracking-widest ${
                    result.prediction === PredictionType.HUMAN 
                      ? 'bg-emerald-500/20 text-emerald-400 border-l border-b border-emerald-500/30' 
                      : 'bg-amber-500/20 text-amber-400 border-l border-b border-amber-500/30'
                  }`}>
                    {result.prediction.replace('_', ' ')}
                  </div>

                  <div className="flex items-center gap-4 mb-6">
                    <div className={`p-3 rounded-2xl ${
                      result.prediction === PredictionType.HUMAN ? 'bg-emerald-500/10' : 'bg-amber-500/10'
                    }`}>
                      {result.prediction === PredictionType.HUMAN ? (
                        <CheckBadgeIcon className="w-8 h-8 text-emerald-500" />
                      ) : (
                        <ExclamationCircleIcon className="w-8 h-8 text-amber-500" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">Analysis Complete</h3>
                      <p className="text-zinc-500 text-sm">Spectral scan verified sample identity.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl">
                      <span className="text-xs text-zinc-500 block mb-1">Confidence</span>
                      <span className="text-xl font-bold mono">{(result.confidence * 100).toFixed(1)}%</span>
                    </div>
                    <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl">
                      <span className="text-xs text-zinc-500 block mb-1">Language</span>
                      <span className="text-xl font-bold mono">{result.language_detected}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-400">Prediction Accuracy Level</span>
                      <span className={`font-semibold ${result.confidence > 0.8 ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {result.confidence > 0.8 ? 'High' : 'Moderate'}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${result.prediction === PredictionType.HUMAN ? 'bg-emerald-500' : 'bg-amber-500'}`}
                        style={{ width: `${result.confidence * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="mt-8 pt-8 border-t border-zinc-800">
                    <h4 className="text-zinc-300 font-semibold mb-3 flex items-center gap-2">
                      Explainability Report
                    </h4>
                    <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                      <p className="text-zinc-400 text-sm leading-relaxed italic">
                        "{result.explanation}"
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <CodeBracketIcon className="w-7 h-7 text-blue-500" />
                Integration Guide
              </h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-zinc-200 mb-2">Endpoint Details</h3>
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 mono text-sm flex items-center justify-between">
                    <span className="text-zinc-400"><span className="text-emerald-500 font-bold mr-2">POST</span> https://api.voxverity.ai/v1/detect-voice</span>
                    <button className="text-blue-500 hover:text-blue-400 transition-colors">Copy</button>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-zinc-200 mb-2">Request Body</h3>
                  <pre className="bg-zinc-950 p-6 rounded-xl border border-zinc-800 mono text-xs text-zinc-400 overflow-x-auto">
{`{
  "audio_base64": "<BASE64_MP3_DATA>",
  "api_key": "vx_live_..."
}`}
                  </pre>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-zinc-200 mb-2">Sample Python Integration</h3>
                  <pre className="bg-zinc-950 p-6 rounded-xl border border-zinc-800 mono text-xs text-zinc-400 overflow-x-auto leading-relaxed">
{`import requests
import base64

def check_voice(file_path):
    with open(file_path, "rb") as f:
        encoded = base64.b64encode(f.read()).decode()
    
    response = requests.post(
        "https://api.voxverity.ai/v1/detect-voice",
        json={"audio_base64": encoded},
        headers={"X-API-Key": "your_key"}
    )
    return response.json()

# Returns:
# {
#   "prediction": "AI_GENERATED",
#   "confidence": 0.98,
#   "explanation": "High phase coherence and lack of breathing artifacts..."
# }`}
                  </pre>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: "Rate Limit", value: "60 RPM", desc: "Per project key" },
                { title: "Max Duration", value: "30s", desc: "Recommended limit" },
                { title: "Avg Latency", value: "450ms", desc: "Real-time processing" }
              ].map((stat, i) => (
                <div key={i} className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl text-center">
                  <span className="text-zinc-500 text-xs uppercase font-bold tracking-widest">{stat.title}</span>
                  <div className="text-2xl font-bold mt-1 text-zinc-200">{stat.value}</div>
                  <p className="text-zinc-600 text-xs mt-1">{stat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-zinc-800 bg-zinc-950 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-zinc-600 text-sm">© 2024 VoxVerity AI. All rights reserved.</p>
          <div className="flex gap-6 text-zinc-600 text-sm">
            <a href="#" className="hover:text-zinc-300 transition-colors">Documentation</a>
            <a href="#" className="hover:text-zinc-300 transition-colors">Privacy</a>
            <a href="#" className="hover:text-zinc-300 transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
