/**
 * Created by Vertex on 17/2/20.
 */

var scene, camera, renderer, raycaster, mouse, clip, mixer, clock;  // 三维场景相关的对象
var parentHolder, mainPlanet, logo, dotWave, plane, skybox;         // 主行星, 标题, 平面墙和点阵波浪的封装对象
var objects = [];                                                   // 该数组用来放入封装对象, 其中每个封装对象都有一个obj对象, 是THREE.Object3D类型的对象
var subMeshes = [];                                                 // subMeshes用来判断射线法是否选中这些子行星物体中的某一个, 对象类型是Object3D
var intersected;                                                    // 当前射线选中的对象
var windowWidth = window.innerWidth, windowHeight = window.innerHeight;
var postProcessing = {enabled: false};
var matDepth = new THREE.MeshDepthMaterial();                       // 处理图像深度
var props = {
    index: -1,                                                       // 需要切换到的子行星索引
    subMeshCount: 6,                                                // 子行星数量
    subMeshStep: 20,                                                // 子行星公转半径偏差值
    startStep: 85,                                                  // 子行星公转半径
    stat: 'loading'                                                 // 当前场景状态
};

var STAT = {                                                        // 表示状态的字符串
    LOADING: 'loading',                                             // 代表场景正在加载, 由Logo控制
    READY: "ready",                                                 // 代表场景加载完毕, 由Logo控制
    INIT: "init",                                                   // 代表主行星和子行星正在移动
    IDLE: "idle",                                                   // 代表场景处于空闲状态
    FOLLOW: 'follow'                                                // 代表当前有选定物体
};

var mainLoc = new THREE.Vector3(270, 90, 0);                        // 主行星所在的位置
var preCamLoc = new THREE.Vector3(0, 0, 0);                         // 摄像机的上一个位置

/**
 * 初始化场景, 对象,以及后处理效果
 */
function init(){
    // 创建场景
    createScene();

    // 创建物体
    createObjects();

    // 创建后处理
    createPostProcessing();

    // 在网页中添加DOM元素以及相关事件
    document.getElementById('canvas').appendChild(renderer.domElement);
    window.addEventListener('mousemove', onMouseMove, false);
    window.addEventListener('resize', onResizeWindow, false);
    window.addEventListener('mousedown', onMouseDown, false);
}

/**
 * 创建场景
 */
function createScene(){
    // 初始化场景和渲染器
    scene = new THREE.Scene();
    clock = new THREE.Clock();
    renderer = new THREE.WebGLRenderer({
        alpha: true,
        autoclear: false,
        antialias: true,
        //premultipliedAlpha: false
    });
    renderer.setPixelRatio((window.devicePixelRatio)? window.devicePixelRatio : 1);
    renderer.setSize(windowWidth, windowHeight);
    renderer.setClearColor(0xE0E1DF, 0.0);

    // 创建一个Camera对象, 封装了THREE.PerspectiveCamera
    // 其中camera.obj是摄像机本身
    camera = new Camera(50, windowWidth / windowHeight, 1, 10000);
    camera.obj.position.set(0, 0, 2000);
    preCamLoc.x = camera.obj.position.x;
    preCamLoc.y = camera.obj.position.y;
    objects.push(camera);
    scene.add(camera.obj);

    // 鼠标坐标
    mouse = new THREE.Vector2();

    // 射线器
    raycaster = new THREE.Raycaster();
}

/**
 * 创建后期处理
 */
