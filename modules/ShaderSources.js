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
    if (!window.XMLHttpRequest) throw new Error('Ajax/XMLHttpRequest required to load shaders!');

    let shaders = [];
    let xhr = new XMLHttpRequest();

    loadFiles(xhr, shaderPaths, shaders)
    shaderSources.fragSource = replaceText(shaders[0], shaderReplacements);
    shaderSources.vertSource = shaders[1];
}

export function getShaders() {
    return shaderSources;
}

function replaceText(text, replacements) {
    return text.replace(/\$\{\w+\}/g, (match) => {
        let token = match.substring(2, match.length - 1);
        return replacements.hasOwnProperty(token) ? replacements[token] : token;
    });
}

function loadFiles(xhr, paths, contents) {
    if (paths.length == 0) return;

    xhr.open('GET', paths[0], false);
    xhr.onreadystatechange = () => {
        if (xhr.readyState == XMLHttpRequest.DONE) {
            if (xhr.status != 200) throw new Error(`Unable to load file: ${paths[0]}!`);

            contents.push(xhr.responseText);
            paths.shift();
            loadFiles(xhr, paths, contents);
        }
    };

    xhr.send();
}

function formatGlslFloat(num) {
    let str = num.toString();

    if (!str.includes('.')) str += '.0';

    return str;
}
