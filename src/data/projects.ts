interface Project {
  imageUrl: string;
  name: string;
  description?: string;
  buttonLabel: string;
  buttonIcon?: React.ReactNode;
  buttonHref: string;
}

export const projects: Project[] = [
  {
    imageUrl: "/projects/rowseven.webp",
    name: "Row Seven",
    description:
      "Discover movies and TV series, see where to stream them and keep a watchlist.",
    buttonLabel: "View site",
    buttonIcon: null,
    buttonHref: "https://rowseven.netlify.app/",
  },
  {
    imageUrl: "/projects/mindutrition.webp",
    name: "Mindutrition",
    description: "Nutrition coaching website.",
    buttonLabel: "View site",
    buttonIcon: null,
    buttonHref: "https://www.mindutrition.li/",
  },
  {
    imageUrl: "/projects/solkai.webp",
    name: "Solkai",
    description: "Premium padel rackets web shop.",
    buttonLabel: "View site",
    buttonIcon: null,
    buttonHref: "https://www.solkaisports.com/",
  },
  {
    imageUrl: "/projects/benchyx.webp",
    name: "Benchyx",
    description:
      "Free online developer tools: JSON, JWT, regex, diff, and more.",
    buttonLabel: "View site",
    buttonIcon: null,
    buttonHref: "https://maku85.github.io/benchyx/",
  },
  {
    imageUrl: "/projects/the-card-club.webp",
    name: "The Card Club",
    description:
      "Card game rules in Italian: searchable catalog, score keeper and offline PWA.",
    buttonLabel: "View site",
    buttonIcon: null,
    buttonHref: "https://thecardclub.netlify.app/",
  },
];
