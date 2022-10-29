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
    fragSource: `
    #extension GL_OES_standard_derivatives : enable
    #define MAX_CHARGES ${maxCharges}
    #define PI 3.1415927

    precision mediump float;
    
    uniform vec2 viewport;
    uniform vec3 charges[MAX_CHARGES];
    uniform int chargesCount;

    const float ARROW_TILE_SIZE = 45.0;
    const float ARROW_HEAD_ANGLE = 45.0 * PI / 180.0;
    const float ARROW_HEAD_LENGTH = ARROW_TILE_SIZE / 6.0;
    const float ARROW_SHAFT_THICKNESS = 1.0;
    const float GRID_RADIUS = 2.0;

    float distSquared(vec2 a, vec2 b)
    {
        vec2 c = a - b;
        return dot(c, c);
    }

    vec2 calcField(vec2 pos)
    {
        vec2 field = vec2(0.0);

        for (int i = 0; i < MAX_CHARGES; ++i)
        {
            if (i >= chargesCount) break;

            vec2 dir = normalize(pos - charges[i].xy * viewport);
            field += charges[i].z / distSquared(pos, charges[i].xy * viewport) * dir;
        }

        return field * 1000000.0;
    }

    vec2 arrowTileCenterCoord(vec2 pos)
    {
        return (floor(pos / ARROW_TILE_SIZE) + 0.5) * ARROW_TILE_SIZE;
    }

    float gridCircle(vec2 p)
    {
        float inside = distance(p, arrowTileCenterCoord(p)) < GRID_RADIUS ? 1.0 : 0.0;
        return inside;
    }

    float arrow(vec2 p, vec2 v)
    {
        p -= arrowTileCenterCoord(p);

        float magV = length(v);
        float magP = length(p);

        if (magV > 0.0)
        {
            vec2 dirP = p / magP;
            vec2 dirV = v / magV;

            magV = clamp(magV, 5.0, ARROW_TILE_SIZE / 2.0);
            v = dirV * magV;

            float dist = max(
                // Shaft
                ARROW_SHAFT_THICKNESS / 4.0 - 
                    max(abs(dot(p, vec2(dirV.y, -dirV.x))), // Width
                        abs(dot(p, dirV)) - magV + ARROW_HEAD_LENGTH / 2.0), // Length
                    
                    // Arrow head
                 min(0.0, dot(v - p, dirV) - cos(ARROW_HEAD_ANGLE / 2.0) * length(v - p)) * 2.0 + // Front sides
                 min(0.0, dot(p, dirV) + ARROW_HEAD_LENGTH - magV)
            );

            return clamp(1.0 + dist, 0.0, 1.0);
        }
        else
        {
            return max(0.0, 1.2 - magP);
        }
    }

    vec4 calcPotentialColor()
    {
        // Calculate potential
        float potential = 0.0;
    
        for (int i = 0; i < MAX_CHARGES; ++i)
        {
            if (i >= chargesCount) break;
            potential += charges[i].z / distance(gl_FragCoord.xy, charges[i].xy * viewport);
        }

        // Do the coloring
        float f = fract(potential * 10000.0);
        float nf = fract(-potential * 10000.0);
        float df = fwidth(potential * 7000.0);
        float a = clamp(1.0 - smoothstep(df * 1.0, df * 2.0, f) + (1.0 - smoothstep(df * 1.0, df * 2.0, nf)), 0.0, 1.0);
        vec3 color = (floor(potential * 10000.0 + 0.5) >= 0.0) ? vec3(1.0, 0.3, 0.3) : vec3(0.3, 0.5, 1.0);

        return vec4(color, a);
    }

    void main()
    {
        vec3 color = vec3(0.15);
        vec4 potentialColor = calcPotentialColor();
        float arrowAlpha = arrow(gl_FragCoord.xy, calcField(arrowTileCenterCoord(gl_FragCoord.xy)) * ARROW_TILE_SIZE * 0.4);

        if (chargesCount > 0)
        {
            color = mix(color, vec3(0.5), arrowAlpha * length(calcField(gl_FragCoord.xy)));
            color = mix(color, potentialColor.rgb, potentialColor.a);
        }
        else
        {
            color = mix(color, vec3(0.5), gridCircle(gl_FragCoord.xy) * 0.1);
        }
    
        gl_FragColor = vec4(color, 1.0);
    }    
    `
}

class ChargePool {
    index = 0;
    maxSize = 0;
    array = [];

    constructor(maxLength) {
        this.maxSize = maxLength;
    }

    add(item) {
        if (this.array.length == this.maxSize) this.array.pop();

        this.array.unshift(item);
    }

    remove(index) {
        this.array.splice(index, 1);
    }

    length() {
        return this.array.length;
    }

