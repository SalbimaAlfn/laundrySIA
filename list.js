import { readdirSync } from "fs";
readdirSync("src/lib/schemas").forEach((f) => console.log(f));
