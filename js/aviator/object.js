/**
 * Created by Vertex on 17/2/13.
 */

var particlesPool = [];

// 创建一个圆柱形的海
var Sea = function(){
    // 创建一个圆柱形几何图形
    var geom = new THREE.CylinderGeometry(600, 600, 800, 40, 10);

    // 创建一个矩阵, 该矩阵用于进行环绕X轴进行旋转变换
    geom.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI/2));

    // 创建材质
    var mat = new THREE.MeshPhongMaterial({
        color: Colors.blue,
        transparent: true,
        opacity: 0.6, // 透明度
        shading: THREE.FlatShading // 着色方式
    });

    // 合并相同位置的顶点,
    //geom.mergeVertices();
    var l = geom.vertices.length;
    this.waves = [];
    for (var i=0; i<l; i++){
        // 获取每个顶点
        var v = geom.vertices[i];
        this.waves.push({
            y:v.y,
            x:v.x,
            z:v.z,
            ang:Math.random() * Math.PI * 2, // 波浪的形成实际上是顶点根据某一角度进行旋转
            amp:5 + Math.random() * 15, // 旋转的距离
            speed:0.016 + Math.random() * 0.032 // 旋转速度
        });
    }

    // 将多几何图形和材质结合起来, 传递给网格物体
    this.mesh = new THREE.Mesh(geom, mat);
    this.mesh.receiveShadow = true;
}

Sea.prototype.moveWaves = function(){
    var verts = this.mesh.geometry.vertices;
    var l = verts.length;
    for(var i=0; i<l; i++){
        var v = verts[i];
        var vprops = this.waves[i];
        v.x = vprops.x + Math.cos(vprops.ang) * vprops.amp;
        v.y = vprops.y + Math.sin(vprops.ang) * vprops.amp;
        vprops.ang += vprops.speed;
    }

    this.mesh.geometry.verticesNeedUpdate = true;
}

// 创建一个由多种正方体组成的不规则形状的云彩
var Cloud = function(){
    // 创建一个空的父容器
    this.mesh = new THREE.Object3D();

    // 创建一个盒物体, 实际上是立方体
    var geom = new THREE.BoxGeometry(20, 20, 20);

    // 创建材质
    var mat = new THREE.MeshPhongMaterial({
        color:Colors.white
    });

    // 随机取当前云朵所需的立方体个数
    var n = 3 + Math.floor(Math.random() * 3);
    for (var i = 0; i < n; i++){
        var m = new THREE.Mesh(geom, mat);
        m.position.x = i * 15; // 根据编号决定立方体的X轴位置
        m.position.y = Math.random() * 10;
        m.position.z = Math.random() * 10;
        m.rotation.z = Math.random() * Math.PI * 2;
        m.rotation.y = Math.random() * Math.PI * 2;
        var s = 0.1 + Math.random() * 0.9;
        m.scale.set(s, s, s);
        m.castShadow = true;
        m.receiveShadow = true;
        this.mesh.add(m);
    }
}

Cloud.prototype.rotate = function(){
    var l = this.mesh.children.length;
    for(var i=0; i<l; i++){
        var m = this.mesh.children[i]; // 获取父容器中的子物体, 也就是云朵块
        m.rotation.z += Math.random() * 0.005 * (i + 1);
        m.rotation.y += Math.random() * 0.002 * (i + 1);
    }
}

// 创建天空
var Sky = function(){
    // 空的父容器, 实际上是装载云朵的容器
    this.mesh = new THREE.Object3D();
    this.nClouds = 20;
    this.clouds = [];
    var stepAngle = Math.PI * 2 / this.nClouds; // 为了每次等距生成云朵

    // 创建云朵
    for(var i=0; i < this.nClouds; i++){
        var c = new Cloud();
        var a = stepAngle * i;
        var h = 750 + Math.random() * 200; // 云朵的随机高度
        this.clouds.push(c);
        // 将云朵布置在圆形上, 根据角度来决定
        c.mesh.position.y = Math.sin(a) * h;
        c.mesh.position.x = Math.cos(a) * h;
        c.mesh.rotation.z = a + Math.PI/2; // 跟着角度旋转
        c.mesh.position.z = -400 - Math.random() * 400;
        var s = 1 + Math.random() * 2; // 缩放
        c.mesh.scale.set(s, s, s);
        this.mesh.add(c.mesh);
    }
}

