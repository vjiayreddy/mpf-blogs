import sanitize from "sanitize-html";

export function sanitizeRichHtml(html?: string | null): string {
  if (!html) return "";
  return sanitize(html, {
    allowedTags: sanitize.defaults.allowedTags.concat([
      "img",
      "h1",
      "h2",
      "figure",
      "figcaption",
      "picture",
      "source",
    ]),
    allowedAttributes: {
      ...sanitize.defaults.allowedAttributes,
      a: ["href", "name", "target", "rel"],
      img: ["src", "srcset", "alt", "title", "width", "height", "loading"],
      source: ["srcset", "type", "sizes"],
      "*": ["class", "id"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: {
      img: ["https"],
      source: ["https"],
    },
    transformTags: {
      a: sanitize.simpleTransform("a", { rel: "noopener noreferrer" }),
    },
  });
}

export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
