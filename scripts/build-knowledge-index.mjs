import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const knowledgeDir = path.join(projectRoot, "紫微斗数王亭之");
const outputPath = path.join(projectRoot, "src", "data", "knowledgeIndex.json");

const KEYWORDS = [
  "命宫",
  "身宫",
  "兄弟",
  "夫妻",
  "子女",
  "财帛",
  "疾厄",
  "迁移",
  "交友",
  "仆役",
  "官禄",
  "事业",
  "田宅",
  "福德",
  "父母",
  "大限",
  "流年",
  "流月",
  "流日",
  "流时",
  "三方四正",
  "四化",
  "化禄",
  "化权",
  "化科",
  "化忌",
  "紫微",
  "天机",
  "太阳",
  "武曲",
  "天同",
  "廉贞",
  "天府",
  "太阴",
  "贪狼",
  "巨门",
  "天相",
  "天梁",
  "七杀",
  "破军",
  "左辅",
  "右弼",
  "文昌",
  "文曲",
  "天魁",
  "天钺",
  "禄存",
  "天马",
  "擎羊",
  "陀罗",
  "火星",
  "铃星",
  "地空",
  "地劫",
  "庙",
  "旺",
  "陷",
  "平",
  "得",
  "利",
];

function cleanText(value) {
  return value
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function getSourceTitle(fileName, content) {
  const match = /^#\s+(.+)$/m.exec(content);
  return cleanText(match?.[1] ?? fileName.replace(/\.md$/i, ""));
}

function getKeywords(text, headingPath) {
  const haystack = `${headingPath.join(" ")} ${text}`;
  return KEYWORDS.filter((keyword) => haystack.includes(keyword));
}

function pushChunk(chunks, fileName, sourceTitle, headingPath, text) {
  const cleanedText = cleanText(text);

  if (cleanedText.length < 20) {
    return;
  }

  const keywords = getKeywords(cleanedText, headingPath);

  chunks.push({
    id: `${fileName.replace(/\.md$/i, "")}-${chunks.length + 1}`,
    sourceTitle,
    headingPath,
    text: cleanedText.slice(0, 900),
    keywords,
  });
}

function splitLongParagraph(paragraph) {
  const text = cleanText(paragraph);
  const chunks = [];
  let cursor = 0;

  while (cursor < text.length) {
    chunks.push(text.slice(cursor, cursor + 650));
    cursor += 650;
  }

  return chunks;
}

function parseMarkdown(fileName, content) {
  const sourceTitle = getSourceTitle(fileName, content);
  const lines = content.split(/\r?\n/);
  const headingStack = [];
  const chunks = [];
  let buffer = [];

  function flushBuffer() {
    const paragraph = cleanText(buffer.join("\n"));
    buffer = [];

    if (!paragraph) {
      return;
    }

    splitLongParagraph(paragraph).forEach((part) => {
      pushChunk(chunks, fileName, sourceTitle, headingStack.filter(Boolean), part);
    });
  }

  for (const line of lines) {
    const headingMatch = /^(#{1,4})\s+(.+)$/.exec(line);

    if (headingMatch) {
      flushBuffer();
      const level = headingMatch[1].length;
      headingStack[level - 1] = cleanText(headingMatch[2]);
      headingStack.length = level;
      continue;
    }

    if (!line.trim()) {
      flushBuffer();
      continue;
    }

    buffer.push(line);
  }

  flushBuffer();
  return chunks;
}

async function main() {
  let files = [];

  try {
    files = (await readdir(knowledgeDir)).filter((fileName) => fileName.endsWith(".md"));
  } catch {
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, "[]\n", "utf8");
    console.warn(`Knowledge directory not found: ${knowledgeDir}`);
    return;
  }

  const chunks = [];

  for (const fileName of files.sort()) {
    const filePath = path.join(knowledgeDir, fileName);
    const content = await readFile(filePath, "utf8");
    chunks.push(...parseMarkdown(fileName, content));
  }

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(chunks, null, 2)}\n`, "utf8");
  console.log(`Knowledge index generated: ${chunks.length} chunks`);
}

await main();
