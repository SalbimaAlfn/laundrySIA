const { execSync } = require("child_process");
try {
  const out = execSync("node node_modules/eslint/bin/eslint.js .", { encoding: "utf8", stdio: "pipe", maxBuffer: 50 * 1024 * 1024 });
  console.log("OK");
  process.exit(0);
} catch (e) {
  const all = (e.stdout || "") + (e.stderr || "");
  console.log(all);
  process.exit(1);
}