Sky.prototype.moveClouds = function(){
    for(var i=0; i<this.nClouds; i++){
        var c = this.clouds[i];
        c.rotate();
    }
}

// 创建飞机
var Airplane = function(){
    this.mesh = new THREE.Object3D();

    // 机舱
    var geomCabin = new THREE.BoxGeometry(80, 50, 50, 1, 1, 1);
    var matCabin = new THREE.MeshPhongMaterial({
        color:Colors.red,
        shading: THREE.FlatShading
    });
    geomCabin.vertices[4].y -= 10;
    geomCabin.vertices[4].z += 20;
    geomCabin.vertices[5].y -= 10;
    geomCabin.vertices[5].z -= 20;
    geomCabin.vertices[6].y += 20;
    geomCabin.vertices[6].z += 20;
    geomCabin.vertices[7].y += 20;
    geomCabin.vertices[7].z -= 20;
    var cabin = new THREE.Mesh(geomCabin, matCabin);
    this.mesh.add(cabin);

    // 引擎
    var geomEngine = new THREE.BoxGeometry(20, 50, 50, 1, 1, 1);
    var matEngine = new THREE.MeshPhongMaterial({
        color: Colors.white,
        shading:THREE.FlatShading
    });
    var engine = new THREE.Mesh(geomEngine, matEngine);
    engine.position.x = 40;
    engine.castShadow = true;
    engine.receiveShadow = true;
    this.mesh.add(engine);

    // 尾翼
    var geomTail = new THREE.BoxGeometry(15, 20, 5, 1, 1, 1);
    var matTail = new THREE.MeshPhongMaterial({
        color:Colors.red,
        shading:THREE.FlatShading
    });
    geomTail.vertices[0].x -= 5;
    geomTail.vertices[1].x -= 5;
    var tail = new THREE.Mesh(geomTail, matTail);
    tail.position.set(-30, 25, 0); // 尾翼的相对
    tail.castShadow = true;
    tail.receiveShadow = true;
    this.mesh.add(tail);

    // 机翼
    var geomWing = new THREE.BoxGeometry(40, 4, 150, 1, 1, 1);
    var matWing = new THREE.MeshPhongMaterial({
        color:Colors.red,

    });
    var wing1 = new THREE.Mesh(geomWing, matWing);
    wing1.position.set(0, 5, 0);
    wing1.castShadow = true;
    wing1.receiveShadow = true;
    this.mesh.add(wing1);

    // 螺旋桨的轴
    var geomPropeller = new THREE.BoxGeometry(20, 10, 10, 1, 1, 1);
    var matPropeller = new THREE.MeshPhongMaterial({
        color: Colors.brown,
        shading: THREE.FlatShading
    });
    // 为了在循环中调用螺旋桨旋转, 因此将螺旋桨设置为公共字段
    this.propeller = new THREE.Mesh(geomPropeller, matPropeller);
    this.propeller.castShadow = true;
    this.propeller.receiveShadow = true;

    // 螺旋桨叶片
    var geomBlade = new THREE.BoxGeometry(1, 100, 20, 1, 1, 1);
    var matBlade = new THREE.MeshPhongMaterial({
        color: Colors.brownDark,
        shading: THREE.flatShading
    });
    var blade = new THREE.Mesh(geomBlade, matBlade);
    blade.position.set(8, 0, 0);
    blade.castShadow = true;
    blade.receiveShadow = true;
    this.propeller.add(blade);
    this.propeller.position.set(50, 0, 0);
    this.mesh.add(this.propeller);

    // 轮胎保护壳
    var geomProc = new THREE.BoxGeometry(30, 15, 10, 1, 1, 1);
    var matProc = new THREE.MeshPhongMaterial({
        color:Colors.red,
        shading: THREE.FlatShading
    });
    var procLeft = new THREE.Mesh(geomProc, matProc);
    procLeft.position.set(25, -20, -25);
    procLeft.castShadow = true;
    procLeft.receiveShadow = true;
    this.mesh.add(procLeft);
    var procRight = procLeft.clone();
    procRight.position.z = -procLeft.position.z;
    this.mesh.add(procRight);

    // 轮胎
    var geomTire = new THREE.BoxGeometry(24, 24, 4, 1, 1, 1);
    var matTire = new THREE.MeshPhongMaterial({
        color: Colors.brownDark,
        shading: THREE.FlatShading
    });
    var tireBack = new THREE.Mesh(geomTire, matTire);

    var geomAxis = new THREE.BoxGeometry(10, 10, 6, 1, 1, 1);
    var matAxis = new THREE.MeshPhongMaterial({
        color: Colors.brown,
        shading: THREE.FlatShading
    });
    var axisBack = new THREE.Mesh(geomAxis, matAxis);
    tireBack.add(axisBack);
    tireBack.scale.set(0.5, 0.5, 0.5);
    tireBack.position.set(-35, -15, 0);
    this.mesh.add(tireBack);

    // 可以克隆多份对象, 每一个对象是单独的引用关系
    var tireLeft = tireBack.clone();
    tireLeft.scale.set(1, 1, 1);
    tireLeft.position.set(procLeft.position.x, procLeft.position.y - 8, procLeft.position.z);
    var tireRight = tireLeft.clone();
    tireRight.position.z = -tireLeft.position.z;
    this.mesh.add(tireLeft);
    this.mesh.add(tireRight);

    // 悬挂系统
    var geomSusp = new THREE.BoxGeometry(4, 20, 4);
    geomSusp.applyMatrix(new THREE.Matrix4().makeTranslation(0, 10, 0));
    var matSusp = new THREE.MeshPhongMaterial({
        color: Colors.red,
        shading: THREE.FlatShading
    });
    var susp = new THREE.Mesh(geomSusp, matSusp);
    susp.position.set(-35, -15, 0);
    susp.rotation.z = -0.3;
    this.mesh.add(susp);

    // 飞行员
    this.pilot = new Pilot();
    this.pilot.mesh.position.set(-10, 27, 0);
    this.mesh.add(this.pilot.mesh);

    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
}

