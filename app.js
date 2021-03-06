/**
 * 五子棋对象构造函数
 */
function Gobang() {
    this._status = 0; // 棋局状态，0表示对战中，1表示对战结束
    this._role = 0; // 棋子颜色，0表示黑棋，1表示白棋
    this._chessDatas = []; // 存放下棋数据
    this._backStepDatas = []; // 存放悔棋数据
    this._chessboardDatas = this._initChessboardDatas();
    this._replay = document.getElementById("replay");
    this._reset = document.getElementById("reset");
    this._back_reset = document.getElementById("back_reset");
    this._vs_ai = document.getElementById("vs_ai");
    this._msg = document.getElementById('msg');
    this._msgs = {
        'domVer':'DOM版本',
        'canvasVer':'Canvas版本',
        'start': '比赛开始！',
        'restart': '比赛重新开始！',
        'blackWin': '黑棋胜！',
        'whiteWin': '白棋胜！',
        'aiWin': "ai胜！",
        'pWin': "恭喜你赢了计算机！"
    };
    
    //版本变换
    this._version = document.getElementById("version");
    
    // DOM 相关
    this._gridDoms = []; // 存放棋盘(DOM)
    this._chessboardContainer = document.getElementById('chessboard_container');
    
    // Canvas 相关
    this._chessboardCanvas = document.getElementById('chessboard_canvas_container');
    this._chessCanvas = document.getElementById('chessboard_canvas');
    this._chessContext = this._chessCanvas.getContext('2d');
};

/**
 * Default棋盘版本
 */
Gobang.prototype._initChessboardVersion = function() {
    var vm = this;
    vm._chessboardContainer.className = 'chessboard-container hidden';
    vm._chessboardCanvas.className = 'chessboard-canvas-container show';
};

/**
 * 初始化棋盘数据
 */
Gobang.prototype._initChessboardDatas = function() {
    var initDatas = new Array(15);
    for (var i = 0; i < 15; i++) {
        initDatas[i] = new Array(15);
    }
    return initDatas;
};

/**
 * 判断是否有棋子
 */
Gobang.prototype._hasChess = function(position) {
    var vm = this;
    var hasChess = false;
    vm._chessDatas.forEach(function(item) {
        if(item === position) hasChess = true;
    });
    return hasChess;
};

/**
 * 落子
 */
Gobang.prototype._drawChess = function(position) {
    var vm = this;
    
    if (position == undefined || position == null) return;
    
    // DOM
    var domGrid = vm._gridDoms[position];
    domGrid.className = "chess-grid " + (vm._role ? "white-chess" : "black-chess");
    
    // Canvas
    vm._drawChessInCanvas(position, vm._role);
};

/**
 * 在canvas落子
 */
Gobang.prototype._drawChessInCanvas = function(position,role) {
    var vm = this;
    
    if(position == undefined || position == null) return;
    
    var x = ((position % 15) + 0.5) * 30;
    var y = (parseInt((position / 15), 10) + 0.5) * 30;
    vm._chessContext.beginPath();
    vm._chessContext.arc(x, y, 13, 0, 2 * Math.PI);// 画圆
    //定义棋子颜色
    var gradient = vm._chessContext.createRadialGradient(x + 2, y - 2, 13, x + 2, y - 2, 0);
    if(role){
        gradient.addColorStop(0,"#d1d1d1");
        gradient.addColorStop(1,"#f9f9f9");
    }else{
        gradient.addColorStop(0,'#0a0a0a');
        gradient.addColorStop(1,'#636766');
    }
    vm._chessContext.fillStyle = gradient;
    vm._chessContext.fill();
    vm._chessContext.closePath();
};

/**
 * 移除棋子
 */
Gobang.prototype._rmChess = function(position,reDraw) {
    var vm = this;
    if(position == undefined || position == null) return;
    
    //DOM
    var domGrid = vm._gridDoms[position];
    domGrid.className = "chess-grid";
    
    //Canvas
    vm._chessCanvas.width = vm._chessCanvas.width; //重设画布宽度，快速清空画布内容
    if (vm._chessDatas.length < 1) return;
    // 重绘
    if (!reDraw) return;
    vm._chessDatas.forEach(function(p, r) {
        vm._drawChessInCanvas(p, r % 2);
    });
};

/**
 * 下一步棋
 */
Gobang.prototype._next = function(position) {
    var vm = this;
    if(vm._hasChess(position)) return;
    vm._chessboardDatas[(position % 15)][parseInt((position / 15), 10)] = vm._role;
    vm._chessDatas.push(position);
    
    // 绘制棋子
    vm._drawChess(position);
};

/**
 * 悔棋
 */
Gobang.prototype.backStep = function(target) {
    var vm = this;
    if(vm._chessDatas.length < 1) return;
    var lastStep = vm._chessDatas.pop();
    vm._backStepDatas.push(lastStep);
    vm._role = 1- vm._role;
    
    // 移除棋子
    vm._rmChess(lastStep,true);
};

/**
 * 撤销悔棋
 */
