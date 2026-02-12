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
  const objectUrl = URL.createObjectURL(blob);
  const safe = safeFilename(filename);
  try {
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = safe || 'download';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
