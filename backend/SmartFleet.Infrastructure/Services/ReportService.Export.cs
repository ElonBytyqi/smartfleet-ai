using ClosedXML.Excel;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using SmartFleet.Application.DTOs;

namespace SmartFleet.Infrastructure.Services;

public partial class ReportService
{
    public async Task<byte[]> ToExcelAsync(ReportType type, ReportFilter filter)
    {
        var r = await BuildAsync(type, filter);

        using var wb = new XLWorkbook();
        var ws = wb.AddWorksheet("Raporti");
        var cols = r.Columns.Count;
        var row = 1;

        // Titulli
        ws.Cell(row, 1).Value = r.Title;
        ws.Range(row, 1, row, cols).Merge().Style
            .Font.SetBold().Font.SetFontSize(15);
        row++;

        ws.Cell(row, 1).Value = r.Subtitle;
        ws.Range(row, 1, row, cols).Merge().Style
            .Font.SetItalic().Font.SetFontColor(XLColor.Gray);
        row += 2;

        // Përmbledhja
        foreach (var s in r.Summary)
        {
            ws.Cell(row, 1).Value = s.Label;
            ws.Cell(row, 1).Style.Font.SetBold();
            ws.Cell(row, 2).Value = s.Value;
            row++;
        }
        row++;

        // Koka e tabelës
        for (var c = 0; c < cols; c++)
        {
            var cell = ws.Cell(row, c + 1);
            cell.Value = r.Columns[c];
            cell.Style.Font.SetBold().Font.SetFontColor(XLColor.White);
            cell.Style.Fill.SetBackgroundColor(XLColor.FromHtml("#1F2937"));
        }
        var headerRow = row;
        row++;

        foreach (var dataRow in r.Rows)
        {
            for (var c = 0; c < dataRow.Count; c++)
                ws.Cell(row, c + 1).Value = dataRow[c];
            row++;
        }

        if (r.Rows.Count > 0)
            ws.Range(headerRow, 1, row - 1, cols).SetAutoFilter();

        ws.SheetView.FreezeRows(headerRow);
        ws.Columns().AdjustToContents();

        using var ms = new MemoryStream();
        wb.SaveAs(ms);
        return ms.ToArray();
    }

    public async Task<byte[]> ToPdfAsync(ReportType type, ReportFilter filter)
    {
        var r = await BuildAsync(type, filter);
        var generated = DateTime.UtcNow.ToString("dd.MM.yyyy HH:mm") + "Z";

        var doc = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4.Landscape());
                page.Margin(1.5f, Unit.Centimetre);
                page.DefaultTextStyle(t => t.FontSize(9));

                page.Header().Column(col =>
                {
                    col.Item().Row(row =>
                    {
                        row.RelativeItem().Column(c =>
                        {
                            c.Item().Text(r.Title).FontSize(16).SemiBold();
                            c.Item().Text(r.Subtitle).FontSize(9).FontColor(Colors.Grey.Darken1);
                        });
                        row.ConstantItem(140).AlignRight().Column(c =>
                        {
                            c.Item().Text("SmartFleet AI").FontSize(11).SemiBold();
                            c.Item().Text(generated).FontSize(8)
                                .FontColor(Colors.Grey.Darken1);
                        });
                    });
                    col.Item().PaddingTop(8).LineHorizontal(1).LineColor(Colors.Grey.Lighten1);
                });

                page.Content().PaddingVertical(12).Column(col =>
                {
                    // Përmbledhja si kuti
                    if (r.Summary.Count > 0)
                    {
                        col.Item().PaddingBottom(12).Row(row =>
                        {
                            foreach (var s in r.Summary)
                            {
                                row.RelativeItem().Border(1)
                                    .BorderColor(Colors.Grey.Lighten2)
                                    .Padding(6).Column(c =>
                                    {
                                        c.Item().Text(s.Label).FontSize(7)
                                            .FontColor(Colors.Grey.Darken1);
                                        c.Item().PaddingTop(2).Text(s.Value)
                                            .FontSize(12).SemiBold();
                                    });
                            }
                        });
                    }

                    if (r.Rows.Count == 0)
                    {
                        col.Item().PaddingTop(40).AlignCenter()
                            .Text("Nuk ka të dhëna për këtë periudhë.")
                            .FontColor(Colors.Grey.Darken1);
                        return;
                    }

                    col.Item().Table(table =>
                    {
                        table.ColumnsDefinition(c =>
                        {
                            foreach (var _ in r.Columns) c.RelativeColumn();
                        });

                        table.Header(h =>
                        {
                            foreach (var name in r.Columns)
                                h.Cell().Background(Colors.Grey.Darken3)
                                    .Padding(5).Text(name)
                                    .FontColor(Colors.White).SemiBold().FontSize(8);
                        });

                        var i = 0;
                        foreach (var dataRow in r.Rows)
                        {
                            var bg = i++ % 2 == 0 ? Colors.White : Colors.Grey.Lighten4;
                            foreach (var cell in dataRow)
                                table.Cell().Background(bg)
                                    .BorderBottom(1).BorderColor(Colors.Grey.Lighten2)
                                    .Padding(4).Text(cell).FontSize(8);
                        }
                    });
                });

                page.Footer().AlignCenter().Text(t =>
                {
                    t.CurrentPageNumber().FontSize(8);
                    t.Span(" / ").FontSize(8);
                    t.TotalPages().FontSize(8);
                });
            });
        });

        return doc.GeneratePdf();
    }
}