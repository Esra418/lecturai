const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "youtu.be",
  "m.youtube.com",
  "music.youtube.com",
]);

export function isYoutubeUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return YOUTUBE_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

/**
 * Extract 11-character YouTube video ID from a full URL, short link, embed path, or raw ID.
 */
export function extractYouTubeVideoId(input: string): string | null {
  const trimmed = input.trim();
  const idPattern = /^[\w-]{11}$/;

  if (idPattern.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    if (!YOUTUBE_HOSTS.has(url.hostname)) {
      return null;
    }

    if (url.hostname === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0]?.split("?")[0];
      return id && idPattern.test(id) ? id : null;
    }

    const v = url.searchParams.get("v");
    if (v && idPattern.test(v)) {
      return v;
    }

    const parts = url.pathname.split("/").filter(Boolean);

    const embedIndex = parts.indexOf("embed");
    if (embedIndex >= 0) {
      const id = parts[embedIndex + 1]?.split("?")[0];
      return id && idPattern.test(id) ? id : null;
    }

    const shortsIndex = parts.indexOf("shorts");
    if (shortsIndex >= 0) {
      const id = parts[shortsIndex + 1]?.split("?")[0];
      return id && idPattern.test(id) ? id : null;
    }

    const liveIndex = parts.indexOf("live");
    if (liveIndex >= 0) {
      const id = parts[liveIndex + 1]?.split("?")[0];
      return id && idPattern.test(id) ? id : null;
    }
  } catch {
    /* not a valid URL */
  }

  return null;
}
