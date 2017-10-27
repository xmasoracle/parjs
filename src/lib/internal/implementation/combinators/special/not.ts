/**
 * @module parjs/internal/implementation/combinators
 */ /** */
import {ParjsAction} from "../../action";
import {QUIET_RESULT} from "../../special-results";
import {AnyParserAction} from "../../../action";
import {ReplyKind} from "../../../../reply";
import {ParsingState} from "../../state";
/**
 * Created by User on 22-Nov-16.
 */
export class PrsNot extends ParjsAction {

    isLoud = false;
    expecting : string;
    constructor(private inner : AnyParserAction) {
        super();
        this.expecting = `not: ${inner.expecting}`;
    };

    _apply(ps : ParsingState) {
        let {inner} = this;
        let {position} = ps;
        inner.apply(ps);
        if (ps.isOk) {
            ps.position = position;
            ps.kind = ReplyKind.SoftFail;
        }
        else if (ps.kind === ReplyKind.HardFail || ps.kind === ReplyKind.SoftFail) {
            //hard fails are okay here
            ps.kind = ReplyKind.OK;
            ps.position = position;
            return;
        }
        //the remaining case is a fatal failure that isn't recovered from.
    }
}