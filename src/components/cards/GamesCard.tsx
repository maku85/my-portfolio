import { useLocale, useTranslations } from "next-intl";
import { FaGamepad } from "react-icons/fa";

import Card from "@/components/Card";
import { getPathname } from "@/i18n/navigation";

export default function GamesCard() {
  const locale = useLocale();
  const t = useTranslations("GamesCard");

  return (
    <Card
      imageUrl="/games.webp"
      title={t("title")}
      text={t("text")}
      buttonHref={getPathname({ locale, href: "/games" })}
      buttonLabel={t("buttonLabel")}
      buttonIcon={<FaGamepad />}
    />
  );
}
