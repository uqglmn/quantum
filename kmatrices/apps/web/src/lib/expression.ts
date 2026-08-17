import type { Expression } from "../domain";

const infix: Record<string, string> = { Plus: " + ", Times: " · " };

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
