import Image from "next/image.js";
import Link from "next/link";
import type React from "react";
import { useEffect, useState } from "react";

interface CardProps {
  className?: string;
  imageUrl?: string;
  backgroundImageUrl?: string;
  title?: string;
  subtitle?: string;
  text?: string;
  children?: React.ReactNode;
  buttonLabel?: string;
  buttonIcon?: React.ReactNode;
  buttonOnClick?: () => void;
  buttonHref?: string;
}

export default function Card({
  className = "",
  imageUrl,
  backgroundImageUrl,
  title,
  subtitle,
  text,
  children,
  buttonLabel,
  buttonIcon,
  buttonOnClick,
  buttonHref,
}: CardProps) {
  const [external, setExternal] = useState(false);

  useEffect(() => {
    if (buttonHref && typeof window !== "undefined") {
      setExternal(
        /^https?:\/\//.test(buttonHref) &&
          !buttonHref.includes(window.location.hostname),
      );
    }
  }, [buttonHref]);

  return (
    <div
      className={`relative bg-white rounded-md shadow-sm overflow-hidden transition hover:shadow-lg hover:-translate-y-1 duration-300 flex flex-col ${className}`}
    >
      {imageUrl && (
        <Image
          src={imageUrl}
          alt={title || subtitle || "Card image"}
          width={400}
          height={200}
          className="w-full object-cover"
          priority
          draggable={false}
          unoptimized
        />
      )}

      {backgroundImageUrl && (
        <>
          <div
            role="img"
            aria-label={title || subtitle || "Card image"}
            className="absolute inset-0 w-full h-full object-cover blur-xs bg-center bg-cover"
            style={{ backgroundImage: `url(${backgroundImageUrl})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/50 to-transparent" />
        </>
      )}

      {title || subtitle || text || children || buttonLabel ? (
        <div className="relative p-6 flex flex-col gap-2 flex-1">
          {title && <h3 className="text-2xl font-bold">{title}</h3>}
          {subtitle && (
            <h4 className="text-md font-semibold text-gray-800">{subtitle}</h4>
          )}
          {text && <p className="text-gray-500 text-sm">{text}</p>}
          {children}
          {buttonLabel &&
            (buttonHref ? (
              external ? (
                <a
                  href={buttonHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center justify-center px-4 py-2 bg-primary text-white rounded-md font-semibold hover:bg-accent transition"
                >
                  {buttonIcon && <span className="mr-2">{buttonIcon}</span>}
                  {buttonLabel}
                </a>
              ) : (
                <Link
                  href={buttonHref}
                  className="mt-4 inline-flex items-center justify-center px-4 py-2 bg-primary text-white rounded-md font-semibold hover:bg-accent transition"
                >
                  {buttonIcon && <span className="mr-2">{buttonIcon}</span>}
                  {buttonLabel}
                </Link>
              )
            ) : (
              <button
                type="button"
                onClick={buttonOnClick}
                className="mt-4 inline-flex items-center justify-center px-4 py-2 bg-primary text-white rounded-md font-semibold hover:bg-primary-dark transition"
              >
                {buttonIcon && <span className="mr-2">{buttonIcon}</span>}
                {buttonLabel}
              </button>
            ))}
        </div>
      ) : null}
    </div>
  );
}
