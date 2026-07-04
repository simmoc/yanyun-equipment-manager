import openpyxl
import os

files = [
    "鸣金影105阶竞速轴属性毕业率进阶计算器0.1.xlsx",
]

base_path = "/Users/simmoc/project/yanyun-equipment-manager/base_excel"

for filename in files:
    path = os.path.join(base_path, filename)
    wb = openpyxl.load_workbook(path, data_only=False)
    sheet = wb['期望']
    
    # Check cells BO, BM, BP, BQ (Wait, these are columns? BM, BP, BQ are column names?)
    # Looking at MD: "BM = 会意命中概率", "BO = 精准命中概率", "BP = 会心命中概率", "BQ = 普通命中概率"
    # Wait, the MD uses these as variable names. I need to find the COLUMNS in the sheet.
    # MD 3.4 says "单技能伤害 = L = M*BO + N*BM + O*BP + P*BQ"
    # Usually L is Column L, M is Column M, etc.
    # But let's check Column BO, BM, BP, BQ in '期望' sheet.
    
    print(f"File: {filename}")
    for col in ['BM', 'BN', 'BO', 'BP', 'BQ']:
        cell = f"{col}25" # Row 25 is likely the first skill row
        print(f"{cell} formula: {sheet[cell].value}")

    # Also check the damage components M, N, O, P
    for col in ['M', 'N', 'O', 'P']:
        cell = f"{col}25"
        print(f"{cell} formula: {sheet[cell].value}")
