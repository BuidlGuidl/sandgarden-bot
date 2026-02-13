import { existsSync, readdirSync, readFileSync } from "fs";
import { join } from "path";

const SKILLS_DIR = join(process.cwd(), "skills");

type SkillSummary = {
  name: string;
  description: string;
};

type ParsedSkill = {
  name: string;
  description: string;
  body: string;
};

function parseFrontmatter(raw: string): ParsedSkill | null {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return null;

  const frontmatter = match[1];
  const body = match[2].trim();

  const name = frontmatter.match(/^name:\s*(.+)$/m)?.[1]?.trim();
  const description = frontmatter.match(/^description:\s*(.+)$/m)?.[1]?.trim();

  if (!name || !description) return null;
  return { name, description, body };
}

export function loadSkillSummaries(): SkillSummary[] {
  if (!existsSync(SKILLS_DIR)) return [];

  const summaries: SkillSummary[] = [];

  for (const entry of readdirSync(SKILLS_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const skillFile = join(SKILLS_DIR, entry.name, "SKILL.md");
    if (!existsSync(skillFile)) continue;

    const raw = readFileSync(skillFile, "utf-8");
    const parsed = parseFrontmatter(raw);
    if (parsed) {
      summaries.push({ name: parsed.name, description: parsed.description });
    }
  }

  return summaries;
}

export function loadSkillContent(name: string): string | null {
  if (!existsSync(SKILLS_DIR)) return null;

  for (const entry of readdirSync(SKILLS_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const skillFile = join(SKILLS_DIR, entry.name, "SKILL.md");
    if (!existsSync(skillFile)) continue;

    const raw = readFileSync(skillFile, "utf-8");
    const parsed = parseFrontmatter(raw);
    if (parsed && parsed.name === name) return parsed.body;
  }

  return null;
}
