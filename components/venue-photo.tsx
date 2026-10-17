import Image from "next/image";
import { ImageOff } from "lucide-react";

export function VenuePhoto({
  src,
  alt,
  sizes,
}: {
  src: string;
  alt: string;
  sizes: string;
}) {
  if (!src.trim()) {
    return (
      <div className="venue-photo-placeholder" role="img" aria-label={`${alt}: photo coming soon`}>
        <ImageOff size={24} aria-hidden="true" />
        <span>Photo coming soon</span>
      </div>
    );
  }

  return <Image src={src} alt={alt} fill sizes={sizes} />;
}
