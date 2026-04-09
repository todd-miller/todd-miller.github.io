const ICONIFY_BASE = "https://api.iconify.design";

/**
 * Resolve a skill icon reference to a URL.
 *
 * Three supported forms:
 *   1. Local path:        "/icons/foo.svg"        → returned as-is
 *   2. Prefixed icon:     "simple-icons:portainer" → Iconify (forced white for simple-icons)
 *   3. Bare name:         "typescript"            → Iconify skill-icons set
 */
export function resolveIconUrl(icon: string): string {
    if (icon.startsWith("/")) {
        const base = import.meta.env.BASE_URL;
        return `${base}${icon.slice(1)}`;
    }

    const isPrefixed = icon.includes(":");
    const path = isPrefixed ? icon.replace(":", "/") : `skill-icons/${icon}`;
    const query = icon.startsWith("simple-icons:") ? "?color=%23ffffff" : "";
    return `${ICONIFY_BASE}/${path}.svg${query}`;
}
