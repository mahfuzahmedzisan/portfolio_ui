import assert from "node:assert/strict";
import test from "node:test";

import { buildCsp } from "../../lib/security/headers.ts";

function scriptSrc(csp: string): string[] {
  const directive = csp.split("; ").find((d) => d.startsWith("script-src "));
  assert.ok(directive, "script-src is present");
  return directive.split(" ").slice(1);
}

test("the default policy does not allow WebAssembly compilation", () => {
  assert.ok(!scriptSrc(buildCsp()).includes("'wasm-unsafe-eval'"));
});

test("the wasm policy adds only 'wasm-unsafe-eval' to script-src", () => {
  const base = scriptSrc(buildCsp());
  const wasm = scriptSrc(buildCsp({ wasm: true }));
  assert.ok(wasm.includes("'wasm-unsafe-eval'"));
  assert.deepEqual(
    wasm.filter((source) => source !== "'wasm-unsafe-eval'"),
    base,
  );
});

test("the wasm policy never grants eval() in production", () => {
  const previous = process.env.NODE_ENV;
  Object.assign(process.env, { NODE_ENV: "production" });
  try {
    assert.ok(!scriptSrc(buildCsp({ wasm: true })).includes("'unsafe-eval'"));
  } finally {
    Object.assign(process.env, { NODE_ENV: previous });
  }
});
