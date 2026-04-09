import { describe, it, expect } from "vitest";
import content from "./content.json";

const HTTP_URL = /^https?:\/\/\S+$/;
const MAILTO = /^mailto:\S+@\S+\.\S+$/;
const YEAR_MONTH = /^\d{4}-\d{2}$/;

describe("content.json", () => {
  it("has required top-level fields", () => {
    expect(content.name).toBeTruthy();
    expect(content.meta.title).toBeTruthy();
    expect(content.meta.description).toBeTruthy();
    expect(content.meta.canonicalUrl).toMatch(HTTP_URL);
  });

  it("hero has non-empty paragraphs", () => {
    expect(content.hero.title).toBeTruthy();
    expect(content.hero.paragraphs.length).toBeGreaterThan(0);
    for (const p of content.hero.paragraphs) expect(p.trim()).not.toBe("");
  });

  it("contact has valid URLs", () => {
    expect(content.contact.email_url).toMatch(MAILTO);
    expect(content.contact.github_url).toMatch(HTTP_URL);
    expect(content.contact.linkedin_url).toMatch(HTTP_URL);
  });

  describe("experience.jobs", () => {
    it("has at least one job", () => {
      expect(content.experience.jobs.length).toBeGreaterThan(0);
    });

    it.each(content.experience.jobs.map((j) => [j.company, j] as const))(
      "%s has required fields and valid period",
      (_company, job) => {
        expect(job.role).toBeTruthy();
        expect(job.company).toBeTruthy();
        expect(job.period.start).toMatch(YEAR_MONTH);
        if (job.period.end !== null) {
          expect(job.period.end).toMatch(YEAR_MONTH);
          expect(job.period.end >= job.period.start).toBe(true);
        }
        expect(Array.isArray(job.highlights)).toBe(true);
        expect(Array.isArray(job.tech)).toBe(true);
      },
    );

    it("has at most one job with null end (current role)", () => {
      const current = content.experience.jobs.filter((j) => j.period.end === null);
      expect(current.length).toBeLessThanOrEqual(1);
    });
  });

  describe("skillsShowcase.skills", () => {
    it("has non-empty skills", () => {
      expect(content.skillsShowcase.skills.length).toBeGreaterThan(0);
    });

    it.each(content.skillsShowcase.skills.map((s) => [s.name, s] as const))(
      "%s has name, icon, and valid url",
      (_name, skill) => {
        expect(skill.name).toBeTruthy();
        expect(skill.icon).toBeTruthy();
        if (skill.url) expect(skill.url).toMatch(HTTP_URL);
      },
    );
  });
});
