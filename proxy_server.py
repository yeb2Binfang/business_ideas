from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json
import io
import os

app = Flask(__name__)
CORS(app)  # 允许跨域

API_KEY = "app-ufLiTAOLy3RD9UWoLY0VwUOA"
FILE_TYPE = "document"

# ===================== 1. 上传文件 =====================
def upload_file_to_dify(file_data, filename, user):
    upload_url = "https://api.dify.ai/v1/files/upload"
    headers = {
        "Authorization": f"Bearer {API_KEY}"
    }
    
    print("📤 开始上传文件到 Dify...")
    
    files = {
        'file': (filename, file_data, 'application/pdf')
    }
    data = {
        "user": user,
        "type": "document"
    }
    
    response = requests.post(upload_url, headers=headers, files=files, data=data)
    print(f"上传响应：{response.status_code} | {response.text}")
    
    if response.status_code == 201:
        file_id = response.json().get("id")
        print(f"✅ 文件上传成功，file_id：{file_id}")
        return file_id
    else:
        raise Exception(f"文件上传失败：{response.text}")

# ===================== 2. 运行工作流 =====================
def run_dify_workflow(file_id, user):
    workflow_url = "https://api.dify.ai/v1/workflows/run"
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
        "Accept": "text/event-stream"
    }
    
    data = {
        "inputs": {
            "file": [
                {
                    "transfer_method": "local_file",
                    "upload_file_id": file_id,
                    "type": FILE_TYPE
                }
            ],
            "userinput.files": [
                {
                    "transfer_method": "local_file",
                    "upload_file_id": file_id,
                    "type": FILE_TYPE
                }
            ]
        },
        "response_mode": "streaming",
        "user": user
    }
    
    print("\n🚀 启动工作流...")
    response = requests.post(
        workflow_url,
        headers=headers,
        json=data,
        stream=True,
        timeout=600
    )
    
    if response.status_code != 200:
        raise Exception(f"请求失败：{response.status_code}，{response.text}")
    
    print("✅ 开始接收事件...")
    final_result = None
    
    for line in response.iter_lines(decode_unicode=True):
        if not line:
            continue
        if line.startswith("data:"):
            event_data = line[5:].strip()
            if not event_data:
                continue
            try:
                event = json.loads(event_data)
                event_type = event.get("event")
                print(f"📡 事件：{event_type}")
                
                if event_type == "workflow_finished":
                    final_result = event.get("data")
                    print("\n✅ 工作流执行完成！")
                    print(json.dumps(final_result, ensure_ascii=False, indent=2))
                    return final_result
                
            except json.JSONDecodeError:
                print(f"⚠️  无法解析事件：{line}")
    
    raise Exception("工作流未返回完成事件")

# ===================== API接口 =====================

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "message": "代理服务器运行中！"})

@app.route('/api/process', methods=['POST'])
def process():
    try:
        print("\n===== 收到新的请求 =====")
        
        user = "test-user-001"
        file_id = None
        
        # 检查是否有上传文件
        if 'file' in request.files:
            file = request.files['file']
            if file.filename != '':
                print(f"📄 收到文件：{file.filename}")
                file_data = file.read()
                file_id = upload_file_to_dify(file_data, file.filename, user)
        
        # 检查是否有链接
        elif 'url' in request.form:
            url = request.form['url']
            print(f"🔗 收到链接：{url}")
            # 这里处理链接逻辑（可以扩展）
            file_id = None
        
        if not file_id:
            return jsonify({"error": "请上传文件或提供链接"}), 400
        
        # 运行工作流
        result = run_dify_workflow(file_id, user)
        
        return jsonify({
            "success": True,
            "data": result
        })
        
    except Exception as e:
        print(f"\n❌ 处理失败：{str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("\n🚀 Dify 代理服务器启动！")
    print("📡 监听地址：http://localhost:3002")
    print("🔧 使用端口：3002")
    print("\n请确保已安装 flask 和 flask_cors：")
    print("  pip install flask flask-cors requests\n")
    app.run(host='0.0.0.0', port=3002, debug=True)
