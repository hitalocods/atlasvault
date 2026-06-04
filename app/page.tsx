import { getPrisma } from "@/lib/prisma";
import { VaultShell } from "@/components/vault-shell";
import { fallbackProjects, fallbackSnippets } from "@/lib/fallback-data";
import type { VaultProject, VaultSnippet } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getVaultData(): Promise<{ projects: VaultProject[]; snippets: VaultSnippet[] }> {
  const prisma = getPrisma();

  try {
    const [projects, snippets] = await Promise.all([
      prisma.project.findMany({
        include: { timeline: { orderBy: { createdAt: "asc" } } },
        orderBy: [{ favorite: "desc" }, { updatedAt: "desc" }],
      }),
      prisma.snippet.findMany({ orderBy: { createdAt: "desc" } }),
    ]);

    return {
      projects: projects.map((project) => ({
        ...project,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
        nextPaymentDate: project.nextPaymentDate?.toISOString() ?? null,
        lastUpdate: project.lastUpdate?.toISOString() ?? null,
        timeline: project.timeline.map((item) => ({
          ...item,
          createdAt: item.createdAt.toISOString(),
        })),
      })),
      snippets: snippets.map((snippet) => ({
        ...snippet,
        createdAt: snippet.createdAt.toISOString(),
      })),
    };
  } catch (error) {
    console.error("Falling back to static vault data because Prisma is unavailable.", error);
    return { projects: fallbackProjects, snippets: fallbackSnippets };
  }
}

export default async function Home() {
  const { projects, snippets } = await getVaultData();

  return <VaultShell projects={projects} snippets={snippets} />;
}
