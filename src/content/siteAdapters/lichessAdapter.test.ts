import { lichessAdapter } from "./lichessAdapter";

describe("Lichess completed-game adapter", () => {
  it("uses the official same-origin PGN export for a completed replay", async () => {
    document.body.innerHTML = '<main class="analyse"><div class="analyse__moves"><div class="result">½-½</div></div></main>';
    const pgn = '[Event "Completed"]\n[Result "1/2-1/2"]\n\n1. d4 d5 1/2-1/2';
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => pgn });
    vi.stubGlobal("fetch", fetchMock);

    const result = await lichessAdapter.inspect(document, new URL("https://lichess.org/q7ZvsdUF"));

    expect(result.context.status).toBe("finished");
    expect(result.pgn).toBe(pgn);
    expect(fetchMock).toHaveBeenCalledWith("/game/export/q7ZvsdUF", expect.objectContaining({ credentials: "include" }));
    vi.unstubAllGlobals();
  });
});
