export interface NativeImageProps {
  src: string;
  alt: string;
  fill: boolean;
  width?: number;
  height?: number;
  className?: string;
  onLoad: () => void;
  onError: () => void;
}

/** Native img 요소 - Local URL 또는 Supabase URL용 */
export function NativeImage({ src, alt, fill, width, height, className, onLoad, onError }: NativeImageProps) {
  const imgClassName = fill
    ? `absolute inset-0 w-full h-full object-cover ${className ?? ''}`
    : className;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      className={imgClassName}
      onLoad={onLoad}
      onError={onError}
    />
  );
}
