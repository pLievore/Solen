import sanitizeHtml from "sanitize-html";

export function sanitizePostHtml(content: string): string {
  return sanitizeHtml(content, {
    allowedTags: [
      "p",
      "br",
      "hr",
      "h2",
      "h3",
      "h4",
      "strong",
      "em",
      "s",
      "blockquote",
      "ul",
      "ol",
      "li",
      "a",
      "code",
      "pre",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", {
        rel: "noopener noreferrer",
      }),
    },
  });
}
