/**
 * Created by Administrator on 2015/4/7 0007.
 */
function MusicVisualizer(obj) {
    this.source = null;                             //AudioBufferSourceNode
    this.audioBuffer = null;                        //每首歌对应的buffer， AudioBuffer类型数据
    this.count = 0;                                 //记录切歌次数，避免切歌后，上一首歌还在播放
    this.progressBar = obj.progressBar;             //进度条
    this.playedTimeLable = obj.playedTimeLable;     //已播放时长的标签
    this.wholeTimeLable = obj.wholeTimeLable;       //总时长的标签
    //console.log(this.playedTimeLable+"\\"+this.wholeTimeLable);

    this.musicStatus = false;        //歌曲是否正在播放，true为播放
    this.musicDuration = 0;         //歌曲总时长
    this.playedDuration = 0;        //歌曲已播放的时长
    this.startTime = 0;             //歌曲某次开始的时间
    this.endTime = 0;               //歌曲某次暂停的时间
    //this.firstStop = true;
    this.startFlag = 0;             //对于某个AudioBufferSourceNode，是否已经调用过start方法，只有调用了start，才能stop，1表示已经播放过
    this.playOver = null;           //整首歌曲是否播放完毕，true为完了

    this.analyser = MusicVisualizer.audioCxt.createAnalyser();      //AnalyserNode，分析节点
    this.size = obj.size;                                           //
    this.analyser.fftsize = this.size * 2;                          //经傅里叶变换到频域里得到的数据个数


    this.gainNode = MusicVisualizer.audioCxt[MusicVisualizer.audioCxt.createGain ? "createGain" : "createGainNode"]();
    this.gainNode.connect(MusicVisualizer.audioCxt.destination);    //GainNode，改变音量的节点
    this.analyser.connect(this.gainNode);                           //讲分析节点连接到GainNode

    //this.xhr = new XMLHttpRequest();
    this.xhr = new XMLHttpRequest();                    //ajax对象

    this.draw = obj.draw;               //绘图的方法

    this.visualize();                   //可视化方法，该方法里采用动画，不断绘制图形
    //this.musicProgress();
}

MusicVisualizer.audioCxt = new (window.AudioContext || window.webkitAudioContext || window.mozAudioContext)();      //AudioContext对象，一般只需一个。所有的节点和连接都是由它出发形成的。
/**
 * 通过ajax请求，向后台读取数据
 * @param url   后台数据所在地址
 * @param fun   成功后回调函数
 */
MusicVisualizer.prototype.load = function (url, fun) {
    this.xhr.abort();
    this.xhr.open("GET", url);
    this.xhr.responseType = "arraybuffer";
    var self = this;
    self.xhr.onload = function(){
        fun(self.xhr.response);
    };
    this.xhr.send();
};
/**
 * 解码方法。
 * @param arraybuffer  ajax从后台读取到的arraybuffer类型的数据
 * @param fun          成功后回调函数
 */
MusicVisualizer.prototype.decode = function (arraybuffer, fun) {
    MusicVisualizer.audioCxt.decodeAudioData(arraybuffer, function (buffer) {
        fun(buffer);
    },function (err) {
        console.log(err);
    })
};
/**
 * 播放歌曲的方法，调用了ajax读取数据和解码方法
 * @param url   数据在后台的地址
 *
 */
MusicVisualizer.prototype.play = function (url) {
    this.playedDuration = 0;    //开始播放一首歌时，已播放时长置零
    this.playOver = false;
    var n = ++this.count;       //避免切歌后，以前的歌还会播放
    var self = this;
    self.source && self.source[self.source.stop ? "stop" : "noteOff"](0); //如果还存在歌曲资源，应该停止
    if(url instanceof ArrayBuffer){             //url是ArrayBuffer类型，表示是从本地读取的音频资源
        var arraybuffer = url;
        if (n != self.count) return;
        self.decode(arraybuffer, function (buffer) {
            if (n != self.count) return;
            var bufferSource = MusicVisualizer.audioCxt.createBufferSource();

            bufferSource.connect(self.analyser);
            bufferSource.buffer = buffer;
            self.audioBuffer = buffer;              //保存该音频的ArrayBuffer，便于暂停后再播放时，使用该ArrayBuffer
            self.musicDuration = buffer.duration;   //保存该音频的总时长


            bufferSource[bufferSource.start ? "start" : "noteOn"](0);  //开始播放
            self.startTime = MusicVisualizer.audioCxt.currentTime;      //记录这次开始播放的时刻
            self.source = bufferSource;         //记录该AudioBufferSourceNode，可以使用它来暂停
            self.musicStatus = true;            //音乐处于播放状态
            self.startFlag = 1;                 //对于该AudioBufferSourceNode而言，已调用了start方法

            /*
            将音频总时长换算成时：分：秒
             */
            var whour = Math.round(self.musicDuration / 3600) ;
            var wmin = Math.round((self.musicDuration - whour * 3600)/60);
            var wsen = Math.round(self.musicDuration % 60);
            self.playedTimeLable.innerHTML = "0:00";        //更改显示已播放时长的标签的文字
            self.wholeTimeLable.innerHTML = whour +":"+ wmin +":"+ wsen;         //更改显示总时长的标签的文字
            //console.log("decode success !")
        });

    }else if(typeof(url) === "string"){     //url是字符串，表示从后台服务器读取的音频资源
        this.load(url, function(arraybuffer){
            if (n != self.count) return;
            self.decode(arraybuffer, function (buffer) {
                if (n != self.count) return;
                var bufferSource = MusicVisualizer.audioCxt.createBufferSource();

                bufferSource.connect(self.analyser);
                bufferSource.buffer = buffer;
                self.audioBuffer = buffer;
                self.musicDuration = buffer.duration;
                //console.log(self.musicDuration);

                bufferSource[bufferSource.start ? "start" : "noteOn"](0);
                self.startTime = MusicVisualizer.audioCxt.currentTime;
                self.source = bufferSource;
                self.musicStatus = true;
                self.startFlag = 1;

                var whour = Math.round(self.musicDuration / 3600) ;
                var wmin = Math.round((self.musicDuration - whour * 3600)/60);
                var wsen = Math.round(self.musicDuration % 60);
                self.playedTimeLable.innerHTML = "0:00";
                self.wholeTimeLable.innerHTML = whour +":"+ wmin +":"+ wsen;
               // console.log(self.playedTimeLable.textContent);

            });
        });
    }

};
/**
 * 改变音量的方法
 * @param percent  更改后的百分比
 */
