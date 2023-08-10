import * as Consts from './modules/SimConsts.js';
import * as UI from './modules/UIConsts.js';
import * as GL from './modules/GLRenderer.js';
import * as Canvas from './modules/CanvasRenderer.js';
import { ChargePool } from './modules/ChargePool.js';
import { Vec2 } from './modules/Vec2.js';

const MouseButtons = {
    left: 0,
    right: 2
};

var posQueue = new ChargePool(Consts.maxCharges);

var leftMouseStatus = {
    down: false,
    dragging: false,
    dragStart: Vec2.zero(),
    selIndex: 0
};

function init() {
    GL.initShaders();
    initCanvas();

    // Setup events for user interaction
    window.addEventListener('resize', initCanvas);
    
    UI.fieldCanvas.addEventListener('mousedown', onMouseDown);
    UI.fieldCanvas.addEventListener('mouseup', onMouseUp); // TODO: mouse exit
    UI.fieldCanvas.addEventListener('mousemove', onMouseMove);
    UI.fieldCanvas.addEventListener('contextmenu', (e) => e.preventDefault());

    UI.slider.addEventListener('input', (_) => UI.sliderValueText.innerHTML = `${UI.slider.value} C`);
    UI.resetButton.addEventListener('click', clearScreen);
    UI.fieldLineCheckbox.addEventListener('change', (_) => window.requestAnimationFrame(draw));
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

    window.requestAnimationFrame(draw);
}

function draw() {
    GL.renderField(posQueue);
    Canvas.renderFieldLines(posQueue);
}

function clearScreen() {
    posQueue.clear();
    window.requestAnimationFrame(draw);
}

function onMouseDown(event) {
    if (event.button != MouseButtons.left) return;

    leftMouseStatus.down = true;
    leftMouseStatus.dragStart = posFromMouse(event);
}

function onMouseUp(event) {
    if (event.button == MouseButtons.right) onClick(event);
    if (event.button != MouseButtons.left) return;

    if (!leftMouseStatus.dragging) {
        onClick(event);
    }

    leftMouseStatus.dragging = false;
    leftMouseStatus.down = false;
}

function onMouseMove(event) {
    if (leftMouseStatus.down && !leftMouseStatus.dragging && leftMouseStatus.dragStart.distFrom(event) > 100) { // TODO: make this UI const
        leftMouseStatus.dragging = true;
        onDragStart(event);
    }

    if (leftMouseStatus.dragging) onDrag(event);
}

function onDragStart(event) {
    leftMouseStatus.selIndex = selectCharge(leftMouseStatus.dragStart);
}

function onDrag(event) {
    if (leftMouseStatus.selIndex == null) return;

    let pos = posFromMouse(event);

    posQueue.array[leftMouseStatus.selIndex][0] = pos.x;
    posQueue.array[leftMouseStatus.selIndex][1] = pos.y;

    window.requestAnimationFrame(draw);
}

function onClick(event) {
    let pos = posFromMouse(event);

    // Add Charge
    if (event.button == MouseButtons.left && UI.slider.value != 0) {
        posQueue.add([pos.x, pos.y, UI.slider.value * 0.01]);
    }

    // Remove Charge
    if (event.button == MouseButtons.right) {
        let i = selectCharge(pos);

        if (i != null) posQueue.remove(i);
    }

    window.requestAnimationFrame(draw);
}

function posFromMouse(event) {
    return new Vec2(event.x / window.innerWidth, 1.0 - event.y / window.innerHeight);
}

function selectCharge(pos) {
    for (let i = 0; i < posQueue.length(); i++) {
        if (pos.distFrom(posQueue.array[i]) < UI.selectionRadius) {
            return i;
        }
    }

    return null;
}

window.init = init;
