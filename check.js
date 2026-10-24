const { execSync } = require("child_process");
const cmds = {
  typecheck: "node node_modules/typescript/bin/tsc --noEmit",
  lint: "node node_modules/eslint/bin/eslint.js .",
  test: "node node_modules/vitest/vitest.mjs run",
};
const name = process.argv[2];
const cmd = cmds[name];
if (!cmd) {
  console.log("unknown: " + name);
  process.exit(1);
}
try {
  const out = execSync(cmd, { encoding: "utf8", stdio: "pipe", maxBuffer: 50 * 1024 * 1024 });
  console.log("OK " + name);
  console.log(out.slice(-4000));
} catch (e) {
  console.log("FAIL " + name);
  console.log((e.stdout || "") + (e.stderr || ""));
  process.exit(1);
}
