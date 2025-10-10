import { useEffect, useState } from "react";
import { FaRss } from "react-icons/fa";

import Card from "@/components/Card";

function parseRSS(xml: string) {
  const parser = new window.DOMParser();
  const doc = parser.parseFromString(xml, "application/xml");
  const items = Array.from(doc.querySelectorAll("item")).slice(0, 5);
  return items.map((item) => {
    const title = item.querySelector("title")?.textContent || "";
    const link =
      item.querySelector("link")?.textContent ||
      item.querySelector("guid")?.textContent ||
      "";
    return { title, link };
  });
}

const DevNewsCard: React.FC = () => {
  const [news, setNews] = useState<{ title: string; link: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/devnews")
      .then((res) => res.json())
      .then((data) => {
        setNews(parseRSS(data.xml));
      })
      .catch(() => setError("Impossibile caricare le notizie."));
  }, []);

  return (
    <Card
      title="Dev News"
      subtitle="Ultime dal mondo sviluppo"
      text="Le ultime notizie dal feed webdev:"
      buttonLabel="Altri articoli"
      buttonIcon={<FaRss />}
      buttonHref="https://dev.to/t/webdev"
    >
      <div className="mt-2">
        {error && <span className="text-red-500 text-sm">{error}</span>}
        {!error && news.length === 0 && (
          <span className="text-gray-400 text-sm">Caricamento...</span>
        )}
        <ul className="list-disc list-inside text-gray-700">
          {news.map((item) => (
            <li key={item.link} className="mb-1">
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-secondary hover:underline"
              >
                {item.title}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
};

export default DevNewsCard;
