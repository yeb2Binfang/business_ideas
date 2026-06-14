import os
import json
import sys
import io
import pandas as pd

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def log(msg):
    print(msg, file=sys.stderr, flush=True)

def merge_csv_files(folder_path, output_file):
    """Merge multiple CSV files with auto column alignment"""
    all_data = []
    file_names = []

    log("=== START ===")

    try:
        for file_name in os.listdir(folder_path):
            if file_name.lower().endswith(".csv"):
                file_path = os.path.join(folder_path, file_name)
                try:
                    df = pd.read_csv(file_path, encoding="utf-8")
                    all_data.append(df)
                    file_names.append(file_name)
                    log(f"[OK] Read: {file_name} ({len(df)} rows)")
                except Exception as e:
                    try:
                        df = pd.read_csv(file_path, encoding="gbk")
                        all_data.append(df)
                        file_names.append(file_name)
                        log(f"[OK] Read (GBK): {file_name} ({len(df)} rows)")
                    except Exception as err:
                        log(f"[ERR] Failed {file_name}: {str(err)}")

        if all_data:
            result_df = pd.concat(all_data, ignore_index=True)
            # 使用 utf-8-sig 保存，Excel 打开不乱码
            result_df.to_csv(output_file, index=False, encoding="utf-8-sig")

            log(f"[OK] Merge completed! {len(all_data)} files, total rows: {len(result_df)}")
            log(f"[OK] Columns: {list(result_df.columns)}")
            log(f"[FILE] Output: {output_file}")

            # 将每一行数据转成字典列表，返回给前端
            rows_data = []
            for _, row in result_df.iterrows():
                row_dict = {}
                for col in result_df.columns:
                    val = row[col]
                    # 处理 NaN/None，转成字符串
                    if pd.isna(val):
                        row_dict[str(col)] = ''
                    else:
                        row_dict[str(col)] = str(val)
                rows_data.append(row_dict)

            result = {
                "success": True,
                "file_count": len(all_data),
                "total_rows": len(result_df),
                "columns": [str(c) for c in result_df.columns],
                "rows": rows_data,
                "files": file_names,
                "output_file": os.path.basename(output_file)
            }
            print(json.dumps(result, ensure_ascii=False), flush=True)
        else:
            log("[WARN] No CSV files found")
            print(json.dumps({"error": "No CSV files found"}, ensure_ascii=False), flush=True)

    except Exception as e:
        log(f"[FATAL] {str(e)}")
        print(json.dumps({"error": str(e)}, ensure_ascii=False), flush=True)
        sys.exit(1)

def main():
    if len(sys.argv) < 2:
        log("[ERR] Missing arguments")
        print(json.dumps({"error": "Missing arguments"}, ensure_ascii=False), flush=True)
        sys.exit(1)

    folder_path = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else "合并结果.csv"

    log(f"[INFO] Folder: {folder_path}")
    log(f"[INFO] Output: {output_file}")

    merge_csv_files(folder_path, output_file)

if __name__ == "__main__":
    main()
