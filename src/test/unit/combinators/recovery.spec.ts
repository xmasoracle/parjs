import { expectFailure, expectSuccess } from "../../helpers/custom-matchers";
import { ResultKind } from "../../../lib/internal/result";
import { string, fail, rest } from "../../../lib/internal/parsers";
import {
    mapConst,
    maybe,
    not,
    or,
    qthen,
    recover,
    stringify,
    then
} from "../../../lib/combinators";

describe("maybe combinator", () => {
    it("works", () => {
        const p = string("a");
        const m = p.pipe(maybe());
        expectSuccess(m.parse("a"));
        expectSuccess(m.parse(""));
    });

    it("causes progress on success", () => {
        const p = string("abc").pipe(maybe(), qthen("123"));
        expectSuccess(p.parse("abc123"), "123");
    });

    it("propagates hard failure", () => {
        const p = fail().pipe(maybe());
        expectFailure(p.parse(""), ResultKind.HardFail);
    });
});

describe("or combinator", () => {
    describe("loud or loud", () => {
        const parser = string("ab").pipe(or("cd"));
        it("succeeds parsing 1st option", () => {
            expectSuccess(parser.parse("ab"), "ab");
        });
        it("suceeds parsing 2nd option", () => {
            expectSuccess(parser.parse("cd"), "cd");
        });
        it("fails parsing both", () => {
            expectFailure(parser.parse("ef"), ResultKind.SoftFail);
        });
        it("fails hard when 1st fails hard", () => {
            const parser2 = fail({
                reason: "fail",
                kind: ResultKind.HardFail
            }).pipe(mapConst("x"), or("ab"));
            expectFailure(parser2.parse("ab"), ResultKind.HardFail);
        });
        const parser2 = string("ab").pipe(
            or(
                fail({
                    reason: "x",
                    kind: "Hard"
                })
            )
        );
        it("succeeds with 2nd would've failed hard", () => {
            expectSuccess(parser2.parse("ab"), "ab");
        });
        it("fails when 2nd fails hard", () => {
            expectFailure(parser2.parse("cd"), ResultKind.HardFail);
        });
    });
});

describe("or val combinator", () => {
    const parser = string("a").pipe(then("b"), stringify(), maybe("c"));

    const p2 = string("a").pipe(maybe(0), then("b"));
    it("succeeds to parse", () => {
        expectSuccess(parser.parse("ab"), "ab");
    });

    it("if first fails hard, then fail hard", () => {
        expectFailure(parser.parse("ax"), ResultKind.HardFail);
    });

    it("if first fail soft, then return value", () => {
        expectSuccess(parser.parse(""), "c");
    });

    it("falsy alt value", () => {
        const result = p2.parse("b");
        expectSuccess(result, [0, "b"]);
    });
});

describe("not combinator", () => {
    const parser = string("a").pipe(then("b"), stringify(), not());
    it("succeeds on empty input/soft fail", () => {
        expectSuccess(parser.parse(""), undefined);
    });
    it("succeeds on hard fail if we take care of the rest", () => {
        const parser2 = parser.pipe(then(rest()));
        expectSuccess(parser2.parse("a"));
    });
    it("soft fails on passing input", () => {
        expectFailure(parser.parse("ab"), ResultKind.SoftFail);
    });
    it("fails fatally on fatal fail", () => {
        const parser2 = fail({
            kind: "Fatal",
            reason: "fatal"
        }).pipe(not());
        expectFailure(parser2.parse(""), ResultKind.FatalFail);
    });
    it("fails on too much input", () => {
        expectFailure(parser.parse("a"), ResultKind.SoftFail);
    });
});

describe("soft combinator", () => {
    const parser = string("a").pipe(
        then("b"),
        stringify(),
        recover(() => ({ kind: "Soft" }))
    );
    it("succeeds", () => {
        expectSuccess(parser.parse("ab"), "ab");
    });
    it("fails softly on soft fail", () => {
        expectFailure(parser.parse("ba"), ResultKind.SoftFail);
    });
    it("fails softly on hard fail", () => {
        expectFailure(parser.parse("a"), ResultKind.SoftFail);
    });
    it("fails fatally on fatal fail", () => {
        const parser2 = fail({
            kind: "Fatal"
        }).pipe(recover(() => ({ kind: "Soft" })));
        expectFailure(parser2.parse(""), ResultKind.FatalFail);
    });
});
