interface Project {
  imageUrl: string;
  name: string;
  description?: string;
  buttonLabel: string;
  buttonIcon?: React.ReactNode;
  buttonHref: string;
}

export const projects: Project[] = [];
