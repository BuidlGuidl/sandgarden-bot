import type { Tool } from "./types.js";
import { loadSkillContent } from "../skills.js";

export const skillTool: Tool = {
  name: "use_skill",
  description:
    "Load a skill's full instructions by name. Use when a task matches an available skill.",
  parameters: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Name of the skill to load",
      },
    },
    required: ["name"],
  },
  async execute(params) {
    const name = params.name as string;
    const content = loadSkillContent(name);
    if (!content) return `Error: skill "${name}" not found`;
    return content;
  },
};
