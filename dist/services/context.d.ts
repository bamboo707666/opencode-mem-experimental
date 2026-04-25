import type { MemoryClass } from "../types/index.js";
interface MemoryResultMinimal {
    similarity: number;
    memory?: string;
    chunk?: string;
    class?: MemoryClass;
    type?: string;
    metadata?: {
        class?: MemoryClass;
    } | Record<string, unknown>;
}
interface MemoriesResponseMinimal {
    results?: MemoryResultMinimal[];
}
export declare function formatContextForPrompt(userId: string | null, projectMemories: MemoriesResponseMinimal, opts?: {
    includeClassGrouping?: boolean;
}): string;
export {};
//# sourceMappingURL=context.d.ts.map