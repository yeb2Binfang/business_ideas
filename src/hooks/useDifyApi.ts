import { useAppStore } from '../store/useAppStore';

const parseWorkflowResult = (result: any) => {
  console.log('🎯 ====== 解析结果 ======');
  console.log('📝 原始结果:', result);

  if (result.success) {
    return {
      simple: result.simple || '',
      complicate: result.complicate || '',
      story: result.story || '',
      test: result.test || '',
      news: result.news || ''
    };
  }
  
  return {
    simple: '解析结果失败',
    complicate: '解析结果失败',
    story: '解析结果失败',
    test: '解析结果失败',
    news: '解析结果失败'
  };
};

export const useDifyApi = () => {
  const { 
    startProcessing, 
    updateProgress, 
    setResult,
    file,
    url
  } = useAppStore();

  const processContent = async () => {
    console.log('🎯 ====== 开始处理 ======');
    startProcessing();
    updateProgress('parsing', 10);

    try {
      const hasFile = !!file;
      const hasUrl = !!url.trim();
      
      if (!hasFile && !hasUrl) {
        throw new Error('请上传文件或输入链接');
      }

      let requestBody: any;
      
      if (hasUrl) {
        console.log('📁 模式: URL');
        requestBody = { url: url.trim() };
        updateProgress('parsing', 20);
      } else if (hasFile) {
        console.log('📁 模式: 文件');
        console.log('📁 文件:', file.name);
        updateProgress('parsing', 20);
        
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        let binary = '';
        uint8Array.forEach(byte => {
          binary += String.fromCharCode(byte);
        });
        const base64 = btoa(binary);
        
        console.log('📦 base64 长度:', base64.length);
        requestBody = {
          buffer: base64,
          filename: file.name
        };
      } else {
        throw new Error('请上传文件或输入链接');
      }

      updateProgress('parsing', 30);
      
      console.log('🌐 调用 /api/dify...');
      const response = await fetch('/api/dify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log('📥 响应状态：', response.status);
      updateProgress('parsing', 60);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ 请求失败：', errorText);
        throw new Error(`请求失败：${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ 收到响应：', result);
      
      const parsed = parseWorkflowResult(result);
      updateProgress('ideating', 100);
      setResult(parsed);
      
      console.log('🏆 ====== 处理完成 ======');
      
    } catch (error: any) {
      console.error('💥 处理过程出错：', error);
      updateProgress('ideating', 100);
      setResult({
        simple: `错误: ${error.message}`,
        complicate: `错误: ${error.message}`,
        story: `错误: ${error.message}`,
        test: `错误: ${error.message}`,
        news: `错误: ${error.message}`
      });
    }
  };

  return {
    processContent
  };
};
