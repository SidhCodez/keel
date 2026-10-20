export interface ParsedYouTubeTimestamp {
  videoId: string;
  seconds: number;
  appUrl: string;
  webUrl: string;
}

/**
 * Parses a timestamp string (MM:SS or HH:MM:SS) into total seconds.
 */
export function parseTimestampStringToSeconds(timestampStr: string): number | null {
  const parts = timestampStr.trim().split(':').map(Number);
  if (parts.some(isNaN)) {
    return null;
  }

  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    if (minutes === undefined || seconds === undefined) return null;
    return minutes * 60 + seconds;
  }

  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    if (hours === undefined || minutes === undefined || seconds === undefined) return null;
    return hours * 3600 + minutes * 60 + seconds;
  }

  return null;
}

/**
 * Extracts a YouTube video ID from standard YouTube URL formats.
 */
export function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Generates Android app intent and web URLs deep-linked to the specified timestamp.
 */
export function parseYouTubeTimestamp(
  videoUrl: string,
  timestampStr: string
): ParsedYouTubeTimestamp | null {
  const videoId = extractYouTubeVideoId(videoUrl);
  if (!videoId) {
    return null;
  }

  const seconds = parseTimestampStringToSeconds(timestampStr);
  if (seconds === null) {
    return null;
  }

  return {
    videoId,
    seconds,
    appUrl: `vnd.youtube://${videoId}?t=${seconds}`,
    webUrl: `https://youtu.be/${videoId}?t=${seconds}s`,
  };
}
