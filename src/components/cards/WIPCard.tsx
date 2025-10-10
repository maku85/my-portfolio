import { useTranslations } from "next-intl";
import { FaGithub } from "react-icons/fa";

import Card from "@/components/Card";

export default function WIPCard() {
  const t = useTranslations("WIPCard");

  return (
    <Card
      imageUrl="/wip.webp"
      title={t("title")}
      subtitle={t("subtitle")}
      text={t("text")}
      buttonHref="https://github.com/maku85"
      buttonLabel={t("buttonLabel")}
      buttonIcon={<FaGithub />}
    />
  );
}
