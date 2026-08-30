import { useLocale, useTranslations } from "next-intl";
import { FaServer } from "react-icons/fa";

import Card from "@/components/Card";
import { documentedAreas, skillsForArea } from "@/data/competencies";
import { currentFocus } from "@/data/engineering";
import { localize } from "@/data/localized";

export default function EngineeringCard() {
  const t = useTranslations("EngineeringCard");
  const locale = useLocale();

  return (
    <Card
      title={t("title")}
      subtitle={t("subtitle")}
      text={t("text")}
      buttonHref="/engineering"
      buttonLabel={t("buttonLabel")}
      buttonIcon={<FaServer aria-hidden />}
    >
      <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
        {documentedAreas.map((area) => (
          <div key={area.slug}>
            <dt className="text-base font-semibold text-primary">
              {area.title}
            </dt>
            <dd className="mt-1 text-sm text-gray-500 dark:text-gray-300">
              {skillsForArea(area.slug)
                .map((skill) => skill.title)
                .join(", ")}
            </dd>
          </div>
        ))}
      </dl>

      {currentFocus.length > 0 && (
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-300">
          {t("exploringLabel")}:{" "}
          {currentFocus.map((f) => localize(f, locale)).join(", ")}
        </p>
      )}
    </Card>
  );
}
