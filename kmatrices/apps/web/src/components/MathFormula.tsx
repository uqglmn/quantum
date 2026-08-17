import { useMemo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

export function MathFormula({
  latex,
  display = true,
  className = "",
  label,
}: {
  latex: string;
  display?: boolean;
  className?: string;
  label?: string;
}) {
  const html = useMemo(() => katex.renderToString(latex, {
    displayMode: display,
    throwOnError: false,
    strict: "warn",
    trust: false,
    output: "htmlAndMathml",
  }), [latex, display]);

  return <div
    className={`math-formula ${display ? "math-formula--display" : "math-formula--inline"} ${className}`}
    aria-label={label}
    dangerouslySetInnerHTML={{ __html: html }}
  />;
}
