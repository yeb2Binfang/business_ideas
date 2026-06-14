import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'

function difyPlugin() {
  console.log('🚀 加载 Dify 插件...')
  
  return {
    name: 'dify-proxy',
    apply: 'serve',
    configureServer(server) {
      console.log('🔧 配置开发服务器...')
      
      server.middlewares.use('/api/dify', async (req, res) => {
        console.log('📨 拦截到 /api/dify 请求')
        
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method Not Allowed');
          return;
        }

        try {
          let body = '';
          req.on('data', chunk => { body += chunk.toString(); });
          req.on('end', async () => {
            try {
              const inputData = JSON.parse(body || '{}');
              const isUrlMode = !!inputData.url;
              
              if (isUrlMode) {
                console.log('📥 收到URL请求:', inputData.url);
              } else {
                console.log('📥 收到文件请求:', inputData.filename);
              }
              
              const tmpDir = path.join(process.cwd(), 'tmp');
              if (!fs.existsSync(tmpDir)) {
                fs.mkdirSync(tmpDir, { recursive: true });
              }
              
              const pdfFilePath = path.join(tmpDir, `file_${Date.now()}.pdf`);
              const jsonFilePath = path.join(tmpDir, `request_${Date.now()}.json`);
              
              if (isUrlMode) {
                fs.writeFileSync(jsonFilePath, JSON.stringify({
                  url: inputData.url
                }), 'utf-8');
                console.log('📁 URL模式 JSON文件:', jsonFilePath);
              } else {
                const buffer = Buffer.from(inputData.buffer, 'base64');
                fs.writeFileSync(pdfFilePath, buffer);
                fs.writeFileSync(jsonFilePath, JSON.stringify({
                  filename: inputData.filename
                }), 'utf-8');
                console.log('📁 文件模式 PDF文件:', pdfFilePath);
                console.log('📁 文件模式 JSON文件:', jsonFilePath);
              }
              
              const pythonScript = path.join(process.cwd(), 'run_dify.py');
              console.log('🐍 调用Python:', pythonScript);
              
              const pythonProcess = spawn('python', [pythonScript, jsonFilePath, pdfFilePath], {
                cwd: process.cwd(),
                shell: false
              });
              
              let output = '';
              let errorOutput = '';
              
              pythonProcess.stdout.on('data', (data) => {
                output += data.toString();
                console.log('📤 Python stdout:', data.toString().substring(0, 200));
              });
              
              pythonProcess.stderr.on('data', (data) => {
                errorOutput += data.toString();
                console.log('📤 Python stderr:', data.toString());
              });
              
              pythonProcess.on('error', (err) => {
                console.error('❌ Python进程启动失败:', err);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: '进程启动失败: ' + err.message }));
              });
              
              const timeout = setTimeout(() => {
                console.log('⏰ Python执行超时，强制终止');
                pythonProcess.kill();
              }, 900000);
              
              pythonProcess.on('close', (code) => {
                clearTimeout(timeout);
                console.log('📊 Python退出码:', code);
                
                console.log('📁 临时文件已保存:');
                console.log('  -', jsonFilePath);
                console.log('  -', pdfFilePath);
                console.log('  (文件不会被自动删除，可在 tmp/ 目录查看)');
                
                if (code !== 0) {
                  console.error('❌ Python执行失败:', errorOutput);
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: errorOutput || '脚本执行失败' }));
                  return;
                }
                
                try {
                  const result = JSON.parse(output.trim());
                  console.log('✅ 执行成功:', Object.keys(result));
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(result));
                } catch (e) {
                  console.error('❌ JSON解析失败:', output);
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: '解析失败: ' + output }));
                }
              });
              
            } catch (error) {
              console.error('❌ 处理失败:', error);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: error.message }));
            }
          });
        } catch (error) {
          console.error('❌ 异常:', error);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: error.message }));
        }
      });
      
      // CSV 合并路由
      server.middlewares.use('/api/merge-csv', async (req, res) => {
        console.log('📨 拦截到 /api/merge-csv 请求');
        
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method Not Allowed');
          return;
        }

        try {
          let body = '';
          req.on('data', chunk => { body += chunk.toString(); });
          req.on('end', async () => {
            try {
              const inputData = JSON.parse(body || '{}');
              const files = inputData.files || [];
              
              console.log(`📥 收到 ${files.length} 个 CSV 文件`);
              
              const tmpDir = path.join(process.cwd(), 'tmp');
              if (!fs.existsSync(tmpDir)) {
                fs.mkdirSync(tmpDir, { recursive: true });
              }
              
              const timestamp = Date.now();
              const mergeFolder = path.join(tmpDir, `merge_${timestamp}`);
              fs.mkdirSync(mergeFolder, { recursive: true });
              
              // 保存所有 CSV 文件
              for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const filePath = path.join(mergeFolder, file.filename);
                const buffer = Buffer.from(file.buffer, 'base64');
                fs.writeFileSync(filePath, buffer);
                console.log(`📁 保存文件 ${i + 1}: ${file.filename}`);
              }
              
              const outputFile = path.join(tmpDir, `合并结果_${timestamp}.csv`);
              const pythonScript = path.join(process.cwd(), 'run_merge_csv.py');
              
              console.log('🐍 调用 Python 合并脚本:', pythonScript);
              
              const pythonProcess = spawn('python', [pythonScript, mergeFolder, outputFile], {
                cwd: process.cwd(),
                shell: false
              });
              
              let output = '';
              let errorOutput = '';
              
              pythonProcess.stdout.on('data', (data) => {
                output += data.toString();
              });
              
              pythonProcess.stderr.on('data', (data) => {
                errorOutput += data.toString();
                console.log('📤 Python stderr:', data.toString());
              });
              
              pythonProcess.on('error', (err) => {
                console.error('❌ Python进程启动失败:', err);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: '进程启动失败: ' + err.message }));
              });
              
              const timeout = setTimeout(() => {
                console.log('⏰ Python执行超时，强制终止');
                pythonProcess.kill();
              }, 120000);
              
              pythonProcess.on('close', (code) => {
                clearTimeout(timeout);
                console.log('📊 Python退出码:', code);

                if (code !== 0) {
                  console.error('❌ Python执行失败:', errorOutput);
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: errorOutput || '脚本执行失败' }));
                  return;
                }

                try {
                  // 找到 stdout 中第一个 { 到最后一个 } 之间的 JSON
                  const jsonStart = output.indexOf('{');
                  const jsonEnd = output.lastIndexOf('}');
                  if (jsonStart === -1 || jsonEnd === -1) {
                    throw new Error('无法找到 JSON');
                  }
                  const jsonStr = output.substring(jsonStart, jsonEnd + 1);
                  const result = JSON.parse(jsonStr);
                  
                  if (result.success && fs.existsSync(outputFile)) {
                    // 读取合并后的文件内容，返回 base64（仅用于下载）
                    const mergedBuffer = fs.readFileSync(outputFile);
                    const mergedBase64 = mergedBuffer.toString('base64');
                    result.mergedFileBase64 = mergedBase64;
                    result.mergedFileName = path.basename(outputFile);
                    console.log('✅ 合并成功, 文件大小:', mergedBuffer.length, 'bytes, rows:', result.rows?.length || 0);
                  }
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(result));
                } catch (e) {
                  console.error('❌ JSON解析失败:', output, e);
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: '解析失败: ' + output }));
                }
              });
              
            } catch (error) {
              console.error('❌ 处理失败:', error);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: error.message }));
            }
          });
        } catch (error) {
          console.error('❌ 异常:', error);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: error.message }));
        }
      });
      
      console.log('✅ Dify 插件配置完成');
    }
  }
}

export default defineConfig({
  build: {
    sourcemap: 'hidden',
  },
  server: {
    port: 5174
  },
  plugins: [
    react(),
    difyPlugin()
  ],
})
