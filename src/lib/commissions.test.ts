// Test del calcolo provvigioni: `npm test`. Nessuna dipendenza extra (node:test + tsx).
import { test } from "node:test";
import assert from "node:assert/strict";
import { commissionableUnits, computeCommissionSplit, type CommissionRules } from "./commissions";

const PLAN: CommissionRules = {
  commissionL1Cents: 1000,
  commissionL2Cents: 200,
  commissionL3Cents: 200,
  commissionL4Cents: 200,
  commissionL5Cents: 400,
  maxCommissionPercent: 40,
};

test("una confezione da 70 € distribuisce 10/2/2/2/4 €", () => {
  const rows = computeCommissionSplit({ units: 1, basisCents: 7000, levels: [1, 2, 3, 4, 5], rules: PLAN });
  assert.deepEqual(rows.map((r) => r.amountCents), [1000, 200, 200, 200, 400]);
});

test("scala col volume: 3 confezioni ⇒ 30/6/6/6/12 €", () => {
  const rows = computeCommissionSplit({ units: 3, basisCents: 21000, levels: [1, 2, 3, 4, 5], rules: PLAN });
  assert.deepEqual(rows.map((r) => r.amountCents), [3000, 600, 600, 600, 1200]);
});

test("catena corta: solo i livelli popolati", () => {
  const rows = computeCommissionSplit({ units: 1, basisCents: 7000, levels: [1, 2], rules: PLAN });
  assert.deepEqual(rows.map((r) => r.level), [1, 2]);
});

test("il tetto scala in proporzione e la somma è esatta", () => {
  // 20 € lordi su 30 € di netto con tetto 40% ⇒ 12 € esatti.
  const rows = computeCommissionSplit({ units: 1, basisCents: 3000, levels: [1, 2, 3, 4, 5], rules: PLAN });
  assert.equal(rows.reduce((s, r) => s + r.amountCents, 0), 1200);
});

test("invariante su 20.000 casi casuali: somma = min(lordo, tetto)", () => {
  let seed = 42;
  const rnd = (n: number) => {
    seed = (seed * 1103515245 + 12345) % 2 ** 31;
    return seed % n;
  };
  for (let i = 0; i < 20_000; i++) {
    const rules: CommissionRules = {
      commissionL1Cents: rnd(3000),
      commissionL2Cents: rnd(1000),
      commissionL3Cents: rnd(1000),
      commissionL4Cents: rnd(1000),
      commissionL5Cents: rnd(1000),
      maxCommissionPercent: rnd(101),
    };
    const levels = Array.from({ length: rnd(6) }, (_, k) => k + 1);
    const units = rnd(20);
    const basisCents = rnd(50_000);
    const rows = computeCommissionSplit({ units, basisCents, levels, rules });

    const rates = [rules.commissionL1Cents, rules.commissionL2Cents, rules.commissionL3Cents, rules.commissionL4Cents, rules.commissionL5Cents];
    const gross = levels.reduce((s, l) => s + units * rates[l - 1], 0);
    const cap = Math.floor((basisCents * rules.maxCommissionPercent) / 100);
    const expected = units > 0 && basisCents > 0 && gross > 0 && cap > 0 ? Math.min(gross, cap) : 0;

    assert.equal(rows.reduce((s, r) => s + r.amountCents, 0), expected);
    for (const r of rows) {
      assert.ok(Number.isInteger(r.amountCents) && r.amountCents > 0);
      // Nessun livello prende più della propria tariffa (né 1 centesimo se è a 0 €).
      assert.ok(r.amountCents <= r.units * r.rateCents);
    }
  }
});

test("le varianti a 0 unità non contano", () => {
  assert.equal(commissionableUnits([{ commissionUnits: 0, quantity: 5 }, { commissionUnits: 2, quantity: 1 }]), 2);
});
