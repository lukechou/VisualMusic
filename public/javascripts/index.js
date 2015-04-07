/**
 * Created by Administrator on 2015/4/6 0006.
 */
function $(s) {
    return document.querySelectorAll(s);
}

var lis = $("#list li");

for (var i = 0; i < lis.length; i++) {
    lis[i].onclick = function () {
        for (var j = 0; j < lis.length; j++) {
            lis[j].className = "";
        }
        this.className = "selected";
        load("/media/" + this.title)
    }
}
/*全局变量*/

var audioCxt = new (window.AudioContext || window.webkitAudioContext || window.mozAudioContext)();
var bufferSource = null;
var gainNode = audioCxt[audioCxt.createGain ? "createGain" : "createGainNode"]();
var source = null;
var analyser = audioCxt.createAnalyser();
var size = 32;
analyser.fftsize = size * 2;
analyser.connect(gainNode);
gainNode.connect(audioCxt.destination);

var xhr = new XMLHttpRequest();
var count = 0;

var rightDiv = $(".right")[0];
var canvas = $("#canvas")[0];
var canCxt = canvas.getContext('2d');
var height;
var width;
var dot = [];
var dot_move = true;

rightDiv.onclick = function(){
    dot_move = dot_move == true ? false : true;
}

function random(n, m) {
    var min = n || 0;
    var max = m || 1;
    return max >= min ? Math.round(Math.random() * (max - min) + min) : 0;

}
function getDot() {
    dot = [];
    for (var i = 0; i < size; i++) {
        var x = random(0,width);
        var y = random(0,height);
        var color = "rgba(" + random(0, 255) + "," + random(0, 255) + "," + random(0, 255) + ",0.3)";
        dot.push({
            dot_x: x,
            dot_y: y,
            dot_dx: random(1,4),
            dot_color: color,
            dot_cap_bottom:0
        });
    };

}
var lineGra;
function resize() {
    width = rightDiv.clientWidth;
    height = rightDiv.clientHeight;
    canvas.width = width;
    canvas.height = height;

    lineGra = canCxt.createLinearGradient(0, 0, 0, height);
    lineGra.addColorStop(0, "red");
    lineGra.addColorStop(0.7, "green");
    lineGra.addColorStop(1, "yellow");

    //canCxt.fillStyle = lineGra;

    getDot();
}
resize();
window.onresize = resize;

function load(url) {
    var n = ++count;
    source && source[source.stop ? "stop" : "noteOff"](0);
    xhr.abort();
    xhr.open("get", url);
    xhr.responseType = "arraybuffer";
    xhr.onload = function () {
        if (n != count) {
            return;
        }
        audioCxt.decodeAudioData(xhr.response, function (buffer) {
            if (n != count) return;
            bufferSource = audioCxt.createBufferSource();
            bufferSource.buffer = buffer;
            bufferSource.connect(analyser);
            bufferSource[bufferSource.start ? "start" : "noteON"](0);
            source = bufferSource;

        }, function (err) {
            console.log(err);
        });
    };
    xhr.send();
}

function visualizer() {
    var arr = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(arr);
    //console.log(arr);
    requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame;

    function v() {
        analyser.getByteFrequencyData(arr);
        //console.log(arr);
        draw(arr);
        requestAnimationFrame(v);
    }

    requestAnimationFrame(v);
}
visualizer();

function draw(arr) {
    var onedot = null;
    canCxt.clearRect(0, 0, width, height);
    var w = width / size;
    var rectW = w * 0.6;
    var capHeight = rectW > 10 ? 10 : rectW;
        canCxt.fillStyle = lineGra;
    for (var i = 0; i < size; i++) {//此处如果写成 i < arr.length，则出现bug，识别不了下面的dot_x，也是醉了。
         onedot = dot[i];
        if (draw.type == "column") {
            canCxt.beginPath();
            var h = arr[i] / 256 * height;
            var cap_bottom =  onedot.dot_cap_bottom;
            if(cap_bottom < 0){cap_bottom = 0};
            if(h > 0 && cap_bottom < h + 40){
                cap_bottom = h + 40 > height - capHeight ? height -capHeight: h + 40;
            }
            canCxt.fillRect(w * i, height - h, rectW, h);
            canCxt.fillRect(w * i, height -capHeight - cap_bottom,rectW,capHeight);
            cap_bottom --;

        }else if (draw.type == "dot") {
            canCxt.beginPath();
            var r = 10 + arr[i] / 256 * (height > width ? width : height)/20;
            var x = onedot.dot_x;
            var y = onedot.dot_y;
            var color = onedot.dot_color;
            if(y < r || y > height - r){y = y < r ? r : height - r};
            canCxt.arc(x,y, r, 0, Math.PI * 2);
            var radialGra = canCxt.createRadialGradient(x, y, 0, x, y, r);
            radialGra.addColorStop(0, "white");
            radialGra.addColorStop(1, color);
            canCxt.fillStyle = radialGra;
            canCxt.fill();
            if(dot_move){
                onedot.dot_x += onedot.dot_dx;
                onedot.dot_x = onedot.dot_x > width ? 0 : onedot.dot_x;
            };

        }


    }
}
draw.type = "column";
var types = $("#type li");
for (var i = 0; i < types.length; i++) {
    types[i].onclick = function () {
        for (var j = 0; j < types.length; j++) {
            types[j].className = "";
        }
        this.className = "selected";
        draw.type = this.getAttribute("data-type");
        console.log(draw.type);
    }
}

function changeVolume(percent) {
    gainNode.gain.value = percent * percent;
}

$("#volume")[0].onchange = function () {
    changeVolume(this.value / this.max);
}

$("#volume")[0].onchange();