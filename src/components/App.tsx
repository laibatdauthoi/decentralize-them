import type { PropsWithChildren } from "react";
import { AppProviders } from "./AppProviders";

function App({ children }: PropsWithChildren) {
  return (
    <AppProviders>
      {children}
    </AppProviders>
  );
}