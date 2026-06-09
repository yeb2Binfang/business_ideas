import { motion } from 'framer-motion';
import { Brain, FileText, Sparkles, Zap, CheckCircle2, Circle } from 'lucide-react';
import { useAppStore, ProcessingStep } from '../store/useAppStore';
import { GlassCard } from './GlassCard';

const steps: { step: ProcessingStep; label: string; icon: any; color: string }[] = [
  { step: 'parsing', label: '内容解析', icon: FileText, color: 'text-cyan-400' },
  { step: 'summarizing', label: '分点总结', icon: Brain, color: 'text-blue-400' },
  { step: 'storytelling', label: '趣味解读', icon: Sparkles, color: 'text-purple-400' },
  { step: 'ideating', label: '商业创意', icon: Zap, color: 'text-pink-400' },
];

export const ProcessingStatus = () => {
  const { processingStep, progress } = useAppStore();

  const getCurrentStepIndex = () => {
    return steps.findIndex(s => s.step === processingStep);
  };

  const currentIndex = getCurrentStepIndex();

  return (
    <section className="relative z-10 pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <GlassCard className="p-6 sm:p-8">
          <div className="text-center mb-8">
            <motion.div
              animate={{ 
                rotate: 360,
                scale: [1, 1.1, 1]
              }}
              transition={{
                rotate: { duration: 2, repeat: Infinity, ease: 'linear' },
                scale: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
              }}
              className="inline-flex"
            >
              <Brain className="w-16 h-16 text-cyan-400" />
            </motion.div>
            <h2 className="text-2xl font-bold text-slate-100 mt-4">
              AI正在处理中...
            </h2>
            <p className="text-slate-400 mt-2">
              请稍候，这可能需要几秒钟
            </p>
          </div>

          {/* 进度条 */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-slate-400 mb-2">
              <span>处理进度</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* 水平步骤列表 */}
          <div className="relative">
            {/* 连接线 */}
            <div className="absolute top-6 left-8 right-8 h-0.5 bg-white/10">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-400 to-purple-400"
                initial={{ width: 0 }}
                animate={{ width: `${((currentIndex + 1) / steps.length) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>

            <div className="flex justify-between relative z-10">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = step.step === processingStep;
                const isCompleted = index < currentIndex;
                
                return (
                  <motion.div
                    key={step.step}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ 
                      opacity: index <= currentIndex ? 1 : 0.4,
                      y: 0
                    }}
                    transition={{ delay: index * 0.1 }}
                    className="flex flex-col items-center"
                  >
                    <div className={`
                      w-12 h-12 rounded-full flex items-center justify-center z-10
                      ${isActive || isCompleted
                        ? `${step.color} bg-current/20 border-2 border-current`
                        : 'text-slate-500 bg-white/5 border-2 border-white/10'
                      }
                    `}>
                      {isCompleted ? (
                        <CheckCircle2 className="w-6 h-6" />
                      ) : isActive ? (
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <Icon className="w-6 h-6" />
                        </motion.div>
                      ) : (
                        <Circle className="w-6 h-6" />
                      )}
                    </div>
                    
                    <p className={`
                      mt-3 text-sm font-medium text-center
                      ${isActive ? 'text-slate-100' : 
                        isCompleted ? 'text-slate-300' : 'text-slate-500'
                      }
                    `}>
                      {step.label}
                    </p>

                    {isActive && (
                      <div className="flex gap-1 mt-2">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            className="w-2 h-2 rounded-full bg-cyan-400"
                            animate={{
                              opacity: [0.3, 1, 0.3],
                              y: [0, -4, 0]
                            }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              delay: i * 0.2
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </GlassCard>
      </div>
    </section>
  );
};
