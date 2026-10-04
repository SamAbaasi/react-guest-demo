// jsdom has no IntersectionObserver; the properties panel uses one for sticky headers.
// A no-op stand-in is enough for these tests.
if (!globalThis.IntersectionObserver) {
  globalThis.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() { return []; }
  };
}
