import type { Expression } from "../domain";

const infix: Record<string, string> = { Plus: " + ", Times: " · " };

const latexSymbols: Record<string, string> = {
  "λ": "\\lambda",
  "μ": "\\mu",
  "ν": "\\nu",
  "ν0": "\\nu_0",
  "ν1": "\\nu_1",
  I: "\\mathrm{i}",
};

function group(expression: Expression): string {
  const latex = expressionToLatex(expression);
  return expression.kind === "call" && expression.head === "Plus"
    ? `\\left(${latex}\\right)`
    : latex;
}

export function formatExpression(expression: Expression): string {
  switch (expression.kind) {
    case "integer":
    case "real":
    case "string":
      return expression.value;
    case "rational":
      return `${expression.numerator}/${expression.denominator}`;
    case "symbol":
      return expression.name;
    case "complex":
      return `${formatExpression(expression.real)} + ${formatExpression(expression.imaginary)} i`;
    case "sparseMatrix":
      return `${expression.dimensions[0]}×${expression.dimensions[1]} sparse matrix`;
    case "call": {
      if (expression.head === "Power" && expression.arguments.length === 2) {
        return `${formatExpression(expression.arguments[0])}^(${formatExpression(expression.arguments[1])})`;
      }
      const separator = infix[expression.head];
      if (separator) return expression.arguments.map(formatExpression).join(separator);
      return `${expression.head}(${expression.arguments.map(formatExpression).join(", ")})`;
    }
  }
}

export function expressionToLatex(expression: Expression): string {
  switch (expression.kind) {
    case "integer":
    case "real":
      return expression.value;
    case "string":
      return `\\text{${expression.value.replace(/[{}]/g, "")}}`;
    case "rational":
      return `\\frac{${expression.numerator}}{${expression.denominator}}`;
    case "symbol":
      return latexSymbols[expression.name] ?? expression.name.replace(/([0-9]+)$/, "_{$1}");
    case "complex":
      return `${expressionToLatex(expression.real)} + ${expressionToLatex(expression.imaginary)}\\,\\mathrm{i}`;
    case "sparseMatrix":
      return `\\text{${expression.dimensions[0]}\\times${expression.dimensions[1]} sparse matrix}`;
    case "call": {
      if (expression.head === "Power" && expression.arguments.length === 2) {
        const [base, exponent] = expression.arguments;
        if (exponent.kind === "integer" && exponent.value === "-1") {
          return `\\frac{1}{${group(base)}}`;
        }
        return `{${group(base)}}^{${expressionToLatex(exponent)}}`;
      }
      if (expression.head === "Times") {
        const factors = [...expression.arguments];
        const negative = factors[0]?.kind === "integer" && factors[0].value === "-1";
        if (negative) factors.shift();
        return `${negative ? "-" : ""}${factors.map(group).join("\\,") || "1"}`;
      }
      if (expression.head === "Plus") {
        return expression.arguments.map(expressionToLatex).join(" + ").replace(/\+ -/g, "- ");
      }
      return `\\operatorname{${expression.head}}\\left(${expression.arguments.map(expressionToLatex).join(",")}\\right)`;
    }
  }
}
