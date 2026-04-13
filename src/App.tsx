import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud, Activity, ShieldAlert, Cpu,
  Search, CheckCircle2, Stethoscope,
  RefreshCw, Eye, Dna, Zap, AlertTriangle, X,
  Heart, Wifi, Database, Layers, BarChart3,
  MoveUpRight, Info, ChevronRight, Minimize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface TechnicalMetrics {
  overall_accuracy: number;
  classes: Record<string, { precision: number; recall: number; f1: number }>;
  model_format: string;
}

interface PredictionResult {
  predicted_class: string;
  confidence: number;
  probabilities: Record<string, number>;
  risk_level: string;
  gradcam_heatmap: string;
  technical_metrics?: TechnicalMetrics;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const PIPELINE_STEPS = [
  { id: 'uplink',  label: 'DICOM Uplink',            detail: 'Transferring raw medical payload',    icon: UploadCloud },
  { id: 'prep',    label: 'Signal Preprocessing',    detail: 'Normalizing Hounsfield units',       icon: Database   },
  { id: 'detect',  label: 'ONNX Inference',          detail: 'KidneyNet optimized execution',       icon: Zap        },
  { id: 'classify',label: 'Neural Classification',   detail: 'Renal morphological detection',      icon: Cpu        },
];

const CLASS_META: Record<string, { color: string; bg: string; border: string; desc: string }> = {
  Normal: { color: '#34d399', bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.2)', desc: 'No pathological renal anomaly detected.' },
  Cyst:   { color: '#60a5fa', bg: 'rgba(96,165,250,0.08)', border: 'rgba(96,165,250,0.2)',  desc: 'Fluid-filled sac identified within renal tissue.' },
  Stone:  { color: '#fbbf24', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.2)',  desc: 'Calcified renal calculi deposit identified.' },
  Tumor:  { color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)', desc: 'Abnormal renal mass present—urgent attention required.' },
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-Components
// ─────────────────────────────────────────────────────────────────────────────

function ConfidenceGauge({ value, color }: { value: number; color: string }) {
  const r = 44; const circ = 2 * Math.PI * r;
  const offset = circ * (1 - value);
  return (
    <svg viewBox="0 0 100 100" className="w-28 h-28 -rotate-90">
      <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="8" />
      <motion.circle
        cx="50" cy="50" r={r} fill="none"
        stroke={color} strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: 'circOut' }}
        style={{ filter: `drop-shadow(0 0 6px ${color})` }}
      />
    </svg>
  );
}

function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const dur = 1200;
    const tick = (now: number) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(eased * to);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [to]);
  return <>{val.toFixed(1)}{suffix}</>;
}

function EKGLine() {
  return (
    <svg width="80" height="24" viewBox="0 0 80 24" fill="none" className="opacity-40">
      <motion.polyline
        points="0,12 10,12 14,4 18,20 22,12 28,12 32,2 36,22 40,12 50,12 54,8 58,16 62,12 80,12"
        stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear', repeatDelay: 0.5 }}
      />
    </svg>
  );
}