Gobang.prototype.resetBackStep = function() {
    var vm = this;
    if(vm._backStepDatas.length < 1) return;
    
    var lastStep = vm._backStepDatas.pop();
    vm._next(lastStep);
    
    // 绘制棋子
    vm._drawChess(lastStep);
    
    vm._role = 1 - vm._role;
};

/**
 * 判断某个单元格是否在棋盘上
 */
Gobang.prototype._inBoard = function(x,y) {
    return x >=0 && x < 15 && y >=0 && y < 15;
};

/**
 * 判断在某个方向上相同棋子个数
 */
Gobang.prototype._chessCount = function(xPos,yPos,deltaX,deltaY) {
    var vm = this;
    var count = 0;
    while(true) {
        xPos += deltaX;
        yPos += deltaY;
        if(!vm._inBoard(xPos,yPos) || vm._chessboardDatas[xPos][yPos] != vm._role)
            break;
        count ++;
    }
    return count;
};

/**
 * 判断在某个方向上是否获胜
 * @param position 最后一步棋的位置
 * @param direction 方向
 * @return
 */
Gobang.prototype._isWinInDirection = function(position,direction) {
    var vm = this;
    var xPos = (position % 15);
    var yPos = parseInt(position / 15, 10);
    var count = 1;
    count += vm._chessCount(xPos, yPos, direction.deltaX, direction.deltaY);
    count += vm._chessCount(xPos, yPos, -1 * direction.deltaX, -1 * direction.deltaY);
    return count >= 5;
};

/**
 * 获胜条件
 */
Gobang.prototype.isWin = function(position) {
    var vm = this;
    if(vm._chessDatas.length < 9) return 0;
    
    //赢法：横，竖，正斜，反斜
    var direction = [{
        deltaX: 1,
        deltaY: 0
    },{
        deltaX: 0,
        deltaY: 1
    },{
        deltaX: 1,
        deltaY: 1
    },{
        deltaX: 1,
        deltaY: -1
    }];
    for(var i = 0; i < 4; i++) {
        if(vm._isWinInDirection(position, direction[i])) return true;
    }
};

/**
 * 画棋盘
 */
Gobang.prototype._drawChessboard = function() {
    var vm = this;
    
    //DOM
    var fragment = '';
    for(var i = 0; i < 15 * 15; i++) {
        fragment += '<div class="chess-grid" attr-data="' + i + '"></div>';
    }
    vm._chessboardContainer.innerHTML = fragment;
    vm._gridDoms = vm._chessboardContainer.getElementsByClassName("chess-grid");
    
    //Canvas
    var bgCanvas = document.getElementById("chessboard_bg_canvas");
    var bgContext = bgCanvas.getContext("2d");
    bgContext.strokeStyle = 'none'; //边框颜色
    for(var i = 0; i < 15; i++) {
        bgContext.moveTo(15 + i * 30 , 15);
        bgContext.lineTo(15 + i * 30 , 435);
        bgContext.stroke();
        bgContext.moveTo(15 , 15 + i * 30);
        bgContext.lineTo(435 , 15 + i * 30);
        bgContext.stroke();
    }
};

/**
 * 展示消息
 */
Gobang.prototype._showMsg = function(msg,duration) {
    var vm = this;
    vm._msg.innerHTML = msg;
    vm._msg.className = 'msg-container show';
    setTimeout(function() {
        if(vm._msg.className.indexOf('show') >= 0) {
            vm._msg.className = 'msg-container';
        }
    }, duration || 0);
};

/**
 * 重新开始
 */
Gobang.prototype.clear = function() {
    var vm = this;
    if(vm._chessDatas.length < 1) return;
    vm._status = 0;
    
    //清除棋子
    vm._chessDatas.forEach(function(position) {
        vm._rmChess(position,false);
    });
    
    vm._chessDatas = [];
    vm._backStepDatas = [];
    vm._chessboardDatas = vm._initChessboardDatas();
    vm._showMsg(vm._msgs.restart, 1000);
};

/**
 * 游戏初始化
 */
