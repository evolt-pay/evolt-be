import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export function loadJson(relativePath: string): any {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const fullPath = path.resolve(__dirname, "..", relativePath);
    console.log("Loading JSON from:", fullPath);
    return JSON.parse(fs.readFileSync(fullPath, "utf-8"));
}