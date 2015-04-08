/**
 * Created by Administrator on 2015/4/6 0006.
 *
 * 还有2个小地方有待改进：1，点击播放/暂停按钮，文字的改变  2，切换歌曲时，进度条要立即停止
 */
function $(s) {
    return document.querySelectorAll(s);
}
/*全局变量*/

var size = 32;  //实时获取的音频频域数据，也是柱状图的个数

var playedTimeLable = $("#playedTime")[0];      //显示已播放时长的标签
var wholeTimeLable = $("#wholeTime")[0];        //显示歌曲总时长的标签
var progressBar = $("#progress")[0];            //歌曲进度条
var rightDiv = $(".right")[0];          //右边用于作画的区域
var canvas = $("#canvas")[0];           //作画的canvas
var canCxt = canvas.getContext('2d');
var height;     //右边作画区域的高
var width;      //右边作画区域的宽
var dot = [];   //用于绘制圆形的数组
var dot_move = true;    //圆形是否运动，true表示运动

var lineGra;            //绘图的线性渐变
var lis = $("#list li");    //左边歌曲列表

draw.type = "column";   //绘制图形的种类
var types = $("#type li"); //切换图形种类的元素

/**
 * 新建MusicVisualizer对象
 * @type {MusicVisualizer}
 */
var mv = new MusicVisualizer({
    size : size,
    draw : draw,
    progressBar: progressBar,
    playedTimeLable : playedTimeLable,
    wholeTimeLable : wholeTimeLable
});

var i,j;   //用于循坏的全局变量
/**
 * 给歌曲列表的每首歌，绑定单击事件
 * 点击后，开始播放歌曲
 */
for (var i = 0; i < lis.length; i++) {
    lis[i].onclick = function () {
        for (var j = 0; j < lis.length; j++) {
            lis[j].className = "";
        }
        this.className = "selected";
        var self = this;
        //mv.load("/media/" + this.title);
        $("#start")[0].textContent = mv.musicStatus == true ? "Pause" : "Play";    //歌曲即将播放，改变播放按钮的显示文字
        mv.play("/media/" + self.title);            //调用MusicVisualizer的play方法
    };
};

/**
 * 右边图形区域，点击切换运动状态
 */
rightDiv.onclick = function(){
    dot_move = dot_move == true ? false : true;
}
/**
 * 给“更多”按钮绑定单击事件
 * 点击后调用隐藏的用于打开文件的按钮的单击事件
 */
$("#add")[0].onclick = function(){
    $("#upload")[0].click();
};
/**
 * 打开本地文件，读取文件，调用Mv对象的播放歌曲方法
 */
$("#upload")[0].onchange = function(){
    var file = this.files[0];
    var fr = new FileReader();

    $("#start")[0].textContent = mv.musicStatus == true ? "Pause" : "Play";

    fr.onload = function(e){
        mv.play(e.target.result);
    };
    fr.readAsArrayBuffer(file);
};
/**
 * 给播放/暂停按钮绑定单击事件
 * 点击后播放或者暂停歌曲，并改变圆形的运动状态、按钮自身的文字
 * 调用mv对象的controlMusic方法进行控制音乐的播放或暂停
 */
$("#start")[0].onclick = function(){
    if(mv.source === null){alert("请先点击左边歌曲，才能播放");return};
    if(mv.playOver == true){return};
    dot_move = mv.musicStatus == true ? false : true;
    this.textContent = mv.musicStatus == true ? "Play" : "Pause";
    mv.controlMusic();
};

/**
 * 给音量进度条的进度变化绑定事件
 * 调用mv对象的音量改变方法
 */
$("#volume")[0].onchange = function () {
    mv.changeVolumn(this.value / this.max);
}
/**
 * 先调用一次，使得默认的音量起效
 */
$("#volume")[0].onchange();

/**
 * 用于生成n到m之间的一个随机整数
 * @param n
 * @param m
 * @returns {number}
 */
function random(n, m) {
    var min = n || 0;
    var max = m || 1;
    return max >= min ? Math.round(Math.random() * (max - min) + min) : 0;

}
/**
 * 获取所有的圆形的数组
 */
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
/**
 * 改变窗口大小绑定事件
 * 设置画布大小、生成线性渐变样式、生成圆形的数组
 */
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
resize();   //先调用一次
window.onresize = resize;         //整个窗口的大小改变也绑定到此方法

/**
 * 用于绘制图形的具体方法
 * @param arr  根据该数组进行绘制
 */
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

/**
 * 改变图形种类
 */
for (var j = 0; j < types.length; j++) {
    types[j].onclick = function () {
        for (var k = 0; k < types.length; k++) {
            types[k].className = "";
        }
        this.className = "selected";
        draw.type = this.getAttribute("data-type");
        //console.log(draw.type);
    }
}

