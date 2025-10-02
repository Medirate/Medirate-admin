// Shared progress tracking for CSV uploads
export const progressMap = new Map<string, { progress: number; message: string; status: 'uploading' | 'completed' | 'error' }>();

// Clean up completed uploads after 5 minutes
setInterval(() => {
  for (const [id, progress] of progressMap.entries()) {
    if (progress.status === 'completed' || progress.status === 'error') {
      progressMap.delete(id);
    }
  }
}, 5 * 60 * 1000);
