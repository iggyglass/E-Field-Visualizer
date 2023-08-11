import * as Consts from '../modules/SimConsts.js';

const maxChargesElements = document.getElementsByClassName('max-charges');
const fieldLineNumText = document.getElementById('field-line-num');
const fieldLineIterText = document.getElementById('field-line-iterations');

for (let i = 0; i < maxChargesElements.length; i++) {
    maxChargesElements[i].innerHTML = `${Consts.maxCharges}`;
}

fieldLineIterText.innerHTML = `${Consts.fieldLineLength}`;
fieldLineNumText.innerHTML = `\\(n=${Consts.fieldLineCount}\\)`;

MathJax.typeset();
