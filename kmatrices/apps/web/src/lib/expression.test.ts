import { describe, expect, it } from "vitest";
import type { Expression } from "../domain";
import { expressionToLatex, formatExpression } from "./expression";

describe("expression formatting", () => {
  it("renders the restricted AST as readable text and LaTeX", () => {
    const expression: Expression = {
      kind: "call",
      head: "Times",
      arguments: [
        { kind: "integer", value: "-1" },
        { kind: "symbol", name: "λ" },
        { kind: "call", head: "Power", arguments: [
          { kind: "symbol", name: "u" },
          { kind: "integer", value: "-1" },
        ] },
      ],
    };
    expect(formatExpression(expression)).toBe("-1 · λ · u^(-1)");
    expect(expressionToLatex(expression)).toBe("-\\lambda\\,\\frac{1}{u}");
  });

  it("maps indexed boundary parameters without executable parsing", () => {
    expect(expressionToLatex({ kind: "symbol", name: "ν1" })).toBe("\\nu_1");
  });
});
