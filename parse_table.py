#!/usr/bin/env python3
import csv
import json
import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path


COMPANY_HEADER_NAMES = {
    "企业名称",
    "企业名字",
    "公司名称",
    "公司名字",
    "单位名称",
    "客户名称",
    "企业",
    "公司",
    "单位",
    "名称",
    "name",
    "company",
    "companyname",
}


def normalize_header(value):
    return str(value or "").strip().lower().replace(" ", "")


def has_company_header(values):
    return any(normalize_header(value) in COMPANY_HEADER_NAMES for value in values)


def row_to_record(headers, row):
    record = {}
    for idx, header in enumerate(headers):
        value = row[idx] if idx < len(row) else None
        record[header] = "" if value is None else str(value).strip()
    return record


def column_index(cell_ref):
    letters = "".join(ch for ch in str(cell_ref or "") if ch.isalpha())
    index = 0
    for ch in letters:
        index = index * 26 + (ord(ch.upper()) - ord("A") + 1)
    return max(index - 1, 0)


def read_csv(path):
    text = path.read_text(encoding="utf-8-sig", errors="ignore")
    sample = text[:4096]
    dialect = csv.Sniffer().sniff(sample, delimiters=",\t;，")
    rows = list(csv.reader(text.splitlines(), dialect=dialect))
    if not rows:
        return []
    first = rows[0]
    if has_company_header(first):
        headers = [str(header).strip() if header is not None else f"列{idx + 1}" for idx, header in enumerate(first)]
        data_rows = rows[1:]
    else:
        headers = ["企业名称", *[f"列{idx}" for idx in range(2, len(first) + 1)]]
        data_rows = rows
    records = []
    for row in data_rows:
        record = row_to_record(headers, row)
        if any(str(value).strip() for value in record.values()):
            records.append(record)
    return records


def read_xlsx(path):
    try:
        import openpyxl
    except ModuleNotFoundError:
        return read_xlsx_without_openpyxl(path)

    workbook = openpyxl.load_workbook(path, read_only=True, data_only=True)
    sheet = workbook.active
    rows = list(sheet.iter_rows(values_only=True))
    if not rows:
        return []
    first = rows[0]
    if has_company_header(first):
        headers = [str(header).strip() if header is not None else f"列{idx + 1}" for idx, header in enumerate(first)]
        data_rows = rows[1:]
    else:
        headers = ["企业名称", *[f"列{idx}" for idx in range(2, len(first) + 1)]]
        data_rows = rows
    records = []
    for row in data_rows:
        record = row_to_record(headers, row)
        if any(str(value).strip() for value in record.values()):
            records.append(record)
    return records


def read_xlsx_without_openpyxl(path):
    with zipfile.ZipFile(path) as archive:
        shared_strings = read_shared_strings(archive)
        sheet_path = first_sheet_path(archive)
        sheet_xml = archive.read(sheet_path)

    root = ET.fromstring(sheet_xml)
    rows = []
    for row_el in root.findall(".//{*}sheetData/{*}row"):
        values = []
        for cell in row_el.findall("{*}c"):
            idx = column_index(cell.attrib.get("r", ""))
            while len(values) <= idx:
                values.append("")
            values[idx] = read_cell_value(cell, shared_strings)
        if any(str(value).strip() for value in values):
            rows.append(values)

    if not rows:
        return []

    first = rows[0]
    if has_company_header(first):
        headers = [str(header).strip() if header is not None else f"列{idx + 1}" for idx, header in enumerate(first)]
        data_rows = rows[1:]
    else:
        headers = ["企业名称", *[f"列{idx}" for idx in range(2, len(first) + 1)]]
        data_rows = rows

    records = []
    for row in data_rows:
        record = row_to_record(headers, row)
        if any(str(value).strip() for value in record.values()):
            records.append(record)
    return records


def read_shared_strings(archive):
    try:
        root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
    except KeyError:
        return []

    values = []
    for item in root.findall("{*}si"):
        parts = []
        for text in item.findall(".//{*}t"):
            parts.append(text.text or "")
        values.append("".join(parts))
    return values


def first_sheet_path(archive):
    workbook = ET.fromstring(archive.read("xl/workbook.xml"))
    rels = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
    first_sheet = workbook.find(".//{*}sheet")
    if first_sheet is None:
        return "xl/worksheets/sheet1.xml"
    rel_id = first_sheet.attrib.get("{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id")
    for rel in rels.findall("{*}Relationship"):
        if rel.attrib.get("Id") == rel_id:
            target = rel.attrib.get("Target", "worksheets/sheet1.xml")
            if target.startswith("/"):
                return target.lstrip("/")
            if target.startswith("xl/"):
                return target
            return f"xl/{target}"
    return "xl/worksheets/sheet1.xml"


def read_cell_value(cell, shared_strings):
    cell_type = cell.attrib.get("t")
    if cell_type == "inlineStr":
        return "".join(text.text or "" for text in cell.findall(".//{*}t")).strip()

    value_el = cell.find("{*}v")
    if value_el is None:
        return ""
    raw = value_el.text or ""
    if cell_type == "s":
        try:
            return shared_strings[int(raw)].strip()
        except Exception:
            return raw.strip()
    return raw.strip()


def main():
    path = Path(sys.argv[1])
    ext = path.suffix.lower()
    if ext in (".xlsx", ".xlsm"):
        rows = read_xlsx(path)
    else:
        rows = read_csv(path)
    print(json.dumps({"ok": True, "rows": rows}, ensure_ascii=False))


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(json.dumps({"ok": False, "error": str(exc)}, ensure_ascii=False))
        sys.exit(1)