function createPostProcessing(){
    // 后期处理基本属性
    var params = {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBFormat
    };

    // 添加施加后处理效果的场景
    postProcessing.bokehScene = new THREE.Scene();
    postProcessing.bokehCamera = new THREE.OrthographicCamera(windowWidth / -2, windowWidth / 2, windowHeight / 2, windowHeight / -2, -1000, 1000);
    postProcessing.bokehScene.add(postProcessing.bokehCamera);

    // 创建渲染对象, 包含颜色数据和深度数据
    postProcessing.rtTextureDepth = new THREE.WebGLRenderTarget(windowWidth, windowHeight, params);
    postProcessing.rtTextureColor = new THREE.WebGLRenderTarget(windowWidth, windowHeight, params);
    var bokeh_shader = THREE.DOFShader;

    // 为uniform变量赋值
    postProcessing.bokeh_uniforms = THREE.UniformsUtils.clone(bokeh_shader.uniforms);
    postProcessing.bokeh_uniforms["tColor"].value = postProcessing.rtTextureColor.texture;
    postProcessing.bokeh_uniforms["tDepth"].value = postProcessing.rtTextureDepth.texture;
    postProcessing.bokeh_uniforms["textureWidth"].value = windowWidth;
    postProcessing.bokeh_uniforms["textureHeight"].value = windowHeight;
    postProcessing.materialBokeh = new THREE.ShaderMaterial({
        uniforms: postProcessing.bokeh_uniforms,
        vertexShader: bokeh_shader.vertexShader,
        fragmentShader: bokeh_shader.fragmentShader,
        defines: {
            RINGS: 2,
            SAMPLES: 4
        }
    });

    // 添加精神效果
    postProcessing.bokehQuad = new THREE.Mesh( new THREE.PlaneBufferGeometry( window.innerWidth, window.innerHeight ), postProcessing.materialBokeh );
    //postProcessing.bokehQuad.position.z = -500;
    postProcessing.bokehScene.add( postProcessing.bokehQuad );
}

/**
 * 创建物体
 */
function createObjects(){
    // 迁想Logo
    logo = new Logo('json/logo_animation.json');
    mixer = logo.mixer;                         // 必须要让Blender中导出的Mixer作为全局的AnimationMixer控制这个动画
    logo.obj.position.set(0, 0, 2200);          // Logo的初始位置
    logo.obj.rotation.y += Math.PI;
    logo.obj.scale.set(100, 100, 100);
    objects.push(logo);
    scene.add(logo.obj);

    // 整个场景对象的父对象, 包含了主行星, 碎片, 子行星等, 不包含相机和天空盒
    parentHolder = new ParentHolder();
    parentHolder.obj.position.set(mainLoc.x, mainLoc.y, mainLoc.z);

    // 主行星
    mainPlanet = new MeshPlanet('main', props.subMeshCount, 30);
    objects.push(mainPlanet);
    var angle = Math.PI / 12;
    mainPlanet.obj.children[0].rotation.set(-angle, -angle, -angle);
    mainPlanet.obj.rotation.set(angle, angle, angle);
    parentHolder.subObj.add(mainPlanet.obj);

    // 子行星
    for(var i=0; i<props.subMeshCount; i++){
        var s = new SubMeshPlanet('sub', i, 10, props.subMeshStep * Math.random() + props.startStep);
        objects.push(s);
        subMeshes.push(s.subObj.children[0]);
        parentHolder.subObj.add(s.obj);
    }
    scene.add(parentHolder.obj);

    // 点阵波浪, 独立
    dotWave = new DotWave();
    dotWave.obj.position.set(mainLoc.x, mainLoc.y - 70, mainLoc.z);
    dotWave.obj.rotation.y += Math.PI / 4;
    objects.push(dotWave);
    scene.add(dotWave.obj);

    // 天空盒, 附加在相机上
    skybox = new SkySphere();
    camera.obj.add(skybox.obj);
}

/**
 * 逐帧调用的动画方法
 */
