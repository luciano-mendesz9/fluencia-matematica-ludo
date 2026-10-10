import { describe, expect, it } from "vitest";
import {
  LudoDomainError,
  PROPOSED_MVP_BOARD,
  applyMove,
  assertValidGameState,
  canonicalCell,
  chooseMachineMove,
  createBoardDefinition,
  finalTrackProgress,
  legalMoves,
  winnerOf,
  type GameState,
  type LegalMove,
} from "../../src/domain/ludo";
import { base, boardWithRules, gameState, home, track } from "../fixtures/ludo";

describe("FM-016 board definition", () => {
  it("versiona dois percursos de 52 casas e um corredor final de seis", () => {
    expect(PROPOSED_MVP_BOARD.version).toBe("ludo-mvp-proposed-v1");
    expect(PROPOSED_MVP_BOARD.paths.STUDENT).toHaveLength(52);
    expect(PROPOSED_MVP_BOARD.paths.MACHINE).toHaveLength(52);
    expect(PROPOSED_MVP_BOARD.homeStretchLength).toBe(6);
    expect(finalTrackProgress(PROPOSED_MVP_BOARD)).toBe(57);
    expect(canonicalCell(PROPOSED_MVP_BOARD, "STUDENT", 0)).toBe(0);
    expect(canonicalCell(PROPOSED_MVP_BOARD, "MACHINE", 0)).toBe(26);
    expect(canonicalCell(PROPOSED_MVP_BOARD, "STUDENT", 52)).toBeNull();
  });

  it("rejeita definição sem caminho canônico completo", () => {
    expect(() => createBoardDefinition({
      ...PROPOSED_MVP_BOARD,
      paths: { ...PROPOSED_MVP_BOARD.paths, STUDENT: [0, 1] },
    })).toThrowError(LudoDomainError);
  });

  it("expõe OD-002 como configuração explícita e imutável", () => {
    expect(PROPOSED_MVP_BOARD.rules).toEqual({
      requireExactHome: true,
      machineExtraRollOnSix: false,
      allowOwnPieceSharing: true,
      resetRecoveryErrorsWhenAllPlayablePiecesReturnToBase: false,
    });
    expect(Object.isFrozen(PROPOSED_MVP_BOARD.rules)).toBe(true);
  });
});

describe("FM-016 legalMoves catalog", () => {
  const catalog = [
    { name: "base com 1 não sai", state: gameState(), piece: "s1", dice: 1, to: null },
    { name: "base com 6 entra no percurso", state: gameState(), piece: "s1", dice: 6, to: track(0) },
    { name: "percurso compartilhado avança", state: gameState(PROPOSED_MVP_BOARD, { s1: track(10) }), piece: "s1", dice: 3, to: track(13) },
    { name: "entra no corredor final", state: gameState(PROPOSED_MVP_BOARD, { s1: track(50) }), piece: "s1", dice: 3, to: track(53) },
    { name: "chega com valor exato", state: gameState(PROPOSED_MVP_BOARD, { s1: track(57) }), piece: "s1", dice: 1, to: home() },
    { name: "não ultrapassa chegada exata", state: gameState(PROPOSED_MVP_BOARD, { s1: track(57) }), piece: "s1", dice: 2, to: null },
    { name: "pino concluído não se move", state: gameState(PROPOSED_MVP_BOARD, { s1: home() }), piece: "s1", dice: 6, to: null },
  ] as const;

  for (const fixture of catalog) {
    it(fixture.name, () => {
      const move = legalMoves(PROPOSED_MVP_BOARD, fixture.state, "STUDENT", fixture.dice)
        .find((candidate) => candidate.pieceId === fixture.piece);
      expect(move?.to ?? null).toEqual(fixture.to);
    });
  }

  it("permite uma variante parametrizada sem chegada exata", () => {
    const board = boardWithRules({ requireExactHome: false });
    const move = legalMoves(board, gameState(board, { s1: track(57) }), "STUDENT", 6)
      .find((candidate) => candidate.pieceId === "s1");
    expect(move?.to).toEqual(home());
  });

  it("rejeita dado fornecido fora do domínio", () => {
    expect(() => legalMoves(PROPOSED_MVP_BOARD, gameState(), "STUDENT", 0)).toThrowError(
      expect.objectContaining({ code: "INVALID_DICE" }),
    );
  });

  it("bloqueia compartilhamento próprio quando a configuração proíbe", () => {
    const board = boardWithRules({ allowOwnPieceSharing: false });
    const state = gameState(board, { s1: track(4), s2: track(5) });
    expect(legalMoves(board, state, "STUDENT", 1).map((move) => move.pieceId)).not.toContain("s1");
  });
});

