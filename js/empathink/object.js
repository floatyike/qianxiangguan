var shootStep = 0.6;        // 小行星放射的时间间隔
var shootSpeed = 0.1;       // 小行星放射过程的时间
var flyDuration = 2;        // 摄像机从原点飞往主行星的时间
var logoDuration = 1.5;     // logo飞散的时间
var followDuration = 2;     // 选定时摄像机飞行时间
var unfollowDuration = 2;   // 取消选定时摄像机飞行时间
var particlesPool = [];     // 碎片池
var subline = false;
var rotUnit = Math.PI / 180;
var subMeshInfos = [
    {
        text: 'About Us',
        angle: {
            x: rotUnit * 30, y: -rotUnit * 60, z: rotUnit * 15
        },
        focus: { x:0.7, y:0.5 },
        relPos: { x:-2, y:1.5, z: -4 }
    },
    {
        text: 'Unit',
        angle: {
            x: -rotUnit * 23, y: -rotUnit * 156, z: -rotUnit * 28
        },
        focus: { x:0.7, y:0.5 },
        relPos: { x:3, y:-0.5, z:-4 }
    },
    {
        text: 'Service Cases',
        angle: {
            x: -rotUnit * 3, y: -rotUnit * 142, z: rotUnit * 10
        },
        focus: { x:0.3, y:0.5 },
        relPos: { x:3, y:-1, z:-4 }
    },
    {
        text: 'Team',
        angle: {
            x: rotUnit * 3, y: -rotUnit * 166, z: rotUnit * 15
        },
        focus: { x:0.7, y:0.5 },
        relPos: { x:-2, y:-1, z:-3 }
    },
    {
        text: 'Join',
        angle: {
            x: rotUnit * 60, y: 0, z: rotUnit * 3
        },
        focus: { x:0.7, y:0.5 },
        relPos: { x:-2, y:-0.5, z:-2 }
    },
    {
        text: 'Contact',
        angle: {
            x: -rotUnit * 27, y: -rotUnit * 155, z: -rotUnit * 25
        },
        focus: { x:0.3, y:0.5 },
        relPos: { x:3, y:-0.5, z:-4 }
    }

];

/**
 *
 * 摄像机封装对象
 *
 *
 *
 * @param fov 视锥角度
 * @param aspect 宽高比
 * @param near 近平面距离
 * @param far 远平面距离
 * @constructor
 */
var Camera = function(fov, aspect, near, far){
    this.obj = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this.prop = {
        animating: false,
        dist: 200,
        followDist: 15,           // 摄像机在点击事件时移动的距离
        prePos: new THREE.Vector3(0, 0, 0)
    }

    if(subline){
        var matL = new THREE.LineBasicMaterial({color: 0xff0000});
        var geomL = new THREE.Geometry();
        geomL.vertices.push(new THREE.Vector3(-100, 0, -1));
        geomL.vertices.push(new THREE.Vector3(100, 0, -1));
        var line = new THREE.Line(geomL, matL);
        this.obj.add(line);
    }
};

/**
 * 摄像机的动画控制
 */
Camera.prototype.animate = function(){
    if(!this.prop.animating){
        switch(props.stat){
            case STAT.INIT:
                break;
            case STAT.IDLE:
                break;
            case STAT.READY:
                break;
        }
    }
};

/**
 * 移动到球体的动画, 播放时间由flyDuration决定
 */
Camera.prototype.movingTo = function(position){
    var _this = this;
    _this.prop.animating = true;
    TweenMax.to(_this.obj.position, flyDuration, {
        x: position.x,
        y: position.y,
        z: position.z + _this.prop.dist,
        ease: Power2.easeInOut,
        delay: 0.5, // logo飞散的0.5秒后开始移动
        onComplete: function(){
            _this.prop.animating = false;
            _this.prop.prePos = new THREE.Vector3(_this.obj.position.x, _this.obj.position.y, _this.obj.position.z);
        }
    });
};

/**
 * 摄像机跟随小行星的方法
 * @param pos
 */
