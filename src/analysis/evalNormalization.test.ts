import { cpLossForMover, graphValue, normalizeEngineScore } from "./evalNormalization";

describe("evaluation normalization", () => {
  it("normalizes side-to-move scores to White perspective", () => {
    expect(normalizeEngineScore({ type: "cp", value: 45 }, "w")).toEqual({ type: "cp", value: 45 });
    expect(normalizeEngineScore({ type: "cp", value: 45 }, "b")).toEqual({ type: "cp", value: -45 });
  });

  it("calculates loss from the mover's perspective", () => {
    expect(cpLossForMover({ type: "cp", value: 80 }, { type: "cp", value: -20 }, "w")).toBe(100);
    expect(cpLossForMover({ type: "cp", value: -80 }, { type: "cp", value: 20 }, "b")).toBe(100);
  });

  it("keeps mate distinct and caps only graph display", () => {
    expect(normalizeEngineScore({ type: "mate", value: 3 }, "b")).toEqual({ type: "mate", value: -3 });
    expect(graphValue({ type: "mate", value: -2 })).toBe(-10);
    expect(graphValue({ type: "cp", value: 5000 })).toBe(10);
  });
});
