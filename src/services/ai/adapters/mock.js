import { normalizePortfolio } from "../../schema";
import { AI_ERROR_CODES, AiError } from "../errors";

/**
 * DEMO adapter. There is no AI model, avatar, or voice behind it.
 *
 * The only thing it can do is assemble a speaking script from a fixed
 * template using text the user entered. Sections with no data are omitted.
 * It adds no facts, and the result is marked source: "template".
 *
 * Adapter interface (a real adapter implements the same shape):
 *   id, label
 *   capabilities: { script, improveText, avatar, speech }   booleans
 *   generateScript(portfolio)            -> { sections, text, source }
 *   improveText({ field, text })         -> { text }
 *   createAvatarJob({ imageDataUrl, script }) -> job
 *   getAvatarJob(jobId)                  -> job
 *   cancelAvatarJob(jobId)               -> job
 *   synthesizeSpeech({ text, voiceId })  -> { audioUrl }
 * Methods for capabilities that are false are simply absent.
 */

function joinList(items) {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function sentence(value) {
  return /[.!?]$/.test(value) ? value : `${value}.`;
}

/** Pure function, exported so it can be tested without the adapter wrapper. */
export function buildScript(portfolio) {
  const { profile, education, skills, experience, achievements, projects } =
    normalizePortfolio(portfolio);

  const sections = [];
  const add = (id, title, text) => sections.push({ id, title, text });

  const intro = [profile.name && `Hi, I'm ${profile.name}.`, profile.about && sentence(profile.about)]
    .filter(Boolean)
    .join(" ");
  if (intro) add("introduction", "Introduction", intro);

  if (education) add("education", "Education", `Here is my education background. ${sentence(education)}`);

  if (skills.length) add("skills", "Skills", `My skills include ${joinList(skills)}.`);

  if (projects.length) {
    const spoken = projects.map((project, index) => {
      const label = project.title ? `Project ${index + 1}: ${sentence(project.title)}` : `Project ${index + 1}.`;
      return project.description ? `${label} ${sentence(project.description)}` : label;
    });
    add("projects", "Projects", spoken.join(" "));
  }

  if (experience) add("experience", "Experience", `Here is my experience. ${sentence(experience)}`);

  if (achievements.length) {
    add("achievements", "Achievements", `My achievements include ${joinList(achievements)}.`);
  }

  if (sections.length === 0) {
    throw new AiError(
      AI_ERROR_CODES.INVALID_INPUT,
      "Add your name, an about text, skills, education, or a project before generating a script."
    );
  }

  add("closing", "Closing", "Thank you for taking the time to view my portfolio.");

  return {
    sections,
    text: sections.map((section) => section.text).join("\n\n"),
    source: "template",
  };
}

export const mockAdapter = {
  id: "demo",
  label: "Demo mode",
  capabilities: { script: true, improveText: false, avatar: false, speech: false },
  async generateScript(portfolio) {
    return buildScript(portfolio);
  },
};
