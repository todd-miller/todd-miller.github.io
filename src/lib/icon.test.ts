import { describe, it, expect } from "vitest";
import { resolveIconUrl } from "./icon";

describe("resolveIconUrl", () => {
    it("returns local paths unchanged", () => {
        expect(resolveIconUrl("/icons/litestar.svg")).toBe("/icons/litestar.svg");
    });

    it("maps bare names to the skill-icons set", () => {
        expect(resolveIconUrl("typescript")).toBe("https://api.iconify.design/skill-icons/typescript.svg");
    });

    it("maps hyphenated bare names to skill-icons", () => {
        expect(resolveIconUrl("react-dark")).toBe("https://api.iconify.design/skill-icons/react-dark.svg");
    });

    it("maps prefixed names to their Iconify set", () => {
        expect(resolveIconUrl("logos:aws-lambda")).toBe("https://api.iconify.design/logos/aws-lambda.svg");
    });

    it("forces white color for simple-icons", () => {
        expect(resolveIconUrl("simple-icons:portainer")).toBe(
            "https://api.iconify.design/simple-icons/portainer.svg?color=%23ffffff",
        );
    });

    it("does not add color query for non simple-icons prefixes", () => {
        expect(resolveIconUrl("logos:aws-ecs")).not.toContain("color=");
    });
});
