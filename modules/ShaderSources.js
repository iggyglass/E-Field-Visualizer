import * as Consts from './SimConsts.js';

const shaderPaths = ['modules/shaders/frag.glsl', 'modules/shaders/vert.glsl'];
const shaderReplacements = {
    maxCharges: Consts.maxCharges,
    fieldScale: formatGlslFloat(Consts.fieldScale)
};

let shaderSources = {
    vertSource: null,
    fragSource: null
};

export function loadShaders() {
    if (!window.XMLHttpRequest) {
        console.error('Ajax/XMLHttpRequest required to load shaders!');
        return false;
    }

    let shaders = [];
    let xhr = new XMLHttpRequest();

    if (!loadFiles(xhr, shaderPaths, shaders)) return false;

    shaderSources.fragSource = replaceText(shaders[0], shaderReplacements);
    shaderSources.vertSource = shaders[1];
    return true;
}

export function getShaders() {
    return shaderSources;
}

function replaceText(text, replacements) {
    return text.replace(/\$\{\w+\}/g, (match) => {
        let innerText = match.substring(2, match.length - 1);
        return replacements.hasOwnProperty(innerText) ? replacements[innerText] : innerText;
    });
}

function loadFiles(xhr, paths, contents) {
    if (paths.length == 0) return true;

    let success = true;

    xhr.open('GET', paths[0], false);
    xhr.onreadystatechange = () => {
        if (xhr.readyState == XMLHttpRequest.DONE) {
            if (xhr.status != 200) success = false;

            contents.push(xhr.responseText);
            paths.shift();
            success = loadFiles(xhr, paths, contents);
        }
    };

    xhr.send();
    return success;
}

function formatGlslFloat(num) {
    let str = num.toString();

    if (!str.includes('.')) str += '.0';

    return str;
}
