"use client"

import { useState, useEffect, useRef } from "react"

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export default function LazyImage({
  src,
  alt,
  className,
  onLoad,
  onError
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
 
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = imgRef.current;
            if (img) {
              img.src = src;
              observer.unobserve(img);
            }
          }
        });
      },
      { rootMargin: '50px' }
    );
   
    if (imgRef.current) {
      observer.observe(imgRef.current);
    }
   
    return () => observer.disconnect();
  }, [src]);
 
  return (
    <>
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-600"></div>
        </div>
      )}
      <img
        ref={imgRef}
        src=""
        data-src={src}
        alt={alt}
        className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => {
          setIsLoaded(true);
          onLoad?.();
        }}
        onError={() => {
          setIsLoaded(true);
          onError?.();
        }}
        loading="lazy"
      />
    </>
  );
}