Camera.prototype.follow = function(pos, relPos){
    var _this = this;
    if(props.stat == STAT.FOLLOW){
        return;
    }
    if(!_this.prop.animating){
        _this.prop.animating = true;
        props.stat = STAT.FOLLOW;
        TweenMax.to(_this.obj.position, followDuration, {
            x: _this.prop.prePos.x + relPos.x,
            y: pos.y + relPos.y,
            z: pos.z + _this.prop.followDist + relPos.z,
            ease: Power2.easeOut,
            onComplete: function(){
                _this.prop.animating = false;
            }
        })
    }
};

/**
 * 摄像机取消跟随的方法
 */
Camera.prototype.unfollow = function(){
    var _this = this;
    if(props.stat != STAT.FOLLOW){
        return;
    }
    if(!_this.prop.animating){
        _this.prop.animating = true;
        TweenMax.to(_this.obj.position, unfollowDuration, {
            x: _this.prop.prePos.x,
            y: _this.prop.prePos.y,
            z: _this.prop.prePos.z,
            ease: Power2.easeInOut,
            onComplete: function(){
                _this.prop.animating = false;
                props.stat = STAT.IDLE;
            }
        });
    }
};


/**
 *
 * Logo的封装物体
 *
 *
 *
 * @param file logo对象的json文件路径
 * @constructor
 */
var Logo = function(file){
    var _this = this;
    var loader = new THREE.ObjectLoader();
    this.obj = new THREE.Object3D();
    this.mixer = new THREE.AnimationMixer(_this.obj);
    this.actions = [];
    this.prop = {
        animating: false
    };

    // 加载JSON文件并初始化Logo
    loader.load(file, function(obj){
        // 导入几何对象并使用自定义的材质
        for(var i=0, l=obj.children.length; i<l; i++){
            if(obj.children[i] instanceof THREE.Mesh && obj.children[i].name != 'Sphere' && obj.children[i].name != 'Camera'){
                obj.children[i].material = new THREE.MeshBasicMaterial({
                    color: 0x000000
                });
                _this.obj.add(obj.children[i].clone());
            }
        }
        // 导入动画
        for(var i=0, l=obj.animations.length; i<l; i++){
            _this.actions.push(_this.mixer.clipAction(obj.animations[i]));
        }
        console.log("preparing logo");
        if(!_this.prop.animating){
            _this.prop.animating = true;
            var delay = 1;
            TweenMax.to(_this.obj.position, 2, {
                z: 0,
                ease: Power2.easeOut,
                delay: delay,
                onComplete: function(){
                    _this.prop.animating = false;
                }
            });
        }
    });
};

/**
 * Logo对象的动画方法, 暂时没有内容
 */
Logo.prototype.animate = function(){
    if(!this.prop.animating){
        switch(props.stat){
            case STAT.LOADING:
                break;
            case STAT.IDLE:
                break;
            case STAT.READY:
                break;
            case STAT.INIT:
                break;
            case STAT.FOLLOW:
                break;
        }
    }
};

/**
 * 播放Logo对象自带的动画
 */
Logo.prototype.play = function(){
    if(this.actions.length > 0){
        var action = this.actions[0];
        action.setLoop(THREE.LoopOnce);
        action.setDuration(logoDuration);
        action.play();
        setTimeout(function(){
            action.paused = true;
        }, logoDuration * 0.9 * 1000);
    }
};

/**
 *
 * 所有行星物体的父类对象
 *
 *
 */
var ParentHolder = function(){
    this.obj = new THREE.Object3D();
    this.subObj = new THREE.Object3D(); // 再套一层空物体, 便于旋转
    this.obj.add(this.subObj);
    this.prop = {
        angle: 0
    }

};

/**
 * 旋转父物体
 * @param extraAngle 旋转的角度
 */
ParentHolder.prototype.rotateMeshes = function(extraAngle, duration){
    var _this = this;
    if(duration === undefined){
        duration = followDuration;
    }
    TweenMax.to(_this.obj.rotation, duration, {
        y: extraAngle,
        ease: Power2.easeInOut
    });


};

ParentHolder.prototype.unrotate = function(duration){
    var _this = this;
    if(duration === undefined){
        duration = unfollowDuration;
    }
    TweenMax.to(_this.obj.rotation, duration, {
        y: 0,
        ease: Power2.easeInOut
    });
};

/**
 *
 * 主行星的封装对象
 *
 *
 *
 * @param name 主行星的名字
 * @param count 小行星的个数
 * @param radius 球体半径
 * @constructor
 */
