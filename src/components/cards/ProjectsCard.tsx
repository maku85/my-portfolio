import { useTranslations } from "next-intl";
import { FaFolderOpen } from "react-icons/fa";

import Card from "@/components/Card";

export default function ProjectsCard() {
  const t = useTranslations("ProjectsCard");

  return (
    <Card
      imageUrl="/lab.webp"
      title={t("title")}
      text={t("text")}
      buttonHref="/projects"
      buttonLabel={t("buttonLabel")}
      buttonIcon={<FaFolderOpen />}
    ></Card>
  );
}
