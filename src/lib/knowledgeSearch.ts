import rawKnowledgeIndex from "@/data/knowledgeIndex.json";
import type { KnowledgeChunk, KnowledgeMatch } from "@/types/interpretation";

const knowledgeIndex = rawKnowledgeIndex as KnowledgeChunk[];

function normalizeKeyword(keyword: string): string {
  return keyword.trim().toLowerCase();
}

function uniqueKeywords(keywords: string[]): string[] {
  return Array.from(
    new Set(
      keywords
        .map(normalizeKeyword)
        .filter((keyword) => keyword.length > 0),
    ),
  );
}

function scoreChunk(chunk: KnowledgeChunk, keywords: string[]): number {
  const text = `${chunk.sourceTitle} ${chunk.headingPath.join(" ")} ${chunk.text}`.toLowerCase();
  const chunkKeywords = new Set(chunk.keywords.map(normalizeKeyword));

  return keywords.reduce((score, keyword) => {
    if (chunkKeywords.has(keyword)) {
      return score + 8;
    }

    if (chunk.headingPath.some((heading) => heading.toLowerCase().includes(keyword))) {
      return score + 6;
    }

    if (chunk.sourceTitle.toLowerCase().includes(keyword)) {
      return score + 4;
    }

    if (text.includes(keyword)) {
      return score + 3;
    }

    return score;
  }, 0);
}

export function searchKnowledge(keywords: string[], limit = 6): KnowledgeMatch[] {
  const normalizedKeywords = uniqueKeywords(keywords);

  if (normalizedKeywords.length === 0 || knowledgeIndex.length === 0) {
    return [];
  }

  return knowledgeIndex
    .map((chunk) => ({
      chunk,
      score: scoreChunk(chunk, normalizedKeywords),
    }))
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score || a.chunk.id.localeCompare(b.chunk.id))
    .slice(0, limit);
}

export function getKnowledgeIndexSize(): number {
  return knowledgeIndex.length;
}