var MeshPlanet = function(name, count, radius) {
    this.obj = new THREE.Group();
    this.subObj = new THREE.Object3D();
    this.pHolder = new ParticlesHolder();
    this.prop = {
        animating: false,
        count: count,
        mainParticleCount: 80,
        explodeRadius: 40,
        explodeStep: 40,
        explodeSpeed: 0.2,
        rotAngle: Math.PI / 12
    };

    // 主行星主体
    var geomM = new THREE.BoxGeometry(radius, radius, radius);
    var matM = new THREE.MeshBasicMaterial({
        color: 0xFCCE5B,
        transparent: true,
        opacity: 0.0
    });

    var meshM = new THREE.Mesh(geomM.clone(), matM.clone());
    meshM.position.set(0, 0, 0);
    this.obj.add(meshM);

    // 附带的点光源
    var lightP = new THREE.PointLight(0xBCB7A9, 0.76, 500, 3.54);
    this.obj.add(lightP);

    // 附带的半球光源
    var lightH = new THREE.HemisphereLight(0xCFCAC0, 0x949085, 1);
    lightH.position.set(0, 50, 0);
    this.obj.add(lightH);

    // 主行星碎裂后的碎片
    var geomP = new THREE.TetrahedronGeometry(radius / 8, 0);
    var matP = new THREE.MeshPhongMaterial({
        color: 0xFFFFFF,
        shading: THREE.FlatShading,
        shininess: 30,
        specular: 0x000000,
        transparent: true,
        opacity: 0.0
    });
    for(var i=0; i<this.prop.mainParticleCount; i++){
        var size = Math.random();
        var angleXOZ = Math.random() * Math.PI * 2;
        var circle = Math.floor((Math.random() * this.prop.explodeStep) + this.prop.explodeRadius);
        var meshP = new THREE.Mesh(geomP.clone(), matP.clone());
        meshP.scale.set(size, size, size);
        meshP.rotation.set(Math.random(), Math.random(), Math.random());
        meshP.targetPos = new THREE.Vector3(Math.sin(angleXOZ) * circle, Math.random() * 10 - 5, Math.cos(angleXOZ) * circle);
        meshP.rotSpeed = Math.random() * 0.06;
        meshP.position.set(0, 0, 0);
        meshP.castShadow = true;
        meshP.receiveShadow = true;
        this.subObj.add(meshP);
    }
    this.obj.add(this.subObj);
};

/**
 * 主行星的动画方法
 */
MeshPlanet.prototype.animate = function (){
    if(!this.prop.animating){
        switch(props.stat) {
            case STAT.LOADING:
                this.showUp();
                break;
            case STAT.INIT:
                this.explode();
                break;
            case STAT.READY:
                this.spin();
                break;
            case STAT.IDLE:
                this.spin();
                break;
            case STAT.FOLLOW:
                this.spin();
                break;
        }
    }
};

/**
 * 主星球出现时的动画
 */
MeshPlanet.prototype.showUp = function(){
    this.prop.animating = true;
    var _this = this;
    var delay = 3;
    console.log('preparing planet');
    // 显现球体
    TweenMax.to(this.obj.children[0].material, 1, {
        ease: Power2.easeOut,
        opacity: 1.0,
        delay: delay,
        onComplete: function(){
            props.stat = STAT.READY;
            _this.prop.animating = false;
        }
    });
    for(var i=0, l=this.subObj.children.length; i<l; i++){
        var child = this.subObj.children[i];
        TweenMax.to(child.material, 1, {
            ease: Power2.easeOut,
            opacity: 1.0,
            delay: delay,
            onComplete: function(){
                props.stat = STAT.READY;
                _this.prop.animating = false;
            }
        });
    }
};

/**
 * 主行星缩小动画
 */
