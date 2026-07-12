import { appendFileSync } from "node:fs";

const tag = process.env.GITHUB_REF_NAME || process.argv[2];
const match = /^PRD\/v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.exec(
  tag ?? "",
);

if (!match) {
  console.error(
    `Invalid production tag "${tag ?? ""}". Expected PRD/vMAJOR.MINOR.PATCH, for example PRD/v1.0.1.`,
  );
  process.exit(1);
}

const version = `v${match[1]}.${match[2]}.${match[3]}`;
const output = ["environment=production", `version=${version}`];

if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `${output.join("\n")}\n`);
}

console.log(`Validated ${tag}: environment=production, version=${version}`);
