export class AnalysisQueue {
  private controller?: AbortController;
  start(): AbortSignal { this.controller?.abort(); this.controller = new AbortController(); return this.controller.signal; }
  stop(): void { this.controller?.abort(); }
  get running(): boolean { return Boolean(this.controller && !this.controller.signal.aborted); }
}
