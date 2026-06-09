import requests
import json
import sys
import os
import re
from bs4 import BeautifulSoup

API_KEY = "app-ufLiTAOLy3RD9UWoLY0VwUOA"
FILE_TYPE = "document"

def log(msg):
    print(msg, file=sys.stderr, flush=True)

session = requests.Session()
session.trust_env = False
session.proxies = {'http': None, 'https': None}

def extract_wechat_content(url: str) -> str:
    try:
        log(f"[URL] Fetching WeChat article from: {url}")
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        response = session.get(url, headers=headers, timeout=30)
        response.encoding = "utf-8"
        html = response.text
        soup = BeautifulSoup(html, "html.parser")
        
        title = ""
        title_tag = soup.find("h1", class_="rich_media_title") or soup.find("title")
        if title_tag:
            title = title_tag.get_text(strip=True)
        
        content_div = soup.find("div", class_="rich_media_content")
        if content_div:
            for script in content_div(["script", "style"]):
                script.extract()
            full_text = []
            for p_tag in content_div.find_all("p"):
                para_text = p_tag.get_text(separator="\n", strip=False)
                para_text = re.sub(r'\s+', ' ', para_text).replace(' \n ', '\n').strip()
                if para_text:
                    full_text.append(para_text)
            text_content = "\n\n".join(full_text)
            text_content = re.sub(r'\n{3,}', '\n\n', text_content)
        else:
            text_content = "未提取到正文内容"
        
        full_content = f"Title: {title}\n\nURL: {url}\n\n{text_content}"
        log(f"[URL] Successfully extracted, length: {len(full_content)}")
        return full_content
        
    except Exception as e:
        log(f"[URL] Extract failed: {str(e)}")
        raise Exception(f"Failed to extract WeChat content: {str(e)}")

def create_txt_file(text: str, output_path: str):
    """Create a TXT file (simplest and most reliable)"""
    try:
        log(f"[TXT] Creating TXT file at: {output_path}")
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(text)
        
        log(f"[TXT] Created successfully")
        return True
        
    except Exception as e:
        log(f"[TXT] Error: {e}")
        return False

def upload_file_to_dify(file_path: str, user: str):
    upload_url = "https://api.dify.ai/v1/files/upload"
    headers = {"Authorization": f"Bearer {API_KEY}"}

    if not os.path.exists(file_path):
        raise Exception(f"File not found: {file_path}")

    with open(file_path, 'rb') as file:
        files = {'file': (os.path.basename(file_path), file, 'text/plain')}
        data = {"user": user, "type": "document"}
        response = session.post(upload_url, headers=headers, files=files, data=data)

        if response.status_code == 201:
            file_id = response.json().get("id")
            return file_id
        else:
            raise Exception(f"Upload failed: {response.text}")

def run_dify_workflow_streaming(file_id: str, user: str):
    workflow_url = "https://api.dify.ai/v1/workflows/run"
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
        "Accept": "text/event-stream"
    }

    data = {
        "inputs": {
            "file": [{"transfer_method": "local_file", "upload_file_id": file_id, "type": FILE_TYPE}],
            "userinput.files": [{"transfer_method": "local_file", "upload_file_id": file_id, "type": FILE_TYPE}]
        },
        "response_mode": "streaming",
        "user": user
    }

    response = session.post(workflow_url, headers=headers, json=data, stream=True, timeout=900)

    if response.status_code != 200:
        raise Exception(f"Request failed: {response.status_code}")

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
                log(f"[EVENT] {event_type}")

                if event_type == "workflow_finished":
                    final_result = event.get("data")
                    log("[OK] workflow_finished received")
                    return final_result

            except json.JSONDecodeError:
                continue

    raise Exception("No workflow_finished event received")

def main():
    log("=== START ===")
    if len(sys.argv) < 3:
        log("[ERR] Args missing")
        error_json = json.dumps({"error": "Args missing"}, ensure_ascii=False)
        sys.stdout.buffer.write(error_json.encode('utf-8'))
        sys.exit(1)

    json_file_path = sys.argv[1]
    pdf_file_path = sys.argv[2]
    
    is_url_mode = False
    url = ""
    try:
        if os.path.exists(json_file_path):
            with open(json_file_path, 'r', encoding='utf-8') as f:
                config = json.load(f)
                url = config.get('url', '')
                if url:
                    is_url_mode = True
                    log(f"[MODE] URL mode: {url}")
                else:
                    log(f"[MODE] File mode")
    except Exception as e:
        log(f"[WARN] Config read failed: {str(e)}")

    try:
        user = "test-user-001"
        temp_pdf_path = pdf_file_path
        
        if is_url_mode and url:
            log("[1] Extracting WeChat article content...")
            content = extract_wechat_content(url)
            log(f"[1] Content length: {len(content)} chars")
            
            log("[2] Creating TXT file...")
            tmp_dir = os.path.dirname(temp_pdf_path)
            if tmp_dir and not os.path.exists(tmp_dir):
                os.makedirs(tmp_dir, exist_ok=True)
            
            # Save as TXT file instead of PDF
            txt_path = temp_pdf_path.replace('.pdf', '.txt')
            create_txt_file(content, txt_path)
            
            if os.path.exists(txt_path):
                file_size = os.path.getsize(txt_path)
                log(f"[OK] TXT created, size: {file_size} bytes")
                temp_pdf_path = txt_path  # Use TXT instead
            else:
                log(f"[ERROR] TXT file was not created!")
            
            log("[3] Uploading to Dify...")
        else:
            log("[1] Uploading file to Dify...")
        
        file_id = upload_file_to_dify(temp_pdf_path, user)
        log(f"[OK] file_id: {file_id}")

        log("[4] Running workflow...")
        final_result = run_dify_workflow_streaming(file_id, user)

        result_output = {"success": True}
        status = final_result.get("status")

        if status == "succeeded" and final_result.get("outputs"):
            outputs = final_result["outputs"]
            result_output["simple"] = outputs.get("simple", "")
            result_output["complicate"] = outputs.get("complicate", "")
            result_output["story"] = outputs.get("story", "")
            result_output["test"] = outputs.get("test", "")
            result_output["news"] = outputs.get("news", "")
        else:
            error_msg = final_result.get("error", "Unknown error")
            result_output["simple"] = f"[WARN] Status: {status}"
            result_output["complicate"] = f"[WARN] Error: {error_msg}"
            result_output["story"] = f"[INFO] Time: {final_result.get('elapsed_time', 0):.2f}s"
            result_output["test"] = f"[INFO] Tokens: {final_result.get('total_tokens', 0)}"
            result_output["news"] = f"[DATA] {json.dumps(final_result, ensure_ascii=False)[:500]}"
            result_output["success"] = False

        output_json = json.dumps(result_output, ensure_ascii=False)
        sys.stdout.buffer.write(output_json.encode('utf-8'))
        log("=== END ===")

    except Exception as e:
        log(f"[FATAL] {str(e)}")
        error_json = json.dumps({"error": str(e)}, ensure_ascii=False)
        sys.stdout.buffer.write(error_json.encode('utf-8'))
        sys.exit(1)

if __name__ == "__main__":
    main()
