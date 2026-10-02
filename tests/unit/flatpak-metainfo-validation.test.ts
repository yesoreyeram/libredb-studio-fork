/**
 * Unit test pinning the Flatpak Smoke metainfo validation as network-free.
 *
 * appstreamcli validate probes every <url> in the metainfo over the network by
 * default, so a job container that cannot reach github.com fails the step with a
 * url-not-reachable warning that reads like a manifest defect. The step exists
 * to validate the metainfo and the rendered release manifest, not the runner
 * connectivity, so it must pass --no-net.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";

interface Step {
  name?: string;
  run?: string;
}

const WORKFLOW = join(import.meta.dir, "../../.github/workflows/flatpak-smoke.yml");

const metainfoStepRun = (): string => {
  const workflow = parseYaml(readFileSync(WORKFLOW, "utf8")) as {
    jobs: Record<string, { steps?: Step[] }>;
  };
  const steps = Object.values(workflow.jobs).flatMap((job) => job.steps ?? []);
  return steps.find((step) => step.run?.includes("appstreamcli validate"))?.run ?? "";
};

describe("flatpak-smoke metainfo validation", () => {
  test("validates the metainfo without network access", () => {
    expect(metainfoStepRun()).toContain("appstreamcli validate --no-net");
  });

  test("still lints the rendered release manifest", () => {
    expect(metainfoStepRun()).toContain("flatpak-builder-lint manifest build/flatpak/org.libredb.Studio.yml");
  });
});
