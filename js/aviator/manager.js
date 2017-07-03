/**
 * Created by Vertex on 17/2/13.
 */
var Colors = {
    red:0xf25346,
    white:0xd8d0d1,
    brown:0x59332e,
    pink:0xF5986E,
    brownDark:0x23190f,
    blue:0x68c3c0,
};

var scene, // 场景
    camera, // 摄像机
    fieldOfView, // 视窗
    aspectRatio, // 宽高比
    nearPlane, // 近景的多边形个数
    farPlane, // 远景的多边形个数
    HEIGHT, // 高度
    WIDTH, // 宽度
    renderer, // 渲染器?
    container; // 场景容器, 通过树形结构展开

var hemisphereLight, // 半球形光源, 多半是为了创建环境光
    shadowLight,
    ambientLight; // 使用了线光源, 创建物件的阴影

var sea,
    sky,
    airplane;

var mousePos = {
    x:0,
    y:0
};

var particlesHolder;

var deltaTime,
    newTime = 0,
    oldTime = 0;

var planeRotSensivity = 0.002,
    planeMovSensivity = 0.005;

// 创建场景
function createScene(){
    HEIGHT = window.innerHeight;
    WIDTH = window.innerWidth;

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xf7d9aa, 100, 950);

    // 创建透视视角摄像机
    aspectRatio = WIDTH / HEIGHT;
    fieldOfView = 60;
    nearPlane = 1;
    farPlane = 10000;
    camera = new THREE.PerspectiveCamera(
        fieldOfView,
        aspectRatio,
        nearPlane,
        farPlane
    );
    camera.position.x = 0;
    camera.position.z = 100;
    camera.position.y = 100;

    renderer = new THREE.WebGLRenderer({
        alpha: true, // Alpha通道
        antialias: true // 抗锯齿, 一般会降低性能
    });

    renderer.setSize(WIDTH, HEIGHT);

    container = document.getElementById('world');
    container.appendChild(renderer.domElement);

    window.addEventListener('resize', handleWindowResize, false);
}

// 更改大小时刷新窗口
function handleWindowResize(){
    HEIGHT = window.innerHeight;
    WIDTH = window.innerWidth;
    renderer.setSize(WIDTH, HEIGHT);
    camera.aspect = WIDTH / HEIGHT;
    camera.updateProjectionMatrix();
}


// 创建光源
function createLights(){
    hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, .9);
    shadowLight = new THREE.DirectionalLight(0xffffff, .9);
    ambientLight = new THREE.AmbientLight(0x0012FF, 0.5);
    shadowLight.position.set(150, 350, 350); // 线性光中心点
    shadowLight.castShadow = true; // 允许生成阴影

    // 创建一个阴影可见区域, 也就是线性光的立方体范围
    shadowLight.shadow.camera.left = -400;
    shadowLight.shadow.camera.right = 400;
    shadowLight.shadow.camera.top = 400;
    shadowLight.shadow.camera.bottom = -400;
    shadowLight.shadow.camera.near = 1;
    shadowLight.shadow.camera.far = 1000;

    // 阴影质量
    shadowLight.shadow.mapSize.width = 2048;
    shadowLight.shadow.mapSize.height = 2048;

    // 在场景中添加光源
    scene.add(hemisphereLight);
    scene.add(shadowLight);
    scene.add(ambientLight);
}


// 创建海
function createSea(){
    sea = new Sea();
    sea.mesh.position.y = -600;
    scene.add(sea.mesh);
}

// 创建天空
function createSky(){
    sky = new Sky();
    sky.mesh.position.y = -600;
    scene.add(sky.mesh);
}

// 创建飞机
function createAirplane(){
    airplane = new Airplane();
    airplane.mesh.scale.set(0.25, 0.25, 0.25);
    airplane.mesh.position.y = 100;
    airplane.mesh.position.x = -50;
    scene.add(airplane.mesh);
}

// 创建能量块
function createParticles(){
    for(var i=0; i<10; i++){
        var particle = new Particle();
        particlesPool.push(particle);
    }
    particlesHolder = new ParticlesHolder();
    scene.add(particlesHolder.mesh);
}

// 更新飞机位置
function updatePlane(){
    // 投影坐标的移动
    var targetX = normalize(mousePos.x, -1, 1, -20, 20);
    var targetY = normalize(mousePos.y, -1, 1, 80, 120);
    airplane.mesh.position.y += (targetY - airplane.mesh.position.y) * deltaTime * planeMovSensivity;
    airplane.mesh.position.x += (targetX - airplane.mesh.position.x) * deltaTime * planeMovSensivity;
    airplane.mesh.rotation.z = (targetY - airplane.mesh.position.y) * deltaTime * planeRotSensivity;
    airplane.propeller.rotation.x += 0.5; // 螺旋桨加速旋转
}

// 处理鼠标移动
function handleMouseMove(event){
    var tx = -1 + (event.clientX / WIDTH) * 2;
    var ty = 1 - (event.clientY / HEIGHT) * 2;
    mousePos = {
        x: tx,
        y: ty
    };
    if(event.clientY > 700){
        particlesHolder.spawnParticles(airplane.mesh.position.clone(), 1, Colors.red, 0.8);
    }
}

// 标准化投影
function normalize(v, vmin, vmax, tmin, tmax){
    var nv = Math.max(Math.min(v, vmax), vmin);
    var dv = vmax - vmin;
    var pc = (nv - vmin) / dv;
    var dt = tmax - tmin;
    var tv = tmin + (pc * dt);
    return tv;
}

// 循环播放
function loop(){
    newTime = new Date().getTime();
    deltaTime = newTime - oldTime;
    oldTime = newTime;

    airplane.propeller.rotation.x += 0.2;
    sea.mesh.rotation.z += 0.005;
    sky.mesh.rotation.z += 0.01;
    updatePlane();
    sea.moveWaves();
    sky.moveClouds();
    airplane.pilot.updateHairs();
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
}