const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// 获取文件路径（从命令行参数）
const filePath = process.argv[2];

if (!filePath) {
  console.error('请提供文件路径');
  process.exit(1);
}

// 检查文件是否存在
if (!fs.existsSync(filePath)) {
  console.error(`文件不存在：${filePath}`);
  process.exit(1);
}

// 运行 Python 脚本
const pythonScript = path.join(__dirname, 'run_dify.py');
const pythonProcess = spawn('python', [pythonScript, filePath]);

let output = '';
let errorOutput = '';

pythonProcess.stdout.on('data', (data) => {
  output += data.toString();
});

pythonProcess.stderr.on('data', (data) => {
  errorOutput += data.toString();
});

pythonProcess.on('close', (code) => {
  if (code !== 0) {
    console.error('Python脚本执行失败:', errorOutput);
    process.exit(code);
  }
  
  try {
    const result = JSON.parse(output);
    console.log(JSON.stringify(result));
  } catch (e) {
    console.error('解析结果失败:', output);
    process.exit(1);
  }
});
