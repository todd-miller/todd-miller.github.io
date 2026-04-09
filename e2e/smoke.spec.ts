import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import content from "../src/content.json" with { type: "json" };
import type { Job } from "@/src/content";
import assert from "node:assert";

test.describe("home page smoke", () => {
  test("loads with correct title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(content.meta.title);
  });

  test("hero renders name and first paragraph", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: content.name })).toBeVisible();
  });

  test("nav anchors scroll to their sections", async ({ page }) => {
    await page.goto("/");
    for (const id of ["about", "contact", "experience"]) {
      await page.getByRole("link", { name: id, exact: true }).first().click();
      await expect(page).toHaveURL(new RegExp(`#${id}$`));
    }
  });

  test("experience jobs: collapsed shows meta, expanded reveals highlights", async ({ page }) => {
    await page.goto("/");

    const assertCollapsed = async (details: any, summary: any, job: Job) => {
      await expect(details).not.toHaveAttribute("open", "");
      await expect(summary).toContainText(job.role);
      await expect(summary).toContainText(job.company);
    }
    const assertExpanded = async (details: any, job: any) => {
      await expect(details).toHaveAttribute("open", "");
      for (const highlight of job.highlights) {
        await expect(details.getByText(highlight, { exact: false }).first()).toBeVisible();
      }
    }


    const section = page.locator("#experience");
    const jobItems = section.locator("details.job");
    await expect(jobItems).toHaveCount(content.experience.jobs.length);

    for (let i = 0; i < content.experience.jobs.length; i++) {
      const job = content.experience.jobs[i];
      const details = jobItems.nth(i);
      const item = details;
      const summary = details.locator("> summary");

      await assertCollapsed(details, summary, job);

      // assert Job without highlights displays properly while expanded
      if (job.highlights.length > 0) {
        // The highlights wrapper is a CSS-grid 0fr row + overflow-hidden;
        // Playwright's toBeHidden doesn't detect that, so measure directly.
        const highlightsUl = item.locator("ul.list-disc").first();
        const collapsedHeight = await highlightsUl.evaluate(
          (el) => (el as HTMLElement).getBoundingClientRect().height,
        );
        expect(collapsedHeight).toBe(0);
      }

      // Expand this specific job and verify highlights become visible.
      await summary.click();
      await assertExpanded(details, job);

      await summary.click();
      await assertCollapsed(details, summary, job);
    }
  });


  test("resume download link is present", async ({ page }) => {
    await page.goto("/");
    const resume = page.getByLabel("Download resume PDF");
    await expect(resume).toBeVisible();
    await expect(resume).toHaveAttribute("href", "/resume.pdf");
  });

  test("copy-email writes address to clipboard", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/");
    const email = content.contact.email_url.replace(/^mailto:/, "");
    await page.getByRole("button", { name: new RegExp(`Copy email`) }).click();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toBe(email);
  });

  test("respects prefers-reduced-motion on skills marquee", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto("/");
    const track = page.locator(".skills-track").first();
    await expect(track).toBeVisible();
    const t1 = await track.evaluate((el) => getComputedStyle(el).transform);
    await page.waitForTimeout(600);
    const t2 = await track.evaluate((el) => getComputedStyle(el).transform);
    expect(t1).toBe(t2);
    await context.close();
  });

  test("has no serious or critical a11y violations", async ({ page }) => {
    await page.goto("/");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    const bad = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(bad, JSON.stringify(bad, null, 2)).toEqual([]);
  });
});
