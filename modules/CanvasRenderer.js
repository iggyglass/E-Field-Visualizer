import * as Consts from './SimConsts.js';
import * as UI from './UIConsts.js';
import { Vec2 } from './Vec2.js';

const ctx = UI.fieldCanvas.getContext('2d');

export function renderFieldLines(charges) {
    ctx.clearRect(0, 0, UI.fieldCanvas.width, UI.fieldCanvas.height);
    ctx.strokeStyle = UI.fieldLineColor;
    ctx.lineWidth = UI.fieldLineWidth;

    if (!UI.fieldLineCheckbox.checked) return;

    for (let i = 0; i < charges.length(); i++) {
        let scale = 1;
        let offset = 0;
        
        if (charges.array[i][2] < 0) {
            scale = -1;
            offset = Math.PI / Consts.fieldLineCount;
        }

        for (let angle = 0; angle < Consts.fieldLineCount; angle++) {
            let radius = Consts.fieldLineChargeRadius * Math.abs(charges.array[i][2]);
            let pos = Vec2.fromPolar(radius, angle * (2 * Math.PI / Consts.fieldLineCount) + offset);
            pos = fromGlslCoords(pos.add(charges.array[i]));

            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);

            for (let j = 0; j < Consts.fieldLineLength; j++) {                
                let field = calcField(pos, charges);

                field.mulScalar(scale);
                field.y *= -1;

                field.normalize().mulScalar(Consts.fieldLineStepSize);
                pos.add(field);

                if (insideCharge(pos, charges)) break;

                ctx.lineTo(pos.x, pos.y);
            }

            ctx.stroke();
        }
    }
}

function fromGlslCoords(pos) {
    pos.x *= UI.fieldCanvas.width;
    pos.y = UI.fieldCanvas.height - pos.y * UI.fieldCanvas.height;

    return pos;
}

function toGlslCoords(pos) {
    pos.x /= UI.fieldCanvas.width;
    pos.y = 1.0 - pos.y / UI.fieldCanvas.height;

    return pos;
}

function insideCharge(pos, charges) {
    pos = toGlslCoords(pos.clone());

    for (let i = 0; i < charges.length(); i++) {
        let radius = Consts.fieldLineChargeRadius * Math.abs(charges.array[i][2]);
        if (pos.distFrom(charges.array[i]) < radius) return true;
    }

    return false;
}

function calcField(pos, charges) {
    pos = pos.clone();

    let field = Vec2.zero();
    pos.y = UI.fieldCanvas.height - pos.y;

    for (let i = 0; i < charges.length(); i++) {
        let viewport = new Vec2(UI.fieldCanvas.width, UI.fieldCanvas.height);
        let chargePos = viewport.mul(charges.array[i]);
        let dir = pos.clone().sub(chargePos).normalize();

        let dist = chargePos.distSquaredFrom(pos);

        field.add(dir.mulScalar(charges.array[i][2] / dist));
    }

    field.mulScalar(Consts.fieldScale);

    return field;
}
