import { useRef } from 'react';
import { Hero } from '../components/Hero';
import { UploadSection } from '../components/UploadSection';
import { ProcessingStatus } from '../components/ProcessingStatus';
import { ResultsSection } from '../components/ResultsSection';
import { Footer } from '../components/Footer';
import { useAppStore } from '../store/useAppStore';
import { useParticleBackground } from '../hooks/useParticleBackground';
import { useDifyApi } from '../hooks/useDifyApi';

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isProcessing, result, reset } = useAppStore();
  const { processContent } = useDifyApi();

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

  return (
    <div ref={containerRef} className="min-h-screen">
      <Hero />
      
      {!isProcessing && !result && (
        <UploadSection onSubmit={handleSubmit} />
      )}

      {isProcessing && (
        <ProcessingStatus />
      )}

      {result && (
        <ResultsSection onReset={handleReset} />
      )}

      <Footer />
    </div>
  );
}