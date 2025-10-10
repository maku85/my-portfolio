import { useTranslations } from "next-intl";

import Card from "@/components/Card";
import { skills } from "@/data/skills";

export default function SkillsCard() {
  const t = useTranslations("SkillsCard");

  return (
    <Card title={t("title")} subtitle={t("subtitle")} text={t("text")}>
      <div className="flex flex-wrap gap-2 mt-2">
        {skills.map((skill) => (
          <span
            key={skill}
            className="px-3 py-1 bg-primary text-white rounded-full text-sm font-semibold"
          >
            {skill}
          </span>
        ))}
      </div>
    </Card>
  );
}
