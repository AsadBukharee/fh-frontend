import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { describe, expect, it } from "vitest";

type PageModule = {
  default?: unknown;
};

const testFileDir = path.dirname(fileURLToPath(import.meta.url));

const modules = import.meta.glob("../../app/**/page.tsx") as Record<
  string,
  () => Promise<PageModule>
>;

function isClientPage(pageFilePath: string): boolean {
  const absPath = path.resolve(testFileDir, pageFilePath);
  try {
    const raw = fs.readFileSync(absPath, "utf8");
    // Next.js convention: `"use client"` must exist at the top-level of the module.
    return raw.includes('"use client"') || raw.includes("'use client'");
  } catch {
    // If we can't read the file, don't mark it as client automatically.
    return false;
  }
}

describe("Client page smoke: imports all client pages", () => {
  it(
    "should be able to import every app route page marked with \"use client\"",
    async () => {
    const failures: Array<{ page: string; error: unknown }> = [];

    const clientPages = Object.keys(modules).filter(isClientPage);

    // Import with limited concurrency so we don't blow up the compiler/transformer.
    const limit = 4;
    let cursor = 0;

    const worker = async () => {
      while (cursor < clientPages.length) {
        const page = clientPages[cursor++];
        try {
          const mod = await modules[page]();
          expect(mod).toBeTruthy();
          expect(mod.default).toBeTruthy();
        } catch (error) {
          failures.push({ page, error });
        }
      }
    };

    await Promise.all(Array.from({ length: Math.min(limit, clientPages.length) }, worker));

    if (failures.length > 0) {
      const details = failures
        .slice(0, 20)
        .map(
          (f) =>
            `- ${f.page}: ${f.error instanceof Error ? f.error.message : String(f.error)}`,
        )
        .join("\n");

      throw new Error(
        `Some client pages failed to import (${failures.length}). First failures:\n${details}`,
      );
    }
    },
    120_000,
  );
});