MeshPlanet.prototype.explode = function(){
    var _this = this;
    if(!_this.prop.animating){
        _this.prop.animating = true;
        _this.obj.parent.add(_this.pHolder.obj);
        var delay = flyDuration;                    // 播放完后镜头拉开的时间
        var scale = _this.obj.children[0].scale;
        // 放射出所有碎片
        for(var i=0; i<_this.prop.mainParticleCount; i++){
            var child = _this.subObj.children[i];
            TweenMax.to(child.position, _this.prop.explodeSpeed, {
                x: child.targetPos.x,
                y: child.targetPos.y,
                z: child.targetPos.z,
                ease: Power2.easeOut,
                delay: delay
            });
            TweenMax.to(child.rotation, _this.prop.explodeSpeed, {
                y: Math.PI * 4,
                ease: Power2.easeOut,
                delay: delay
            });
        }

        TweenMax.to(scale, _this.prop.explodeSpeed, {
            x: 0.01,
            y: 0.01,
            z: 0.01,
            ease: Power2.easeOut,
            delay: delay,
            onComplete: function(){
                _this.pHolder.spawnParticles(_this.obj.position.clone(), 10, 0.8);
                _this.obj.remove(_this.obj.children[0]);
                _this.prop.animating = false;
            }
        });
    }
};

/**
 * 主行星旋转
 */
MeshPlanet.prototype.spin = function(){
    this.subObj.rotation.y += 0.001;
    for(var i=0; i<this.subObj.children.length; i++){
        this.subObj.children[i].rotation.y += this.subObj.children[i].rotSpeed;
    }
};

/**
 *
 * 围绕主行星旋转的小行星对象
 *
 *
 *
 * @param name
 * @param index
 * @param file
 * @param sphereR
 * @param rotateR
 * @constructor
 */
