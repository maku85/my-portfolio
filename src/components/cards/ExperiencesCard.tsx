import { useTranslations } from "next-intl";
import { FaLinkedin } from "react-icons/fa";

import Card from "@/components/Card";
import { experiences } from "@/data/experiences";

export default function ExperiencesCard() {
  const t = useTranslations("ExperiencesCard");

  return (
    <Card
      imageUrl="/experiences.webp"
      title={t("title")}
      subtitle={t("subtitle")}
      text={t("text")}
      buttonHref="https://www.linkedin.com/in/mauro-cunsolo"
      buttonLabel={t("buttonLabel")}
      buttonIcon={<FaLinkedin />}
    >
      <ul className="list-disc list-inside text-gray-700 mt-2">
        {experiences.map((exp) => (
          <li key={exp.role}>
            <span className="font-semibold text-primary">{exp.role}</span> -{" "}
            {exp.company} ({exp.period})
            <br />
            <span className="text-sm text-gray-500">{exp.description}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