describe("FM-016 capture and transition", () => {
  it("captura em casa comum e devolve todos os adversários daquela casa à base", () => {
    const state = gameState(PROPOSED_MVP_BOARD, {
      s1: track(9),
      m1: track(36),
      m2: track(36),
    });
    const move = legalMoves(PROPOSED_MVP_BOARD, state, "STUDENT", 1)
      .find((candidate) => candidate.pieceId === "s1") as LegalMove;
    expect(move.capturedPieceIds).toEqual(["m1", "m2"]);

    const result = applyMove(PROPOSED_MVP_BOARD, state, move);
    expect(result.state.pieces.find((piece) => piece.id === "s1")?.position).toEqual(track(10));
    expect(result.state.pieces.find((piece) => piece.id === "m1")?.position).toEqual(base());
    expect(result.state.pieces.find((piece) => piece.id === "m2")?.position).toEqual(base());
  });

  it("não captura nem invalida convivência entre adversários em casa segura", () => {
    const state = gameState(PROPOSED_MVP_BOARD, { s1: track(7), m1: track(34) });
    const move = legalMoves(PROPOSED_MVP_BOARD, state, "STUDENT", 1)
      .find((candidate) => candidate.pieceId === "s1") as LegalMove;
    expect(canonicalCell(PROPOSED_MVP_BOARD, "STUDENT", 8)).toBe(8);
    expect(move.capturedPieceIds).toEqual([]);
    expect(() => applyMove(PROPOSED_MVP_BOARD, state, move)).not.toThrow();
  });

  it("recalcula o movimento e rejeita captura adulterada ou estado obsoleto", () => {
    const state = gameState(PROPOSED_MVP_BOARD, { s1: track(9), m1: track(36) });
    const move = legalMoves(PROPOSED_MVP_BOARD, state, "STUDENT", 1)
      .find((candidate) => candidate.pieceId === "s1") as LegalMove;
    expect(() => applyMove(PROPOSED_MVP_BOARD, state, { ...move, capturedPieceIds: [] }))
      .toThrowError(expect.objectContaining({ code: "ILLEGAL_MOVE" }));
  });

  it("não altera o estado de entrada", () => {
    const state = gameState(PROPOSED_MVP_BOARD, { s1: track(10) });
    for (const piece of state.pieces) Object.freeze(piece.position);
    Object.freeze(state.pieces);
    Object.freeze(state);
    const move = legalMoves(PROPOSED_MVP_BOARD, state, "STUDENT", 2)
      .find((candidate) => candidate.pieceId === "s1") as LegalMove;
    const result = applyMove(PROPOSED_MVP_BOARD, state, move);
    expect(state.pieces.find((piece) => piece.id === "s1")?.position).toEqual(track(10));
    expect(result.state.pieces.find((piece) => piece.id === "s1")?.position).toEqual(track(12));
  });

  it("detecta a vitória quando o quarto pino chega", () => {
    const state = gameState(PROPOSED_MVP_BOARD, {
      s1: home(), s2: home(), s3: home(), s4: track(57),
    });
    const move = legalMoves(PROPOSED_MVP_BOARD, state, "STUDENT", 1)
      .find((candidate) => candidate.pieceId === "s4") as LegalMove;
    const result = applyMove(PROPOSED_MVP_BOARD, state, move);
    expect(result.winner).toBe("STUDENT");
    expect(winnerOf(PROPOSED_MVP_BOARD, result.state)).toBe("STUDENT");
    expect(legalMoves(PROPOSED_MVP_BOARD, result.state, "MACHINE", 6)).toEqual([]);
  });
});