// 创建飞行员
var Pilot = function(){
    this.mesh = new THREE.Object3D();
    this.mesh.name = "pilot";
    this.angleHairs = 0;

    // 飞行员的身体
    var geomBody = new THREE.BoxGeometry(15, 15, 15);
    var matBody = new THREE.MeshPhongMaterial({
        color: Colors.brown,
        shading: THREE.FlatShading
    });
    var body = new THREE.Mesh(geomBody, matBody);
    body.position.set(2, -12, 0);
    this.mesh.add(body);

    // 飞行员的头
    var geomFace = new THREE.BoxGeometry(10, 10, 10);
    var matFace = new THREE.MeshPhongMaterial({
        color: Colors.pink
    });
    var face = new THREE.Mesh(geomFace, matFace);
    this.mesh.add(face);

    // 飞行员头发, 先创建一个块, 通过克隆来组成头发
    var geomHair = new THREE.BoxGeometry(4, 4, 4);
    var matHair = new THREE.MeshLambertMaterial({
        color: Colors.brown
    });
    var hair = new THREE.Mesh(geomHair, matHair);
    hair.geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, 2, 0));
    var hairs = new THREE.Object3D();
    this.hairsTop = new THREE.Object3D();
    for(var i=0; i<12; i++){
        var h = hair.clone();
        var col = i % 3;
        var row = Math.floor(i / 3);
        var startPosZ = -4;
        var startPosX = -4;
        h.position.set(startPosX + row * 4, 0, startPosZ + col * 4); // 4是头发块的单位大小
        h.geometry.applyMatrix(new THREE.Matrix4().makeScale(1, 1, 1));
        this.hairsTop.add(h);
    }
    hairs.add(this.hairsTop);

    var geomHairSide = new THREE.BoxGeometry(12, 4, 2);
    geomHairSide.applyMatrix(new THREE.Matrix4().makeTranslation(-6, 0, 0));
    var hairSideR = new THREE.Mesh(geomHairSide, matHair);
    var hairSideL = hairSideR.clone();
    hairSideR.position.set(8, -2, 6);
    hairSideL.position.set(8, -2 -6);
    hairs.add(hairSideR);
    hairs.add(hairSideL);

    var geomHairBack = new THREE.BoxGeometry(2, 8, 10);
    var hairBack = new THREE.Mesh(geomHairBack, matHair);
    hairBack.position.set(-1, -4, 0);
    hairs.add(hairBack);
    hairs.position.set(-5, 5, 0);
    this.mesh.add(hairs);
}

