/**
 * Fetch a URL (e.g. presigned) and trigger a direct download in the browser
 * instead of opening in a new tab. Uses a temporary anchor with the download
 * attribute after fetching the response as a blob.
 */
/** Replace characters that are invalid or unsafe in filenames. */
function safeFilename(name: string): string {
  return name.replace(/[/\\?*:|\s]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'download';
}

export async function downloadFromUrl(url: string, filename: string = 'download'): Promise<void> {
  const res = await fetch(url, { mode: 'cors' });
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const blob = await res.blob();
  downloadBlob(blob, filename);
}

/** Trigger a download of a Blob with the given filename. */
export function downloadBlob(blob: Blob, filename: string = 'download'): void {
  const safe = safeFilename(filename) || 'download';
  const objectUrl = URL.createObjectURL(blob);
  try {
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = safe;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/** Parse filename from Content-Disposition header (e.g. attachment; filename="contract-1.html"). */
export function parseFilenameFromDisposition(disposition: string | null): string | null {
  if (!disposition) return null;
  const match = disposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i);
  return match ? match[1].trim() : null;
}