var SubMeshPlanet = function(name, index, sphereR, rotateR){
    var _this = this;
    this.obj = new THREE.Object3D(); // 将球体和轨道包含在内的Object3D对象
    this.subObj = new THREE.Object3D(); // 把球体放在单独的Object3D对象中, 以拥有一个单独的坐标系, 便于进行轨道旋转.

    this.prop = {
        animating: false,
        maxSpeed: 0.002,
        angle: 0,
        preAngle: new THREE.Vector3(),
        index: index,
        radius: rotateR,
        speed: 0.0,
        focused: false,
        rotX: Math.PI / 12,
        rotY: Math.PI / 12,
        rotZ: Math.PI / 12,
        preColor: new THREE.Color(1, 1, 1),
        btnRelPos: {
            x: 5,
            y: 5,
            z: 0
        },
        worldYAxis: new THREE.Vector3(),
        worldXAxis: new THREE.Vector3(),
        worldZAxis: new THREE.Vector3()
    };


    // 创建一个多边形
    var geomM = new THREE.TetrahedronGeometry(sphereR, 0);
    var matM = new THREE.MeshPhongMaterial({
        color: 0xFFFFFF,
        specular: 0x000000,
        shininess: 300,
        shading: THREE.FlatShading,
        transparent: true,
        opacity: 0.0
    });
    var matShader = new THREE.MeshBasicMaterial({
        color: 0xFCCE5B
    });
    matShader.depthWrite = false;

    // 创建一个文字物体
    this.button = new Button(subMeshInfos[index].text);
    this.button.obj.position.set(0, 0, 0);
    this.button.obj.rotation.set(-_this.prop.rotX, -_this.prop.rotY, -_this.prop.rotZ);

    var meshM = new THREE.Mesh(geomM.clone(), matM.clone());
    var meshShader = new THREE.Mesh(geomM.clone(), matShader.clone());
    meshShader.visible = false;
    meshM.castShadow = true;
    meshM.receiveShadow = true;
    meshM.position.set(0, 0, 0);
    meshM.rotation.set(Math.PI * Math.random(), Math.PI * Math.random(), Math.PI * Math.random());
    this.prop.preAngle.x = meshM.rotation.x;
    this.prop.preAngle.y = meshM.rotation.y;
    this.prop.preAngle.z = meshM.rotation.z;
    meshM.add(meshShader);
    this.subObj.position.set(0, 0, 0);
    this.subObj.add(meshM);
    this.subObj.add(this.button.obj);
    this.obj.add(this.subObj);

    // 设定子行星坐标系中与世界坐标系相重叠的坐标系
    // 包括X轴, Y轴, Z轴
    this.prop.worldYAxis = new THREE.Vector3(0, 1, 0);
    this.prop.worldXAxis = new THREE.Vector3(1, 0, 0);
    this.prop.worldZAxis = new THREE.Vector3(0, 0, 1);
    var vX = new THREE.Vector3(1, 0, 0);
    var vY = new THREE.Vector3(0, 1, 0);
    var vZ = new THREE.Vector3(0, 0, 1);
    this.prop.worldYAxis.applyAxisAngle(vZ, -_this.prop.rotZ);
    this.prop.worldXAxis.applyAxisAngle(vZ, -_this.prop.rotZ);
    this.prop.worldZAxis.applyAxisAngle(vZ, -_this.prop.rotZ);
    vX.applyAxisAngle(vZ, -_this.prop.rotZ);
    vZ.applyAxisAngle(vZ, -_this.prop.rotZ);
    this.prop.worldYAxis.applyAxisAngle(vY, -_this.prop.rotY);
    this.prop.worldXAxis.applyAxisAngle(vY, -_this.prop.rotY);
    this.prop.worldZAxis.applyAxisAngle(vY, -_this.prop.rotY);
    vX.applyAxisAngle(vY, -_this.prop.rotY);
    this.prop.worldYAxis.applyAxisAngle(vX, -_this.prop.rotX);
    this.prop.worldXAxis.applyAxisAngle(vX, -_this.prop.rotX);
    this.prop.worldZAxis.applyAxisAngle(vX, -_this.prop.rotX);
    this.prop.worldYAxis.normalize();
    this.prop.worldXAxis.normalize();
    this.prop.worldZAxis.normalize();

    this.subObj.children[0].getCamPosition = function(){
        var pos = new THREE.Vector3(this.position.x, this.position.y, this.position.z);
        var vX = new THREE.Vector3(1, 0, 0);
        var vY = new THREE.Vector3(0, 1, 0);
        var vZ = new THREE.Vector3(0, 0, 1);
        pos.applyAxisAngle(vX, _this.prop.rotX);
        vY.applyAxisAngle(vX, _this.prop.rotX);
        vZ.applyAxisAngle(vX, _this.prop.rotX);
        pos.applyAxisAngle(vY, _this.prop.rotY);
        vZ.applyAxisAngle(vY, _this.prop.rotY);
        pos.applyAxisAngle(vZ, _this.prop.rotZ);
        var pos2D = new THREE.Vector2(pos.x, pos.z);
        pos.z = pos2D.distanceTo(new THREE.Vector2());
        return pos;
    };


    this.subObj.children[0].getRelativePosition = function(){
        return subMeshInfos[index].relPos;
    };

    // 给球形子物体能够被选定的函数
    this.subObj.children[0].focus = function(){
        if(!_this.prop.focused){
            console.log('focused');
            var matS = this.material;
            _this.prop.focused = true;
            _this.prop.preColor.r = matS.color.r;
            _this.prop.preColor.g = matS.color.g;
            _this.prop.preColor.b = matS.color.b;
            TweenMax.to(matS.color, 0.2, {
                r: 1.0,
                g: 1.0,
                b: 1.0,
                ease: Power2.easeOut
            });
            this.setBorderScale(1.3);
        }
    };

    // 球形子物体不被选定时的函数
    this.subObj.children[0].unfocus = function(){
        if(_this.prop.focused){
            console.log('unfocused');
            _this.prop.focused = false;
            TweenMax.to(this.material.color, 0.2, {
                r: _this.prop.preColor.r,
                g: _this.prop.preColor.g,
                b: _this.prop.preColor.b,
                ease: Power2.easeOut
            });
            this.setBorderScale(1.0);
        }
    };

    this.subObj.children[0].setBorderScale = function(scale){
        if(props.stat == STAT.INIT){
            return;
        }
        TweenMax.to(this.children[0].scale, 0.2, {
            x: scale,
            y: scale,
            z: scale,
            ease: Power2.easeOut
        })
    };

    this.subObj.children[0].rotateToCam = function(angle){
        var rotAngle = angle % (Math.PI * 2);
        var obj = this;
        if(rotAngle > 0 && rotAngle <= Math.PI / 2){
            rotAngle = 2 * Math.PI - rotAngle;
        }else if(rotAngle > Math.PI / 2 && rotAngle <= Math.PI){
            rotAngle = rotAngle - Math.PI;
        }else if(rotAngle > Math.PI && rotAngle <= Math.PI * 3/2){
            rotAngle = Math.PI - rotAngle;
        }else if(rotAngle > Math.PI * 3/2 && rotAngle < Math.PI * 2){
            rotAngle = Math.PI - rotAngle;
        }

        rotAngle -= Math.PI / 12;

        // 绕着计算出的世界坐标系进行旋转
        setTimeout(function(){
            obj.rotation.set(0, Math.PI * 4, 0)
            obj.rotateOnAxis(_this.prop.worldYAxis, -rotAngle);
            obj.rotateOnAxis(_this.prop.worldXAxis, subMeshInfos[_this.prop.index].angle.x);
            obj.rotateOnAxis(_this.prop.worldYAxis, subMeshInfos[_this.prop.index].angle.y);
            obj.rotateOnAxis(_this.prop.worldZAxis, subMeshInfos[_this.prop.index].angle.z);
        }, (followDuration - 1) * 1000);
    };

    this.subObj.children[0].unrotate = function(){
        TweenMax.to(this.rotation, unfollowDuration * 2, {
            x: _this.prop.preAngle.x,
            y: Math.PI * 4,
            z: _this.prop.preAngle.z,
            ease: Power2.easeOut
        });
    };

    // 获取球形子物体的旋转角度
    this.subObj.children[0].getRotateAngle = function(){
        var pos = new THREE.Vector3(this.position.x, this.position.y, this.position.z);
        var vX = new THREE.Vector3(1, 0, 0);
        var vY = new THREE.Vector3(0, 1, 0);
        var vZ = new THREE.Vector3(0, 0, 1);
        pos.applyAxisAngle(vX, _this.prop.rotX);
        vY.applyAxisAngle(vX, _this.prop.rotX);
        vZ.applyAxisAngle(vX, _this.prop.rotX);
        pos.applyAxisAngle(vY, _this.prop.rotY);
        vZ.applyAxisAngle(vY, _this.prop.rotY);
        pos.applyAxisAngle(vZ, _this.prop.rotZ);
        var pos2D = new THREE.Vector2(pos.x, pos.z);
        var angle = - (Math.PI * 4 - pos2D.angle()) - Math.PI / 2;
        return angle;
    };

    // 获取焦点坐标
    this.subObj.children[0].getFocus = function(){
        return subMeshInfos[_this.prop.index].focus;
    }

    // 获取索引值
    this.subObj.children[0].getMeshIndex = function(){
        return _this.prop.index;
    }
};

