import React from "react";
import { render, type RenderOptions } from "@testing-library/react";

import ReduxProvider from "@/app/store/ReduxProvider";

export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) {
  return render(ui, { wrapper: ({ children }) => <ReduxProvider>{children}</ReduxProvider>, ...options });
}