Pilot.prototype.updateHairs = function(){
    var hairs = this.hairsTop.children;
    var l = hairs.length;
    for(var i=0; i<l; i++){
        var h = hairs[i];
        h.scale.y = 0.75 + Math.cos(this.angleHairs + i/3) * 0.25; // 通过拉长来起到拂动的效果, i/3确保每一排的拂动效果相同
    }
    this.angleHairs += 0.1;
}

// 创建能量块
Particle = function(){
    var geom = new THREE.TetrahedronGeometry(3, 0);
    var mat = new THREE.MeshPhongMaterial({
        color: 0x009999,
        shininess:0,
        specular:0xffffff,
        shading:THREE.FlatShading
    });
    this.mesh = new THREE.Mesh(geom, mat);
}

Particle.prototype.explode = function(pos, color, scale){
    var _this = this;
    var _p = this.mesh.parent; // 父容器?
    this.mesh.material.color = new THREE.Color(color);
    this.mesh.material.needsUpdate = true;
    this.mesh.scale.set(scale, scale, scale);
    // 不管怎么说会朝着一个直线移动
    var targetX = pos.x + (-1 + Math.random() * 2) * 50;
    var targetY = pos.y + (-1 + Math.random() * 2) * 50;
    var speed = 1 + Math.random() * 0.2;
    TweenMax.to(this.mesh.rotation, speed, {x:Math.random() * 12, y:Math.random() * 12});
    TweenMax.to(this.mesh.scale, speed, {x:0.1, y:0.1, z:0.1});
    TweenMax.to(this.mesh.position, speed, {x:targetX, y:targetY, delay:Math.random() * 0.1, ease:Power2.easeOut, onComplete:function(){
        if(_p)
            _p.remove(_this.mesh);
        _this.mesh.scale.set(1,1,1);
        particlesPool.unshift(_this); // 结束动作后, 将碎片放入缓冲池中以备重新使用
    }});
}

// 生成碎片
ParticlesHolder = function(){
    this.mesh = new THREE.Object3D();
}

ParticlesHolder.prototype.spawnParticles = function(pos, density, color, scale){
    var nParticles = density;
    for(var i=0; i<nParticles; i++){
        var particle;
        if(particlesPool.length){
            particle = particlesPool.pop();
        }else{
            particle = new Particle();
        }
        this.mesh.add(particle.mesh);
        particle.mesh.visible = true;
        var _this = this;
        particle.mesh.position.y = pos.y;
        particle.mesh.position.x = pos.x;
        particle.explode(pos, color, scale);
    }
}