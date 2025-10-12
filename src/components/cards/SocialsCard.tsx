import { useTranslations } from "next-intl";

import Card from "@/components/Card";
import { socials } from "@/data/socials";

export default function SocialsCard() {
  const t = useTranslations("SocialsCard");

  return (
    <Card title={t("title")} subtitle={t("subtitle")} text={t("text")}>
      <div className="mx-auto flex gap-4 mt-2">
        {socials.map((social) => (
          <a
            key={social.name}
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            title={social.name}
            className={`text-${social.color} dark:text-blue-200 hover:text-accent transition text-3xl`}
          >
            <social.icon />
          </a>
        ))}
      </div>
    </Card>
  );
}
