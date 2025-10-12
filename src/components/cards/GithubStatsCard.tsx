import Image from "next/image";
import { useTranslations } from "next-intl";

import Card from "@/components/Card";

export default function GithubStatsCard() {
  const t = useTranslations("GithubStatsCard");

  return (
    <Card title={t("title")}>
      <Image
        src="https://github-readme-stats.vercel.app/api?username=maku85&show_icons=true&theme=shadow_blue&hide_border=true"
        alt="GitHub Stats"
        width={500}
        height={200}
        className="rounded-lg shadow dark:bg-gray-800"
        unoptimized
      />
      <div className="mt-4">
        <Image
          src="https://github-readme-streak-stats.herokuapp.com/?user=maku85&theme=shadow_blue&hide_border=true"
          alt="GitHub Streak"
          width={500}
          height={200}
          className="rounded-lg shadow dark:bg-gray-800"
          unoptimized
        />
      </div>
    </Card>
  );
}
