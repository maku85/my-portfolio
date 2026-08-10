import Image from "next/image";
import type React from "react";

interface ProjectCardProps {
  imageUrl?: string;
  title?: string;
  subtitle?: string;
  text?: string;
  buttonLabel?: string;
  buttonIcon?: React.ReactNode;
  buttonHref?: string;
}

export default function ProjectCard({
  imageUrl,
  title,
  subtitle,
  text,
  buttonLabel,
  buttonIcon,
  buttonHref,
}: ProjectCardProps) {
  return (
    <div className="relative rounded-xl shadow-md overflow-hidden transition hover:shadow-lg hover:-translate-y-1 duration-300 h-80 flex">
      {imageUrl && (
        <Image
          src={imageUrl}
          alt={title || subtitle || "Project image"}
          fill
          sizes="(min-width: 768px) 33vw, 100vw"
          className="absolute inset-0 object-cover"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      <div className="relative z-10 flex flex-col justify-end h-full w-full p-6">
        {title && (
          <h3 className="text-xl font-bold text-white mb-1">{title}</h3>
        )}
        {subtitle && (
          <h4 className="text-md font-semibold text-primary mb-1">
            {subtitle}
          </h4>
        )}
        {text && <p className="text-gray-200 text-sm mb-2">{text}</p>}
        {buttonLabel && buttonHref && (
          <a
            href={buttonHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-3 py-1 bg-primary text-white text-sm font-medium rounded hover:bg-secondary transition"
          >
            {buttonIcon && <span className="mr-2">{buttonIcon}</span>}
            {buttonLabel}
          </a>
        )}
      </div>
    </div>
  );
}
