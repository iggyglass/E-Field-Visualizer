import * as Consts from './modules/SimConsts.js';
import * as UI from './modules/UIConsts.js';
import * as GL from './modules/GLRenderer.js';
import * as Canvas from './modules/CanvasRenderer.js';
import { ChargePool } from './modules/ChargePool.js';
import { Vec2 } from './modules/Vec2.js';

var posQueue = new ChargePool(Consts.maxCharges);

function init() {
    GL.initShaders();
    initCanvas();

    // Setup events for user interaction
    window.addEventListener('resize', initCanvas);
    
    UI.fieldCanvas.addEventListener('click', onClick);
    UI.fieldCanvas.addEventListener('contextmenu', onClick);

    UI.slider.addEventListener('input', (_) => UI.sliderValueText.innerHTML = `${UI.slider.value} C`);
    UI.fieldLineCheckbox.addEventListener('change', draw)
}

function initCanvas() {
    // GL Canvas
    UI.glCanvas.width = Math.floor(window.innerWidth * window.devicePixelRatio);
    UI.glCanvas.height = Math.floor(window.innerHeight * window.devicePixelRatio);

    UI.glCanvas.style.width = `${window.innerWidth}px`;
    UI.glCanvas.style.height = `${window.innerHeight}px`;

    // Field line canvas
    UI.fieldCanvas.width = Math.floor(window.innerWidth * window.devicePixelRatio);
    UI.fieldCanvas.height = Math.floor(window.innerHeight * window.devicePixelRatio);

    UI.fieldCanvas.style.width = `${window.innerWidth}px`;
    UI.fieldCanvas.style.height = `${window.innerHeight}px`;

    draw();
}

function draw() {
    GL.renderField(posQueue);
    Canvas.renderFieldLines(posQueue);
}

function onClick(event) {
    let pos = new Vec2(event.x / window.innerWidth, 1.0 - event.y / window.innerHeight);

    // Add Charge
    if (event.button == 0 && UI.slider.value != 0) {
        posQueue.add([pos.x, pos.y, UI.slider.value * 0.01]);
    }

    // Remove Charge
    if (event.button == 2) {
        for (let i = 0; i < posQueue.length(); i++) {
            if (pos.distFrom(posQueue.array[i]) < UI.selectionRadius) {
                posQueue.remove(i);
                break;
            }
        }
    }

    event.preventDefault();
    draw();
}

window.init = init;
