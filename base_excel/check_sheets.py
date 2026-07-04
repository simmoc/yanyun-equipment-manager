import openpyxl
import os

files = [
    "鸣金影105阶竞速轴属性毕业率进阶计算器0.1.xlsx",
]

base_path = "/Users/simmoc/project/yanyun-equipment-manager/base_excel"

for filename in files:
    path = os.path.join(base_path, filename)
    wb = openpyxl.load_workbook(path, read_only=True)
    print(f"File: {filename}")
    print(f"Sheets: {wb.sheetnames}")
