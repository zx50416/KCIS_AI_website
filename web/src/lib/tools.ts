import catalog from "@/data/tools.json";
import type { Tool } from "./types";

export function getTools(): Tool[] {
  return (catalog.tools as Tool[]).filter((t) => t.status !== "deprecated");
}

export function getAllToolsIncludingDeprecated(): Tool[] {
  return catalog.tools as Tool[];
}

export function getToolBySlug(slug: string): Tool | undefined {
  return (catalog.tools as Tool[]).find((t) => t.slug === slug || t.id === slug);
}
