import { useTranslations } from "next-intl";

import Card from "@/components/Card";

export default function AboutCard() {
  const t = useTranslations("AboutCard");

  return (
    <Card imageUrl="/about.webp" title={t("title")} text={t("text")}>
      <ul className="mt-4 space-y-2">
        <li className="flex items-center gap-2 font-semibold px-3 py-2 border-b border-gray-200">
          🚀 <span className="text-gray-700 font-normal dark:text-blue-200">{t("curiosity")}</span>
        </li>
        <li className="flex items-center gap-2 font-semibold px-3 py-2 border-b border-gray-200">
          🎯{" "}
          <span className="text-gray-700 font-normal dark:text-blue-200">
            {t("specialization")}
          </span>
        </li>
        <li className="flex items-center gap-2 font-semibold px-3 py-2">
          💡 <span className="text-gray-700 font-normal dark:text-blue-200">{t("belief")}</span>
        </li>
      </ul>
    </Card>
  );
}
