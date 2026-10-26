import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { KBItem } from "@contracts/types";

// ---------- 关键词词典（照抄需求，勿随意增删） ----------
export const KEYWORD_DICT: Record<"java" | "python" | "cpp" | "llm" | "frontend" | "test" | "data" | "common", string[]> = {
  java: [
    "Java", "Spring", "SpringBoot", "Spring Boot", "SpringCloud", "MyBatis",
    "JVM", "Maven", "Gradle", "Dubbo", "Netty", "Kafka", "RocketMQ",
    "Zookeeper", "线程池", "HashMap", "ConcurrentHashMap", "JUC",
  ],
  python: [
    "Python", "Django", "Flask", "FastAPI", "Tornado", "Celery", "asyncio",
    "协程", "GIL", "Pandas", "NumPy", "Scrapy", "爬虫", "SQLAlchemy",
    "Gunicorn", "Uvicorn", "PyTorch", "TensorFlow",
  ],
  cpp: [
    "C++", "STL", "Qt", "智能指针", "shared_ptr", "多态", "虚函数", "epoll",
    "Linux", "网络编程", "CMake", "gdb", "多线程", "内存池", "Boost",
    "protobuf", "gRPC", "Reactor",
  ],
  llm: [
    "大模型", "LLM", "Transformer", "注意力", "GPT", "BERT", "LLaMA", "Qwen",
    "微调", "LoRA", "SFT", "RLHF", "DPO", "预训练", "Prompt", "提示词",
    "RAG", "检索增强", "向量", "Embedding", "Agent", "LangChain", "vLLM",
    "量化", "KV Cache", "幻觉", "多模态", "HuggingFace", "DeepSeek",
  ],
  frontend: [
    "前端", "JavaScript", "TypeScript", "React", "Vue", "Angular", "HTML",
    "CSS", "ES6", "浏览器", "Webpack", "Vite", "Node.js", "npm", "小程序",
    "闭包", "原型链", "虚拟DOM", "Redux", "Pinia", "SSR", "Tailwind",
  ],
  test: [
    "测试", "用例", "自动化测试", "性能测试", "接口测试", "单元测试",
    "Selenium", "Playwright", "Appium", "JMeter", "Postman", "pytest",
    "JUnit", "缺陷", "Bug", "压测", "回归测试", "黑盒", "白盒", "Mock",
  ],
  data: [
    "数据分析", "数据分析师", "SQL", "MySQL查询", "Hive", "Tableau",
    "Power BI", "FineBI", "Excel", "透视表", "指标体系", "北极星指标",
    "埋点", "AB测试", "A/B", "漏斗分析", "留存分析", "RFM", "用户画像",
    "用户分层", "数据看板", "可视化", "假设检验", "SPSS", "数据运营",
    "经营分析", "异动归因", "Matplotlib", "点击流",
  ],
  common: [
    "MySQL", "Redis", "索引", "事务", "MVCC", "分库分表", "缓存", "消息队列",
    "分布式", "微服务", "Docker", "K8s", "Nginx", "HTTP", "TCP", "操作系统",
    "Elasticsearch", "MongoDB", "PostgreSQL", "限流", "幂等",
  ],
};

export type Lang = "java" | "python" | "cpp" | "llm" | "frontend" | "test" | "data";

const ALL_LANGS: Lang[] = ["java", "python", "cpp", "llm", "frontend", "test", "data"];

// ---------- 启动时加载题库 ----------

function resolveKbDir(): string {
  const fromCwd = path.resolve(process.cwd(), "api/data/kb");
  if (fs.existsSync(fromCwd)) return fromCwd;
  // esbuild 打包后 cwd 一般是项目根，上面即可命中；此处兜底
  return fileURLToPath(new URL("../data/kb", import.meta.url));
}

function loadKB(): KBItem[] {
  const dir = resolveKbDir();
  const files = ["java.json", "python.json", "cpp.json", "llm.json", "frontend.json", "test.json", "data.json", "common.json"];
  const items: KBItem[] = [];
  for (const file of files) {
    const full = path.join(dir, file);
    if (!fs.existsSync(full)) continue;
    const arr = JSON.parse(fs.readFileSync(full, "utf-8")) as KBItem[];
    items.push(...arr);
  }
  return items;
}

const KB_ITEMS: KBItem[] = loadKB();

export function allItems(): KBItem[] {
  return KB_ITEMS;
}

export function listByLanguage(language?: string): KBItem[] {
  if (!language) return KB_ITEMS;
  return KB_ITEMS.filter((it) => it.language === language);
}

// ---------- 关键词匹配 ----------

