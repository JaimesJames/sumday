import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

function validate(tag) {
  return spawnSync(process.execPath, ["scripts/validate-release-tag.mjs", tag], {
    encoding: "utf8",
  });
}

test("accepts a production semantic version tag", () => {
  const result = validate("PRD/v1.2.3");

  assert.equal(result.status, 0);
  assert.match(result.stdout, /version=v1\.2\.3/);
});

test("rejects malformed or non-production tags", () => {
  for (const tag of ["v1.2.3", "PRD/v1.2", "PRD/v01.2.3", "DEV/v1.2.3"]) {
    const result = validate(tag);
    assert.notEqual(result.status, 0, tag);
  }
});