function animate(){
    // 逐帧调用
    requestAnimationFrame(animate);

    // clock对象生成的值主要用于AnimationMixer, 大概是为了保持帧率
    var delta = 0.75 * clock.getDelta();
    if(mixer){
        mixer.update(delta);
    }

    // 遍历objects数组中的所有对象, 调用其animate方法来表演
    for(var i=0, l=objects.length; i<l; i++){
        objects[i].animate();
    }

    if(postProcessing.enabled) {        // 选中对象时会开启后处理效果, 即景深Shader
        scene.overrideMaterial = null;
        // renderer.setRenderTarget(postProcessing.rtTextureColor);
        // renderer.setRenderTarget(postProcessing.rtTextureDepth);
        renderer.clear();
        renderer.render(scene, camera.obj, postProcessing.rtTextureColor, true);
        scene.overrideMaterial = matDepth;
        renderer.render(scene, camera.obj, postProcessing.rtTextureDepth, true);
        renderer.render(postProcessing.bokehScene, postProcessing.bokehCamera);
    }else{                              // 没选中时使用默认Render的固定管线
        scene.overrideMaterial = null;
        renderer.clear();
        renderer.render(scene, camera.obj, false);
    }
}

/**
 * 鼠标移动时调用的方法
 * @param event 鼠标移动时的事件对象, 包含指针坐标
 */
function onMouseMove(event){
    event.preventDefault();
    mouse.x = (event.clientX / windowWidth) * 2 - 1;
    mouse.y = - (event.clientY / windowHeight) * 2 + 1;

    // 当场景状态处于空闲或准备状态时, 响应鼠标移动
    if(props.stat == STAT.IDLE || props.stat == STAT.READY){
        camera.obj.lookAt(mainLoc.x, mainLoc.y, mainLoc.z);     // 这个应该没什么用了, 因为相机已经移动过了
        camera.obj.position.x += ((mouse.x * 10) - camera.obj.position.x + preCamLoc.x);
        camera.obj.position.y += ((mouse.y * 10) - camera.obj.position.y + preCamLoc.y);
        camera.obj.updateProjectionMatrix();

        // 设置射线器
        // 选中任何子行星, 则调用高亮方法
        raycaster.setFromCamera(mouse, camera.obj);
        var intersects = raycaster.intersectObjects(subMeshes);
        if(intersects.length > 0){
            intersected = intersects[0].object;
            if(intersected.focus){
                intersected.focus();
            }
        }else{
            if(intersected && intersected.unfocus){
                intersected.unfocus();
            }
        }
    }
}

/**
 * 鼠标按下时调用的方法
 * @param event 鼠标点击时的事件对象
 */
function onMouseDown(event){
    event.preventDefault();
    mouse.x = (event.clientX / windowWidth) * 2 - 1;
    mouse.y = - (event.clientY / windowHeight) * 2 + 1;

    if(props.stat != STAT.READY){           // 应该在除了准备状态都可以响应鼠标
        // 如果没有创建射线器, 则创建
        if(raycaster){
            raycaster.setFromCamera(mouse, camera.obj);
        }
        var intersects = raycaster.intersectObjects(subMeshes);
        if(intersects.length > 0) {
            intersected = intersects[0].object;
            if (intersected.focus) {
                onFollow();
            }
        }
        // }else{
        //     onLeave();
        //     intersected = null;
        // }
    }else if(props.stat == STAT.READY){     // 如果位于标题界面并处于准备状态
        // 转换状态
        props.stat = STAT.INIT;
        logo.play();
        camera.movingTo(mainLoc);
        preCamLoc.x = mainLoc.x;
        preCamLoc.y = mainLoc.y;

        //底部导航切换
        $('footer').delay(2000).fadeIn(1000);
    }
}

/**
 * 窗口大小改变时调用的方法
 */
function onResizeWindow(){
    windowWidth = window.innerWidth;
    windowHeight = window.innerHeight;
    camera.obj.aspect = windowWidth / windowHeight;
    camera.obj.updateProjectionMatrix();
    renderer.setSize(windowWidth, windowHeight);
    // if(windowWidth > 1440 && windowWidth > 1024){
    //
    //     if(windowWidth > windowHeight){
    //         renderer.setSize(windowWidth, windowHeight);
    //         var aspect = 1440 / windowHeight;
    //         camera.obj.aspect = aspect;
    //         camera.obj.updateProjectionMatrix();
    //     }else{
    //         renderer.setSize(windowWidth, windowHeight);
    //         var aspect = windowWidth / 1024;
    //         camera.obj.aspect = aspect;
    //         camera.obj.updateProjectionMatrix();
    //     }
    //
    //
    // }else{
    //     camera.obj.aspect = windowWidth / windowHeight;
    //     camera.obj.updateProjectionMatrix();
    //     renderer.setSize(windowWidth, windowHeight);
    // }
}

