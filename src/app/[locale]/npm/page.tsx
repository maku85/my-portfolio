"use client";

import CardMasonry from "@/components/CardMasonry";
import { NpmCard } from "@/components/cards/NpmCard";
import { libraries } from "@/data/libraries";

export default function NpmProjects() {
  return (
    <main className="pt-8 pb-12 px-4">
      <CardMasonry
        cards={libraries.map((project) => () => (
          <NpmCard key={project.name} project={project} />
        ))}
      />
    </main>
  );
}
