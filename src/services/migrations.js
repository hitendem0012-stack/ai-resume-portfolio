import { SCHEMA_VERSION, normalizePortfolio, toList } from "./schema";

export class MigrationError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "MigrationError";
    this.code = code;
  }
}

/** Legacy records have no schemaVersion and are treated as version 0. */
export function detectVersion(record) {
  if (record.schemaVersion === undefined) return 0;
  const version = record.schemaVersion;
  if (!Number.isInteger(version) || version < 0) {
    throw new MigrationError("invalid_version", "The saved portfolio has an invalid version number.");
  }
  return version;
}

/**
 * Version 0 (original prototype): flat fields
 * name, email, image, about, skills (comma string), education,
 * linkedin, github, instagram, behance, project1, project1desc, project2, project2desc.
 * Every value present is carried over. Nothing is invented.
 */
function migrateV0toV1(legacy) {
  const projects = [];
  for (let i = 1; legacy[`project${i}`] !== undefined || legacy[`project${i}desc`] !== undefined; i++) {
    projects.push({
      title: legacy[`project${i}`],
      description: legacy[`project${i}desc`],
      url: legacy[`project${i}url`],
      technologies: [],
    });
  }

  return {
    schemaVersion: 1,
    profile: {
      name: legacy.name,
      email: legacy.email,
      image: legacy.image,
      about: legacy.about,
    },
    education: legacy.education,
    skills: toList(legacy.skills),
    experience: legacy.experience,
    achievements: [],
    projects,
    social: {
      linkedin: legacy.linkedin,
      github: legacy.github,
      instagram: legacy.instagram,
      behance: legacy.behance,
    },
    ai: {},
  };
}

/** migrations[n] upgrades a record from version n to n + 1. */
const migrations = {
  0: migrateV0toV1,
  1: (versionOne) => ({
    ...versionOne,
    schemaVersion: 2,
    projects: (Array.isArray(versionOne.projects) ? versionOne.projects : []).map((project) => ({
      ...project,
      url: typeof project.url === "string" ? project.url : "",
    })),
  }),
};

/**
 * Upgrades a parsed record to the current schema. Pure: the input is not
 * mutated. Always returns a normalized record.
 */
export function migrateToCurrent(record) {
  const fromVersion = detectVersion(record);

  if (fromVersion > SCHEMA_VERSION) {
    throw new MigrationError(
      "newer_version",
      "This portfolio was saved by a newer version of the app and cannot be opened safely."
    );
  }

  let current = record;
  for (let version = fromVersion; version < SCHEMA_VERSION; version++) {
    current = migrations[version](current);
  }

  return {
    data: normalizePortfolio(current),
    migrated: fromVersion < SCHEMA_VERSION,
    fromVersion,
  };
}
