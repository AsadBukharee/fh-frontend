# Testing Setup (Unit, Integration, E2E)

This document explains the testing infrastructure added to this Next.js + TypeScript frontend, what the current outcomes are, and what the next improvements should be.

## 1. What I did

### Test runners added
- **Vitest** for **unit** and **integration** tests (runs in `jsdom`).
- **React Testing Library** for UI testing with accessibility-friendly queries.
- **MSW (Mock Service Worker)** to deterministically mock `fetch` API calls during integration tests.
- **Playwright** scaffold for **E2E** tests (critical flow coverage).

### Test coverage added
#### Unit tests
- **Redux slice reducers**
  - `driverSlice` reducer behavior
  - `walkaroundSlice` reducer behavior
- **UI wrapper behavior (non-snapshot)**
  - Verified `components/ui/form.tsx` error rendering via `FormMessage` using React Hook Form error injection.

#### Integration tests (RTL + MSW)
- **Login page**
  - success case: MSW returns tokens -> cookies written -> router redirect called
  - failure case: MSW returns 400 -> user-friendly error shown
- **Forget password page**
  - invalid email: client-side validation message shown
  - success: MSW returns OTP success -> success toast shown + input cleared
- **Next-of-kin step (multi-step UI)**
  - valid submission: validates + calls `setNextOfKinData`, advances step, clears localStorage draft
  - invalid phone: shows validation error, does not advance step
- **Sites/Locations**
  - `AddLocation`: validates postcode + submits PUT with auth header
  - `SiteDetails`: loads site + saves edits (PATCH + PUT)
- **RBAC/permission handling**
  - `FetchInterceptor`: opens “Access Restricted” dialog on `403` responses

### E2E scaffold added (Playwright)
- Added a Playwright configuration and a first smoke test for the `/login` flow.
- The test stubs the login API response so it is deterministic and less flaky.

### “All pages” smoke coverage
- Added a Vitest smoke test that imports **every client-marked Next.js page** (`app/**/page.tsx` files containing `"use client"`).
- This detects module-resolution/type/import issues across the app without requiring a full end-to-end functional flow for every route.

## 2. What the current outcomes are

- ✅ `npm run test` passes successfully for the current unit + integration test suite.
- ✅ Tests are deterministic (MSW mocks and controlled environment setup).
- ✅ Avoids snapshot-only assertions; tests focus on user-visible behavior and state changes.

## 3. Files added / key configuration

### Folder structure
```
tests/
  setup/
    vitest.setup.ts
  mocks/
    handlers.ts
    server.ts
    styleMock.ts
    fileMock.ts
  test-utils/
    render.tsx
  unit/
    store/
      driverSlice.test.ts
      walkaroundSlice.test.ts
    ui/
      formMessage.test.tsx
  integration/
    auth/
      login.test.tsx
      forget-password.test.tsx
    add-driver/
      next-of-kin-step.test.tsx
    sites/
      add-location.test.tsx
      site-details.test.tsx
    rbac/
      fetch-interceptor.test.tsx
  smoke/
    client-pages-imports.test.ts
  e2e/
    login.spec.ts
```

### Vitest configuration
- `vitest.config.ts`
  - `jsdom` environment
  - setup file: `tests/setup/vitest.setup.ts`
  - module stubs for CSS/assets
  - excludes `tests/e2e/**` so unit/integration runs don’t try to execute Playwright specs

### MSW mock setup
- `tests/mocks/handlers.ts` contains deterministic endpoint handlers (login, password reset, one update endpoint).
- `tests/mocks/server.ts` starts MSW in Node for integration tests.

### Playwright configuration
- `playwright.config.ts`
  - `tests/e2e` as `testDir`
  - optional dev server start (non-CI)

### CI workflow (optional)
- `.github/workflows/test.yml`
  - runs `npm run test` on push and pull requests

## 4. How to run tests

From the repository root:

### Unit + Integration
- `npm run test`
- `npm run test:watch`
- `npm run test:coverage`

### E2E (Playwright)
- `npx playwright test`

## 5. Mocking approach (how APIs are handled)

- Integration tests use **MSW** to intercept network calls made via `fetch`.
- MSW handlers are defined in `tests/mocks/handlers.ts`.
- `vitest.setup.ts` starts MSW and clears state between tests.
- `next/navigation`, `next/link`, `next/image`, and `next-client-cookies` are mocked so client components can render under `jsdom`.

## 6. What I changed in application code (test compatibility)

To avoid Vitest module-resolution issues for auth pages, the login and forget-password screens were updated to use:
- `src="/icon.jpg"`
instead of a relative import from `public/`.

Files:
- `app/(pages)/login/page.tsx`
- `app/(pages)/forget-password/page.tsx`

## 7. What next (recommended)

### Expand integration coverage
Prioritize screens that:
- submit forms
- call APIs
- depend on Redux and/or multi-step UI flows

Good next candidates (based on your codebase patterns):
- multi-step add-driver flows (other steps besides Next-of-kin)
- task creation/reassignment dialogs
- vehicle/walkaround flows that post and validate records

### Task Management + SU Transport coverage added
- **Task Management**
  - `tests/integration/tasks/task-management-page.test.tsx`: loads tasks + verifies search refetch uses `search=` query param
  - `tests/integration/tasks/reassign-task-dialog.test.tsx`: roles/users load + submits reassignment POST (MSW)
  - `tests/integration/tasks/task-detail.test.tsx`: task detail fetch + auto PATCH from `not_viewed` → `viewed`
- **SU Transport**
  - `tests/integration/su-transport/su-logs.test.tsx`: renders run list + edits SU number (POST `update_stop`) and updates UI
  - `tests/integration/su-transport/numbers-overview.test.tsx`: overview screen renders API-provided location row

### Add request-level assertions
Create reusable helpers so tests can assert:
- request payload shape
- headers (e.g., authorization token usage)
- correct endpoint URLs and query params

### Add more Playwright E2E specs
Add 2-3 more critical specs (deterministic network stubs):
- login + first dashboard navigation
- one “create record” happy path
- one “validation error” path

### CI: add E2E later (optional)
Once flows are stable and environment variables/network stubbing are consistent, add a second CI job to run Playwright as well.

