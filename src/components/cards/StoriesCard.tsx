import { useTranslations } from "next-intl";
import { FaBookOpen } from "react-icons/fa";

import Card from "@/components/Card";

export default function StoriesCard() {
  const t = useTranslations("StoriesCard");

  return (
    <Card
      title={t("title")}
      imageUrl="/writing.webp"
      text={t("text")}
      buttonLabel={t("buttonLabel")}
      buttonHref="/stories"
      buttonIcon={<FaBookOpen />}
    />
  );
}
