import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Link2, Settings, X, FileText, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { GlassCard } from './GlassCard';
import { useState, useRef, useCallback } from 'react';

interface UploadSectionProps {
  onSubmit: () => void;
}

export const UploadSection = ({ onSubmit }: UploadSectionProps) => {
  const { file, url, settings, setFile, setUrl, setSettings } = useAppStore();
  const [showSettings, setShowSettings] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      if (validTypes.includes(droppedFile.type)) {
        setFile(droppedFile);
      }
    }
  }, [setFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const canSubmit = (file !== null) || (url.trim() !== '');

  return (
    <section className="relative z-10 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <GlassCard className="p-6 sm:p-8">
          <div className="space-y-8">
            {/* 文件上传区域 */}
            <div>
              <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                上传文档
              </h3>
              
              <AnimatePresence mode="wait">
                {!file ? (
                  <motion.div
                    key="upload"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`
                      cursor-pointer
                      border-2 border-dashed rounded-xl p-8 text-center
                      transition-all duration-300
                      ${isDragging 
                        ? 'border-cyan-400 bg-cyan-400/10' 
                        : 'border-white/10 hover:border-cyan-400/50 hover:bg-white/5'
                      }
                    `}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-cyan-400/10 flex items-center justify-center">
                        <Upload className="w-7 h-7 text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-slate-300 font-medium">
                          拖放文件或点击上传
                        </p>
                        <p className="text-sm text-slate-500 mt-1">
                          支持 PDF, DOC, DOCX, TXT 格式
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="file-info"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-cyan-400/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-slate-200 font-medium">{file.name}</p>
                        <p className="text-sm text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <button
                      onClick={clearFile}
                      className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <X className="w-5 h-5 text-slate-400" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 分隔线 */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-slate-500 text-sm">或</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* 链接输入 */}
            <div>
              <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                <Link2 className="w-5 h-5 text-purple-400" />
                粘贴链接
              </h3>
              <div className="relative">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="输入视频链接、文章URL..."
                  className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-400/50 transition-colors"
                />
              </div>
            </div>

            {/* 高级设置 */}
            <div>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span className="text-sm font-medium">高级设置</span>
              </button>

              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4 space-y-4">
                      <div>
                        <label className="block text-sm text-slate-400 mb-2">分析深度</label>
                        <div className="flex gap-3">
                          {[
                            { value: 'basic', label: '基础' },
                            { value: 'detailed', label: '详细' }
                          ].map((option) => (
                            <button
                              key={option.value}
                              onClick={() => setSettings({ analysisDepth: option.value as any })}
                              className={`
                                px-4 py-2 rounded-lg text-sm font-medium transition-all
                                ${settings.analysisDepth === option.value
                                  ? 'bg-cyan-400/20 text-cyan-400 border border-cyan-400/30'
                                  : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
                                }
                              `}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm text-slate-400 mb-2">输出风格</label>
                        <div className="flex gap-3">
                          {[
                            { value: 'professional', label: '专业' },
                            { value: 'casual', label: '轻松' }
                          ].map((option) => (
                            <button
                              key={option.value}
                              onClick={() => setSettings({ outputStyle: option.value as any })}
                              className={`
                                px-4 py-2 rounded-lg text-sm font-medium transition-all
                                ${settings.outputStyle === option.value
                                  ? 'bg-purple-400/20 text-purple-400 border border-purple-400/30'
                                  : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
                                }
                              `}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 提交按钮 */}
            <button
              onClick={onSubmit}
              disabled={!canSubmit}
              className={`
                w-full py-4 px-6 rounded-xl font-semibold text-lg
                flex items-center justify-center gap-2
                transition-all duration-300
                ${canSubmit
                  ? 'bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 hover:from-cyan-400 hover:via-blue-400 hover:to-purple-400 text-white shadow-lg hover:shadow-cyan-500/25 hover:scale-[1.02] active:scale-[0.98]'
                  : 'bg-white/10 text-slate-500 cursor-not-allowed'
                }
              `}
            >
              <CheckCircle2 className="w-5 h-5" />
              开始解析
            </button>
          </div>
        </GlassCard>
      </div>
    </section>
  );
};