/**
 *
 * 子行星飞散
 *
 *
 */
SubMeshPlanet.prototype.scatter = function(){
    console.log('scatter');
    this.prop.animating = true;
    var _this = this;
    var radius = _this.prop.radius;
    var delay = flyDuration;
    var angle = this.prop.angle = Math.random() * Math.PI / 12 + Math.PI * 2 / 7 * this.prop.index;
    var sphere = this.subObj.children[0];
    var button = this.subObj.children[1];
    this.obj.rotation.set(this.prop.rotX, this.prop.rotY, this.prop.rotZ);

    TweenMax.to(sphere.position, shootSpeed, {
        x: radius * Math.cos(angle),
        z: radius * Math.sin(angle),
        ease: Power2.easeOut,
        delay: delay
    });
    TweenMax.to(button.position, shootSpeed, {
        x: radius * Math.cos(angle) + _this.prop.btnRelPos.x,
        y: _this.prop.btnRelPos.y,
        z: radius * Math.sin(angle) + _this.prop.btnRelPos.z,
        ease: Power2.easeOut,
        delay: delay
    });
    TweenMax.to(sphere.rotation, 1, {
        y: Math.PI * 4,
        ease: Power2.easeOut,
        delay: delay
    });
    for(var i=0; i<button.children.length; i++){
        TweenMax.to(button.children[i].material, 1, {
            opacity: 1.0,
            delay: delay + shootSpeed * 5
        });
    }
    TweenMax.to(sphere.material, 0.1, {
        opacity: 1.0,
        ease: Power2.easeOut,
        delay: delay,
        onComplete: function(){
            _this.prop.animating = false;
            props.stat = STAT.IDLE;
        }
    });
    sphere.children[0].visible = true;
};

/**
 * 小行星的动画方法
 */
