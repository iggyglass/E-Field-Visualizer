import * as Consts from '../modules/SimConsts.js';

const maxChargesText = document.getElementById('max-charges');
const fieldLineNumText = document.getElementById('field-line-num');
const fieldLineIterText = document.getElementById('field-line-iterations');

maxChargesText.innerHTML = `${Consts.maxCharges}`;
fieldLineIterText.innerHTML = `${Consts.fieldLineLength}`;
fieldLineNumText.innerHTML = `\\(n=${Consts.fieldLineCount}\\)`;

MathJax.typeset();
