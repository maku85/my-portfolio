import { easeInOut, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

import type { Library } from "@/data/libraries";

const cardVariants = {
  initial: { opacity: 0, y: 24 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: easeInOut },
  },
};

export function NpmCard({ project }: { project: Library }) {
  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover={{
        boxShadow: "0 0 24px #2563eb55",
        borderColor: "#2563eb",
        scale: 1.02,
      }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      style={{ fontFamily: "monospace" }}
    >
      <Link
        href={project.link}
        className="group bg-[#18181b] border border-gray-800 rounded-xl shadow-sm overflow-hidden flex flex-col"
      >
        <div className="px-6 pt-6 pb-4">
          <span className="text-lg font-bold text-primary mb-2 block">
            {project.name}
          </span>
          <div className="bg-[#23272e] rounded-md px-4 py-2 text-sm text-gray-100 mb-4 select-all">
            <span className="text-green-400">$</span> {project.installCommand}
          </div>
          <div className="text-gray-300 text-sm mb-4">
            {project.description}
          </div>
          <div className="flex space-x-2">
            <span>
              <Image
                src={`https://img.shields.io/npm/v/${project.name}?style=flat-square`}
                alt="npm version"
                width={80}
                height={20}
                unoptimized
                className="ratio-3/2"
              />
            </span>
            <span>
              <Image
                src={`https://img.shields.io/npm/dm/${project.name}?style=flat-square`}
                alt="npm downloads"
                width={140}
                height={20}
                unoptimized
                className="ratio-3/2"
              />
            </span>
            <span>
              <Image
                src={`https://img.shields.io/github/stars/maku85/${project.name}?style=flat-square`}
                alt="GitHub stars"
                width={54}
                height={20}
                unoptimized
                className="ratio-3/2"
              />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