MusicVisualizer.prototype.changeVolumn = function (percent) {
    this.gainNode.gain.value = percent * percent;
};
/**
 * 可视化方法，主要是绘制各种图形的具体过程，使用动画，保持持续的不断重绘
 */
MusicVisualizer.prototype.visualize = function () {
    var self = this;
    var arr = new Uint8Array(self.analyser.frequencyBinCount);
    self.analyser.getByteFrequencyData(arr);
    //console.log(arr);
    requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame;            //动画对象

    function v() {
        self.analyser.getByteFrequencyData(arr);
        self.draw(arr);  //绘制柱形或者圆形
        self.musicProgress();   //绘制进度条的进度
        requestAnimationFrame(v);       //动画方法里面调用动画方法
    }

    requestAnimationFrame(v);   //调用一次，使其进入循坏
};

/**
 * 控制音乐播放或暂停的方法
 */
MusicVisualizer.prototype.controlMusic = function () {
    var self = this;
    if(self.musicStatus){//处于播放状态，暂停它
        if(self.source === null){alert("请先从左边音乐列表点击歌曲，才能播放");return}
        var bufferSource = (self.startFlag == 1) ? self.source : MusicVisualizer.audioCxt.createBufferSource();     //根据是否调用过start方法，决定是否新建AudioBufferSourceNode对象

        bufferSource.connect(self.analyser);
        bufferSource.buffer = self.audioBuffer;
        self.source = bufferSource;

        bufferSource[bufferSource.stop ? "stop" : "noteOff"](0);
        self.endTime = MusicVisualizer.audioCxt.currentTime;        //记录此次暂停的时刻
        //self.firstStop = false;                                   //是否第一次暂停，false表示否
        self.musicStatus = false;                                   //音乐处于非播放状态
        self.startFlag = 0;                                         //该AudioBufferSourceNode对象未使用过start方法

        self.playedDuration += self.endTime - self.startTime;       //计算已播放的总时长

    }else{//处于暂停状态，播放它
        var bufferSource = (self.startFlag == 1) ? self.source : MusicVisualizer.audioCxt.createBufferSource();

        bufferSource.connect(self.analyser);
        bufferSource.buffer = self.audioBuffer;
        self.source = bufferSource;

        var offset = self.playedDuration;               //应该从音频的哪个时刻开始播放
        //console.log(offset);
        bufferSource[bufferSource.start ? "start" : "noteOn"](0,offset);
        self.startTime = MusicVisualizer.audioCxt.currentTime;  //记录此次开始播放的时刻
        self.musicStatus = true;            //音乐处于播放状态
        self.startFlag = 1;                 //该AudioBufferSourceNode对象使用过了start方法
    }

};

/**
 * 控制歌曲进度条的方法。根据已播放总时长、当前时刻、此次开始播放的时刻，计算出真正的已播放总时长。
 * 该方法在动画方法中调用，不断进行更新渲染
 */
MusicVisualizer.prototype.musicProgress = function () {
    var self = this;

    //真正的已播放的总时长，需要用记录下的已播放总时长，加上当前时刻距离此次开始播放时刻的时间差
    var realPlayedDuration = self.musicStatus ? (MusicVisualizer.audioCxt.currentTime - self.startTime + self.playedDuration) : self.playedDuration;
    var phour = Math.round(realPlayedDuration / 3600) ;
    var pmin = Math.round((realPlayedDuration - phour * 3600)/60);
    var psen = Math.round(realPlayedDuration % 60);

    //如果已经播放完毕，则停止渲染进度条，返回
    if((self.audioBuffer != null) && (realPlayedDuration >= self.audioBuffer.duration)){
        self.playOver = true;
        return;
    };

    if(self.musicDuration === 0 || self.source === null ){      //还未开始播放
        self.progressBar.value = "0";
    }else if(self.musicStatus){                 //处于播放状态
        var value = (realPlayedDuration/self.musicDuration * self.progressBar.max).toString();
        self.progressBar.value = value;
        self.playedTimeLable.innerHTML = phour +":"+ pmin +":"+ psen;

    }else if(!self.musicStatus){                //处于非播放状态
        var value = (realPlayedDuration/ self.musicDuration * self.progressBar.max).toString() ;
        self.progressBar.value = value;
        self.playedTimeLable.innerHTML = phour +":"+ pmin +":"+ psen;
    }
};