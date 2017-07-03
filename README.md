css部分：
1.css 背景有透明度变化时用：background:rgba(255,255,255,.3);
2.固定定位:除fixed,用absolute 配合
$('seleltor').scrool(function(){
 var scrolld=$('seletor').scroolTop()+fixedElementTop;
     $('fixed').css('top',scrolled+'px');
 })
3.图片黑白效果
filter:grayscale(1);

js部分
    1.jquery动画要停止要执行的动画之前的动画用stop
    2.数据变化是尽量用动态计算
    3.onmousewheel:
    var container=document.getElementById('id');
    container.onmousewheel=function(){
    event=event||window.event;
    //判断滚轮
    //向下
    if(event.wheelDelta<0||event.detail){
    ......
    }else{//向上

    。。。。。。
        }
        //取消默认行为
        event.preventDefault&&event.preventDefault();
        return false;
    }
    bind(container,'DOMMouseScroll',container.onmousewheel);
    function bind(obj,eventstr,callback){
        if(obj.addEventListenner){
        //如果浏览器正常
        obj.addEventListener(eventStr,callback,false);
        }else{
        //ie8
        obj.attachEvent('on'+eventStr,function(){
                callback.call(obj)
            });

        }
    }



