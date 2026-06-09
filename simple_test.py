#!/usr/bin/env python
# -*- coding: utf-8 -*-

import json
import sys

print("✅ Python脚本可以运行")
print(f"参数数量: {len(sys.argv)}")
if len(sys.argv) > 1:
    print(f"第一个参数: {sys.argv[1]}")

# 测试JSON解析
test_data = {"test": "value"}
print(json.dumps(test_data, ensure_ascii=False))
