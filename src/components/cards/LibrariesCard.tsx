import { useTranslations } from "next-intl";
import { FaNpm } from "react-icons/fa";

import Card from "@/components/Card";
import { libraries } from "@/data/libraries";

export default function LibrariesCard() {
  const t = useTranslations("LibrariesCard");

  return (
    <Card
      title={t("title")}
      subtitle={t("subtitle")}
      text={t("text")}
      buttonHref="/npm"
      buttonLabel={t("buttonLabel")}
      buttonIcon={<FaNpm />}
    >
      <div className="flex flex-col gap-2 mt-2">
        <ul className="list-disc list-inside text-gray-700 mb-2">
          {libraries.slice(0, 3).map((lib) => (
            <li key={lib.name}>
              <span className="font-semibold text-primary">{lib.name}</span>
              <span className="text-sm text-gray-500 ml-2">
                {lib.description}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
