/**
 * Secure, lightweight math expression evaluator.
 * Supports: + - * / ( ) with operator precedence.
 * Accepts both '.' and ',' as decimal separators.
 * Returns null for invalid / unsafe expressions.
 *
 * Implementation: hand-written recursive-descent parser.
 * NO eval() — only whitelisted chars are processed.
 */

/** Allowed characters whitelist before any parsing */
const ALLOWED = /^[\d\s+\-*/().,%]+$/;

/** Normalise expression: commas → dots, strip spaces */
function normalise(expr: string): string {
  return expr.replace(/,/g, ".").replace(/\s/g, "");
}

/** Tokeniser */
type Token =
  | { type: "num"; value: number }
  | { type: "op"; value: "+" | "-" | "*" | "/" }
  | { type: "lparen" }
  | { type: "rparen" };

function tokenise(expr: string): Token[] | null {
  const tokens: Token[] = [];
  let i = 0;
  while (i < expr.length) {
    const ch = expr[i];
    if (ch >= "0" && ch <= "9" || ch === ".") {
      let num = "";
      let dots = 0;
      while (i < expr.length && (expr[i] >= "0" && expr[i] <= "9" || expr[i] === ".")) {
        if (expr[i] === ".") dots++;
        num += expr[i++];
      }
      if (dots > 1) return null; // malformed number
      tokens.push({ type: "num", value: parseFloat(num) });
    } else if (ch === "+" || ch === "-" || ch === "*" || ch === "/") {
      tokens.push({ type: "op", value: ch as "+" | "-" | "*" | "/" });
      i++;
    } else if (ch === "(") {
      tokens.push({ type: "lparen" });
      i++;
    } else if (ch === ")") {
      tokens.push({ type: "rparen" });
      i++;
    } else {
      return null; // unexpected char
    }
  }
  return tokens;
}

/** Recursive descent parser — respects operator precedence */
class Parser {
  private pos = 0;
  constructor(private tokens: Token[]) {}

  private peek(): Token | null {
    return this.tokens[this.pos] ?? null;
  }

  private consume(): Token {
    return this.tokens[this.pos++];
  }

  /** expression = term (('+' | '-') term)* */
  parseExpr(): number | null {
    let left = this.parseTerm();
    if (left === null) return null;

    while (true) {
      const tok = this.peek();
      if (!tok || tok.type !== "op" || (tok.value !== "+" && tok.value !== "-")) break;
      this.consume();
      const right = this.parseTerm();
      if (right === null) return null;
      left = tok.value === "+" ? left + right : left - right;
    }
    return left;
  }

  /** term = factor (('*' | '/') factor)* */
  private parseTerm(): number | null {
    let left = this.parseFactor();
    if (left === null) return null;

    while (true) {
      const tok = this.peek();
      if (!tok || tok.type !== "op" || (tok.value !== "*" && tok.value !== "/")) break;
      this.consume();
      const right = this.parseFactor();
      if (right === null) return null;
      if (tok.value === "/" && right === 0) return null; // division by zero
      left = tok.value === "*" ? left * right : left / right;
    }
    return left;
  }

  /** factor = ['-'] number | '(' expression ')' */
  private parseFactor(): number | null {
    const tok = this.peek();
    if (!tok) return null;

    // Unary minus
    if (tok.type === "op" && tok.value === "-") {
      this.consume();
      const val = this.parseFactor();
      return val === null ? null : -val;
    }

    // Parenthesised expression
    if (tok.type === "lparen") {
      this.consume();
      const val = this.parseExpr();
      if (val === null) return null;
      const closing = this.peek();
      if (!closing || closing.type !== "rparen") return null;
      this.consume();
      return val;
    }

    // Number literal
    if (tok.type === "num") {
      this.consume();
      return tok.value;
    }

    return null;
  }
}

/**
 * Evaluates a math expression string securely.
 * @returns numeric result, or null if invalid.
 */
export function evaluateExpression(raw: string): number | null {
  if (!raw || !raw.trim()) return null;

  const expr = normalise(raw.trim());
  if (!ALLOWED.test(expr)) return null;
  if (!expr) return null;

  const tokens = tokenise(expr);
  if (!tokens || tokens.length === 0) return null;

  const parser = new Parser(tokens);
  const result = parser.parseExpr();

  // Must consume all tokens (no trailing garbage)
  if (result === null) return null;

  // Clamp unreasonable values
  if (!isFinite(result)) return null;

  return result;
}

/**
 * Returns true if the expression string contains an operator character
 * (meaning it looks like a calculation, not a plain number).
 */
export function isExpression(raw: string): boolean {
  return /[+\-*/()]/.test(raw);
}
