namespace Mojo.Infrastructure.AI;

public class RagPdfInfo
{
    public string FileName { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
    public DateTime LastModifiedUtc { get; set; }
}
