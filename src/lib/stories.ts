import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const storiesRootDirectory = path.join(process.cwd(), "src/data/stories");

export interface StoryFrontmatter {
  title: string;
  excerpt: string;
  coverImage?: string;
  date?: string;
}

export interface Story {
  slug: string;
  frontmatter: StoryFrontmatter;
  content: string;
  collection: string;
  lang: string;
}

export interface CollectionMetadata {
  title?: string;
  description?: string;
  coverImage?: string;
  color?: string;
}

export interface Chapter {
  filename: string;
  slug: string;
  frontmatter: StoryFrontmatter;
  content: string;
}

export interface Collection {
  name: string;
  chapters: Chapter[];
  lang: string;
  metadata?: CollectionMetadata;
}

export function getCollectionsAndChapters(lang: string): Collection[] {
  const langPath = path.join(storiesRootDirectory, lang);
  if (!fs.existsSync(langPath)) return [];
  const collections = fs.readdirSync(langPath).filter((c) => fs.statSync(path.join(langPath, c)).isDirectory());
  return collections.map((collection) => {
    const collectionPath = path.join(langPath, collection);
    
    // Load metadata if exists
    let metadata: CollectionMetadata | undefined;
    const metaPath = path.join(collectionPath, "metadata.json");
    if (fs.existsSync(metaPath)) {
      try {
        metadata = JSON.parse(fs.readFileSync(metaPath, "utf8"));
      } catch (e) {
        console.error(`Error parsing metadata for collection ${collection}:`, e);
      }
    }

    const chapters = fs
      .readdirSync(collectionPath)
      .filter((file) => file.endsWith(".md"))
      .map((filename) => {
        const filePath = path.join(collectionPath, filename);
        const file = fs.readFileSync(filePath, "utf8");
        const { data, content } = matter(file);
        return {
          filename,
          slug: filename.replace(/\.md$/, ""),
          frontmatter: data as StoryFrontmatter,
          content,
        };
      });
    return {
      name: collection,
      chapters,
      lang,
      metadata,
    };
  });
}

export function getChapterByPath(lang: string, collection: string, slug: string): Chapter | null {
  const filePath = path.join(storiesRootDirectory, lang, collection, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const file = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(file);
  return {
    filename: `${slug}.md`,
    slug,
    frontmatter: data as StoryFrontmatter,
    content,
  };
}