SubMeshPlanet.prototype.animate = function(){
    if(!this.prop.animating){
        switch(props.stat){
            case STAT.INIT:
                this.scatter();
                break;
            case STAT.IDLE:
                this.rotate();
                break;
            case STAT.FOLLOW:
                this.prop.speed = 0.0;
                break;
        }
    }
};

/**
 * 小行星的旋转方法
 */
SubMeshPlanet.prototype.rotate = function(){
    if(this.prop.speed < this.prop.maxSpeed){
        this.prop.speed += 0.0001;
    }
    this.prop.angle += this.prop.speed;
    this.subObj.children[0].position.set(this.prop.radius * Math.cos(this.prop.angle), 0, this.prop.radius * Math.sin(this.prop.angle));
    this.subObj.children[1].position.set(this.prop.radius * Math.cos(this.prop.angle) + this.prop.btnRelPos.x, this.prop.btnRelPos.y, this.prop.radius * Math.sin(this.prop.angle) + this.prop.btnRelPos.z)
};

/**
 * 显示选项
 */
SubMeshPlanet.prototype.showButton = function(){
    var button = this.button;
    button.obj.visible = true;
    for(var i=0; i<button.obj.children.length; i++){
        TweenMax.to(button.obj.children[i].material, 1, {
            opacity: 1.0,
            delay: unfollowDuration + 0.5
        });
    }
};

/**
 * 隐藏选项
 */
SubMeshPlanet.prototype.hideButton = function(){
    var button = this.button;
    for(var i=0; i<button.obj.children.length; i++){
        TweenMax.to(button.obj.children[i].material, 0.2, {
            opacity: 0.0,
        });
    }
    setTimeout(function(){
        button.obj.visible = false;
    }, 200);
};

/**
 * 爆炸碎片
 * @constructor
 */
var Particle = function(){
    this.prop = {
        speed: Math.random() * 1.2
    };
    var geom = new THREE.TetrahedronGeometry(10, 0);
    var mat = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        shininess: 0,
        specular: 0xffffff,
        shading: THREE.FlatShading
    });
    this.obj = new THREE.Mesh(geom, mat);
};

/**
 * 碎片飞散的方法
 * @param pos 当前这一碎片飞散的位置
 * @param scale 碎片的初始大小
 */
Particle.prototype.explode = function(pos, scale){
    var _this = this;
    var _p = this.obj.parent;
    _this.obj.scale.set(scale, scale, scale);
    var targetX = pos.x + (-1 + Math.random() * 2) * 70;
    var targetY = pos.y + (-1 + Math.random() * 2) * 70;
    TweenMax.to(_this.obj.rotation, shootStep, {
        x: Math.random() * 12,
        y: Math.random() * 12
    });
    TweenMax.to(_this.obj.scale, _this.prop.speed, {
        x: 0.1,
        y: 0.1,
        z: 0.1
    });
    TweenMax.to(_this.obj.position, _this.prop.speed, {
        x: targetX,
        y: targetY,
        ease: Power2.easeOut,
        onComplete: function(){
            if(_p){
                _p.remove(_this.obj);
            }
            particlesPool.unshift(_this);
        }
    })
};

/**
 *
 * 选项文本
 *
 *
 * @param text
 * @constructor
 */
var Button = function(text){
    this.obj = new THREE.Object3D();
    var _this = this;
    this.prop = {
        radius: 1.5,
        fontSize: 3,
        dotHeight: 6
    };

    // 选项图标中的圆点
    var geomC = new THREE.CircleGeometry(_this.prop.radius, 32);
    var matC = new THREE.MeshBasicMaterial({
        color: 0xFCCE5B,
        transparent: true,
        opacity: 0.0
    });
    var meshC = new THREE.Mesh(geomC, matC);
    meshC.position.set(13, _this.prop.dotHeight, 0);
    _this.obj.add(meshC);

    // 连线
    var geomL = new THREE.Geometry();
    geomL.vertices.push(new THREE.Vector3(0, 0, 0));
    geomL.vertices.push(new THREE.Vector3(5, this.prop.dotHeight, 0));
    geomL.vertices.push(new THREE.Vector3(13, this.prop.dotHeight, 0));
    var line = new THREE.Line(geomL, matC);
    _this.obj.add(line);

    // 文字
    var loader = new THREE.FontLoader();
    loader.load('json/droid_sans.json', function(resp){
        var geomT = new THREE.TextGeometry(text, {
            font: resp,
            size: _this.prop.fontSize,
            height: 0
        });
        var matT = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.0
        });

        var meshT = new THREE.Mesh(geomT, matT);
        meshT.position.set(meshC.position.x + _this.prop.radius * 2, _this.prop.dotHeight - _this.prop.radius, 0);
        _this.obj.add(meshT);
    });
};

