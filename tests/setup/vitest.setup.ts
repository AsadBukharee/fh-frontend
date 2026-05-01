import "@testing-library/jest-dom/vitest";
import React from "react";
import { afterAll, afterEach, beforeAll, vi } from "vitest";

import { server } from "../mocks/server";

// Ensure the app's ENV module is deterministic during tests.
process.env.NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://test.fosterhartley.uk";

// --- Global test utilities (shared by mocked modules) ---
const cookieStore = new Map<string, string>();
(globalThis as any).__TEST_COOKIE_STORE__ = cookieStore;

const routerPushSpy = vi.fn();
(globalThis as any).__TEST_ROUTER_PUSH__ = routerPushSpy;
const routerReplaceSpy = vi.fn();
(globalThis as any).__TEST_ROUTER_REPLACE__ = routerReplaceSpy;

// Allow tests to control Next params/search params.
(globalThis as any).__TEST_ROUTE_PARAMS__ = (globalThis as any).__TEST_ROUTE_PARAMS__ ?? {};
(globalThis as any).__TEST_SEARCH_PARAMS__ = (globalThis as any).__TEST_SEARCH_PARAMS__ ?? new URLSearchParams();

// --- Module mocks ---
vi.mock("next/navigation", () => {
  return {
    useRouter: () => ({
      push: (globalThis as any).__TEST_ROUTER_PUSH__ as (...args: any[]) => any,
      replace: (globalThis as any).__TEST_ROUTER_REPLACE__ as (...args: any[]) => any,
    }),
    useSearchParams: () => (globalThis as any).__TEST_SEARCH_PARAMS__ ?? new URLSearchParams(),
    useParams: () => (globalThis as any).__TEST_ROUTE_PARAMS__ ?? {},
  };
});

vi.mock("next/link", () => {
  return {
    default: ({ href, ...props }: any) => {
      const resolvedHref =
        typeof href === "string" ? href : href?.pathname ? String(href.pathname) : "";
      return React.createElement("a", { href: resolvedHref, ...props });
    },
  };
});

vi.mock("next/image", () => {
  return {
    default: (props: any) => {
      const { src, alt, ...rest } = props;
      return React.createElement("img", {
        alt: alt ?? "",
        src: typeof src === "string" ? src : String(src),
        ...rest,
      });
    },
  };
});

vi.mock("next-client-cookies", () => {
  return {
    useCookies: () => ({
      get: (key: string) => cookieStore.get(key),
      set: (key: string, value: string) => cookieStore.set(key, value),
      remove: (key: string) => cookieStore.delete(key),
    }),
  };
});

// --- DOM polyfills for Radix/Tailwind/modern UI libs ---
if (typeof window !== "undefined") {
  if (!("matchMedia" in window)) {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    });
  }

  if (!("ResizeObserver" in window)) {
    (window as any).ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }

  if (!("requestAnimationFrame" in window)) {
    (window as any).requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(cb, 0);
  }
}

// --- MSW lifecycle ---
beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

afterEach(() => {
  server.resetHandlers();
  cookieStore.clear();
  routerPushSpy.mockClear();
  window.localStorage.clear();
});

afterAll(() => {
  server.close();
});

