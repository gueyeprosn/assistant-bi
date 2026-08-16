import Image from "next/image";

type ImgProps = {
  className?: string;
  alt?: string;
  priority?: boolean;
};

export function Logo({ className = "h-9 w-9", alt = "", priority = false }: ImgProps) {
  return (
    <Image
      src="/brand/icon.png"
      alt={alt}
      width={72}
      height={72}
      priority={priority}
      className={`object-contain ${className}`}
    />
  );
}

export function BrandLockup({
  light = false,
  className = "h-10",
  priority = false,
}: {
  light?: boolean;
  className?: string;
  priority?: boolean;
}) {
  const src = light ? "/brand/logo-reverse.png" : "/brand/logo.png";
  return (
    <Image
      src={src}
      alt="Assistant Bi"
      width={880}
      height={232}
      priority={priority}
      className={`w-auto object-contain object-left ${className}`}
    />
  );
}

export function BrandMono({ className = "h-10" }: { className?: string }) {
  return (
    <Image
      src="/brand/logo-mono.png"
      alt="Assistant Bi"
      width={880}
      height={232}
      className={`w-auto object-contain object-left ${className}`}
    />
  );
}
