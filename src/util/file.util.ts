export function getMimeType(fileUrl: string): string {
    if (fileUrl.endsWith(".png")) return "image/png";
    if (fileUrl.endsWith(".jpg") || fileUrl.endsWith(".jpeg")) return "image/jpeg";
    if (fileUrl.endsWith(".pdf")) return "application/pdf";
    if (fileUrl.endsWith(".heic")) return "image/heic";
    return "image/jpeg"; // default fallback
}