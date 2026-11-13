from pathlib import Path
import re

from xhtml2pdf import pisa


ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "INFORME-TECNICO-APA.html"
OUTPUT = ROOT / "INFORME-TECNICO-APA.pdf"

PDF_CSS = """
@page {
  size: letter;
  margin: 1in;
  @frame page_header {
    -pdf-frame-content: page_number;
    left: 6.45in;
    top: 0.28in;
    width: 0.55in;
    height: 0.2in;
  }
}
body {
  font-family: Times;
  font-size: 12pt;
  line-height: 2;
  color: #111111;
}
.cover {
  height: 9in;
  text-align: center;
  page-break-after: always;
}
.cover img {
  width: 185px;
  height: auto;
  margin: 20px auto 28px;
}
.cover-title {
  font-size: 15pt;
  font-weight: bold;
  margin: 0 0 55px;
}
.cover-authors {
  font-weight: bold;
  line-height: 2.4;
  margin: 0 0 65px;
}
.cover-course {
  font-weight: bold;
  margin: 0 0 65px;
}
.cover-teacher {
  font-weight: bold;
  margin: 0 0 55px;
}
.cover-institution {
  font-size: 11pt;
  font-weight: bold;
  margin: 0 0 18px;
}
.cover-year {
  font-weight: bold;
}
h1, h2 {
  font-size: 12pt;
  text-align: center;
  font-weight: bold;
  margin: 18pt 0 8pt;
}
h3 {
  font-size: 12pt;
  text-align: left;
  font-weight: bold;
  margin: 14pt 0 6pt;
}
p {
  text-indent: 0.5in;
  margin: 0 0 7pt;
}
.abstract, .keywords, .no-indent, .table-note {
  text-indent: 0;
}
ul, ol {
  margin-left: 0.6in;
}
li {
  margin-bottom: 4pt;
}
table {
  width: 100%;
  font-size: 8.5pt;
  line-height: 1.25;
  border-collapse: collapse;
  margin: 8pt 0 4pt;
}
th, td {
  border-bottom: 0.5pt solid #777777;
  padding: 4pt;
  vertical-align: top;
  text-align: left;
}
th {
  border-top: 1pt solid #111111;
  border-bottom: 1pt solid #111111;
  font-weight: bold;
}
caption {
  caption-side: top;
  text-align: left;
  font-size: 10pt;
  font-weight: bold;
  margin-bottom: 4pt;
}
caption em {
  display: block;
  font-weight: normal;
}
.table-note {
  font-size: 9pt;
  line-height: 1.4;
}
.references {
  page-break-before: always;
}
.references p {
  text-indent: -0.5in;
  margin-left: 0.5in;
}
a {
  color: #111111;
}
"""


def main() -> None:
    html = SOURCE.read_text(encoding="utf-8")
    html = re.sub(r"<style>.*?</style>", f"<style>{PDF_CSS}</style>", html, flags=re.S)
    html = html.replace("→", "->")
    html = html.replace(
        "</body>",
        '<div id="page_number" style="text-align: right; font-size: 10pt;">'
        "<pdf:pagenumber></div></body>",
    )

    with OUTPUT.open("wb") as pdf_file:
        result = pisa.CreatePDF(html, dest=pdf_file, path=str(ROOT), encoding="utf-8")

    if result.err:
        raise SystemExit(f"PDF generado con {result.err} error(es).")

    print(f"PDF: {OUTPUT.name} ({OUTPUT.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