    asF32Array() {
        return new Float32Array(this.array.flat());
    }
}

const glCanvas = document.getElementById('gl-canvas');
const gl = glCanvas.getContext('webgl');

const slider = document.getElementById('charge-slider');
const sliderValueText = document.getElementById('charge-value'); 

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
    viewportUniform: null
};

var posQueue = new ChargePool(maxCharges);

function init() {
    // Setup GL stuff
    if (!gl) {
        console.error('WebGL support is required to run!');
        return;
    }

    let ext = gl.getExtension('OES_standard_derivatives');

    if (!ext) {
        console.error('Unable to use WebGL standard derivatives extension!');
        return;
    }

    let vertShader = gl.createShader(gl.VERTEX_SHADER);
    let fragShader = gl.createShader(gl.FRAGMENT_SHADER);

    gl.shaderSource(vertShader, ShaderSources.vertSource);
    gl.shaderSource(fragShader, ShaderSources.fragSource);

    gl.compileShader(vertShader);
    gl.compileShader(fragShader);

    if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
        console.error('Could not compile vertex shader!', gl.getShaderInfoLog(vertShader));
        return;
    }
    
    if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
        console.error('Could not compile electric potential fragment shader!', gl.getShaderInfoLog(fragShader));
        return;
    }

    shaderProgram.program = gl.createProgram();

    gl.attachShader(shaderProgram.program, vertShader);
    gl.attachShader(shaderProgram.program, fragShader);
    gl.linkProgram(shaderProgram.program);

    if (!gl.getProgramParameter(shaderProgram.program, gl.LINK_STATUS)) {
        console.error('Could not link electric potential program!', gl.getProgramInfoLog(shaderProgram.program));
        return;
    }

    gl.validateProgram(shaderProgram.program);

    if (!gl.getProgramParameter(shaderProgram.program, gl.VALIDATE_STATUS)) {
        console.error('Error validating program!', gl.getProgramInfoLog(shaderProgram.program));
        return;
    }

    let vertBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(unitQuad), gl.STATIC_DRAW);

    shaderProgram.positionAttribute = gl.getAttribLocation(shaderProgram.program, 'vertPosition');
    shaderProgram.chargeArrayUniform = gl.getUniformLocation(shaderProgram.program, 'charges');
    shaderProgram.chargeArrayLengthUniform = gl.getUniformLocation(shaderProgram.program, 'chargesCount');
    shaderProgram.viewportUniform = gl.getUniformLocation(shaderProgram.program, 'viewport');

    gl.vertexAttribPointer(shaderProgram.positionAttribute, 2, gl.FLOAT, gl.FALSE, 2 * Float32Array.BYTES_PER_ELEMENT, 0);
    gl.enableVertexAttribArray(shaderProgram.positionAttribute);

    gl.useProgram(shaderProgram.program);

    initCanvas();

    // Setup events for user interaction
    window.addEventListener('resize', initCanvas);
    
    glCanvas.addEventListener('click', onClick);
    glCanvas.addEventListener('contextmenu', onClick);

    slider.addEventListener('input', (_) => sliderValueText.innerHTML = `${slider.value} C`);
}

function initCanvas() {
    glCanvas.width = Math.floor(window.innerWidth * window.devicePixelRatio);
    glCanvas.height = Math.floor(window.innerHeight * window.devicePixelRatio);

    glCanvas.style.width = `${window.innerWidth}px`;
    glCanvas.style.height = `${window.innerHeight}px`;

    draw();
}

function draw() {
    gl.viewport(0, 0, glCanvas.width, glCanvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.uniform3fv(shaderProgram.chargeArrayUniform, posQueue.asF32Array());
    gl.uniform1i(shaderProgram.chargeArrayLengthUniform, posQueue.length());
    gl.uniform2fv(shaderProgram.viewportUniform, new Float32Array([window.innerWidth * window.devicePixelRatio, window.innerHeight * window.devicePixelRatio]));

    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function dist(x1, y1, x2, y2) {
    let dx = x1 - x2;
    let dy = y1 - y2;

    return Math.sqrt(dx * dx + dy * dy);
}

function onClick(event) {
    let x = event.x / window.innerWidth;
    let y = 1.0 - event.y / window.innerHeight;    

    // Add Charge
    if (event.button == 0 && slider.value != 0) {
        posQueue.add([x, y, slider.value * 0.01]);
    }

    // Remove Charge
    if (event.button == 2) {
        for (let i = 0; i < posQueue.length(); i++) {
            if (dist(x, y, posQueue.array[i][0], posQueue.array[i][1]) < 0.1) {
                posQueue.remove(i);
                break;
            }
        }
    }

    event.preventDefault();
    draw();
}
