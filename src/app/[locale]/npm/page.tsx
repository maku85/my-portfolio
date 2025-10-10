"use client";

import CardMasonry from "@/components/CardMasonry";
import { NpmCard } from "@/components/cards/NpmCard";
import { libraries } from "@/data/libraries";

export default function NpmProjects() {
  return (
    <main>
      <CardMasonry
        cards={libraries.map((project) => () => (
          <NpmCard key={project.name} project={project} />
        ))}
        shuffleLabel="Shake!"
      />
    </main>
  );
}
