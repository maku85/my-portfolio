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
    imageUrl: "/projects/project1.png",
    name: "CineSphere",
    description:
      "A movies and TV shows discovery app using The Movie Database API.",
    buttonLabel: "View demo",
    buttonIcon: null,
    buttonHref: "https://pegasus-chi-jade.vercel.app",
  },
];
