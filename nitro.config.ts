import { join } from "path";

export default defineNitroConfig({
  compatibilityDate: "2025-04-20",
  srcDir: "./src",
  alias: {
    "@": join(__dirname, "src")
  }
});
