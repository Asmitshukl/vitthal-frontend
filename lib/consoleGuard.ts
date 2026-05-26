const productionFlag =
  process.env.Production ??
  process.env.PRODUCTION ??
  process.env.NEXT_PUBLIC_Production ??
  process.env.NEXT_PUBLIC_PRODUCTION;

export const isProduction =
  String(productionFlag).toLowerCase() === "true" ||
  process.env.NODE_ENV === "production";

if (isProduction) {
  const noop = () => {};

  console.log = noop;
  console.warn = noop;
  console.info = noop;
  console.debug = noop;
  console.trace = noop;
}

export const consoleGuardScript = isProduction
  ? "(() => { const noop = () => {}; if (window.__VITTHAL_CONSOLE_GUARD__) return; window.__VITTHAL_CONSOLE_GUARD__ = true; console.log = noop; console.warn = noop; console.info = noop; console.debug = noop; console.trace = noop; })();"
  : "";