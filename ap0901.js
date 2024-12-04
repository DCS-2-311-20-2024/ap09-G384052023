//
// 応用プログラミング 第9,10回 自由課題 (ap0901.js)
// G384052023 コクセイ
//
"use strict"; // 厳格モード

// ライブラリをモジュールとして読み込む
import * as THREE from "three";
import { GUI } from "ili-gui";
//------------------Base Block
// ３Ｄページ作成関数の定義
function init() {
  // 制御変数の定義
  const param = {
    axes: true, // 座標軸
    follow: true, //camera follow
    score: 0, // points error need fix
    hp: 100,
    mp: 100,
    exp: 0,
    level: 1,
  };

  // GUIコントローラの設定
  const gui = new GUI();
  gui.add(param, "axes").name("座標軸");
  gui.add(param, "score").name("score").listen();
  gui.add(param, "hp").name("HP").listen();
  gui.add(param, "mp").name("MP").listen();
  gui.add(param, "exp").name("EXP").listen();
  gui.add(param, "level").name("Level").listen();
  gui.add({ reset: resetGame }, "reset").name("game reset"); 
  

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
  const cameraOffset = new THREE.Vector3(0, 25, 30);


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
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById("output").appendChild(renderer.domElement);


  // game clock created
  const clock = new THREE.Clock();

  // -----------------------------------------------------enviroment block
  const floorGeometry = new THREE.PlaneGeometry(100, 100);

  const floorMaterial = new THREE.MeshStandardMaterial({
    map: new THREE.TextureLoader().load('chess.webp'),
    side: THREE.DoubleSide 
  });

  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2; 
  floor.position.y = -5;
  floor.receiveShadow = true; 

  scene.add(floor);

  // -----------------------------------------------------charactor Block



  // charactor create
  const Bgeometry = new THREE.BoxGeometry(1,1,1);
  const material = new THREE.MeshPhongMaterial({color: 0xff0000});
  const charactor = new THREE.Mesh(Bgeometry, material);
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
    const speed = 0.25;
    if (keys['ArrowUp']) {
      charactor.position.z -= speed; 
      lastDirection.set(0,0,-1);
    }
    if (keys['ArrowDown']) {
      charactor.position.z += speed; 
      lastDirection.set(0,0,1);
    }
    if (keys['ArrowLeft']) {
      charactor.position.x -= speed; 
      lastDirection.set(-1,0,0);
    }
    if (keys['ArrowRight']) {
      charactor.position.x += speed; 
      lastDirection.set(1,0,0);
    }

    // board check
    if (charactor.position.x>100) charactor.position.x =100;
    if (charactor.position.x<-100) charactor.position.x =-100;
    if (charactor.position.z>100) charactor.position.z =100;
    if (charactor.position.z<-100) charactor.position.z =-100;
    

  }


  // -----------------------------skills&items Block

  // bullet attack
  function Shoot(){
    const bullet = new THREE.Mesh(
      new THREE.BoxGeometry(0.2,0.2,0.2),
      new THREE.MeshBasicMaterial({color : 0xffffff})
    );
    bullet.position.copy(charactor.position);
    bullet.velocity = lastDirection.clone().multiplyScalar(0.35);
    bullets.push(bullet);
    scene.add(bullet);
  }

  // Beeeeeeeam
  function Beam() {
    if(param.mp>=5) {
      param.mp -= 5;
      const beam = new THREE.Mesh(
        new THREE.BoxGeometry(10,10,10),
        new THREE.MeshBasicMaterial({color:0xffffff})
      );
      beam.position.copy(charactor.position);
      beam.quaternion.copy(charactor.quaternion);
      beam.velocity = lastDirection.clone().multiplyScalar(10);
      beam.lifetime = 3;
      beam.elapsedTime = 0;
      beams.push(beam);
      scene.add(beam);
    }
  }

  // Dash
  function Dash() {

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
          param.hp +=10;
        } else if (item.type === "mp"){
          param.mp +=10;
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








  // -----------------------------------------------------enemy Block


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

  // spawn enemy
  function spawnEnemies() {
    if (param.score >= 100) {
      clearInterval(enemySpawnInterval);  // score=100 stop creating
      alert("Victory! You have reached 100 points!");
      return;
    }

    const numEnemies = Math.floor(Math.random() * 10) + 1;  
    for (let i = 0; i < numEnemies; i++) {
      const randomTargetIndex = Math.floor(Math.random() * targetPositions.length);
      const pos = targetPositions[randomTargetIndex];

      const enemy = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 32, 32),
        new THREE.MeshLambertMaterial({ color: Math.random() > 0.5 ? 0x0000ff : 0xffff00 })
      );
      enemy.position.set(pos.x, pos.y, pos.z);
      enemy.speed = 0.05;
      scene.add(enemy);
      enemies.push(enemy);
    }
  }

  const enemySpawnInterval = setInterval(spawnEnemies, 10000);

  // enemy movement
  function moveEnemies() {
    for(const enemy of enemies){
      const direction = new THREE.Vector3();
      direction.subVectors(charactor.position, enemy.position).normalize();
      enemy.position.add(direction.multiplyScalar(enemy.speed));
    }
  }


  // -----------------------------------------------------action Block

  // hit detection
  function checkHit(){
    // enemy hited
    for(const enemy of enemies){
      if (charactor.position.distanceTo(enemy.position)<1){
        param.hp -=1;
        if (param.hp<=0){
          alert("game over!");
          resetGame();
        }
      }
    }

    // bullet hit
    for (const bullet of bullets) {

      // target hits
      for (let i = targets.length - 1; i >= 0; i--) {
        const target = targets[i];
        if (bullet.position.distanceTo(target.position) < 1) {
          param.score += 1;
          param.scene += 1;

          scene.remove(bullet);
          bullets.splice(bullets.indexOf(bullet),1);
        }
      }
      // enemy hits
      for (const enemy of enemies){
        if (bullet.position.distanceTo(enemy.position)<1){
          scene.remove(enemy);
          enemies.splice(enemies.indexOf(enemy),1);

          param.exp +=1;
          param.score +=1;
          if(Math.random()<0.5){
            dropItem(enemy.position);
          }
          scene.remove(bullet);
          bullets.splice(bullets.indexOf(bullet),1);
          break;
        }
      }

    }

    // beam hit
    for (const beam of beams) {
      const beamBox = new THREE.Box3().setFromObject(beam);

      for (let j = enemies.length - 1; j >= 0; j--) {
        const enemy = enemies[j];
        if (beamBox.containsPoint(enemy.position)) {
          scene.remove(enemy);
          enemies.splice(j, 1);

          param.exp += 1;
          param.score +=1;
          if (Math.random() < 0.5) {
            dropItem(enemy.position);
          }
        }
      }
    }

    

  }





  // ----------------Block movement

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
    moveEnemies();  


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
    for (let i = beams.length - 1; i >= 0; i--) {
      const beam = beams[i];
      beam.position.add(beam.velocity.clone().multiplyScalar(delta));

      beam.elapsedTime += delta;

      if (beam.elapsedTime >= beam.lifetime * 0.8) {
        const opacity = 1 - (beam.elapsedTime - beam.lifetime * 0.8) / (beam.lifetime * 0.2);
        beam.material.opacity = Math.max(0, opacity);
        beam.material.transparent = true;
      }

      if (beam.elapsedTime >= beam.lifetime) {
        scene.remove(beam);
        beams.splice(i, 1);
      }
    }




    // hit detect
    checkHit();

    // level check
    checkLevelUp();





    // camera follow
    if (param.follow) {
      camera.position.copy(charactor.position).add(cameraOffset);
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

  // ---------------------Block Anime
  // 描画開始
  render();

  // reset
  function resetGame() {
    charactor.position.set(0,0,0);
    param.score = 0;
    param.hp = 100;
    param.mp = 100;
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
    if(event.key === 'a' || event.key === 'A'){
      Shoot();
    }
    if(event.key === 's' || event.key === 'S'){
      Beam();
    }
    if(event.key === 'q' || event.key === 'Q'){
      Dash();
    }
  });



}

init();
