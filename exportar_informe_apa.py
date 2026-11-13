from xhtml2pdf import pisa

from generar_informe_pdf import OUTPUT, PDF_CSS, ROOT, SOURCE


def main() -> None:
    html = SOURCE.read_text(encoding="utf-8")
    html = html.replace("<style>", "<style>", 1)
    start = html.index("<style>")
    end = html.index("</style>", start) + len("</style>")
    html = html[:start] + f"<style>{PDF_CSS}</style>" + html[end:]
    html = html.replace("→", "->")
    html = html.replace("</section>\n<main>", "</section><pdf:nextpage />\n<main>", 1)
    html = html.replace(
        '<section class="references">',
        '<pdf:nextpage /><section class="references">',
        1,
    )
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