describe("FM-016 machine policy", () => {
  it("prioriza chegada, depois captura, saída, avanço e desempata por pieceId", () => {
    const finish = gameState(PROPOSED_MVP_BOARD, { m1: track(57), m2: track(0), s1: track(27) });
    expect(chooseMachineMove(PROPOSED_MVP_BOARD, finish, 1)?.pieceId).toBe("m1");

    const capture = gameState(PROPOSED_MVP_BOARD, { m1: track(0), s1: track(32) });
    expect(chooseMachineMove(PROPOSED_MVP_BOARD, capture, 6)?.pieceId).toBe("m1");

    const exit = gameState(PROPOSED_MVP_BOARD, { m2: track(1) });
    expect(chooseMachineMove(PROPOSED_MVP_BOARD, exit, 6)?.pieceId).toBe("m1");

    const tie = gameState(PROPOSED_MVP_BOARD, { m1: track(1), m2: track(8) });
    expect(chooseMachineMove(PROPOSED_MVP_BOARD, tie, 2)?.pieceId).toBe("m1");
  });

  it("retorna null quando nenhum movimento é possível", () => {
    expect(chooseMachineMove(PROPOSED_MVP_BOARD, gameState(), 4)).toBeNull();
  });
});

describe("FM-016 invariants", () => {
  it("rejeita versão divergente, quantidade errada e progresso inválido", () => {
    expect(() => assertValidGameState(PROPOSED_MVP_BOARD, { ...gameState(), boardVersion: "outra" }))
      .toThrowError(expect.objectContaining({ code: "INVALID_STATE" }));
    expect(() => assertValidGameState(PROPOSED_MVP_BOARD, { ...gameState(), pieces: gameState().pieces.slice(1) }))
      .toThrowError(expect.objectContaining({ code: "INVALID_STATE" }));
    expect(() => assertValidGameState(PROPOSED_MVP_BOARD, gameState(PROPOSED_MVP_BOARD, { s1: track(58) })))
      .toThrowError(expect.objectContaining({ code: "INVALID_STATE" }));
  });

  it("rejeita adversários coexistindo fora de casa segura", () => {
    expect(() => assertValidGameState(
      PROPOSED_MVP_BOARD,
      gameState(PROPOSED_MVP_BOARD, { s1: track(10), m1: track(36) }),
    )).toThrowError(expect.objectContaining({ code: "INVALID_STATE" }));
  });

  it("mantém todo movimento gerado dentro do mapa", () => {
    for (let progress = 0; progress <= finalTrackProgress(PROPOSED_MVP_BOARD); progress += 1) {
      for (let dice = 1; dice <= 6; dice += 1) {
        const state: GameState = gameState(PROPOSED_MVP_BOARD, { s1: track(progress) });
        const move = legalMoves(PROPOSED_MVP_BOARD, state, "STUDENT", dice)
          .find((candidate) => candidate.pieceId === "s1");
        if (!move) continue;
        const result = applyMove(PROPOSED_MVP_BOARD, state, move);
        expect(() => assertValidGameState(PROPOSED_MVP_BOARD, result.state)).not.toThrow();
        const position = result.state.pieces.find((piece) => piece.id === "s1")?.position;
        if (position?.kind === "TRACK") {
          expect(position.progress).toBeGreaterThanOrEqual(0);
          expect(position.progress).toBeLessThanOrEqual(57);
        }
      }
    }
  });
});
