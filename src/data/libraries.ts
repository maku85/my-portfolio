export interface Library {
  name: string;
  installCommand: string;
  description: string;
  link: string;
}

export const libraries: Library[] = [
  {
    name: "vemora",
    installCommand: "npm install vemora",
    description: "Repository-local memory system for LLM-assisted development.",
    link: "https://github.com/maku85/vemora",
  },
  {
    name: "mongoose-currency-convert",
    installCommand: "npm install mongoose-currency-convert",
    description:
      "A lightweight Mongoose plugin for automatic currency conversion at save time - flexible, extensible, and service-agnostic.",
    link: "https://github.com/maku85/mongoose-currency-convert",
  },
  {
    name: "mongoose-currency-convert-ecb",
    installCommand: "npm install mongoose-currency-convert-ecb",
    description: "ECB currency rate provider for mongoose-currency-converter.",
    link: "https://github.com/maku85/mongoose-currency-convert-ecb",
  }
];
