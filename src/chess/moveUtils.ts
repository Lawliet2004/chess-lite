export function isUciMove(value: string): boolean { return /^[a-h][1-8][a-h][1-8][qrbn]?$/.test(value); }
