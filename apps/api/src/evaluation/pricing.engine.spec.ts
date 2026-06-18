import { test } from "node:test";
import assert from "node:assert/strict";
import { computeQuote } from "./pricing.engine";

test("exemplo do briefing (PRICING §3): iPhone 11 64GB usado leve = R$200", () => {
  const r = computeQuote({
    isScrap: false,
    base: { label: "Usado com marcas leves", amount: 55000 },
    deltas: [
      { type: "delta", label: "Bateria abaixo de 85%", amount: -10000 },
      { type: "delta", label: "Face ID nao funciona", amount: -25000 },
    ],
  });
  assert.equal(r.isScrap, false);
  assert.equal(r.value, 20000); // R$ 200,00
  assert.equal(r.breakdown.length, 3); // base + 2 deltas
});

test("knockout tem prioridade absoluta -> sucata, ignora base/deltas", () => {
  const r = computeQuote({ isScrap: true, scrapValue: 15000 });
  assert.equal(r.isScrap, true);
  assert.equal(r.value, 15000);
  assert.equal(r.breakdown[0].type, "scrap");
});

test("piso impede valor negativo (default 0)", () => {
  const r = computeQuote({
    isScrap: false,
    base: { label: "Usado forte", amount: 50000 },
    deltas: [{ type: "delta", label: "tudo quebrado", amount: -60000 }],
  });
  assert.equal(r.value, 0);
});

test("sem deltas, valor = preco base", () => {
  const r = computeQuote({
    isScrap: false,
    base: { label: "Novo/lacrado", amount: 70000 },
  });
  assert.equal(r.value, 70000);
  assert.equal(r.breakdown.length, 1);
});
