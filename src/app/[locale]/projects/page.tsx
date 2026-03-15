"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import {
  FaArrowLeft,
  FaCode,
  FaFolderOpen,
  FaGamepad,
  FaGithub,
  FaServer,
} from "react-icons/fa";

import CardMasonry from "@/components/CardMasonry";
import ProjectCard from "@/components/cards/ProjectCard";
import { projects } from "@/data/projects";

export default function Projects() {
  const t = useTranslations("ProjectsPage");

  return (
    <main className="pt-8 pb-12 px-4">
      <div className="mt-10 mb-8 flex flex-col items-center">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-2 text-center italic tracking-tighter">
              {t("title")}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-center max-w-md">
              {t("subtitle")}
          </p>
      </div>

      <div className="mb-12">
        <Link 
          href="/"
          className="mb-8 flex items-center gap-2 text-primary hover:text-accent transition-colors font-bold uppercase text-xs tracking-widest"
        >
          <FaArrowLeft /> {t("backToHome")}
        </Link>
      </div>

      {projects.length === 0 && (
        <div className="text-center text-gray-600 dark:text-blue-200 mt-20">
          <p className="text-2xl mb-4">{t("noProjects")}</p>
          <p className="mb-2">{t("checkBackLater")}</p>
          <div className="flex justify-center space-x-4 mt-4">
            <FaCode size={40} />
            <FaFolderOpen size={40} />
            <FaGamepad size={40} />
            <FaGithub size={40} />
            <FaServer size={40} />
          </div>
        </div>
      )}

      <CardMasonry
        cards={projects.map((project) => () => (
          <ProjectCard
            key={project.name}
            imageUrl={project.imageUrl}
            title={project.name}
            text={project.description}
            buttonLabel={project.buttonLabel}
            buttonIcon={project.buttonIcon}
            buttonHref={project.buttonHref}
          />
        ))}
      />
    </main>
  );
}
