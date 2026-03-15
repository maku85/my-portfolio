"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { FaBookOpen } from "react-icons/fa";
import type { Collection } from "@/lib/stories";

interface StoriesListProps {
  collections: Collection[];
}

export default function StoriesList({ collections }: StoriesListProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-16 mt-12 mb-20 perspective-1000">
      {collections.map((collection, idx) => {
        const meta = collection.metadata;
        const title = meta?.title || collection.name.replace(/-/g, " ");
        
        const defaultColors = [
          "from-red-600 to-red-900",
          "from-blue-600 to-blue-900",
          "from-emerald-600 to-emerald-900",
          "from-amber-600 to-amber-900",
          "from-purple-600 to-purple-900",
        ];
        
        // Use meta.color if it's a tailwind-like class or a simple hint, 
        // otherwise fallback to deterministic color
        const color = meta?.color || defaultColors[idx % defaultColors.length];
        const hasCustomBg = color.startsWith("from-");

        return (
          <Link
            key={collection.name}
            href={`/stories/${collection.name}`}
            className="group relative"
          >
            <motion.div
              whileHover={{ 
                rotateY: -25, 
                x: -10,
                scale: 1.05,
                transition: { duration: 0.4, ease: "easeOut" } 
              }}
              className="relative aspect-[2/3] w-full preserve-3d transition-transform duration-500"
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Book Spine */}
              <div className="absolute left-0 top-0 bottom-0 w-[12%] bg-black/30 z-10 rounded-l-sm border-r border-white/10 shadow-[inner_2px_0_10px_rgba(0,0,0,0.5)]" />
              
              {/* Book Cover */}
              <div 
                className={`absolute inset-0 rounded-r-md rounded-l-sm shadow-2xl overflow-hidden flex flex-col p-6 items-center justify-center text-center`}
                style={{ 
                  background: !hasCustomBg ? color : undefined,
                }}
              >
                {hasCustomBg && (
                  <div className={`absolute inset-0 bg-linear-to-br ${color}`} />
                )}

                {/* Cover Image if exists */}
                {meta?.coverImage && (
                  <div className="absolute inset-0 z-0">
                    <img 
                      src={meta.coverImage} 
                      alt="" 
                      className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" 
                    />
                    <div className="absolute inset-0 bg-black/40" />
                  </div>
                )}

                {/* Texture overlay */}
                <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]" />
                
                <div className="relative z-10 mt-auto mb-auto flex flex-col items-center">
                   <FaBookOpen className="text-white/20 text-4xl mb-4" />
                   <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter leading-tight drop-shadow-lg">
                     {title}
                   </h2>
                   <div className="w-12 h-1 bg-white/30 my-4 rounded-full" />
                   <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest truncate max-w-full italic">
                     {meta?.description || `${collection.chapters.length} Capitoli`}
                   </p>
                </div>

                <div className="mt-auto w-full pt-4 border-t border-white/10 z-10">
                   <span className="text-[9px] font-black text-white/50 uppercase tracking-[0.2em]">
                     M. Cunsolo Edizioni
                   </span>
                </div>
              </div>

              {/* 3D Pages effect */}
              <div 
                className="absolute top-1 bottom-1 -right-2 w-4 bg-stone-100 rounded-r-sm shadow-md"
                style={{ 
                  transform: "rotateY(90deg) translateZ(-8px)",
                  backgroundImage: "linear-gradient(to right, #ddd 1px, transparent 1px)",
                  backgroundSize: "2px 100%"
                }}
              />
            </motion.div>
            
            {/* Shadow underneath */}
            <div className="absolute -bottom-8 left-4 right-4 h-4 bg-black/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full scale-x-90" />
          </Link>
        );
      })}

      <style jsx global>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
      `}</style>
    </div>
  );
}
