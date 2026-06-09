import { Sparkles } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="relative z-10 py-8 border-t border-white/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <span className="text-slate-400 font-medium">AI商业内容解析平台</span>
          </div>
          <div className="text-slate-500 text-sm">
            © {new Date().getFullYear()} All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};
