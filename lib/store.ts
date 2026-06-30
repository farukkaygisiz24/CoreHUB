import { promises as fs } from "fs";
import path from "path";
import { get, put } from "@vercel/blob";
import type { Article, Category } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "articles.json");
const BLOB_PATH = process.env.BLOB_ARTICLES_PATH ?? "corehub/articles.json";

function blobToken(): string | undefined {
  return process.env.BLOB_READ_WRITE_TOKEN;
}

function hasBlobStorage(): boolean {
  return Boolean(blobToken());
}

/** Vercel private store varsayılan; public store için BLOB_ACCESS=public */
function blobAccess(): "public" | "private" {
  return process.env.BLOB_ACCESS === "public" ? "public" : "private";
}

async function streamToText(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf-8");
}

function sortArticles(articles: Article[]): Article[] {
  return [...articles].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

async function loadFromBlob(): Promise<Article[]> {
  try {
    const result = await get(BLOB_PATH, {
      access: blobAccess(),
      token: blobToken(),
    });
    if (!result || result.statusCode !== 200 || !result.stream) return [];
    const text = await streamToText(result.stream);
    return JSON.parse(text) as Article[];
  } catch {
    return [];
  }
}

async function saveToBlob(articles: Article[]): Promise<void> {
  const sorted = sortArticles(articles);
  await put(BLOB_PATH, JSON.stringify(sorted, null, 2), {
    access: blobAccess(),
    token: blobToken(),
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

async function loadFromFile(): Promise<Article[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(raw) as Article[];
  } catch {
    return [];
  }
}

async function saveToFile(articles: Article[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const sorted = sortArticles(articles);
  await fs.writeFile(DATA_FILE, JSON.stringify(sorted, null, 2), "utf-8");
}

export async function loadArticles(): Promise<Article[]> {
  if (hasBlobStorage()) {
    const blobArticles = await loadFromBlob();
    if (blobArticles.length > 0) return blobArticles;
    // İlk deploy: git'teki seed JSON'dan oku (henüz blob boşsa)
    return loadFromFile();
  }
  return loadFromFile();
}

export async function saveArticles(articles: Article[]): Promise<void> {
  if (hasBlobStorage()) return saveToBlob(articles);
  return saveToFile(articles);
}

export async function getByCategory(category: Category): Promise<Article[]> {
  const all = await loadArticles();
  return all.filter((a) => a.category === category);
}

export async function getById(id: string): Promise<Article | undefined> {
  const all = await loadArticles();
  return all.find((a) => a.id === id);
}

const LATEST_NEWS_LIMIT = 6;

/** Siteye en son eklenen haberler (ingestedAt), isteğe bağlı ID hariç tutma. */
export function getLatestArticles(
  articles: Article[],
  limit = LATEST_NEWS_LIMIT,
  excludeIds: Set<string> = new Set(),
): Article[] {
  return [...articles]
    .filter((a) => !excludeIds.has(a.id))
    .sort((a, b) => new Date(b.ingestedAt).getTime() - new Date(a.ingestedAt).getTime())
    .slice(0, limit);
}
