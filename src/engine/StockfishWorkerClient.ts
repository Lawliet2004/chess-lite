import { createAccumulator, parseBestMove, parseInfoLine } from "./evalParser";
import type { AnalyzeOptions, EngineAnalysis, EngineClient } from "./uciTypes";
import { createStockfishWorker } from "./stockfish.worker";

type Waiter = { match: (line: string) => boolean; resolve: () => void; reject: (error: Error) => void; timer: number };

export class StockfishWorkerClient implements EngineClient {
  private worker?: Worker;
  private waiters: Waiter[] = [];
  private fen = "startpos";
  private activeReject?: (error: Error) => void;

  async init(): Promise<void> {
    if (this.worker) return this.isReady();
    this.worker = createStockfishWorker();
    this.worker.onmessage = (event: MessageEvent<unknown>) => {
      const messages = Array.isArray(event.data) ? event.data : [event.data];
      for (const value of messages) this.handleLine(String(value));
    };
    this.worker.onerror = () => {
      const error = new Error("Engine failed to start. Check bundled Stockfish files.");
      this.rejectWaiters(error);
      this.activeReject?.(error);
    };
    this.send("uci");
    await this.waitFor((line) => line === "uciok", 15_000);
    // Stockfish emits position-specific win/draw/loss permille values.
    // https://github.com/official-stockfish/Stockfish/blob/master/src/uci.cpp
    this.send("setoption name UCI_ShowWDL value true");
    await this.isReady();
  }

  async isReady(): Promise<void> {
    this.assertWorker();
    this.send("isready");
    await this.waitFor((line) => line === "readyok", 10_000);
  }

  async newGame(): Promise<void> {
    this.send("ucinewgame");
    await this.isReady();
  }

  async setPositionFen(fen: string): Promise<void> {
    if (!fen || fen.length > 200) throw new Error("Invalid FEN");
    this.fen = fen;
  }

  async analyze(options: AnalyzeOptions): Promise<EngineAnalysis> {
    this.assertWorker();
    const depth = options.depth;
    const movetime = options.movetimeMs;
    if (!depth && !movetime) throw new Error("Analysis requires depth or movetime");
    const multipv = Math.max(1, Math.min(5, options.multipv ?? 1));
    this.send(`setoption name MultiPV value ${multipv}`);
    this.send(`position fen ${this.fen}`);
    const accumulator = createAccumulator();

    return new Promise<EngineAnalysis>((resolve, reject) => {
      this.activeReject = reject;
      const timeout = window.setTimeout(() => {
        this.send("stop");
        reject(new Error("Engine analysis timed out"));
      }, Math.max(30_000, (movetime ?? 0) + 15_000));
      const listener = (event: MessageEvent<unknown>) => {
        const lines = (Array.isArray(event.data) ? event.data : [event.data]).map(String);
        for (const line of lines) {
          const info = parseInfoLine(line);
          if (info) accumulator.push(info);
          const best = parseBestMove(line);
          if (!best) continue;
          window.clearTimeout(timeout);
          this.worker?.removeEventListener("message", listener);
          this.activeReject = undefined;
          const engineLines = accumulator.lines();
          const primary = engineLines[0];
          if (!primary) return reject(new Error("Engine returned no evaluation"));
          resolve({
            ...best,
            depth: primary.depth,
            seldepth: primary.seldepth,
            score: primary.score,
            wdl: primary.wdl,
            pv: primary.pv,
            nodes: primary.nodes,
            nps: primary.nps,
            timeMs: primary.timeMs,
            multipv: engineLines,
          });
        }
      };
      this.worker!.addEventListener("message", listener);
      this.send(depth ? `go depth ${Math.max(1, Math.min(30, depth))}` : `go movetime ${Math.max(25, Math.min(10_000, movetime!))}`);
    });
  }

  async stop(): Promise<void> { if (this.worker) this.send("stop"); }

  async quit(): Promise<void> {
    if (!this.worker) return;
    this.send("quit");
    this.worker.terminate();
    this.worker = undefined;
    this.rejectWaiters(new Error("Engine closed"));
  }

  private send(command: string): void { this.assertWorker().postMessage(command); }
  private assertWorker(): Worker {
    if (!this.worker) throw new Error("Engine is not initialized");
    return this.worker;
  }
  private handleLine(line: string): void {
    for (const waiter of [...this.waiters]) {
      if (!waiter.match(line)) continue;
      window.clearTimeout(waiter.timer);
      this.waiters.splice(this.waiters.indexOf(waiter), 1);
      waiter.resolve();
    }
  }
  private waitFor(match: (line: string) => boolean, timeoutMs: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const waiter: Waiter = { match, resolve, reject, timer: 0 };
      waiter.timer = window.setTimeout(() => {
        this.waiters.splice(this.waiters.indexOf(waiter), 1);
        reject(new Error("Engine did not become ready"));
      }, timeoutMs);
      this.waiters.push(waiter);
    });
  }
  private rejectWaiters(error: Error): void {
    for (const waiter of this.waiters) { window.clearTimeout(waiter.timer); waiter.reject(error); }
    this.waiters = [];
  }
}
