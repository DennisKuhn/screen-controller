'use strict';

const downValue = document.getElementById('networkSpeed_downValue');
const downBar = document.getElementById('networkSpeed_downBar');
const upValue = document.getElementById('networkSpeed_upValue');
const upBar = document.getElementById('networkSpeed_upBar');

setInterval(() => {
    const speedDown = Math.floor(Math.random() * 1000);

    downValue.innerText = speedDown;
    downBar.style.width = speedDown / 10 + '%';

    const speedUp = Math.floor(Math.random() * 1000);

    upValue.innerText = speedUp;
    upBar.style.width = speedUp / 10 + '%';
}, 300);

const getQueryVariable = function(variable) {
    const query = window.location.search.substring(1);
    const vars = query.split('&');
    for (let i = 0; i < vars.length; i++) {
        const pair = vars[i].split('=');
        if (decodeURIComponent(pair[0]) == variable) {
            return decodeURIComponent(pair[1]);
        }
    }
};

const title = getQueryVariable('title');
const backgroundColor = getQueryVariable('background-color');

console.log(title, backgroundColor);

if (title) {
    document.querySelector('h1').innerText = title;
}
if (backgroundColor) {
    document.querySelector('body').style.backgroundColor = backgroundColor;
}
