import { CONFIG } from "../config.js";
import type { MemoryClass } from "../types/index.js";
import { getUserProfileContext } from "./user-profile/profile-context.js";

interface MemoryResultMinimal {
  similarity: number;
  memory?: string;
  chunk?: string;
  class?: MemoryClass;
  type?: string;
  metadata?: { class?: MemoryClass } | Record<string, unknown>;
}

interface MemoriesResponseMinimal {
  results?: MemoryResultMinimal[];
}

export function formatContextForPrompt(
  userId: string | null,
  projectMemories: MemoriesResponseMinimal,
  opts?: { includeClassGrouping?: boolean }
): string {
  const includeGrouping = opts?.includeClassGrouping ?? true;

  if (includeGrouping) {
    return formatGroupedContext(userId, projectMemories);
  }

  return formatFlatContext(userId, projectMemories);
}

function formatFlatContext(
  userId: string | null,
  projectMemories: MemoriesResponseMinimal
): string {
  const parts: string[] = ["[MEMORY]"];

  if (CONFIG.injectProfile && userId) {
    const profileContext = getUserProfileContext(userId);
    if (profileContext) {
      parts.push("\n" + profileContext);
    }
  }

  const projectResults = projectMemories.results || [];
  if (projectResults.length > 0) {
    parts.push("\nProject Knowledge:");
    projectResults.forEach((mem) => {
      const similarity = Math.round(mem.similarity * 100);
      const content = mem.memory || mem.chunk || "";
      parts.push(`- [${similarity}%] ${content}`);
    });
  }

  if (parts.length === 1) {
    return "";
  }

  return parts.join("\n");
}

function formatGroupedContext(
  userId: string | null,
  projectMemories: MemoriesResponseMinimal
): string {
  const parts: string[] = ["[MEMORY]"];

  if (CONFIG.injectProfile && userId) {
    const profileContext = getUserProfileContext(userId);
    if (profileContext) {
      parts.push("\n" + profileContext);
    }
  }

  const GROUP_CAP = 5;

  const groups: Record<string, MemoryResultMinimal[]> = {};

  for (const mem of projectMemories.results || []) {
    const rawClass = mem.metadata?.class ?? mem.class ?? mem.type;
    const cls = typeof rawClass === "string" && rawClass.length > 0 ? rawClass : "uncategorized";
    if (!groups[cls]) {
      groups[cls] = [];
    }
    groups[cls].push(mem);
  }

  const classLabels: Record<string, string> = {
    handoff: "Handoff",
    postmortem: "Postmortem",
    operational_preference: "Operational Preferences",
    uncategorized: "General Knowledge",
  };

  for (const [cls, memories] of Object.entries(groups)) {
    const label = classLabels[cls] || cls;
    const capped = memories.slice(0, GROUP_CAP);
    parts.push(`\n## ${label}`);
    capped.forEach((mem) => {
      const similarity = Math.round(mem.similarity * 100);
      const content = mem.memory || mem.chunk || "";
      parts.push(`- [${similarity}%] ${content}`);
    });
  }

  if (parts.length === 1) {
    return "";
  }

  return parts.join("\n");
}
