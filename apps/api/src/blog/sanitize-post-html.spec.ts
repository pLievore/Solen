import { test } from "node:test";
import assert from "node:assert/strict";
import { sanitizePostHtml } from "./sanitize-post-html";

test("remove scripts, eventos e URLs javascript do HTML do blog", () => {
  const sanitized = sanitizePostHtml(
    '<p onclick="alert(1)">Texto</p><script>alert(1)</script><a href="javascript:alert(1)">link</a>',
  );

  assert.equal(sanitized.includes("<script"), false);
  assert.equal(sanitized.includes("onclick"), false);
  assert.equal(sanitized.includes("javascript:"), false);
  assert.equal(sanitized.includes("<p>Texto</p>"), true);
});

test("preserva links seguros com protecao de aba externa", () => {
  const sanitized = sanitizePostHtml(
    '<a href="https://example.com" target="_blank">Exemplo</a>',
  );

  assert.equal(sanitized.includes('href="https://example.com"'), true);
  assert.equal(sanitized.includes('rel="noopener noreferrer"'), true);
});
