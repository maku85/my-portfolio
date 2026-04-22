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
    imageUrl: "/projects/cineshpere.webp",
    name: "CineSphere",
    description:
      "Movies and TV shows discovery app using The Movie Database API.",
    buttonLabel: "View demo",
    buttonIcon: null,
    buttonHref: "https://pegasus-chi-jade.vercel.app",
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
    imageUrl: "/projects/rested-minds.webp",
    name: "Rested Minds",
    description: "Psychology and mental health website.",
    buttonLabel: "View site",
    buttonIcon: null,
    buttonHref: "https://www.silviarecchionepsicologa.com/",
  },
  {
    imageUrl: "/projects/solkai.webp",
    name: "Solkai",
    description: "Premium padel rackets web shop.",
    buttonLabel: "View site",
    buttonIcon: null,
    buttonHref: "https://www.solkaisports.com/",
  },
];
