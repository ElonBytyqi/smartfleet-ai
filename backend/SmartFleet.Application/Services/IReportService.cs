using SmartFleet.Application.DTOs;

namespace SmartFleet.Application.Services;

public interface IReportService
{
    Task<ReportResult> BuildAsync(ReportType type, ReportFilter filter);
    Task<byte[]> ToExcelAsync(ReportType type, ReportFilter filter);
    Task<byte[]> ToPdfAsync(ReportType type, ReportFilter filter);
}