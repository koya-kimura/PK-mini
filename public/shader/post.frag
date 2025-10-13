precision mediump float;

varying vec2 vTexCoord;

uniform float u_time;
uniform vec2 u_resolution;
uniform sampler2D u_tex;
uniform sampler2D u_uitex;
uniform float u_invert;
uniform float u_mosaic;
uniform float u_noise;
uniform float u_tile;
uniform float u_rgbSplit;
uniform float u_monochrome;
uniform float u_zoom;
uniform float u_blockRotate;

float PI = 3.14159265358979;

float random(vec2 st){
    return fract(sin(dot(st.xy,vec2(12.9898,78.233)))*43758.5453123);
}

vec2 mosaic(vec2 uv, float n){
    return (floor(uv*n)+0.5)/n;
}

vec4 monochrome(vec4 col){
    float gray = (col.r + col.g + col.b) / 3.0;
    gray = floor(gray * 3.0 + 0.5) / 3.0;
    return vec4(vec3(gray), col.a);
}


void main(void) {
    vec2 uv = vTexCoord;

    // --- Noise jitter -----------------------------------------------------
    // Subtle random wobble to keep the background lively.
    uv += (vec2(random(uv) * 0.1 - 0.05)) * (u_noise + 0.025);

    // モザイク
    if(u_mosaic > 0.){
        uv = mosaic(uv, mix(1000.0, 5.0, pow(u_mosaic, 2.0)));
    }

    if(u_tile > 0.){
        float n = floor(u_tile*4.0);
        uv = fract(uv*n);
    }

    float zoomLevel = clamp(u_zoom, 0.0, 1.0);
    float zoomFactor = mix(1.0, 2.5, zoomLevel);
    vec2 zoomCenter = vec2(0.5);
    vec2 sampleUV = (uv - zoomCenter) / zoomFactor + zoomCenter;
    sampleUV = clamp(sampleUV, vec2(0.0), vec2(1.0));

    float blockRotateLevel = clamp(u_blockRotate, 0.0, 1.0);
    if(blockRotateLevel > 0.0){
        // 画面を 16x9 ブロックに分割して、各ブロックを一斉に回転。
        vec2 gridSize = vec2(16.0, 9.0);
        vec2 blockIndex = floor(sampleUV * gridSize);
        vec2 blockCoord = fract(sampleUV * gridSize);
        vec2 centeredCoord = blockCoord - 0.5;
        float angle = blockRotateLevel * (PI * 0.5);
        float c = cos(angle);
        float s = sin(angle);
        vec2 rotatedCoord = vec2(
            centeredCoord.x * c - centeredCoord.y * s,
            centeredCoord.x * s + centeredCoord.y * c
        );
        vec2 clampedLocal = clamp(rotatedCoord + 0.5, 0.0, 1.0);
        sampleUV = (blockIndex + clampedLocal) / gridSize;
        sampleUV = clamp(sampleUV, vec2(0.0), vec2(1.0));
    }

    vec4 renderColor = texture2D(u_tex, sampleUV);

    // --- RGB split --------------------------------------------------------
    float rgbSplitLevel = clamp(u_rgbSplit, 0.0, 1.0);
    if(rgbSplitLevel > 0.0){
        float splitAmount = mix(0.0, 0.03, rgbSplitLevel * rgbSplitLevel);
        vec2 dynamicShift = vec2(
            sin(u_time * 0.7) * splitAmount * 0.6,
            cos(u_time * 0.9) * splitAmount * 0.4
        );
        vec2 splitOffset = vec2(splitAmount, splitAmount * 0.5);

        vec3 splitColor;
        splitColor.r = texture2D(u_tex, clamp(sampleUV + splitOffset + dynamicShift, 0.0, 1.0)).r;
        splitColor.g = renderColor.g;
        splitColor.b = texture2D(u_tex, clamp(sampleUV - splitOffset - dynamicShift, 0.0, 1.0)).b;
        renderColor.rgb = mix(renderColor.rgb, splitColor, rgbSplitLevel);
    }

    // --- Inversion --------------------------------------------------------
    if(u_invert >= 1.0){
        renderColor.rgb = vec3(1.0) - renderColor.rgb;
    }

    // --- Monochrome posterize --------------------------------------------
    if(u_monochrome >= 1.0){
        renderColor = monochrome(renderColor);
    }

    // UIオーバーレイ合成
    vec4 uiColor = texture2D(u_uitex, vTexCoord);
    vec4 composedColor = renderColor * (1.0 - uiColor.a) + uiColor * uiColor.a;

    gl_FragColor = composedColor;
}