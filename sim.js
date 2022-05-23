const maxCharges = 32;

const ShaderSources = {
    vertSource: `
    precision mediump float;

    attribute vec2 vertPosition;
    
    void main()
    {
        gl_Position = vec4(vertPosition, 0.0, 1.0);
    }
    `,
    potentialFragSource: `
    #extension GL_OES_standard_derivatives : enable
    #define MAX_CHARGES ${maxCharges}

    precision mediump float;
    
    uniform vec2 viewport;
    uniform vec3 charges[MAX_CHARGES];
    uniform int chargesCount;
    
    void main()
    {
        // Calculate potential
        float potential = 0.0;
        vec2 position = gl_FragCoord.xy / viewport;
    
        for (int i = 0; i < MAX_CHARGES; ++i)
        {
            if (i >= chargesCount) break;
            potential += charges[i].z / distance(position, charges[i].xy);
        }
    
        // Do the coloring
        float f = fract(potential * 100.0);
        float df = fwidth(potential * 100.0);
        float g = smoothstep(df * 1.0, df * 2.0, f);
        vec3 color = (potential > 0.0) ? vec3(1.0, 0.3, 0.3) : vec3(0.3, 0.5, 1.0);
    
        gl_FragColor = vec4(color, 1.0 - g);
    }    
    `,
    eFieldFragSource: `
    precision mediump float;

void main()
{
    gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);
}
    `
}

class ChargeQueue {
    index = 0;
    array;

    constructor(length) {
        this.array = new Array(length);
    }

    add(item) {
        this.array[this.index++] = item;
        this.index %= this.array.length;
    }

    remove(index) {
        if (index < 0 || index > this.index - 1) throw new Error(`Index ${index} out of bounds!`);

        let temp = this.array[index];

        this.array[index] = this.array[this.index];
        this.array[this.index--] = temp;
    }

    length() {
        return this.index;
    }

    asF32Array() {
        return new Float32Array(this.array.flat());
    }
}

const canvas = document.getElementById('canvas');
const gl = canvas.getContext('webgl');

const unitQuad = [
     1.0,  1.0,
    -1.0,  1.0,
    -1.0, -1.0,
    -1.0, -1.0,
     1.0, -1.0,
     1.0,  1.0
];

var posQueue = new ChargeQueue(maxCharges);

// DEBUGGING
posQueue.add([0.1, 0.2, 0.009]);
posQueue.add([1.0, 0.3, 0.009]);

function init() {
    if (!gl) {
        console.error('WebGL support is required to run!');
        return;
    }

    document.addEventListener('resize', (_) => initCanvas());

    let ext = gl.getExtension('OES_standard_derivatives');

    if (!ext) {
        console.error('Unable to use WebGL standard derivatives extension!');
        return;
    }

    var vertShader = gl.createShader(gl.VERTEX_SHADER);
    var potentialFragShader = gl.createShader(gl.FRAGMENT_SHADER);
    var eFieldFragShader = gl.createShader(gl.FRAGMENT_SHADER);

    gl.shaderSource(vertShader, ShaderSources.vertSource);
    gl.shaderSource(potentialFragShader, ShaderSources.potentialFragSource);
    gl.shaderSource(eFieldFragShader, ShaderSources.eFieldFragSource);

    gl.compileShader(vertShader);
    gl.compileShader(potentialFragShader);
    gl.compileShader(eFieldFragShader);

    if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
        console.error('Could not compile vertex shader!', gl.getShaderInfoLog(vertShader));
        return;
    }
    
    if (!gl.getShaderParameter(potentialFragShader, gl.COMPILE_STATUS)) {
        console.error('Could not compile electric potential fragment shader!', gl.getShaderInfoLog(potentialFragShader));
        return;
    }

    if (!gl.getShaderParameter(eFieldFragShader, gl.COMPILE_STATUS)) {
        console.error('Could not compile electric field fragment shader!', gl.getShaderInfoLog(eFieldFragShader));
        return;
    }

    var potentialProgram = gl.createProgram();

    gl.attachShader(potentialProgram, vertShader);
    gl.attachShader(potentialProgram, potentialFragShader);
    gl.linkProgram(potentialProgram);

    if (!gl.getProgramParameter(potentialProgram, gl.LINK_STATUS)) {
        console.error('Could not link electric potential program!', gl.getProgramInfoLog(potentialProgram));
        return;
    }

    // DEBUG ONLY (validate program)
    gl.validateProgram(potentialProgram);

    if (!gl.getProgramParameter(potentialProgram, gl.VALIDATE_STATUS)) {
        console.error('Error validating program!', gl.getProgramInfoLog(potentialProgram));
        return;
    }
    // END DEBUG ONLY

    var vertBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(unitQuad), gl.STATIC_DRAW);

    let potentialPosAttrib = gl.getAttribLocation(potentialProgram, 'vertPosition');
    let potentialPosArrayUniform = gl.getUniformLocation(potentialProgram, 'charges');
    let potentialPosLenUniform = gl.getUniformLocation(potentialProgram, 'chargesCount');
    let potentialViewportUniform = gl.getUniformLocation(potentialProgram, 'viewport');

    gl.vertexAttribPointer(potentialPosAttrib, 2, gl.FLOAT, gl.FALSE, 2 * Float32Array.BYTES_PER_ELEMENT, 0);
    gl.enableVertexAttribArray(potentialPosAttrib);

    gl.useProgram(potentialProgram);

    gl.uniform3fv(potentialPosArrayUniform, posQueue.asF32Array());
    gl.uniform1i(potentialPosLenUniform, posQueue.length());
    gl.uniform2fv(potentialViewportUniform, new Float32Array([window.innerWidth, window.innerHeight]));

    initCanvas();

    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function initCanvas() {
    canvas.width = Math.floor(window.innerWidth * window.devicePixelRatio);
    canvas.height = Math.floor(window.innerHeight * window.devicePixelRatio);

    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

function draw() {

}
