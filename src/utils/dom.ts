export function textContent(node: Element | null, maxLength = 10_000): string { return (node?.textContent ?? "").trim().slice(0, maxLength); }
