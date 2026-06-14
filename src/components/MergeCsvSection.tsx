import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileSpreadsheet, X, Upload, Download, Loader2, ArrowLeft, ChevronDown, ChevronRight, ChevronUp } from 'lucide-react';
import { GlassCard } from './GlassCard';

interface UploadedFile {
  name: string;
  size: number;
  base64: string;
}

interface ParsedRow {
  [key: string]: string;
}

interface MergeResult {
  success: boolean;
  file_count: number;
  total_rows: number;
  columns: string[];
  rows: ParsedRow[];
  files: string[];
  mergedFileBase64: string;
  mergedFileName: string;
}

// 折叠行组件
const CollapsibleRow = ({ row, columns, index }: { row: ParsedRow; columns: string[]; index: number }) => {
  const [isOpen, setIsOpen] = useState(false);

  // 获取第一列的值作为折叠页标题
  const firstColumnValue = columns[0] ? (row[columns[0]] || '') : '';

  return (
    <div className="border-b border-white/10 last:border-b-0">
      {/* 标题行 - 显示第一列的内容 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors text-left"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-cyan-400 font-medium text-sm w-8">#{index + 1}</span>
          <span className="text-slate-300 truncate flex-1 text-sm">
            {firstColumnValue || `第 ${index + 1} 行`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500 text-xs hidden sm:block">
            {columns.length} 项
          </span>
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-cyan-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </button>

      {/* 展开的内容 - 显示所有 表头字段名:对应内容 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pl-12">
              <div className="grid grid-cols-1 gap-2">
                {columns.map((col) => (
                  <div key={col} className="flex flex-col sm:flex-row sm:items-start gap-1 p-2 rounded-lg bg-white/5">
                    <span className="text-cyan-400 text-xs font-medium min-w-[80px] shrink-0">
                      {col}
                    </span>
                    <span className="text-slate-200 text-sm break-words whitespace-pre-wrap">
                      {row[col] || '(空)'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const MergeCsvSection = ({ onBack }: { onBack: () => void }) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [result, setResult] = useState<MergeResult | null>(null);
  const [error, setError] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const csvFiles = selectedFiles.filter(f => f.name.toLowerCase().endsWith('.csv'));
    
    if (csvFiles.length === 0) {
      setError('请选择 CSV 格式的文件');
      return;
    }

    csvFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = btoa(new Uint8Array(ev.target!.result as ArrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), ''));
        setFiles(prev => [...prev, {
          name: file.name,
          size: file.size,
          base64
        }]);
      };
      reader.readAsArrayBuffer(file);
    });

    setError('');
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleMerge = async () => {
    if (files.length === 0) {
      setError('请先上传至少一个 CSV 文件');
      return;
    }

    setIsMerging(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/merge-csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          files: files.map(f => ({
            filename: f.name,
            buffer: f.base64
          }))
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '合并失败');
      }

      if (!data.success) {
        throw new Error(data.error || '合并失败');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || '合并失败，请重试');
    } finally {
      setIsMerging(false);
    }
  };

  const handleDownload = () => {
    if (!result?.mergedFileBase64) return;
    
    const binaryString = atob(result.mergedFileBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'text/csv;charset=utf-8' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = result.mergedFileName || '合并结果.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <section className="relative z-10 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <GlassCard className="p-6 sm:p-8">
          {/* 头部 */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-slate-300"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                  <FileSpreadsheet className="w-7 h-7 text-cyan-400" />
                  批量合并 CSV 表格
                </h2>
                <p className="text-slate-400 mt-1">上传多个 CSV 文件，自动合并为一个表格</p>
              </div>
            </div>
          </div>

          {/* 上传区域 */}
          {!result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <label className="block cursor-pointer">
                <div className="border-2 border-dashed border-slate-600 hover:border-cyan-400 rounded-2xl p-12 text-center bg-white/5 hover:bg-white/10 transition-all">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                  <p className="text-lg text-slate-300 font-medium mb-2">
                    点击选择 CSV 文件
                  </p>
                  <p className="text-sm text-slate-500">支持批量上传多个 .csv 文件</p>
                  <input
                    type="file"
                    multiple
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              </label>
            </motion.div>
          )}

          {/* 已上传的文件列表 */}
          {files.length > 0 && !result && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-8"
            >
              <h3 className="text-lg font-semibold text-slate-200 mb-4">
                已上传 {files.length} 个文件
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 group hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
                      <div>
                        <p className="text-slate-200 font-medium">{file.name}</p>
                        <p className="text-sm text-slate-500">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="p-2 rounded-lg bg-slate-600/30 hover:bg-red-500/20 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* 合并按钮 */}
          {files.length > 0 && !result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <button
                onClick={handleMerge}
                disabled={isMerging}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed mx-auto"
              >
                {isMerging ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    正在合并...
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-5 h-5" />
                    开始合并表格
                  </>
                )}
              </button>
            </motion.div>
          )}

          {/* 错误提示 */}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-400/20 text-red-300 text-center"
            >
              {error}
            </motion.div>
          )}

          {/* 合并结果 */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8"
            >
              <div className="p-6 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-400/20 text-center mb-6">
                <div className="text-5xl mb-4">🎉</div>
                <h3 className="text-2xl font-bold text-slate-100 mb-2">合并成功！</h3>
                <p className="text-slate-400 mb-4">
                  共合并 {result.file_count} 个文件，总计 {result.total_rows} 行数据
                </p>
                <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-300">
                  <div className="px-3 py-1 rounded-lg bg-white/5 border border-white/10">
                    {result.columns.length} 列字段
                  </div>
                  <div className="px-3 py-1 rounded-lg bg-white/5 border border-white/10">
                    {result.rows.length} 行数据
                  </div>
                </div>
              </div>

              {/* 表格预览区域 - 折叠页显示 */}
              {result.rows.length > 0 && (
                <div className="mb-8">
                  <h4 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
                    表格预览（共 {result.rows.length} 行）
                  </h4>
                  <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
                    <div className="max-h-[600px] overflow-y-auto">
                      {result.rows.map((row, index) => (
                        <CollapsibleRow
                          key={index}
                          row={row}
                          columns={result.columns}
                          index={index}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 下载按钮 */}
              <div className="text-center mb-8">
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-semibold text-lg transition-all"
                >
                  <Download className="w-5 h-5" />
                  下载合并后的表格
                </button>
              </div>

              {/* 已处理的文件列表 */}
              <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                <h4 className="text-lg font-semibold text-slate-200 mb-4">已处理的文件</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {result.files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-3 rounded-lg bg-white/5 text-slate-300"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
                      <span className="text-sm">{file}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 重新上传按钮 */}
              <div className="text-center mt-8">
                <button
                  onClick={() => {
                    setFiles([]);
                    setResult(null);
                    setError('');
                  }}
                  className="px-6 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 font-medium transition-all"
                >
                  重新上传并合并
                </button>
              </div>
            </motion.div>
          )}
        </GlassCard>
      </div>
    </section>
  );
};
