import Image from "next/image";
import Link from "next/link";
import type { YouTubeChannelFeed } from "@/lib/youtube";

function formatYouTubeDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function PlayBadge() {
  return (
    <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/40 bg-red-500/10 text-red-400">
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-6 w-6 fill-current"
      >
        <path d="M7 6.5v11l10-5.5-10-5.5Z" />
      </svg>
    </span>
  );
}

export function YouTubeShowcase({
  channel,
}: {
  channel: YouTubeChannelFeed;
}) {
  const hasVideos = Boolean(channel.featuredVideo);

  return (
    <section className="border-t border-zinc-900 bg-[radial-gradient(circle_at_top_right,rgba(239,68,68,0.16),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.1),transparent_28%),linear-gradient(180deg,rgba(9,9,11,1),rgba(0,0,0,1))]">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="flex flex-col justify-between rounded-[2rem] border border-zinc-800 bg-black/65 p-8 shadow-[0_32px_120px_rgba(0,0,0,0.45)]">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-red-400">
                Channel Signal
              </p>
              <h2 className="mt-5 max-w-xl text-4xl font-black uppercase leading-tight md:text-5xl">
                Breaking Mad on YouTube
              </h2>
              <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-300">
                Recorded pieces, conversations, music, and visual signal from
                the same world as the journal and long-form work.
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Channel
                </p>
                <p className="mt-2 text-lg font-bold text-white">
                  {channel.channelHandle}
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Feed
                </p>
                <p className="mt-2 text-lg font-bold text-white">
                  Auto-refreshing
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Focus
                </p>
                <p className="mt-2 text-lg font-bold text-white">
                  Video + audio
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href={channel.channelUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-red-500 bg-red-500 px-6 py-3 font-bold text-white transition hover:bg-red-400"
              >
                Visit Channel
              </Link>
              <Link
                href={channel.subscribeUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-zinc-700 bg-black/40 px-6 py-3 font-bold text-white transition hover:border-red-500 hover:text-red-400"
              >
                Subscribe on YouTube
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-zinc-800 bg-zinc-950/85 p-5 shadow-[0_32px_120px_rgba(0,0,0,0.45)]">
            {hasVideos ? (
              <div className="grid gap-5">
                <div className="overflow-hidden rounded-[1.75rem] border border-zinc-800 bg-black">
                  <div className="aspect-video">
                    <iframe
                      src={channel.featuredVideo?.embedUrl}
                      title={channel.featuredVideo?.title}
                      className="h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                    />
                  </div>
                  <div className="border-t border-zinc-800 p-5">
                    <p className="text-xs uppercase tracking-[0.24em] text-red-400">
                      Featured Upload
                    </p>
                    <h3 className="mt-3 text-2xl font-bold uppercase leading-tight">
                      {channel.featuredVideo?.title}
                    </h3>
                    <p className="mt-3 text-sm uppercase tracking-[0.2em] text-zinc-500">
                      {channel.featuredVideo?.publishedAt
                        ? formatYouTubeDate(channel.featuredVideo.publishedAt)
                        : null}
                    </p>
                  </div>
                </div>

                {channel.recentVideos.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-3">
                    {channel.recentVideos.map((video) => (
                      <Link
                        key={video.videoId}
                        href={video.watchUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="group overflow-hidden rounded-[1.5rem] border border-zinc-800 bg-black transition hover:border-red-500"
                      >
                        <div className="relative aspect-video overflow-hidden">
                          <Image
                            src={video.thumbnailUrl}
                            alt={video.title}
                            fill
                            className="object-cover transition duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black to-transparent" />
                        </div>
                        <div className="p-4">
                          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                            {formatYouTubeDate(video.publishedAt)}
                          </p>
                          <h4 className="mt-3 line-clamp-3 text-sm font-bold uppercase leading-6 text-white">
                            {video.title}
                          </h4>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="flex h-full flex-col justify-between rounded-[1.75rem] border border-dashed border-zinc-700 bg-[linear-gradient(160deg,rgba(24,24,27,0.98),rgba(9,9,11,1))] p-8">
                <div>
                  <PlayBadge />
                  <p className="mt-6 text-xs uppercase tracking-[0.28em] text-red-400">
                    YouTube Channel Ready
                  </p>
                  <h3 className="mt-4 text-3xl font-black uppercase leading-tight text-white">
                    The channel is linked and ready to spotlight new uploads.
                  </h3>
                  <p className="mt-5 max-w-xl text-lg leading-8 text-zinc-300">
                    Recent videos will appear here automatically as soon as the
                    public YouTube feed exposes them. Until then, the channel
                    link is live and ready for visitors.
                  </p>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-zinc-800 bg-black/60 p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                      Channel Name
                    </p>
                    <p className="mt-3 text-xl font-bold text-white">
                      {channel.channelName}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-zinc-800 bg-black/60 p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                      Feed Status
                    </p>
                    <p className="mt-3 text-xl font-bold text-white">
                      Standing by for uploads
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