/**
 * 点击后摄像机跟踪
 */
var alerts=['About.html','Unit.html','Service.html','Team.html','Join.html','Contact.html'];
var titles=['关于我们','业务单元','服务案例','团队','加入我们','联系我们'];
function onFollow(index){
    if(props.stat != STAT.IDLE){      // 如果当前是非空闲状态, 则不执行
        return;
    }
    var obj = null;

    // 如果指定了索引, 则跳转到索引, 如果没有则跳转到射线选中的物体
    if(index !== undefined){
        obj = subMeshes[index];
        intersected = subMeshes[index];
        props.index = index;
    }else{
        obj = intersected;
        props.index = intersected.getMeshIndex();
    }
    var pos = obj.getCamPosition();
    var relPos = obj.getRelativePosition();
    var angle = obj.getRotateAngle();
    skybox.show();
    pos.x += mainLoc.x;
    pos.y += mainLoc.y;
    pos.z += mainLoc.z;
    camera.follow(pos, relPos);                     // 相机开始跟随
    for(var i=0; i<objects.length; i++){            // 隐藏所有的按钮
        if(objects[i] instanceof SubMeshPlanet){
            objects[i].hideButton();
        }
    }
    parentHolder.rotateMeshes(angle);
    obj.setBorderScale(1.0);
    obj.rotateToCam(angle);
    setTimeout(function(){                          // 延迟开启后处理模式
        var focus = intersected.getFocus();
        postProcessing.enabled = true;
        postProcessing.bokeh_uniforms['focalDepth'].value = 60;
        postProcessing.bokeh_uniforms['focalLength'].value = 20;
        postProcessing.bokeh_uniforms['focusCoords'].value.set(focus.x, focus.y);
        postProcessing.materialBokeh.needsUpdate = true;
    }, 600);

    //导航切换
    ($('#container-navs ').children().length>1)?$('#container-navs li:last-child').remove():'';

    $('#container-navs').append('<li><small>>> </small><span>'+titles[props.index]+'</span></li>');

    $('#content').scrollTop(0);
    $('#container-nav').delay(300).fadeIn(500);
    $('#content').delay(2300).fadeIn(1500);

    $('.show').eq(props.index).addClass('active').siblings().removeClass('active');

    $('#mainContent').load('html/'+alerts[props.index]);


    $('#footer').fadeOut(500).delay(1000).fadeIn(1500);

}

/**
 * 取消摄像机跟踪
 */
function onLeave(){

    if(props.stat != STAT.FOLLOW){    // 如果是空闲状态, 则不执行
        return;
    }
    postProcessing.enabled = false;
    skybox.hide();
    camera.unfollow();
    if(intersected){
        intersected.unfocus();
        intersected.unrotate();
    }
    parentHolder.unrotate();
    for(var i=0; i<objects.length; i++){
        if(objects[i] instanceof SubMeshPlanet){
            objects[i].showButton();
        }
    }
    props.index = -1;
    intersected = null;
}

/**
 * 切换选项
 */
function switchFocus(index){
    if(index === undefined){                                 // 如果索引未指定, 则不执行
        return;
    }
    if(index == props.index && props.stat == STAT.FOLLOW){   // 如果索引无变化, 则不执行
        return;
    }
    props.stat = STAT.IDLE;
    if(intersected){
        intersected.unrotate();
    }

    parentHolder.unrotate();
    onFollow(index);
    props.index = index;

    //弹框内容切换
    $('#content').hide();
}


