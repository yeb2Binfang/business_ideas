import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hoverable?: boolean;
  noPadding?: boolean;
}

export const GlassCard = ({ 
  children, 
  className = '', 
  hoverable = true,
  noPadding = false
}: GlassCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hoverable ? { 
        y: -4, 
        boxShadow: '0 20px 25px -5px rgba(14, 165, 233, 0.1), 0 10px 10px -5px rgba(14, 165, 233, 0.04)' 
      } : {}}
      transition={{ duration: 0.3 }}
      className={`
        relative 
        backdrop-blur-xl 
        bg-white/5 
        border border-white/10 
        rounded-2xl 
        overflow-hidden
        ${hoverable ? 'hover:border-cyan-400/30' : ''}
        ${!noPadding ? 'p-6 sm:p-8' : ''}
        ${className}
      `}
    >
      {/* 渐变光效 */}
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      
      {/* 内容 */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
};
