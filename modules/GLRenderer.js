import * as ShaderSources from './ShaderSources.js';
import * as UI from './UIConsts.js';

const gl = UI.glCanvas.getContext('webgl');

const unitQuad = [
     1.0,  1.0,
    -1.0,  1.0,
    -1.0, -1.0,
    -1.0, -1.0,
     1.0, -1.0,
     1.0,  1.0
];

var shaderProgram = {
    program: null,
    positionAttribute: null,
    chargeArrayUniform: null,
    chargeArrayLengthUniform: null,
    viewportUniform: null,
    equipotentialUniform: null,
    fieldVecUniform: null
};

export function initShaders() {
    if (!gl) {
        console.error('WebGL support is required to run!');
        return false;
    }

    let ext = gl.getExtension('OES_standard_derivatives');

    if (!ext) {
        console.error('Unable to use WebGL standard derivatives extension!');
        return false;
    }

    if (!ShaderSources.loadShaders()) {
        console.error('Unable to load shaders!');
        return false;
    }

    let shaderSources = ShaderSources.getShaders();
    let vertShader = gl.createShader(gl.VERTEX_SHADER);
    let fragShader = gl.createShader(gl.FRAGMENT_SHADER);

    gl.shaderSource(vertShader, shaderSources.vertSource);
    gl.shaderSource(fragShader, shaderSources.fragSource);

    gl.compileShader(vertShader);
    gl.compileShader(fragShader);

    if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
        console.error('Could not compile vertex shader!', gl.getShaderInfoLog(vertShader));
        return false;
    }
    
    if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
        console.error('Could not compile electric potential fragment shader!', gl.getShaderInfoLog(fragShader));
        return false;
    }

    shaderProgram.program = gl.createProgram();

    gl.attachShader(shaderProgram.program, vertShader);
    gl.attachShader(shaderProgram.program, fragShader);
    gl.linkProgram(shaderProgram.program);

    if (!gl.getProgramParameter(shaderProgram.program, gl.LINK_STATUS)) {
        console.error('Could not link electric potential program!', gl.getProgramInfoLog(shaderProgram.program));
        return false;
    }

    gl.validateProgram(shaderProgram.program);

    if (!gl.getProgramParameter(shaderProgram.program, gl.VALIDATE_STATUS)) {
        console.error('Error validating program!', gl.getProgramInfoLog(shaderProgram.program));
        return false;
    }

    let vertBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(unitQuad), gl.STATIC_DRAW);

    shaderProgram.positionAttribute = gl.getAttribLocation(shaderProgram.program, 'vertPosition');
    shaderProgram.chargeArrayUniform = gl.getUniformLocation(shaderProgram.program, 'charges');
    shaderProgram.chargeArrayLengthUniform = gl.getUniformLocation(shaderProgram.program, 'chargesCount');
    shaderProgram.viewportUniform = gl.getUniformLocation(shaderProgram.program, 'viewport');
    shaderProgram.equipotentialUniform = gl.getUniformLocation(shaderProgram.program, 'renderEquipotentials');
    shaderProgram.fieldVecUniform = gl.getUniformLocation(shaderProgram.program, 'renderVecs');

    gl.vertexAttribPointer(shaderProgram.positionAttribute, 2, gl.FLOAT, gl.FALSE, 2 * Float32Array.BYTES_PER_ELEMENT, 0);
    gl.enableVertexAttribArray(shaderProgram.positionAttribute);

    gl.useProgram(shaderProgram.program);

    return true;
}

export function renderField(charges) {
    gl.viewport(0, 0, UI.glCanvas.width, UI.glCanvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.uniform3fv(shaderProgram.chargeArrayUniform, charges.length() > 0 ? charges.asF32Array() : [0, 0, 0]);
    gl.uniform1i(shaderProgram.chargeArrayLengthUniform, charges.length());
    gl.uniform1i(shaderProgram.equipotentialUniform, UI.equipotentialCheckbox.checked | 0);
    gl.uniform1i(shaderProgram.fieldVecUniform, UI.fieldVectorCheckbox.checked | 0);
    gl.uniform2fv(shaderProgram.viewportUniform, new Float32Array([window.innerWidth * window.devicePixelRatio, window.innerHeight * window.devicePixelRatio]));

    gl.drawArrays(gl.TRIANGLES, 0, 6);
}