function matchKeywords(text: string, words: string[]): string[] {
  const lower = text.toLowerCase();
  return words.filter((w) => lower.includes(w.toLowerCase()));
}

/** 大小写不敏感匹配全部词典词，返回去重后的命中词列表 */
export function extractKeywords(text: string): string[] {
  const hits = new Set<string>();
  for (const words of Object.values(KEYWORD_DICT)) {
    for (const w of matchKeywords(text, words)) hits.add(w);
  }
  return [...hits];
}

export interface DetectResult {
  lang: Lang;
  hits: Record<Lang, string[]>;
}

/** 关键词词典命中计数判定方向；全部未命中默认 java */
export function detectLanguage(text: string): DetectResult {
  const hits = Object.fromEntries(
    ALL_LANGS.map((k) => [k, matchKeywords(text, KEYWORD_DICT[k])]),
  ) as Record<Lang, string[]>;
  let lang: Lang = "java";
  let best = 0;
  for (const k of ALL_LANGS) {
    if (hits[k].length > best) {
      best = hits[k].length;
      lang = k;
    }
  }
  return { lang, hits };
}

// ---------- 字符级 TF-IDF（char 2-3gram） ----------

function ngrams(text: string): string[] {
  const clean = text.toLowerCase().replace(/\s+/g, "");
  const grams: string[] = [];
  for (const n of [2, 3]) {
    for (let i = 0; i + n <= clean.length; i++) {
      grams.push(clean.slice(i, i + n));
    }
  }
  return grams;
}

function termFreq(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
  return tf;
}

interface DocVector {
  vec: Map<string, number>; // tf-idf 加权向量
  norm: number;
}

interface IndexEntry {
  item: KBItem;
  doc: DocVector;
}

interface LangIndex {
  entries: IndexEntry[];
  idf: Map<string, number>;
}

function buildVector(tf: Map<string, number>, idf: Map<string, number>): DocVector {
  const vec = new Map<string, number>();
  let sumSq = 0;
  for (const [gram, count] of tf) {
    const w = count * (idf.get(gram) ?? 0);
    if (w === 0) continue;
    vec.set(gram, w);
    sumSq += w * w;
  }
  return { vec, norm: Math.sqrt(sumSq) };
}

function buildIndex(items: KBItem[]): LangIndex {
  const docsText = items.map((it) => `${it.topic} ${it.question} ${it.answer_points.join(" ")}`);
  const tfs = docsText.map((t) => termFreq(ngrams(t)));
  const N = items.length;
  const df = new Map<string, number>();
  for (const tf of tfs) {
    for (const gram of tf.keys()) df.set(gram, (df.get(gram) ?? 0) + 1);
  }
  // IDF = log((1+N)/(1+df)) + 1
  const idf = new Map<string, number>();
  for (const [gram, d] of df) idf.set(gram, Math.log((1 + N) / (1 + d)) + 1);
  const entries = items.map((item, i) => ({ item, doc: buildVector(tfs[i], idf) }));
  return { entries, idf };
}

// 每个语言方向各维护一份索引（候选 = 本语言 + common）
const INDEXES: Record<Lang, LangIndex> = Object.fromEntries(
  ALL_LANGS.map((k) => [
    k,
    buildIndex(KB_ITEMS.filter((it) => it.language === k || it.language === "common")),
  ]),
) as Record<Lang, LangIndex>;

function cosine(a: DocVector, b: DocVector): number {
  if (a.norm === 0 || b.norm === 0) return 0;
  let dot = 0;
  const [small, big] = a.vec.size <= b.vec.size ? [a.vec, b.vec] : [b.vec, a.vec];
  for (const [gram, w] of small) {
    const other = big.get(gram);
    if (other) dot += w * other;
  }
  return dot / (a.norm * b.norm);
}

/**
 * 检索与 queryText 最相关的题库题目。
 * 候选 = 本语言 + common；TF-IDF 余弦相似度 + 关键词加权（question+topic
 * 每命中一个简历关键词 +0.08，frequency==="高频" +0.05），排序取 topK。
 */
export function retrieve(queryText: string, lang: Lang, topK = 15): KBItem[] {
  const index = INDEXES[lang] ?? INDEXES.java;
  const keywords = extractKeywords(queryText);
  const queryVec = buildVector(termFreq(ngrams(queryText)), index.idf);

  const scored = index.entries.map(({ item, doc }) => {
    let score = cosine(queryVec, doc);
    const haystack = `${item.question} ${item.topic}`.toLowerCase();
    for (const kw of keywords) {
      if (haystack.includes(kw.toLowerCase())) score += 0.08;
    }
    if (item.frequency === "高频") score += 0.05;
    return { item, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK).map((s) => s.item);
}
