import { motion, AnimatePresence } from 'framer-motion';
import { FileText, BookOpen, Sparkles, FileQuestion, Newspaper, Copy, Check, RefreshCw, Download } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { GlassCard } from './GlassCard';
import { useState } from 'react';

const tabs = [
  { id: 0, key: 'simple', label: '简单版总结', icon: FileText, color: 'cyan' },
  { id: 1, key: 'complicate', label: '详细版总结', icon: BookOpen, color: 'blue' },
  { id: 2, key: 'story', label: '趣味故事', icon: Sparkles, color: 'purple' },
  { id: 3, key: 'news', label: '新闻联播', icon: Newspaper, color: 'orange' },
  { id: 4, key: 'test', label: '商业点子', icon: FileQuestion, color: 'pink' },
];

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-2 rounded-lg hover:bg-white/10 transition-colors"
    >
      {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
    </button>
  );
};

// Markdown 渲染器 - 处理标题、加粗等
const renderMarkdown = (text: string) => {
  if (!text) return '';

  let html = text;

  // 转义 HTML 特殊字符
  html = html.replace(/&/g, '&amp;')
             .replace(/</g, '&lt;')
             .replace(/>/g, '&gt;');

  // 处理加粗 **text** 和 __text__
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');

  // 处理标题 - 先处理长前缀，避免被短前缀覆盖
  // 6级标题 ######
  html = html.replace(/^###### (.+)$/gm, '<h6 class="text-sm font-semibold text-slate-300 mt-3 mb-1">$1</h6>');
  // 5级标题 #####
  html = html.replace(/^##### (.+)$/gm, '<h5 class="text-base font-semibold text-slate-300 mt-3 mb-1">$1</h5>');
  // 4级标题 ####
  html = html.replace(/^#### (.+)$/gm, '<h4 class="text-base font-bold text-slate-200 mt-4 mb-2">$1</h4>');
  // 3级标题 ###
  html = html.replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold text-slate-200 mt-4 mb-2">$1</h3>');
  // 2级标题 ##
  html = html.replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-slate-100 mt-4 mb-2">$1</h2>');
  // 1级标题 #
  html = html.replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-slate-100 mt-5 mb-2">$1</h1>');

  // 处理无序列表 - 行首以 - / * / + 开始的
  html = html.replace(/^[-*+] (.+)$/gm, '<li class="ml-4 text-slate-300">$1</li>');

  // 处理有序列表 - 行首数字. 格式
  html = html.replace(/^\d+\. (.+)$/gm, '<li class="ml-4 text-slate-300 list-decimal">$1</li>');

  // 换行处理 - 保留空行
  html = html.replace(/\n/g, '<br>');

  return html;
};

// 下载Excel（CSV）
const downloadExcel = (result: any) => {
  const now = new Date();
  const dateStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
  const timeStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
  const dateTimeStr = dateStr + ' ' + timeStr;

  const headers = ['日期', '简单版总结', '详细版总结', '趣味故事', '新闻联播', '商业点子'];
  const values = [
    dateTimeStr,
    result.simple || '',
    result.complicate || '',
    result.story || '',
    result.news || '',
    result.test || ''
  ];

  const escapeCsv = (value: string) => {
    if (!value) return '';
    let escaped = value.replace(/"/g, '""');
    if (escaped.includes(',') || escaped.includes('\n') || escaped.includes('"')) {
      escaped = `"${escaped}"`;
    }
    return escaped;
  };

  const csvContent = [
    headers.map(h => escapeCsv(h)).join(','),
    values.map(v => escapeCsv(v)).join(',')
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `解析结果_${new Date().toLocaleDateString()}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const ResultsSection = ({ onReset }: { onReset: () => void }) => {
  const { result, activeTab, setActiveTab } = useAppStore();

  if (!result) return null;

  // 检查是否所有内容都已经填充（不能是空字符串）
  const isAllDataReady = 
    result.simple && result.simple.trim() !== '' &&
    result.complicate && result.complicate.trim() !== '' &&
    result.story && result.story.trim() !== '' &&
    result.news && result.news.trim() !== '' &&
    result.test && result.test.trim() !== '';
  
  const canDownload = isAllDataReady;

  const activeTabData = tabs[activeTab];
  const Icon = activeTabData.icon;
  const content = result[activeTabData.key as keyof typeof result] || '暂无内容...';

  const renderTabContent = () => {
    const bgColors = [
      'from-cyan-500/10 to-blue-500/10',
      'from-blue-500/10 to-purple-500/10',
      'from-purple-500/10 to-pink-500/10',
      'from-pink-500/10 to-orange-500/10',
      'from-orange-500/10 to-yellow-500/10',
    ];
    const bgColor = bgColors[activeTab % bgColors.length];
    
    const borderColors = [
      'border-cyan-400/20',
      'border-blue-400/20',
      'border-purple-400/20',
      'border-pink-400/20',
      'border-orange-400/20',
    ];
    const borderColor = borderColors[activeTab % borderColors.length];

    return (
      <div className="prose prose-invert max-w-none">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-slate-100">{activeTabData.label}</h3>
          <CopyButton text={content} />
        </div>
        <div className={`p-6 rounded-xl bg-gradient-to-br ${bgColor} border ${borderColor}`}>
          <div 
            className="text-slate-300 leading-relaxed whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
          />
        </div>
      </div>
    );
  };

  return (
    <section className="relative z-10 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <GlassCard className="p-6 sm:p-8">
          {/* 头部 */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                <Check className="w-6 h-6 text-green-400" />
                解析完成！
              </h2>
              <p className="text-slate-400 mt-1">以下是AI为您生成的内容</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => downloadExcel(result)}
                disabled={!canDownload}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                  canDownload
                    ? 'bg-green-500/10 border border-green-400/20 hover:bg-green-500/20 text-green-300 cursor-pointer'
                    : 'bg-slate-600/20 border border-slate-500/20 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Download className="w-4 h-4" />
                下载Excel
              </button>
              <button
                onClick={onReset}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-slate-300"
              >
                <RefreshCw className="w-4 h-4" />
                重新解析
              </button>
            </div>
          </div>

          {/* 标签页导航 - 均分空间 */}
          <div className="grid grid-cols-5 gap-2 mb-8 p-1 rounded-xl bg-white/5">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex flex-col items-center gap-1 px-2 py-3 rounded-lg text-xs font-medium transition-all
                    ${isActive
                      ? `bg-gradient-to-r from-${tab.color}-400/20 to-${tab.color}-400/10 text-${tab.color}-400 border border-${tab.color}-400/30`
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/10'
                    }
                  `}
                >
                  <TabIcon className="w-5 h-5" />
                  <span className="text-center leading-tight">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* 标签页内容 */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </GlassCard>
      </div>
    </section>
  );
};
