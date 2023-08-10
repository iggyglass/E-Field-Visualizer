import * as UI from './UIConsts.js';
import { Vec2 } from './Vec2.js';

const maxVoltage = 500e9;

export function updateVoltage(pos, charges) {
    let voltage = calcVoltage(pos, charges);

    UI.voltageValueText.innerHTML = Math.abs(voltage) < maxVoltage ? `${engineeringNotation(voltage)}V` : `${sign(voltage)}&infin; V`;
}

function calcVoltage(pos, charges) {
    const k = 8.99e9;
    let scale = new Vec2(window.innerWidth, window.innerHeight);
    let voltage = 0;

    pos = pos.mul(scale);

    for (let i = 0; i < charges.length(); i++) {
        voltage += (charges.array[i][2]) / pos.distFrom(scale.clone().mul(charges.array[i]));
    }

    return k * voltage;
}

function sign(num) {
    return num >= 0 ? '' : '-';
}

function engineeringNotation(num) {
    const units = {
        G: 1e9,
        M: 1e6,
        k: 1e3,
    };

    let pm = sign(num);
    num = Math.abs(num);

    for (let unit in units) {
        if (num >= units[unit]) return `${pm}${(num / units[unit]).toFixed(1)} ${unit}`;
    }

    return `${pm}${num.toFixed(1)} `;
}
