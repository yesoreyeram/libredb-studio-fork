/**
 * operator/Makefile bootstraps four build tools with curl at CI time and then
 * executes them: kustomize, helm-operator, operator-sdk and opm.
 *
 * Without `--fail`, curl writes a non-2xx body - an HTML error page, a
 * rate-limit response - straight into the tool path and exits 0, so the
 * `chmod +x` that follows marks that text executable. The failure then only
 * surfaces when the tool is run, as `sh: <path>: 2: Syntax error: newline
 * unexpected`, which names neither the download nor an HTTP status. That is what
 * turned CI run #2569 on main red on 2026-10-01, on a commit that did not touch
 * operator/. `--retry` keeps a transient GitHub hiccup from failing the gate at
 * all.
 *
 * Every other release download in the repo carries `-f` (packaging/linux and
 * packaging/windows fetch-node.sh, .github/workflows/helm-index-check.yml,
 * release-artifacts.yml); the operator bootstraps were the outliers, so this
 * test pins them to the same contract.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const MAKEFILE = join(import.meta.dir, "../../operator/Makefile");

const curls = readFileSync(MAKEFILE, "utf8")
  .split("\n")
  .filter((line) => /^\s*curl\s/.test(line));

describe("operator/Makefile tool bootstrap", () => {
  test("downloads its tools with curl", () => {
    expect(curls.length).toBeGreaterThanOrEqual(4);
  });

  test("every curl download fails on an HTTP error instead of writing the error body", () => {
    for (const line of curls) {
      expect(/\s-[A-Za-z]*f/.test(line) || line.includes("--fail")).toBe(true);
    }
  });

  test("every curl download retries transient failures", () => {
    for (const line of curls) {
      expect(line).toContain("--retry");
    }
  });
});
