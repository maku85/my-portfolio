import type { IconType } from "react-icons";
import { FaCodepen, FaGithub, FaLinkedin, FaNpm } from "react-icons/fa";

interface Social {
  name: string;
  url: string;
  color: string;
  icon: IconType;
}

export const socials: Social[] = [
  {
    name: "GitHub",
    url: "https://github.com/maku85",
    color: "gray-800",
    icon: FaGithub,
  },
  {
    name: "LinkedIn",
    url: "https://www.linkedin.com/in/mauro-cunsolo/",
    color: "blue-700",
    icon: FaLinkedin,
  },
  {
    name: "npm",
    url: "https://www.npmjs.com/~maku85",
    color: "red-600",
    icon: FaNpm,
  },
  {
    name: "CodePen",
    url: "https://codepen.io/maku85",
    color: "black",
    icon: FaCodepen,
  },
];
