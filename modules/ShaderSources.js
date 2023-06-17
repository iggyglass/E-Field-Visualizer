import * as Consts from './SimConsts.js';

export const ShaderSources = {
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
    #define MAX_CHARGES ${Consts.maxCharges}
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

    const float POTENTIAL_COLOR_SCALE = 10000.0;
    const float POTENTIAL_LINE_WIDTH = 7000.0;

    const float VEC_FIELD_SCALE = ${formatGlslFloat(Consts.fieldScale)};

    const vec3 POS_CHARGE_COLOR = vec3(1.0, 0.3, 0.3);
    const vec3 NEG_CHARGE_COLOR = vec3(0.3, 0.5, 1.0);

    const vec3 BG_COLOR = vec3(0.15);
    const vec3 GRID_COLOR = vec3(0.5);

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

        return field * VEC_FIELD_SCALE;
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
        float f = fract(potential * POTENTIAL_COLOR_SCALE);
        float nf = fract(-potential * POTENTIAL_COLOR_SCALE);
        float df = fwidth(potential * POTENTIAL_LINE_WIDTH);
        float a = clamp(1.0 - smoothstep(df * 1.0, df * 2.0, f) + (1.0 - smoothstep(df * 1.0, df * 2.0, nf)), 0.0, 1.0);
        vec3 color = (floor(potential * POTENTIAL_COLOR_SCALE + 0.5) >= 0.0) ? POS_CHARGE_COLOR : NEG_CHARGE_COLOR;

        return vec4(color, a);
    }

    void main()
    {
        vec3 color = BG_COLOR;
        vec4 potentialColor = calcPotentialColor();
        float arrowAlpha = arrow(gl_FragCoord.xy, calcField(arrowTileCenterCoord(gl_FragCoord.xy)) * ARROW_TILE_SIZE * 0.4);

        if (chargesCount > 0)
        {
            color = mix(color, GRID_COLOR, arrowAlpha * length(calcField(gl_FragCoord.xy)));
            color = mix(color, potentialColor.rgb, potentialColor.a);
        }
        else
        {
            color = mix(color, GRID_COLOR, gridCircle(gl_FragCoord.xy) * 0.1);
        }
    
        gl_FragColor = vec4(color, 1.0);
    }    
    `
};

function formatGlslFloat(num) {
    let str = num.toString();

    if (!str.includes('.')) str += '.0';

    return str;
}
