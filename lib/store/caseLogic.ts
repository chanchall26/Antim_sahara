import type { CaseTask, CaseSummary, EstateCase } from "@/types";

/** A task is blocked while any of its dependencies is not done. */
export function recomputeBlocking(tasks: CaseTask[]): CaseTask[] {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  return tasks.map((t) => {
    if (t.status === "done" || t.status === "in_progress") return t;
    const blocked = t.dependencies.some((depId) => byId.get(depId)?.status !== "done");
    const nextStatus = blocked ? "blocked" : "todo";
    return t.status === nextStatus ? t : { ...t, status: nextStatus };
  });
}

export function computeSummary(tasks: CaseTask[]): CaseSummary {
  return {
    totalTasks: tasks.length,
    doneTasks: tasks.filter((t) => t.status === "done").length,
    blockedTasks: tasks.filter((t) => t.status === "blocked").length,
  };
}

export function progressPercent(summary: CaseSummary): number {
  if (!summary.totalTasks) return 0;
  return Math.round((summary.doneTasks / summary.totalTasks) * 100);
}

/** Normalise a case after any mutation: recompute blocking + summary + updatedAt. */
export function normaliseCase(c: EstateCase): EstateCase {
  const tasks = recomputeBlocking(c.tasks);
  return {
    ...c,
    tasks,
    summary: computeSummary(tasks),
    status: tasks.length > 0 && tasks.every((t) => t.status === "done") ? "completed" : "active",
    updatedAt: Date.now(),
  };
}

/** Tasks needing attention now (deadline or actionable) vs. those that can wait. */
export function splitByPriority(tasks: CaseTask[]) {
  const open = tasks.filter((t) => t.status !== "done");
  const now = open.filter((t) => t.priority === "now" || t.status === "in_progress" || !!t.deadline);
  const later = open.filter((t) => !now.includes(t));
  const done = tasks.filter((t) => t.status === "done");
  return { now, later, done };
}