Gobang.prototype.init = function() {
    var vm = this;
    
    // 绘制棋盘
    vm._drawChessboard();
    
    //默认棋盘版本
    vm._initChessboardVersion();
    
    //选择棋盘版本
    if(vm._version.addEventListener) {
        vm._version.addEventListener('change', function(e) {
            var index = vm._version.selectedIndex;
            if(index == 0) {
                vm._chessboardContainer.className = 'chessboard-container show';
                vm._chessboardCanvas.className = 'chessboard-canvas-container hidden';
                vm._showMsg(vm._msgs.domVer, 1000);
                vm.clear();
            } else {
                vm._chessboardContainer.className = 'chessboard-container hidden';
                vm._chessboardCanvas.className = 'chessboard-canvas-container show';
                vm._showMsg(vm._msgs.canvasVer, 1000);
                vm.clear();
            }
        },false);
    } else {
        vm._version.attachEvent('onchange', function(e) {
            var index = vm._version.selectedIndex;
            if(index == 0) {
                vm._chessboardContainer.className = 'chessboard-container show';
                vm._chessboardCanvas.className = 'chessboard-canvas-container hidden';
                vm._showMsg(vm._msgs.domVer, 1000);
                vm.clear();
            } else {
                vm._chessboardContainer.className = 'chessboard-container hidden';
                vm._chessboardCanvas.className = 'chessboard-canvas-container show';
                vm._showMsg(vm._msgs.canvasVer, 1000);
                vm.clear();
            }
        },false);
    }
    
    //提示游戏开始
    vm._showMsg(vm._msgs.start, 1000);
    
    //开始下棋
    //DOM
    if(vm._chessboardContainer.addEventListener) {
        vm._chessboardContainer.addEventListener('click', function(e) {
            var e = e || window.event;
            var target = e.target || e.srcElement;
            var position = target.getAttribute('attr-data') - 0;
            if(vm._status == 0) {
                vm._next(position);
                if(vm.isWin(position)) {
                    vm._status = 1;
                    var msg = vm._role ? vm._msgs.whiteWin : vm._msgs.blackWin;
                    setTimeout(function() {
                        vm._reset.setAttribute("disabled", true);
                        vm._back_reset.setAttribute("disabled", true);
                        vm._showMsg(msg, 10000);
                    }, 300);
                } else {
                    //清除悔棋数据
                    vm._backStepDatas = [];
                }
                vm._role = 1 - vm._role;
            }
        },false);
    } else {
        vm._chessboardContainer.attachEvent('onclick', function(e) {
            var e = e || window.event;
            var target = e.target || e.srcElement;
            var position = target.getAttribute('attr-data') - 0;
            if(vm._status == 0) {
                vm._next(position);
                if(vm.isWin(position)) {
                    vm._status = 1;
                    var msg = vm._role ? vm._msgs.whiteWin : vm._msgs.blackWin;
                    setTimeout(function() {
                        vm._reset.setAttribute("disabled", true);
                        vm._back_reset.setAttribute("disabled", true);
                        vm._showMsg(msg, 10000);
                    }, 300);
                } else {
                    //清除悔棋数据
                    vm._backStepDatas = [];
                }
                vm._role = 1 - vm._role;
            }
        },false);
    }
    
    //Canvas
    if(vm._chessCanvas.addEventListener) {
        vm._chessCanvas.addEventListener('click', function(e) {
            var e = e || window.event;
            var x = e.offsetX;
            var y = e.offsetY;
            var i = Math.floor((x - 4) / 30);
            var j = Math.floor((y - 4) / 30);
            var position = i + j * 15;
            if(vm._status == 0) {
                vm._next(position);
                if(vm.isWin(position)) {
                    vm._status = 1;
                    var msg = vm._role ? vm._msgs.whiteWin : vm._msgs.blackWin;
                    setTimeout(function() {
                        vm._reset.setAttribute("disabled", true);
                        vm._back_reset.setAttribute("disabled", true);
                        vm._showMsg(msg, 10000);
                    }, 300);
                } else {
                    //清除悔棋数据
                    vm._backStepDatas = [];
                }
                vm._role = 1 - vm._role;
            }
        }, false);
    } else {
        vm._chessCanvas.attachEvent('onclick', function(e) {
            var e = e || window.event;
            var x = e.offsetX;
            var y = e.offsetY;
            var i = Math.floor((x - 4) / 30);
            var j = Math.floor((y - 4) / 30);
            var position = i + j * 15;
            if(vm._status == 0) {
                vm._next(position);
                if(vm.isWin(position)) {
                    vm._status = 1;
                    var msg = vm._role ? vm._msgs.whiteWin : vm._msgs.blackWin;
                    setTimeout(function() {
                        vm._reset.setAttribute("disabled", true);
                        vm._back_reset.setAttribute("disabled", true);
                        vm._showMsg(msg, 10000);
                    }, 300);
                } else {
                    //清除悔棋数据
                    vm._backStepDatas = [];
                }
                vm._role = 1 - vm._role;
            }
        }, false);
    }
    
    //开始新一局
    if(vm._replay.addEventListener) {
        vm._replay.addEventListener('click', function() {
            vm.clear();
        },false);
    } else {
        vm._replay.attachEvent('onclick', function() {
            vm.clear();
        },false);
    }
    
    //触发悔棋
    if(vm._reset.addEventListener) {
        vm._reset.addEventListener('click', function(e) {
            var e = e || window.event;
            var x = e.offsetX;
            var y = e.offsetY;
            var i = Math.floor((x - 4) / 30);
            var j = Math.floor((y - 4) / 30);
            var position = i + j * 15;
            vm.backStep(position);
        },false);
    } else {
        vm._reset.attachEvent('onclick', function(e) {
            var e = e || window.event;
            var x = e.offsetX;
            var y = e.offsetY;
            var i = Math.floor((x - 4) / 30);
            var j = Math.floor((y - 4) / 30);
            var position = i + j * 15;
            vm.backStep(position);
        },false);
    }
    
    //撤销悔棋
    if(vm._back_reset.addEventListener) {
        vm._back_reset.addEventListener('click', function() {
            vm.resetBackStep();
        },false);
    } else {
        vm._back_reset.attachEvent('onclick', function() {
            vm.resetBackStep();
        },false);
    }
};

var gobang = new Gobang();
gobang.init();