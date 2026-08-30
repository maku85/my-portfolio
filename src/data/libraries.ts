export interface Library {
  name: string;
  installCommand: string;
  description: string;
  link: string;
}

export const libraries: Library[] = [
  {
    name: "orvaxis",
    installCommand: "npm install orvaxis",
    description:
      "Lightweight, policy-driven execution runtime for Node.js applications.",
    link: "https://github.com/maku85/orvaxis",
  },
  {
    name: "vemora",
    installCommand: "npm install vemora",
    description: "Repository-local memory system for LLM-assisted development.",
    link: "https://github.com/maku85/vemora",
  },
  {
    name: "mongoose-lens",
    installCommand: "npm install mongoose-lens",
    description:
      "Slow query interceptor and index advisor for Mongoose 8+. Automatically runs explain() on slow queries, detects COLLSCAN/SORT stages, and suggests optimal indexes following the ESR rule.",
    link: "https://github.com/maku85/mongoose-lens",
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
  },
  {
    name: "awilix-graph",
    installCommand: "npm install awilix-graph",
    description:
      "CLI and library to inspect an Awilix DI container and generate visual dependency graphs (Mermaid, DOT, JSON, HTML).",
    link: "https://github.com/maku85/awilix-graph",
  },
  {
    name: "stripe-test-utils",
    installCommand: "npm install stripe-test-utils",
    description:
      "Test utilities for Node.js + Stripe - type-safe event factories, signed webhooks, scenario builders, and Jest/Vitest matchers.",
    link: "https://github.com/maku85/stripe-test-utils",
  },
];
