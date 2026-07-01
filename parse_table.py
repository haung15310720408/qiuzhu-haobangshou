#!/usr/bin/env python3
import csv
import json
import sys
from pathlib import Path


def read_csv(path):
    sample = path.read_text(encoding="utf-8-sig", errors="ignore")[:4096]
    dialect = csv.Sniffer().sniff(sample, delimiters=",\t;，")
    with path.open("r", encoding="utf-8-sig", errors="ignore", newline="") as handle:
        return list(csv.DictReader(handle, dialect=dialect))


def read_xlsx(path):
    import openpyxl

    workbook = openpyxl.load_workbook(path, read_only=True, data_only=True)
    sheet = workbook.active
    rows = sheet.iter_rows(values_only=True)
    headers = next(rows, [])
    headers = [str(header).strip() if header is not None else f"列{idx + 1}" for idx, header in enumerate(headers)]
    records = []
    for row in rows:
        record = {}
        for idx, header in enumerate(headers):
            value = row[idx] if idx < len(row) else None
            record[header] = "" if value is None else str(value).strip()
        if any(str(value).strip() for value in record.values()):
            records.append(record)
    return records


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
