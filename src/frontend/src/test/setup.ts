import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { afterEach } from "vitest";

// The generated components expose stable `data-ocid` hooks rather than
// semantic test ids, so `getByTestId` reads that attribute.
configure({ testIdAttribute: "data-ocid" });

// React Testing Library does not auto-clean when Vitest globals are disabled.
afterEach(() => {
  cleanup();
});

// jsdom does not implement the Pointer Capture API that Radix UI primitives
// (Select, DropdownMenu, Dialog) call on pointer interactions. Without these
// stubs, opening a Radix Select throws `target.hasPointerCapture is not a
// function` and the interaction never reaches the component.
if (typeof Element !== "undefined") {
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.setPointerCapture ??= () => {};
  Element.prototype.releasePointerCapture ??= () => {};
}

// Radix Select scrolls the active option into view; jsdom has no layout engine.
if (typeof Element !== "undefined") {
  Element.prototype.scrollIntoView ??= () => {};
}
