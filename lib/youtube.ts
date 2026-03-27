export interface YouTubeVideo {
  videoId: string;
  title: string;
  publishedAt: string;
  watchUrl: string;
  embedUrl: string;
  thumbnailUrl: string;
}

export interface YouTubeChannelFeed {
  channelId: string;
  channelHandle: string;
  channelName: string;
  channelUrl: string;
  subscribeUrl: string;
  feedUrl: string;
  featuredVideo: YouTubeVideo | null;
  recentVideos: YouTubeVideo[];
}

const CHANNEL_ID = "UCBAKbhtwAA7oNrNj0fpnIeA";
const CHANNEL_HANDLE = "@breaking_mad";
const CHANNEL_URL = `https://www.youtube.com/${CHANNEL_HANDLE}`;
const FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;

function decodeXmlEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function readTag(block: string, tagName: string) {
  const escapedTagName = tagName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = block.match(
    new RegExp(`<${escapedTagName}(?: [^>]*)?>([\\s\\S]*?)<\\/${escapedTagName}>`)
  );

  return match ? decodeXmlEntities(match[1].trim()) : null;
}

function parseYouTubeFeed(feed: string): YouTubeVideo[] {
  const entries = Array.from(feed.matchAll(/<entry>([\s\S]*?)<\/entry>/g));

  return entries
    .map(([, entryBlock]) => {
      const videoId = readTag(entryBlock, "yt:videoId");
      const title = readTag(entryBlock, "title");
      const publishedAt = readTag(entryBlock, "published");

      if (!videoId || !title || !publishedAt) {
        return null;
      }

      return {
        videoId,
        title,
        publishedAt,
        watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
        embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`,
        thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      } satisfies YouTubeVideo;
    })
    .filter((video): video is YouTubeVideo => video !== null);
}

export async function getYouTubeChannelFeed(): Promise<YouTubeChannelFeed> {
  const fallbackChannel: YouTubeChannelFeed = {
    channelId: CHANNEL_ID,
    channelHandle: CHANNEL_HANDLE,
    channelName: "breaking_mad",
    channelUrl: CHANNEL_URL,
    subscribeUrl: `${CHANNEL_URL}?sub_confirmation=1`,
    feedUrl: FEED_URL,
    featuredVideo: null,
    recentVideos: [],
  };

  try {
    const response = await fetch(FEED_URL, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
      },
      next: {
        revalidate: 3600,
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return fallbackChannel;
    }

    const feed = await response.text();
    const recentVideos = parseYouTubeFeed(feed).slice(0, 4);
    const channelName =
      readTag(feed, "author")?.match(/<name>([\s\S]*?)<\/name>/)?.[1] ??
      readTag(feed, "title") ??
      fallbackChannel.channelName;

    return {
      ...fallbackChannel,
      channelName: decodeXmlEntities(channelName.trim()),
      featuredVideo: recentVideos[0] ?? null,
      recentVideos: recentVideos.slice(1),
    };
  } catch {
    return fallbackChannel;
  }
}
