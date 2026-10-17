// Minimale typen voor het npm-pakket "potrace" (heeft geen eigen typen).
declare module "potrace" {
  export class Potrace {
    constructor(params?: Record<string, unknown>);
    loadImage(target: Buffer | string, callback: (err: Error | null) => void): void;
    getPathTag(fillColor?: string, scale?: number): string;
    getSVG(): string;
  }
}
