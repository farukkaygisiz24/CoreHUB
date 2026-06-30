import { cn } from "@/lib/utils";

// Kaynak sitelerinden gelen görseller onlarca farklı CDN'de olabilir;
// next/image remotePatterns yerine doğrudan <img> kullanıyoruz.
export default function ArticleImage({
  src,
  alt,
  fill,
  priority,
  className,
}: {
  src: string;
  alt: string;
  fill?: boolean;
  priority?: boolean;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={cn(fill && "absolute inset-0 h-full w-full object-cover", className)}
    />
  );
}
