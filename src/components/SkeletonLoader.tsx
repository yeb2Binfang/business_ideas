import { motion } from 'framer-motion';

interface SkeletonLoaderProps {
  className?: string;
  count?: number;
}

export const SkeletonLoader = ({ className = '', count = 1 }: SkeletonLoaderProps) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0.3 }}
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.1,
            ease: 'easeInOut'
          }}
          className="h-4 bg-white/5 rounded-md overflow-hidden"
        >
          <div className="h-full w-1/2 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent animate-shimmer" />
        </motion.div>
      ))}
    </div>
  );
};

export const TextSkeleton = ({ lines = 3 }: { lines?: number }) => (
  <div className="space-y-2">
    {Array.from({ length: lines }).map((_, i) => (
      <SkeletonLoader 
        key={i} 
        className="w-full"
      />
    ))}
  </div>
);

export const CardSkeleton = () => (
  <div className="p-6 space-y-4">
    <div className="h-6 w-1/3" />
    <div className="space-y-2">
      <div className="h-4 w-full" />
      <div className="h-4 w-5/6" />
      <div className="h-4 w-4/6" />
    </div>
  </div>
);
