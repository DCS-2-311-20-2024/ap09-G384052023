//
// 応用プログラミング 第9,10回 自由課題 (ap0901.js)
// G384052023 コクセイ
//
"use strict"; // 厳格モード

// ライブラリをモジュールとして読み込む
import * as THREE from "three";
import { GUI } from "ili-gui";

// ３Ｄページ作成関数の定義
function init() {
  // 制御変数の定義
  const param = {
    axes: true, // 座標軸
    follow: true, //camera follow
    score: 0, // points
    hp: 100,
    mp: 100,
    exp: 0,
    level: 1,
  };

  // GUIコントローラの設定
  const gui = new GUI();
  gui.add(param, "axes").name("座標軸");
  gui.add(param, "follow").name("follow");
  gui.add(param, "score").name("points").listen();
  gui.add(param, "hp").name("HP").listen();
  gui.add(param, "mp").name("MP").listen();
  gui.add(param, "exp").name("EXP").listen();
  gui.add(param, "level").name("Level").listen();
  gui.add({ reset: restGame }, "reset").name("game reset"); 
  

  // シーン作成
  const scene = new THREE.Scene();

  // 座標軸の設定
  const axes = new THREE.AxesHelper(18);
  scene.add(axes);

  // カメラの作成
  const camera = new THREE.PerspectiveCamera(
    50, window.innerWidth/window.innerHeight, 0.1, 1000);
  camera.position.set(1,50,15);
  camera.lookAt(0,0,0);


  // 光源の設定
  { // 環境ライト
    const light = new THREE.AmbientLight();
    light.intensity=0.9;
    scene.add(light);
  }
  { // ポイントライト
    const light = new THREE.PointLight(0xffffff, 500);
    light.position.set(0, 20, 0);
    scene.add(light);
  }


  // レンダラの設定
  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, innerHeight);
  document.getElementById("output").appendChild(renderer.domElement);


  // game clock created
  const clock = new THREE.Clock();


  // plane create
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(1000, 1000),
    new THREE.MeshLambertMaterial({ color: 0x404040 }));
  plane.rotation.x = -Math.PI / 2;
  plane.position.y = -5;
  scene.add(plane);


  // -----------------------------------------------------charactor



  // charactor create
  const getmetry = new THREE.BoxGeometry(1,1,1);
  const material = new THREE.MeshPhongMaterial({color: 0xff0000});
  const charactor = new THREE.Mesh(getmetry, material);
  scene.add(charactor);

  // bullets
  const bullets = [];
  // beeeeeeeam
  const beams = [];

  // player control
  let keys = {};
  window.addEventListener('keydown',(event) =>{
    keys[event.key] = true;
  });
  window.addEventListener('keyup',(event)=>{
    keys[event.key] = false;
  });

  //movement
  let lastDirection = new THREE.Vector3(0,0,0);
  
  function movement() {
    const speed = 0.1;
    if (keys['ArrowUp']) {charactor.position.z -= speed; lastDirection.set(0,0,-1);}
    if (keys['ArrowDown']) {charactor.position.z += speed; lastDirection.set(0,0,1);}
    if (keys['ArrowLeft']) {charactor.position.x -= speed; lastDirection.set(-1,0,0);}
    if (keys['ArrowRight']) {charactor.position.x += speed; lastDirection.set(1,0,0);}

    // board check
    if (charactor.position.x>50) charactor.position.x =50;
    if (charactor.position.x<-50) charactor.position.x =-50;
    if (charactor.position.z>50) charactor.position.z =50;
    if (charactor.position.z<-50) charactor.position.z =-50;
    

  }


  // skills create

  // bullet attack
  function Shoot(){
    const bullet = new THREE.Mesh(
      new THREE.BoxGeometry(0.2,0.2,0.2),
      new THREE.MeshBasicMaterial({color : 0xffffff})
    );
    bullet.position.copy(charactor.position);
    bullet.velocity = lastDirection.clone().multiplyScalar(0.1);
    bullets.push(bullet);
    scene.add(bullet);
  }

  // Beeeeeeeam
  function Beam() {
    if(param.mp>=5) {
      param.mp -= 5;
      const beam = new THREE.Mesh(
        new THREE.BoxGeometry(0.2,0.2,10),
        new THREE.MeshBasicMaterial({color:0xffffff})
      );
      beam.position.copy(charactor.position);
      beam.position.z +=5;
      beam.velocity = lastDirection.clone().multiplyScalar(1);
      beam.lifetime = 3;
      beam.elpsedTime = 0;
      beams.push(beam);
      scene.add(beam);
    }
  }





  // Item drop
  function dropItem(position){
    const item = new THREE.Mesh(
      new THREE.SphereGeometry(0.5,32,32),
      new THREE.MeshBasicMaterial({color: Math.random()>0.5 ? 0xff0000:0x0000ff})
    );
    item.position.copy(position);
    item.type = Math.random()>0.5 ? "hp" : "mp" ;
    scene.add(item);
    setTimeout(() => {scene.remove(item);
    },10000);  // time that items stay on ground.
  }

  // Item pickup
  function pickupItems() {
    const items = scene.children.filter(child => child.type === "hp" || child.type === "mp");
    for (const item of items) {
      if (charactor.position.distanceTo(item.position)<1){
        if(item.type === "hp"){
          param.hp +=1;
        } else if (item.type === "mp"){
          param.mp +=1;
        }
        scene.remove(item);
      }
    }

  }

  // solo level up
  function checkLevelUp() {
    while (param.exp >= param.level * 10) {
      param.exp -= param.level * 10;
      param.level += 1;
      param.hp += 5; 
      param.mp += 5; 
    }
  }

  // auto hp recover
  function autoHeal(){
    setInterval(() => {
      if(param.hp<100) {
        param.hp +=1 ;
      }
    },10000); // cool down needs 10s
  }








  // -----------------------------------------------------enemy


  // targets create
  const targetPositions = [
    {x:50,y:0,z:0},
    {x:-50,y:0,z:0},
    {x:0,y:0,z:50},
    {x:0,y:0,z:-50},
  ];
  const targets=[];
  for(const pos of targetPositions){
    const target = new THREE.Mesh(new THREE.SphereGeometry(0.5,32,32), new THREE.MeshLambertMaterial({color: 0x00ff00}));
    target.position.set(pos.x,pos.y,pos.z);
    scene.add(target);
    targets.push(target);
  }

  // enemy create
  const enemyPositions = [
    {x:20,y:0,z:0},
    {x:-20,y:0,z:0},
    {x:0,y:0,z:20},
    {x:0,y:0,z:-20},
  ];
  const enemies = [];
  for (const pos of enemyPositions){
    const enemy = new THREE.Mesh(
      new THREE.SphereGeometry(0.5,32,32),
      new THREE.MeshLambertMaterial({color: Math.random() > 0.5 ? 0x0000ff : 0xffff00})
    );
    enemy.position.set(pos.x,pos.y,pos.z);
    enemy.speed = 0.05;
    scene.add(enemy);
    enemies.push(enemy);
  }

  // enemy movement
  function moveEnemies() {
    for(const enemy of enemies){
      const direction = new THREE.Vector3();
      direction.subVectors(charactor.position, enemy.position).normalize();
      enemy.position.add(direction.multiplyScalar(enemy.speed));
    }
  }


  // -----------------------------------------------------action

  // hit detection
  function checkhit(){
    // enemy 
    for(const enemy of enemies){
      if (charactor.position.distanceTo(enemy.position)<1){
        param.hp -=1;
        if (param.hp<=0){
          alert("game over!");
          restGame();
        }
      }
    }

    // bullet
    for (const bullet of bullets) {
      for (const enemy of enemies){
        if (bullet.position.distanceTo(enemy.position)<1){
          scene.remove(enemy);

          enemies.splice(enemies.indexOf(enemy),1);

          param.exp +=1;
          if(Math.random<0.5){
            dropItem(enemy.position);
          }
          scene.remove(bullet);
          bullets.splice(bullets.indexOf(bullet),1);
          break;
        }
      }
    }

    // beam
    for (const beam of beams){
      for (const enemy of enemies){
        if(beam.position.distanceTo(enemy.position)<1){
          scene.remove(enemy);
          enemies.splice(enemies.indexOf(enemy),1);
          param.exp +=1;
          if(Math.random<0.5){
            dropItem(enemy.position);
          }
          scene.remove(beam);
          beams.splice(bullets.indexOf(beam),1);
          break;
        }
      }
    }

  }



  // points check
  for (let i = 0; i<targets.length; i++){
    if(charactor.position.distanceTo(targets[i].position)<1){
      scene.remove(targets[i]);
      targets.splice(i,1);
      param.scene++;
    }
  }







  // 描画処理
  const charactorPosition = new THREE.Vector3();
  const cameraPosition = new THREE.Vector3();


  // 描画関数
  function render() {
    const delta = clock.getDelta();
    
    // 座標軸の表示
    axes.visible = param.axes;
    // move
    movement();
    // enemy move
    moveEnemies();  // check point


    // pick items
    pickupItems();
    // bullet move
    for(const bullet of bullets) {
      bullet.position.add(bullet.velocity);
      if(bullet.position.distanceTo(charactor.position)>100){
        scene.remove(bullet);
        bullets.splice(bullets.indexOf(bullet),1);
      }
    }

    // beam move
    for(const beam of beams) {
      beam.position.add(beam.velocity);
      beam.elapsedTime += delta;
      if(beam.elapsedTime >= beam.lifetime) {
        scene.remove(beam);
        beams.splice(beams.indexOf(beam),1);
      }
    }

    // hit detect
    checkhit();

    // level check
    checkLevelUp();





    // camera follow
    if (param.follow) {
      camera.lookAt(charactor.position);
      camera.up.set(0,1,0);
    } 
    // 描画
    renderer.render(scene, camera);
    // 次のフレームでの描画要請
    requestAnimationFrame(render);
  }

  // start auto recover
  autoHeal();


  // 描画開始
  render();

  // reset
  function restGame() {
    charactor.position.set(0,0,0);
    param.score = 0;
    param.hp = 10;
    param.mp = 10;
    param.exp = 0;
    param.level = 1;

    for(const target of targets) {
      scene.remove(target);
    }
    targets.length = 0;
    for (const pos of targetPositions) {
      const target = new THREE.Mesh(new THREE.SphereGeometry(0.5,32,32), new THREE.MeshLambertMaterial({color:0x00ff00}));
      target.position.set(pos.x,pos.y,pos.z);
      scene.add(target);
      targets.push(target);
    }
    for (const enemy of enemies) {
      scene.remove(enemy);
    }
    enemies.length = 0;
    for (const pos of enemyPositions) {
      const enemy = new THREE.Mesh(
        new THREE.SphereGeometry(0.5,32,32),
        new THREE.MeshLambertMaterial({ color: Math.random() > 0.5 ? 0x0000ff : 0xffff00 })
      );
      enemy.position.set(pos.x,pos.y,pos.z);
      enemy.speed = 0.05;
      scene.add(enemy);
      enemies.push(enemy);
    }
  }

  // key event
  window.addEventListener('keydown',(event)=>{
    if(event.key === 'a' || event.key ==='A'){
      Shoot();
    }
    if(event.key === 's' || event.key === 'S'){
      Beam();
    }
  });



}

init();