/**
 * Portfolio data model (schemaVersion 2).
 *
 * {
 *   schemaVersion: 2,
 *   profile:      { name, email, image, about },
 *   education:    string   (free text, as entered)
 *   skills:       string[]
 *   experience:   string   (free text, as entered)
 *   achievements: string[]
 *   projects:     [{ title, description, url, technologies: string[] }]
 *   social:       { linkedin, github, instagram, behance }
 *   ai:           { avatarEnabled, avatarProvider, generatedScript, avatarVideoUrl }
 * }
 *
 * Education and experience stay free text because the current form collects
 * them that way. Projects include optional external links in schema version 2.
 */

export const SCHEMA_VERSION = 2;

export const SOCIAL_KEYS = ["linkedin", "github", "instagram", "behance"];

const text = (value) => (typeof value === "string" ? value.trim() : "");

const textOrNull = (value) => text(value) || null;

function safeExternalUrl(value) {
  const candidate = text(value);
  if (!candidate) return "";
  try {
    const parsed = new URL(candidate);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.href : "";
  } catch {
    return "";
  }
}

/** Accepts an array of strings or a comma separated string. */
export function toList(value) {
  const items = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(",")
      : [];
  return items.map(text).filter(Boolean);
}

/** Only data URLs are accepted for the profile image. */
const imageSource = (value) =>
  typeof value === "string" && /^data:image\//i.test(value) ? value : "";

export function createEmptyProject() {
  return { title: "", description: "", url: "", technologies: [] };
}

export function createEmptyPortfolio() {
  return {
    schemaVersion: SCHEMA_VERSION,
    profile: { name: "", email: "", image: "", about: "" },
    education: "",
    skills: [],
    experience: "",
    achievements: [],
    projects: [],
    social: { linkedin: "", github: "", instagram: "", behance: "" },
    ai: {
      avatarEnabled: false,
      avatarProvider: null,
      generatedScript: "",
      avatarVideoUrl: null,
    },
  };
}

function normalizeProject(input) {
  if (!input || typeof input !== "object") return null;
  const project = {
    title: text(input.title),
    description: text(input.description),
    url: safeExternalUrl(input.url),
    technologies: toList(input.technologies),
  };
  const isEmpty =
    !project.title && !project.description && !project.url && project.technologies.length === 0;
  return isEmpty ? null : project;
}

/**
 * Coerces any input into a valid current-version portfolio. Unknown fields
 * are dropped, wrong types become empty values, and empty projects are removed.
 * Never throws.
 */
export function normalizePortfolio(input) {
  const source = input && typeof input === "object" ? input : {};
  const profile = source.profile && typeof source.profile === "object" ? source.profile : {};
  const social = source.social && typeof source.social === "object" ? source.social : {};
  const ai = source.ai && typeof source.ai === "object" ? source.ai : {};

  return {
    schemaVersion: SCHEMA_VERSION,
    profile: {
      name: text(profile.name),
      email: text(profile.email),
      image: imageSource(profile.image),
      about: text(profile.about),
    },
    education: text(source.education),
    skills: toList(source.skills),
    experience: text(source.experience),
    achievements: toList(source.achievements),
    projects: (Array.isArray(source.projects) ? source.projects : [])
      .map(normalizeProject)
      .filter(Boolean),
    social: {
      linkedin: safeExternalUrl(social.linkedin),
      github: safeExternalUrl(social.github),
      instagram: safeExternalUrl(social.instagram),
      behance: safeExternalUrl(social.behance),
    },
    ai: {
      avatarEnabled: ai.avatarEnabled === true,
      avatarProvider: textOrNull(ai.avatarProvider),
      generatedScript: text(ai.generatedScript),
      avatarVideoUrl: textOrNull(ai.avatarVideoUrl),
    },
  };
}

/**
 * Maps the flat values held by the current FormPage into the data model.
 */
export function portfolioFromFormValues(values) {
  const projects = Array.isArray(values.projects)
    ? values.projects.map((project) => ({
        title: project.title,
        description: project.description,
        url: project.url,
        technologies: project.technologies,
      }))
    : [
        { title: values.project1, description: values.project1desc, url: values.project1url },
        { title: values.project2, description: values.project2desc, url: values.project2url },
      ];

  return normalizePortfolio({
    profile: {
      name: values.name,
      email: values.email,
      image: values.image,
      about: values.about,
    },
    education: values.education,
    experience: values.experience,
    skills: values.skills,
    projects,
    social: {
      linkedin: values.linkedin,
      github: values.github,
      instagram: values.instagram,
      behance: values.behance,
    },
  });
}
