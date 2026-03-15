"use client";

import { useTranslations } from "next-intl";
import { FaGamepad } from "react-icons/fa";
import Card from "@/components/Card";

export default function GamesCard() {
  const t = useTranslations("GamesCard");

  return (
    <Card
      title={t("title")}
      imageUrl="/games.webp"
      text={t("text")}
      buttonLabel={t("buttonLabel")}
      buttonIcon={<FaGamepad />}
      buttonHref="/games"
    >
      <div className="absolute top-4 right-4 text-white/20 text-6xl rotate-12">
        <FaGamepad />
      </div>
    </Card>
  );
}
