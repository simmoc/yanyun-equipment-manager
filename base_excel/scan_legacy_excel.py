import openpyxl
import os

files = [
    "牵丝玉100级竞速轴属性毕业率计算器5.xlsx",
    "破竹风100级竞速轴属性毕业率计算器5.-1 copy.xlsx"
]

base_path = "/Users/simmoc/project/yanyun-equipment-manager/base_excel"

for filename in files:
    path = os.path.join(base_path, filename)
    wb = openpyxl.load_workbook(path, data_only=True)
    print(f"\nFile: {filename}")
    sheet = wb['期望']
    for r in range(1, 20):
        row_values = [sheet.cell(row=r, column=c).value for c in range(1, 15)]
        print(f"Row {r}: {row_values}")
