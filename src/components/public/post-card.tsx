import Link from "next/link";
import { format } from "date-fns";
import { safeMediaUrl } from "@/lib/safe-url";

type PostCardProps = {
  title: string;
  slug: string;
  excerpt?: string;
  coverImage?: string;
  publishedAt?: string | Date | null;
  readingTime?: number;
  authorName?: string;
};

export function PostCard({
  title,
  slug,
  excerpt,
  coverImage,
  publishedAt,
  readingTime,
  authorName,
}: PostCardProps) {
  const image = safeMediaUrl(coverImage);

  return (
    <article className="group">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt=""
          className="mb-4 aspect-[16/10] w-full object-cover"
        />
      ) : (
        <div className="mb-4 aspect-[16/10] w-full bg-stone-200" />
      )}
      <h2 className="text-xl font-semibold tracking-tight text-stone-900 group-hover:underline">
        <Link href={`/blog/${slug}`}>{title}</Link>
      </h2>
      {excerpt ? <p className="mt-2 text-sm leading-6 text-stone-600">{excerpt}</p> : null}
      <p className="mt-3 text-xs text-stone-500">
        {authorName ? `${authorName} · ` : ""}
        {publishedAt ? format(new Date(publishedAt), "MMM d, yyyy") : ""}
        {readingTime ? ` · ${readingTime} min read` : ""}
      </p>
    </article>
  );
}
