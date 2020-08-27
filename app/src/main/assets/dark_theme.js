var bg_color = 'rgb(0, 0, 0)';
var primary_text_color = 'rgb(255, 255, 255)';
var headline_color = 'rgb(255, 255, 255)';
var link_color = 'rgb(176, 59, 59)';
var figcaption_color = 'rgb(119, 127, 136)';
var ol_color = 'rgb(176, 59, 59)';
var h3_color = 'rgb(180, 48, 48)';
var h4_color = 'rgb(140, 48, 48)';
var csc_color = 'rgb(130, 40, 40)';

// tags which colors are allowed to be converted/enlightened automatically
var dynamic_elements = [ 'h1', 'h2', 'h5', 'h6', 'b', 'li', 'td' ];

// calculate the luminance of a given color
function calcLuminance(r, g, b) {
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// make color brighter, so it should be easily readable with a dark background
function brighterColor(r, g, b) {
    var rgbColors = new Object();
    var factor = (1 - calcLuminance(r, g, b) / 255) + 1;
    rgbColors[0] = Math.min(255, r * factor);
    rgbColors[1] = Math.min(255, g * factor);
    rgbColors[2] = Math.min(255, b * factor);
    return rgbColors;
}

// parse the rgb value of a color
function getRGB(color) {
    var rgbColors = new Object();
    if (color.substring(0, 3) == 'rgb') {
        color = color.substring(color.indexOf('(') + 1, color.indexOf(')'));
        rgbColors=color.split(',', 3);
        rgbColors[0] = parseInt(rgbColors[0]);
        rgbColors[1] = parseInt(rgbColors[1]);
        rgbColors[2] = parseInt(rgbColors[2]);
    } else if (color[0] == '#') {
        rgbColors[0] = color.substring(1, 3);
        rgbColors[1] = color.substring(3, 5);
        rgbColors[2] = color.substring(5, 7);

        rgbColors[0] = parseInt(rgbColors[0], 16);
        rgbColors[1] = parseInt(rgbColors[1], 16);
        rgbColors[2] = parseInt(rgbColors[2], 16);
    }
    return rgbColors;
}

// dark background
document.getElementsByTagName('body')[0].style.background = bg_color;
document.getElementById('content').style.background = bg_color;

// default font color
document.getElementsByTagName('body')[0].style.color = primary_text_color;

// "normal" text
var textElements = document.getElementsByTagName('p');
for (i = 0; i < textElements.length; i++) {
    var rawColor = window.getComputedStyle(textElements[i], null).color;
    if(textElements[i].className.includes('has-very-light-gray-background-color')) {
        textElements[i].style.background = 'rgb(75, 75, 75)';
    }
    if (rawColor == '#000000' || rawColor == 'rgb(0, 0, 0)') {
        textElements[i].style.color = primary_text_color;
    } else {
        var color = getRGB(rawColor);
        // because of some weird colored articles (seems like authors can't differ between black, dark grey and dark red) I have to filter those colors and fix this mess (or make an even bigger...)
        if ((color[0] == color[1] && color[0] == color[2] && color[0] < 70) || calcLuminance(color[0], color[1], color[2]) < 40) {
            textElements[i].style.color = primary_text_color;
        } else {
            if (calcLuminance(color[0], color[1], color[2]) < 110) {
                var newColor = brighterColor(color[0], color[1], color[2]);
                textElements[i].style.color = 'rgb(' + newColor[0] + ',' + newColor[1] + ',' + newColor[2] + ')';
            }
        }
    }
}

// links
var textElements = document.getElementsByTagName('a');
for(i = 0; i < textElements.length; i++) {
    textElements[i].style.color = link_color;
    textElements[i].style.transition = undefined;
    textElements[i].style.boxShadow = 'none';
}

var textElements = document.getElementsByTagName('figcaption');
for(i = 0; i < textElements.length; i++) {
    textElements[i].style.color = figcaption_color;
}

var textElements = document.getElementsByTagName('ol');
for(i = 0; i < textElements.length; i++) {
    textElements[i].style.color = ol_color;
}

var textElements = document.getElementsByTagName('h3');
for(i = 0; i < textElements.length; i++) {
    textElements[i].style.color = h3_color;
}

var textElements = document.getElementsByTagName('h4');
for(i = 0; i < textElements.length; i++) {
    textElements[i].style.color = h4_color;
}

var textElements = document.getElementsByClassName('csc-content');
for(i = 0; i < textElements.length; i++) {
    textElements[i].style.color = csc_color;
}

for (j = 0; j < dynamic_elements.length; j++) {
    var textElements = document.getElementsByTagName(dynamic_elements[j]);
    for(i = 0; i < textElements.length; i++) {
        var color = getRGB(window.getComputedStyle(textElements[i], null).color);
        if (calcLuminance(color[0], color[1], color[2]) < 80) {
            var newColor = brighterColor(color[0], color[1], color[2]);
            textElements[i].style.color = 'rgb(' + newColor[0] + ',' + newColor[1] + ',' + newColor[2] + ')';
        }
    }
}

document.getElementsByClassName('entry-title')[0].style.color = headline_color;

document.getElementById('colophon').remove()