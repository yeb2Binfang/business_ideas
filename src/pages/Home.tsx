import { useRef, useState } from 'react';
import { Hero } from '../components/Hero';
import { UploadSection } from '../components/UploadSection';
import { ProcessingStatus } from '../components/ProcessingStatus';
import { ResultsSection } from '../components/ResultsSection';
import { MergeCsvSection } from '../components/MergeCsvSection';
import { Footer } from '../components/Footer';
import { useAppStore } from '../store/useAppStore';
import { useParticleBackground } from '../hooks/useParticleBackground';
import { useDifyApi } from '../hooks/useDifyApi';

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isProcessing, result, reset } = useAppStore();
  const { processContent } = useDifyApi();
  const [activePage, setActivePage] = useState<'parse' | 'merge'>('parse');

  // 初始化粒子背景
  useParticleBackground(containerRef);

  const handleSubmit = () => {
    console.log('🖱️ 用户点击提交按钮');
    processContent();
  };

  const handleReset = () => {
    console.log('🔄 用户点击重置按钮');
    reset();
  };

  const handleSwitchToParse = () => {
    console.log('🔄 切换到商业点子解析');
    setActivePage('parse');
    // 切换时清理之前的解析状态
    if (result) {
      reset();
    }
  };

  const handleSwitchToMerge = () => {
    console.log('🔄 切换到合并表格');
    setActivePage('merge');
  };

  return (
    <div ref={containerRef} className="min-h-screen relative">
      <Hero />

      {/* 页面切换按钮 - 在 Hero 下方并排显示（仅在初始状态显示） */}
      {!isProcessing && !result && activePage === 'parse' && (
        <div className="relative z-10 -mt-4 mb-8">
          <div className="max-w-2xl mx-auto px-4">
            <div className="flex gap-4">
              <button
                onClick={handleSwitchToParse}
                className="flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 hover:from-cyan-500/30 hover:to-blue-500/30 text-slate-200 font-semibold text-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                商业点子解析
              </button>
              <button
                onClick={handleSwitchToMerge}
                className="flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 hover:from-purple-500/30 hover:to-pink-500/30 text-slate-200 font-semibold text-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
                合并表格
              </button>
            </div>
          </div>
        </div>
      )}

      {activePage === 'merge' && (
        <MergeCsvSection onBack={handleSwitchToParse} />
      )}

      {activePage === 'parse' && (
        <>
          {!isProcessing && !result && (
            <UploadSection onSubmit={handleSubmit} />
          )}

          {isProcessing && (
            <ProcessingStatus />
          )}

          {result && (
            <ResultsSection onReset={handleReset} />
          )}
        </>
      )}

      <Footer />
    </div>
  );
}
