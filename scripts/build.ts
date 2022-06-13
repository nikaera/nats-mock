import { build } from "esbuild";

(async () => {
  await build({
    entryPoints: ["src/index.ts"],
    outfile: "./lib/index.js",
    platform: "node",
    format: "cjs",
    minify: true,
    watch: false,
  });
})().catch((e) => {
  throw e;
});
