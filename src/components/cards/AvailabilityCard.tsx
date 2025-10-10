import { useTranslations } from "next-intl";
import { FaHandshake } from "react-icons/fa";

import Card from "@/components/Card";

export default function AvailabilityCard() {
  const t = useTranslations("AvailabilityCard");

  return (
    <Card
      title={t("title")}
      subtitle={t("subtitle")}
      text={t("text")}
      buttonLabel={t("buttonLabel")}
      buttonIcon={<FaHandshake />}
      buttonHref="mailto:"
    >
      <div className="mt-2 text-green-700 font-semibold">
        🚀 {t("opportunity")}
      </div>
    </Card>
  );
}
