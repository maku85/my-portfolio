"use client";

import { useTranslations } from "next-intl";
import {
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
    <main className="pb-12 px-4">
      {projects.length === 0 && (
        <div className="text-center text-gray-600 mt-20">
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
        shuffleLabel="Shake!"
      />
    </main>
  );
}
