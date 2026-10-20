import { parseYouTubeTimestamp, parseTimestampStringToSeconds, extractYouTubeVideoId } from '../youtube';

describe('parseYouTubeTimestamp (Pure Rule)', () => {
  it('TC-YT-01: parses MM:SS format correctly', () => {
    expect(parseTimestampStringToSeconds('12:40')).toBe(760);
    expect(parseTimestampStringToSeconds('00:30')).toBe(30);
  });

  it('TC-YT-02: parses HH:MM:SS format correctly', () => {
    expect(parseTimestampStringToSeconds('01:15:30')).toBe(4530);
  });

  it('TC-YT-03: returns null for invalid timestamp formats', () => {
    expect(parseTimestampStringToSeconds('invalid')).toBeNull();
    expect(parseTimestampStringToSeconds('12:abc')).toBeNull();
  });

  it('TC-YT-04: extracts YouTube video ID correctly', () => {
    expect(extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(extractYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(extractYouTubeVideoId('https://invalid.com/watch?v=123')).toBeNull();
  });

  it('TC-YT-05: generates proper native intent and web deep links', () => {
    const result = parseYouTubeTimestamp('https://youtu.be/dQw4w9WgXcQ', '12:40');
    expect(result).not.toBeNull();
    expect(result?.seconds).toBe(760);
    expect(result?.appUrl).toBe('vnd.youtube://dQw4w9WgXcQ?t=760');
    expect(result?.webUrl).toBe('https://youtu.be/dQw4w9WgXcQ?t=760s');
  });
});
