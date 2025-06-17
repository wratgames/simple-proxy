import { join } from "path";
import pkg from "./package.json";

export default defineNitroConfig({
  preset: "cloudflare",
  compatibilityDate: "2025-04-20",
  srcDir: "./src",
  runtimeConfig: {
    version: pkg.version,
  },
  alias: {
    "@": join(__dirname, "src"),
  },
});