/**
 * 爆炸管理器
 * @constructor
 */
var ParticlesHolder = function(){
    this.obj = new THREE.Object3D();
};

/**
 * 爆炸管理器
 * @param pos
 * @param density
 * @param scale
 */
ParticlesHolder.prototype.spawnParticles = function(pos, density, scale){
    for(var i=0; i<density; i++){
        var particle;
        if(particlesPool.length){
            particle = particlesPool.pop();
        }else{
            particle = new Particle();
        }
        this.obj.add(particle.obj);
        particle.obj.visible = true;
        particle.obj.position.y = pos.y;
        particle.obj.position.x = pos.x;
        particle.explode(pos, scale);
    }
}

/**
 * 点阵波浪
 * @constructor
 */
var DotWave = function(){
    this.obj = new THREE.Object3D();
    var geomP = new THREE.Geometry();
    geomP.vertices = [new THREE.Vector3(0, 0, 0)];

    // 创建点的材质
    var mat = new THREE.PointsMaterial({
        color: 0x6E6667,
        size: 1,
        opacity: 0.0,
        transparent: true,
        sizeAttenuation: true
    });

    this.prop = {
        amountX: 20,
        amountY: 20,
        seperation: 20,
        duration: 0,
        animating: false
    };

    // 创建点阵
    for(var i=0; i<this.prop.amountX; i++){
        for(var j=0; j<this.prop.amountY; j++){
            var point = new THREE.Points(geomP.clone(), mat.clone());
            point.position.x = i * this.prop.seperation - ((this.prop.amountX * this.prop.seperation) / 2);
            point.position.z = j * this.prop.seperation - ((this.prop.amountX * this.prop.seperation) / 2);
            this.obj.add(point);
        }
    }
};

/**
 * 点阵波浪的动画方法
 */
DotWave.prototype.animate = function(){
    if(!this.prop.animating){
        switch(props.stat){
            case STAT.INIT:
                this.showUp();
                break;
            case STAT.IDLE:
                this.wave();
                break;
        }
    }
};

/**
 * 点阵波浪的显现方法
 */
DotWave.prototype.showUp = function(){
    var _this = this;
    this.prop.animating = true;
    for(var i=0; i<_this.obj.children.length; i++){
        var point = _this.obj.children[i];
        TweenMax.to(point.material, 3, {
            opacity: 1.0,
            ease: Power2.easeOut,
            delay: flyDuration + 2
        })
    }
    this.prop.animating = false;
};

/**
 * 点阵波浪的起伏动画
 */
DotWave.prototype.wave = function(){
    var count = 0;
    var points = this.obj.children;
    for(var i=0; i<this.prop.amountX; i++){
        for(var j=0; j<this.prop.amountY; j++){
            var point = points[count++];
            var val = (Math.sin((i + this.prop.duration) * 0.3)) + (Math.sin((j + this.prop.duration) * 0.5));
            point.position.y = val * 10;
            point.material.size = val * 0.5 < 0.5? 0.5 : val * 0.5;
        }
    }
    this.prop.duration += 0.01;
};


/**
 * 球形天空盒
 * @constructor
 */
var SkySphere = function(){
    var _this = this;
    this.obj = new THREE.Object3D();
    var loader = new THREE.TextureLoader();
    loader.load(
        'img/sky_background.png',
        function (texture){
            var geomS = new THREE.SphereGeometry(1000, 32, 16);
            var matB = new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true,
                opacity: 0.0
            });

            var sky = new THREE.Mesh(geomS.clone(), matB.clone());
            sky.scale.set(-1, 1, 1);
            sky.rotation.y = -Math.PI / 2;
            _this.obj.add(sky);
        }
    );
};

SkySphere.prototype.hide = function(){
    this.obj.children[0].material.opacity = 0.0;
};

SkySphere.prototype.show = function(){
    this.obj.children[0].material.opacity = 1.0;
};