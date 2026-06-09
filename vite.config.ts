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
        
        // try {
        //   if (fs.existsSync(jsonFilePath)) fs.unlinkSync(jsonFilePath);
        //   if (fs.existsSync(pdfFilePath)) fs.unlinkSync(pdfFilePath);
        // } catch (e) {
        //   console.log('⚠️ 清理失败');
        // }
                
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
