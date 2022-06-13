import { build } from "esbuild";

(async () => {
  await build({
    entryPoints: ["src/index.ts"],
    outfile: "./lib/index.js",
    platform: "node",
    format: "cjs",
    watch: false,
  });
})().catch((e) => {
  throw e;
});
