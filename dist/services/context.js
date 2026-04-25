import { CONFIG } from "../config.js";
import { getUserProfileContext } from "./user-profile/profile-context.js";
export function formatContextForPrompt(userId, projectMemories, opts) {
    const includeGrouping = opts?.includeClassGrouping ?? true;
    if (includeGrouping) {
        return formatGroupedContext(userId, projectMemories);
    }
    return formatFlatContext(userId, projectMemories);
}
function formatFlatContext(userId, projectMemories) {
    const parts = ["[MEMORY]"];
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
function formatGroupedContext(userId, projectMemories) {
    const parts = ["[MEMORY]"];
    if (CONFIG.injectProfile && userId) {
        const profileContext = getUserProfileContext(userId);
        if (profileContext) {
            parts.push("\n" + profileContext);
        }
    }
    const GROUP_CAP = 5;
    const groups = {};
    for (const mem of projectMemories.results || []) {
        const rawClass = mem.metadata?.class ?? mem.class ?? mem.type;
        const cls = typeof rawClass === "string" && rawClass.length > 0
            ? rawClass
            : "uncategorized";
        if (!groups[cls]) {
            groups[cls] = [];
        }
        groups[cls].push(mem);
    }
    const classLabels = {
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