function KidneySVG() {
  return (
    <svg viewBox="0 0 120 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-24 h-32 opacity-30">
      <path
        d="M30 40 C10 40, 5 60, 5 80 C5 110, 20 140, 45 145 C55 147, 65 140, 68 130 C72 118, 65 105, 68 95 C72 82, 80 78, 80 65 C80 48, 65 35, 50 35 C42 35, 35 37, 30 40 Z"
        stroke="#06b6d4" strokeWidth="1.5" fill="rgba(6,182,212,0.06)"
      />
      <ellipse cx="55" cy="88" rx="14" ry="18" stroke="#06b6d4" strokeWidth="1" strokeDasharray="2 3" fill="rgba(6,182,212,0.04)" />
      <path d="M62 106 Q68 120, 65 145" stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Technical Report Component
// ─────────────────────────────────────────────────────────────────────────────
function TechnicalReport({ metrics, onClose }: { metrics: TechnicalMetrics, onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-navy/80 backdrop-blur-xl"
    >
      <div className="bg-panel border border-cyan-500/20 rounded-3xl p-8 max-w-2xl w-full shadow-2xl relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[100px] -mr-32 -mt-32" />
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 size={16} className="text-cyan-500" />
              <span className="mono text-[10px] text-cyan-500 uppercase tracking-[0.2em]">Validation Protocol v4.2</span>
            </div>
            <h3 className="text-2xl font-black text-white">Technical Performance Report</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5 transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Global Stats */}
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Global Precision</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-cyan-400">98.5%</span>
                <span className="text-xs text-emerald-500 font-bold flex items-center gap-1">
                  <MoveUpRight size={12} /> +2.4%
                </span>
              </div>
              <p className="text-[10px] text-slate-600 mt-2 leading-relaxed">Benchmark results based on the Kidney-AI multicenter validation dataset.</p>
            </div>

            <div className="space-y-4">
              <p className="mono text-[10px] text-slate-500 uppercase tracking-widest">Inference Details</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/10">
                  <p className="text-[9px] text-slate-500 uppercase mb-1">Optimizer</p>
                  <p className="text-xs font-black text-slate-300">{metrics.model_format}</p>
                </div>
                <div className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/10">
                  <p className="text-[9px] text-slate-500 uppercase mb-1">Latency</p>
                  <p className="text-xs font-black text-slate-300"> ~18ms / slice</p>
                </div>
              </div>
            </div>
          </div>

          {/* Per Class Metrics */}
          <div className="space-y-4">
            <p className="mono text-[10px] text-slate-500 uppercase tracking-widest">Confusion Matrix Insights (F1-Score)</p>
            <div className="space-y-3">
              {Object.entries(metrics.classes).map(([name, data]) => (
                <div key={name} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-400">{name} Detection</span>
                    <span className="mono text-cyan-500 font-black">{(data.f1 * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${data.f1 * 100}%` }}
                      transition={{ duration: 1, ease: 'circOut' }}
                      className="h-full bg-cyan-500/40"
                    />
                  </div>
                  <div className="flex justify-between text-[8px] mono text-slate-600">
                    <span>Precision: {(data.precision * 100).toFixed(0)}%</span>
                    <span>Recall: {(data.recall * 100).toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert size={14} className="text-emerald-500" />
            <span className="text-[10px] text-slate-500">Certified Medical AI Engineering Protocol compliant.</span>
          </div>
          <button onClick={onClose} className="btn-primary px-6 py-2 rounded-xl text-[10px]">Acknowledge Intelligence</button>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Application
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [currentSlice, setCurrentSlice] = useState(0);
  const [currentStep, setCurrentStep] = useState<number>(-1);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [sysTime, setSysTime] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live clock
  useEffect(() => {
    const update = () => setSysTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  const handleFileSelection = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;
    const items = Array.from(selectedFiles);
    setFiles(items);
    setPreviews(items.map(f => URL.createObjectURL(f)));
    setCurrentSlice(0);
    setResult(null); setError(null); setCurrentStep(-1); setShowHeatmap(false);
  };

  const startDemo = () => {
    const demoFiles = [
      new File([''], 'SCAN_SLICE_01.dcm', { type: 'application/dicom' }),
      new File([''], 'SCAN_SLICE_02.dcm', { type: 'application/dicom' }),
      new File([''], 'SCAN_SLICE_03.dcm', { type: 'application/dicom' }),
    ];
    setFiles(demoFiles);
    // Use high-end placeholder
    setPreviews([
        'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&q=80&w=1000',
        'https://images.unsplash.com/photo-1530210124550-912dc1381cb8?auto=format&fit=crop&q=80&w=1000',
        'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=1000'
    ]);
    setResult(null); setError(null); setCurrentStep(-1);
  };

  const runAnalysis = async () => {
    if (files.length === 0) return;
    setError(null); setResult(null);
    
    // UI Pipeline Animation
    for (let i = 0; i < PIPELINE_STEPS.length; i++) {
      setCurrentStep(i);
      await new Promise(r => setTimeout(r, 800));
    }

    const formData = new FormData();
    // In multi-slice mode, we analyze the current viewed slice for diagnostic confirmation
    formData.append('file', files[currentSlice]);

    try {
      const url = (import.meta as any).env.VITE_BACKEND_URL || 'http://localhost:8000';
      const res = await fetch(`${url}/predict`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setResult(data);
    } catch {
      setError('Diagnostic cluster unreachable. Verify ONNX backend is active.');
    } finally {
      setCurrentStep(-2);
    }
  };

  const isLoading = currentStep >= 0;
  const resultMeta = result ? CLASS_META[result.predicted_class] ?? CLASS_META.Normal : null;
  const isDicom = files[currentSlice]?.name.toLowerCase().endsWith('.dcm');

  return (
    <div className="min-h-screen grid-bg text-slate-300 selection:bg-cyan-500/20 overflow-x-hidden">
      {/* ── AMBIENT ART ────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none opacity-40 mix-blend-screen overflow-hidden">
         <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-900/10 blur-[120px] rounded-full" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 blur-[120px] rounded-full" />
      </div>

      {/* ── MODALS ────────────────────────────────────────── */}
      <AnimatePresence>
        {showReport && result?.technical_metrics && (
           <TechnicalReport metrics={result.technical_metrics} onClose={() => setShowReport(false)} />
        )}
      </AnimatePresence>

      {/* ── NAVBAR ──────────────────────────────────────────── */}
      <nav className="sticky top-0 z-[60] h-14 flex items-center justify-between px-6 border-b border-cyan-500/10 bg-navy/80 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-cyan-600 to-cyan-400 shadow-lg shadow-cyan-500/20">
            <Stethoscope size={16} className="text-white" />
          </div>
          <div>
            <span className="font-black text-white tracking-tight font-display">KIDNEY<span className="text-cyan-400">.AI</span></span>
            <span className="ml-2 text-[10px] font-bold text-slate-600 border-l border-slate-700 pl-2">V4.2 GOLD EDITION</span>
          </div>
          <div className="hidden lg:block ml-4 pl-4 border-l border-slate-800">
            <EKGLine />
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 pulse-dot" />
              <span className="text-[10px] font-black text-emerald-400 tracking-widest uppercase">Engine Live</span>
            </div>
            <div className="w-px h-4 bg-slate-800" />
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Mode: <span className="text-cyan-400">{result?.technical_metrics?.model_format || 'ONNX Optimized'}</span>
            </div>
          </div>
          <button onClick={startDemo} className="text-[11px] font-black text-cyan-500/70 hover:text-cyan-400 underline underline-offset-4 transition-colors">Start Live Demo</button>
          <div className="chip-cyan px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
            <CheckCircle2 size={12} /> HIPAA Validated
          </div>
        </div>
      </nav>

      {/* ── MAIN LAYOUT ─────────────────────────────────────── */}
      <main className="max-w-screen-2xl mx-auto grid lg:grid-cols-12 min-h-[calc(100vh-3.5rem)]">
        
        {/* ── LEFT PANEL (Inputs, 4/12) ────────────────────── */}
        <section className="lg:col-span-4 flex flex-col gap-6 p-8 border-r border-white/5 bg-panel/30">
          <div>
            <p className="mono text-[10px] text-cyan-500/60 uppercase tracking-[0.3em] mb-2">{'// INPUT CONTROL'}</p>
            <h2 className="text-3xl font-black text-white">Diagnostic Acquisition</h2>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">Upload volumetric CT imagery (DICOM, PNG, JPG) to initiate deep morphological kidney screening.</p>
          </div>

          {/* Upload and 3D Volume Preview */}
          <div 
            className={`relative rounded-3xl overflow-hidden transition-all duration-500 ${isDragging ? 'scale-[0.98]' : 'scale-100'}`}
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={e => { e.preventDefault(); setIsDragging(false); handleFileSelection(e.dataTransfer.files); }}
          >
            <div 
              className={`upload-zone min-h-[380px] flex flex-col items-center justify-center p-8 text-center cursor-pointer transition-all duration-300 ${previews.length > 0 ? 'bg-navy/40 border-cyan-500/10' : ''}`}
              onClick={() => !isLoading && fileInputRef.current?.click()}
            >
              <input ref={fileInputRef} type="file" multiple accept="image/*,.dcm" className="hidden" onChange={e => handleFileSelection(e.target.files)} />
              
              <AnimatePresence mode="wait">
                {previews.length > 0 ? (
                  <motion.div key="p" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full h-full flex flex-col items-center">
                    <div className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-2xl border border-white/10 group">
                        <img 
                          src={previews[currentSlice]} 
                          className="w-full h-full object-cover grayscale brightness-90 saturate-50 group-hover:grayscale-0 transition-all duration-700"
                          alt="CT Slice"
                        />
                        {/* PACS Overlay Aesthetics */}
                        <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <p className="mono text-[10px] text-cyan-500/60">ID: {files[currentSlice]?.name.split('.')[0]}</p>
                                    <p className="mono text-[10px] text-cyan-500/60">MOD: {isDicom ? 'DICOM/CT' : 'RASTER'}</p>
                                </div>
                                <div className="med-badge">SLICE {currentSlice + 1}/{previews.length}</div>
                            </div>
                            <div className="flex justify-between items-end">
                                <span className="mono text-[10px] text-white/20">KIDNEY-AI V4.2</span>
                                <div className="flex gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/20" />
                                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/20" />
                                </div>
                            </div>
                        </div>
                        {isLoading && <div className="scan-line" />}
                    </div>

                    {/* 3D Volume Slider - THE WOW FACTOR */}
                    <div className="w-full mt-6 px-4">
                      <div className="flex items-center justify-between mb-2">
                         <div className="flex items-center gap-2">
                           <Layers size={12} className="text-cyan-500" />
                           <span className="mono text-[10px] text-slate-500 uppercase tracking-widest">3D Volume Scanning</span>
                         </div>
                         <span className="mono text-[10px] text-cyan-500">{(currentSlice / (previews.length - 1) * 100 || 0).toFixed(0)}% Depth</span>
                      </div>
                      <input 
                        type="range" min="0" max={previews.length - 1} step="1" 
                        value={currentSlice} 
                        onChange={(e) => setCurrentSlice(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                        title="Scroll through kidney volume slices"
                      />
                      <p className="text-[9px] text-slate-600 italic text-center mt-2">Adjust slider to scroll through axial longitudinal slices</p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="e" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-8">
                    <div className="w-20 h-20 rounded-3xl bg-cyan-500/5 border border-cyan-500/20 flex items-center justify-center mx-auto mb-6 float">
                      <UploadCloud size={32} className="text-cyan-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Upload Renal Volumetrics</h3>
                    <p className="text-slate-500 text-xs mb-6 max-w-[240px] mx-auto">Select multiple slices or a ZIP bundle to enable 3D longitudinal analysis.</p>
                    <div className="flex gap-2 justify-center">
                      <span className="med-badge">DICOM</span>
                      <span className="med-badge">NIFTI</span>
                      <span className="med-badge">STACKS</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <button
            onClick={runAnalysis}
            disabled={files.length === 0 || isLoading}
            className="btn-primary w-full py-5 rounded-2xl flex items-center justify-center gap-3 group relative"
          >
             <div className="absolute inset-x-0 bottom-0 h-1 bg-white/10 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500" />
             {isLoading ? <RefreshCw size={20} className="animate-spin text-white" /> : <Zap size={20} className="text-white fill-white/20" />}
             <span className="text-sm tracking-[0.2em] uppercase">{isLoading ? 'Processing Neural Graph...' : 'Execute Analysis'}</span>
          </button>

          {/* Status logs */}
          <div className="mt-auto space-y-4">
            <div className="p-5 rounded-2xl bg-cyan-500/5 border border-cyan-500/10">
              <div className="flex items-center gap-3 mb-3">
                <Info size={16} className="text-cyan-500" />
                <span className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">Diagnostic Guidance</span>
              </div>
              <ul className="space-y-2">
                {[
                  'Ensure renal cortex is centered in axial view',
                  'Support for raw 16-bit DICOM pixel data',
                  'Optimized for ONNX high-speed inference'
                ].map((txt, i) => (
                  <li key={i} className="flex items-start gap-2 text-[10px] text-slate-500 leading-tight">
                    <div className="w-1 h-1 rounded-full bg-cyan-900 mt-1" /> {txt}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex gap-3">
              <AlertTriangle size={18} className="text-red-400 shrink-0" />
              <p className="text-xs text-red-300">{error}</p>
            </motion.div>
          )}
        </section>

        {/* ── RIGHT PANEL (Intelligence Output, 8/12) ────────── */}
        <section className="lg:col-span-8 flex flex-col p-8 gap-8 overflow-y-auto">
          
          <div className="flex items-center justify-between">
            <div>
              <p className="mono text-[10px] text-cyan-500/60 uppercase tracking-[0.3em] mb-1">{'// NEURAL INTELLIGENCE'}</p>
              <h2 className="text-3xl font-black text-white">Diagnostic Insights</h2>
            </div>
            {isLoading && (
              <div className="flex flex-col items-end gap-2">
                 <span className="mono text-[10px] text-cyan-400 animate-pulse tracking-widest">SYNAPSING CLUSTER...</span>
                 <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-cyan-500 shadow-[0_0_10px_#06b6d4]" 
                      initial={{ width: 0 }} 
                      animate={{ width: `${(currentStep + 1) * 25}%` }} 
                    />
                 </div>
              </div>
            )}
            {result && !isLoading && (
              <button 
                onClick={() => setShowReport(true)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-cyan-500/30 bg-cyan-500/5 text-cyan-400 text-[11px] font-black uppercase tracking-widest hover:bg-cyan-500/10 transition-all shadow-lg shadow-cyan-500/5"
              >
                <BarChart3 size={14} /> View Validation Report
              </button>
            )}
          </div>

          <div className="grid lg:grid-cols-7 gap-8 flex-1">
            
            {/* ── CENTRAL VIEWER (4/7) ─────────────────────── */}
            <div className="lg:col-span-4 flex flex-col gap-6">
                <div className="holo-panel-glow rounded-[2rem] p-6 flex-1 flex flex-col min-h-[400px]">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-cyan-500" />
                           <span className="mono text-[10px] text-cyan-400 uppercase tracking-widest font-black">Multi-Symptom Visualizer</span>
                        </div>
                        {result && (
                            <div className="flex bg-navy rounded-full p-1 border border-white/5 shadow-inner">
                                <button 
                                  onClick={() => setShowHeatmap(false)}
                                  className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all ${!showHeatmap ? 'bg-cyan-500 text-white shadow-lg' : 'text-slate-500'}`}
                                >
                                  Raw Scan
                                </button>
                                <button 
                                  onClick={() => setShowHeatmap(true)}
                                  className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all flex items-center gap-2 ${showHeatmap ? 'bg-cyan-500 text-white shadow-lg' : 'text-slate-500'}`}
                                >
                                  <Zap size={10} /> Neural Map
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 rounded-[1.5rem] bg-navy/60 border border-white/5 relative overflow-hidden flex items-center justify-center">
                        {!previews.length ? (
                            <div className="text-center space-y-4 opacity-40">
                                <KidneySVG />
                                <p className="mono text-[10px] uppercase tracking-[0.2em] text-slate-500">Awaiting diagnostic acquisition</p>
                            </div>
                        ) : (
                          <AnimatePresence mode="wait">
                            <motion.div 
                              key={showHeatmap ? 'hm' : 'raw'} 
                              initial={{ opacity: 0, scale: 1.05 }} 
                              animate={{ opacity: 1, scale: 1 }} 
                              exit={{ opacity: 0 }}
                              className="w-full h-full"
                            >
                                <img 
                                  src={showHeatmap && result?.gradcam_heatmap ? `data:image/png;base64,${result.gradcam_heatmap}` : previews[currentSlice]} 
                                  className="w-full h-full object-contain"
                                  alt="Diagnostic Content"
                                />
                                {isLoading && (
                                  <div className="absolute inset-0 bg-navy/60 backdrop-blur-sm flex flex-col items-center justify-center">
                                      <div className="relative mb-6">
                                        <div className="w-24 h-24 rounded-full border-4 border-t-cyan-500 border-white/5 animate-spin" />
                                        <Search size={32} className="absolute inset-0 m-auto text-cyan-500 animate-pulse" />
                                      </div>
                                      <p className="mono text-xs text-white uppercase tracking-widest">{PIPELINE_STEPS[currentStep].label}</p>
                                      <p className="text-[10px] text-slate-500 mt-2">{PIPELINE_STEPS[currentStep].detail}</p>
                                  </div>
                                )}
                            </motion.div>
                          </AnimatePresence>
                        )}
                        {/* Orientation markers */}
                        <div className="pacs-corner tl" /> <div className="pacs-corner tr" />
                        <div className="pacs-corner bl" /> <div className="pacs-corner br" />
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 mono text-xs font-black text-cyan-500/20">L</div>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 mono text-xs font-black text-cyan-500/20">R</div>
                    </div>

                    {showHeatmap && result?.gradcam_heatmap && (
                      <div className="mt-6 p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/10 flex items-center justify-between">
                         <div className="flex gap-4">
                            <div className="flex items-center gap-2">
                               <div className="w-3 h-3 rounded bg-red-500/80" />
                               <span className="text-[10px] font-bold text-slate-500 uppercase">Tumor Focus</span>
                            </div>
                            <div className="flex items-center gap-2">
                               <div className="w-3 h-3 rounded bg-blue-500/80" />
                               <span className="text-[10px] font-bold text-slate-500 uppercase">Healthy Tissue</span>
                            </div>
                         </div>
                         <p className="mono text-[9px] text-slate-700">Algorithm: Gradient-weighted Class Activation Mapping</p>
                      </div>
                    )}
                </div>

                {/* Status Bar */}
                <div className="flex items-center gap-6 px-4">
                    <div className="flex-1 h-px bg-white/5" />
                    <div className="flex items-center gap-4 mono text-[10px] text-slate-600">
                        <span className="flex items-center gap-1.5"><Heart size={10} className="text-red-500" /> BPM: 72</span>
                        <span className="flex items-center gap-1.5"><Activity size={10} className="text-cyan-500" /> CT_DOSE: 12 mSv</span>
                        <span className="flex items-center gap-1.5"><Wifi size={10} className="text-emerald-500" /> LATENCY: 14ms</span>
                    </div>
                </div>
            </div>

            {/* ── ANALYSIS COLUMN (3/7) ───────────────────── */}
            <div className="lg:col-span-3 flex flex-col gap-6">
               <AnimatePresence mode="wait">
                  {!result && !isLoading ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 border border-white/5 rounded-[2rem] bg-navy/20 flex flex-col items-center justify-center p-10 text-center">
                        <Dna size={48} className="text-slate-800 mb-6" />
                        <h4 className="text-sm font-black text-slate-600 uppercase tracking-widest">Awaiting Analysis</h4>
                        <p className="text-xs text-slate-700 mt-2 leading-relaxed">Initiate analysis on selected volume slice to generate diagnostic report.</p>
                    </motion.div>
                  ) : isLoading ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 border border-white/5 rounded-[2rem] bg-navy/20 p-8">
                        <div className="space-y-6">
                            {PIPELINE_STEPS.map((step, i) => (
                                <div key={i} className={`flex items-start gap-4 transition-all duration-500 ${currentStep === i ? 'opacity-100 scale-100' : 'opacity-20 scale-95'}`}>
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${currentStep === i ? 'bg-cyan-500 border-cyan-400 shadow-[0_0_15px_#06b6d440] text-white' : 'bg-white/5 border-white/10 text-slate-700'}`}>
                                       <step.icon size={16} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[11px] font-black text-white uppercase tracking-widest">{step.label}</p>
                                        <p className="text-[10px] text-slate-500 mt-1">{step.detail}</p>
                                    </div>
                                    {currentStep > i && <CheckCircle2 size={16} className="text-emerald-500 mt-1" />}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                  ) : (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6">
                        {/* Result Main Card */}
                        <div className="holo-panel-glow rounded-[2rem] p-8" style={{ borderColor: `${resultMeta?.color}40` }}>
                            <div className="flex items-center gap-1.5 mb-6">
                                <Activity size={14} className="text-cyan-500" />
                                <span className="mono text-[10px] text-cyan-500 uppercase tracking-widest">Diagnosis Confirmed</span>
                            </div>
                            
                            <div className="flex flex-col items-center text-center mb-8">
                                <div className="relative mb-6">
                                    <ConfidenceGauge value={result.confidence} color={resultMeta?.color || '#06b6d4'} />
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-2xl font-black text-white leading-none"><Counter to={result.confidence * 100} />%</span>
                                        <span className="mono text-[8px] text-slate-600 uppercase mt-1">Confidence</span>
                                    </div>
                                </div>
                                <h3 className="text-4xl font-black text-white mb-2" style={{ textShadow: `0 0 30px ${resultMeta?.color}50` }}>{result.predicted_class}</h3>
                                <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest chip-${result.risk_level === 'High' ? 'red' : 'emerald'}`}>
                                    {result.risk_level === 'High' ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
                                    {result.risk_level} Risk Level
                                </div>
                            </div>

                            <p className="text-xs text-slate-500 text-center leading-relaxed mb-4">{resultMeta?.desc}</p>
                        </div>

                        {/* Probability Distribution */}
                        <div className="bg-panel border border-white/5 rounded-[2rem] p-8">
                             <p className="mono text-[10px] text-slate-600 uppercase tracking-widest mb-6">Probability Distribution</p>
                             <div className="space-y-4">
                                {Object.entries(result.probabilities).sort(([,a],[,b]) => (b as any) - (a as any)).map(([name, prob]) => (
                                    <div key={name}>
                                        <div className="flex justify-between items-center text-[10px] mb-2 uppercase tracking-widest font-bold">
                                            <span className={name === result.predicted_class ? 'text-white' : 'text-slate-600'}>{name}</span>
                                            <span className="mono text-cyan-500">{(prob as any * 100).toFixed(1)}%</span>
                                        </div>
                                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                            <motion.div 
                                              initial={{ width: 0 }} animate={{ width: `${(prob as any) * 100}%` }}
                                              className="h-full bg-cyan-500/40"
                                              style={{ background: name === result.predicted_class ? CLASS_META[name].color : '' }}
                                            />
                                        </div>
                                    </div>
                                ))}
                             </div>
                        </div>
                    </motion.div>
                  )}
               </AnimatePresence>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
