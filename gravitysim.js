p5.disableFriendlyErrors = true;
let mouse1X, mouse1Y;
let realMouseX;
let realMouseY;
let gridX = 0;
let gridY = 0;
let a, v, i, j, vR;
let selectedBody, followedBody;
let dt = 0;
let speedEl = 50;
let gravityEl = 1;
let currentBody = 0;
let mouseispressed = false;
let clickedCanvas = false;
let menuDisplayed = false;
let randColor = function(){
  return color(random(100, 255), random(100, 255), random(100, 255));
}
let myCanvas = document.getElementById("myCanvas");
let ctx = myCanvas.getContext("2d");
let bodyMenu = document.getElementById("body-menu") 
// object deciding properties of a new body
const bodyProperties = {
  x: 0,
  y: 0,
  size: 3,
  color: 0, 
  vector: 0
};

const space = {
  x: 0,
  y: 0,
  scale: 1,
  gravity: 0.002 * gravityEl,
  speed: 5 * speedEl * dt,
  pov: "absolute",
  collisionMode: "bounce",
  paused: false
};
// body constructor 
const bodies = [];
class Body {
    constructor(x, y, size, color, vector, pastPositions, relativeTrail) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.color = color;
        this.vector = vector;
        this.pastPositions = pastPositions;
        this.relativeTrail = relativeTrail;
        this.layer = 0;
        this.mass = 4 * PI * Math.pow(this.size / 2, 3) / 3;
    }


    break(body2) {
        v = ((this.vector.mult(this.mass)).add(body2.vector.mult(body2.mass))).div(this.mass + body2.mass);
        function shatter(body) {
            a = 0;
            while (a < body.mass / 2) {
                bodies.push(new Body(random(body.x - body.size, body.x + body.size), random(body.y - body.size, body.y + body.size), random(body.size / 1.5, body.size / 3), body.color, p5.Vector.add(v, createVector(random(-body.size, body.size) / 100, random(-body.size, body.size) / 100)), [], []));
                a += bodies[bodies.length - 1].mass;
                bodies[bodies.length - 1].layer = body.layer;
                bodies[bodies.length - 1].layer++;
            }
        }
        shatter(this);
        shatter(body2);
        deleteBody(bodies.indexOf(this));
        deleteBody(bodies.indexOf(body2));
    }
// code for simulating an elastic colision between two bodies
    bounce(body2) {
        let theta = Math.atan2(-(body2.y - this.y), body2.x - this.x);
        let relativeVector = p5.Vector.sub(this.vector, body2.vector);
        let theta2 = -relativeVector.heading();
        if (body2.size > this.size) {
            v = createVector(((2 * body2.mass) / (this.mass + body2.mass)) * relativeVector.mag() * Math.cos(theta - theta2) * Math.cos(theta), ((2 * body2.mass) / (this.mass + body2.mass)) * -relativeVector.mag() * Math.cos(theta - theta2) * Math.sin(theta));
            body2.vector.add(p5.Vector.mult(v, this.mass / body2.mass));
            this.vector.sub(v);
        } else {
            v = createVector(((2 * this.mass) / (this.mass + body2.mass)) * relativeVector.mag() * Math.cos(theta - theta2) * Math.cos(theta), ((2 * this.mass) / (this.mass + body2.mass)) * -relativeVector.mag() * Math.cos(theta - theta2) * Math.sin(theta));
            body2.vector.add(v);
            this.vector.sub(p5.Vector.mult(v, body2.mass / this.mass));
        }
    }

    offMap() {

        if (this.x < -40000 || this.x > 40000 || this.y < -40000 || this.y > 40000) {
            return true;
        }

    }

    addMass(target) {
        this.size = Math.cbrt(6 * (this.mass + target.mass) / PI);
    }

    collision(target) {
        if (dist(this.x, this.y, target.x, target.y) < (this.size / 2 + target.size / 2) * 1) {
            return true;
        }
    }

    move() {
        this.x += space.speed * this.vector.x;
        this.y += space.speed * this.vector.y;
    }

    draw() {
        noStroke();
        fill(this.color);
        ellipse(this.x, this.y, this.size);
    }
}
function deleteBody (location){
  bodies.splice(location, 1)
  if (followedBody > location) {
    followedBody--;
  } else if (followedBody === location){
    followedBody = null;
  }
  if (bodyMenu.style.display === "grid"){
    if (selectedBody > location){
      selectedBody--;
      document.querySelector("#body-menu h2").innerHTML = "Body #" + (selectedBody + 1);
    } else if (selectedBody === location){
      bodyMenu.style.display = "none";
    }    
  }
  location--;
}
// functions which set coordinates in the original/translated planes
let original = function(x, y){
  return {x: (x-width/2) / space.scale - space.x / space.scale,
         y: (y-height/2) / space.scale - space.y / space.scale}
}
let translated = function(x, y){
  return {x: space.scale*(x + space.x/space.scale) + width/2,
         y: space.scale*(y + space.y/space.scale) + height/2}
}  
let inCanvas = function(x, y){
  if (x >= 0 && x <= width && y >= 0 && y <= height){
    return true;
  }
}
function followingBody(){
  if (typeof followedBody === "number"){
    return true;
  } else {
    return false;
  }
}

function clearTrails(){
  for (i in bodies){
    bodies[i].pastPositions.splice(0, bodies[i].length)
  }
}
function windowResized() {
  resizeCanvas(windowWidth, windowHeight-28);
}

function setup() {  
  createCanvas(windowWidth, windowHeight-28, myCanvas);
  frameRate(60);
  console.log(width, height)
// setting up event listeners for user interaction

// body menu on right click  
    
  let followButton = document.getElementById("follow-body")
  myCanvas.addEventListener("contextmenu", (event) => {
    event.preventDefault()
    for (i = 0; i < bodies.length; i++){
        if (dist(realMouseX, realMouseY, bodies[i].pastPositions[0][0], bodies[i].pastPositions[0][1]) < bodies[i].size/2){
          if (followingBody()){
            if (followedBody === i){
              followButton.innerHTML = "Unfollow";
            } else {
              followButton.innerHTML = "Follow";
            }
          } else {
            followButton.innerHTML = "Follow";
          }
          bodyMenu.style.display = "grid";            
          bodyMenu.style.left = event.pageX + "px";                 
          bodyMenu.style.top = event.pageY + "px";
          selectedBody = i;
          document.querySelector("#body-menu h2").innerHTML = "Body #" + (i + 1);
          menuDisplayed = true;
        }
      }
  });
  
  document.body.addEventListener("click", function(e){
    if (menuDisplayed){
      let contextMenus = document.getElementsByClassName("context-menu");
      for (i = 0; i < contextMenus.length; i++){
        contextMenus[i].style.display = "none";
      }
      menuDisplayed = false;      
    }      
  })
  
  followButton.addEventListener("click", () => {
    if (followButton.innerHTML === "Follow"){
      followedBody = selectedBody;                
    } else {
      followedBody = null;
    }  
        
  });
  
  document.getElementById("delete-body").addEventListener("click", () => {
    deleteBody(selectedBody)
        
    
  }); 
  
// initialize & release bodies  
  
  myCanvas.addEventListener("mousedown", function initiateBody(e){
    if (e.buttons === 1 && menuDisplayed === false){
      mouse1X = realMouseX;
      mouse1Y = realMouseY;  
      mouseispressed = true;
      clickedCanvas = true;
    }
  });
  document.body.addEventListener("mouseup", function releaseBody(){
    if (clickedCanvas){
      bodies.push(new Body (bodyProperties.x, bodyProperties.y, bodyProperties.size, bodyProperties.color, createVector((mouse1X-realMouseX)*0.02, (mouse1Y-realMouseY)*0.02), [], []));
    }    
    mouseispressed = false;
    clickedCanvas = false;
  });
  
// zoom
  
  myCanvas.addEventListener("wheel", function zoom(event) { 
    v = createVector(width/2 - translated(0).x, height/2 - translated(0, 0).y);
    if (event.deltaY > 0) {
      v.mult(1/10);
      space.scale*=0.9;
      space.x += v.x;
      space.y += v.y;
    } else {
      v.mult(1/9);
      space.scale/=0.9;
      space.x -= v.x;
      space.y -= v.y;  
    }      
  });

// infobar buttons  
  
  let povButtons = document.querySelectorAll(".pov");
  function changePov(){
    document.getElementById(space.pov).style.color = "rgb(167,167,167)";
    document.getElementById(space.pov).style.backgroundColor = "rgb(30, 30, 30)";
    space.pov = this.id;
    this.style.color = "azure";
    this.style.backgroundColor = "rgb(112, 121, 128)";
  }
  for (i = 0; i < povButtons.length; i++){
    povButtons[i].addEventListener("click", changePov);
  }

  let collisionButtons = document.querySelectorAll(".collision-mode");
  function changeCollisionMode(){
    document.getElementById(space.collisionMode).style.color = "rgb(167,167,167)";
    document.getElementById(space.collisionMode).style.backgroundColor = "rgb(30, 30, 30)";
    space.collisionMode = this.id  
    this.style.color = "azure";
    this.style.backgroundColor = "rgb(112, 121, 128)";
  }
  for (i = 0; i < collisionButtons.length; i++){
    collisionButtons[i].addEventListener("click", changeCollisionMode);
  }
 
// left side buttons  
  
  let pauseButton = document.getElementById("pause");
  pauseButton.addEventListener("click", function(){
    if (space.paused === false){
      document.getElementById("pause-icon").style.display = "none";
      document.getElementById("start-icon").style.display = "inline";
      space.paused = true;
    } else {
      document.getElementById("pause-icon").style.display = "inline";
      document.getElementById("start-icon").style.display = "none";
      space.paused = false;
    }
  })
  
  let restartButton = document.getElementById("reset");
  restartButton.addEventListener("click", function(){
    bodies.splice(0, bodies.length);
    space.scale = 1;
    space.x = 0;
    space.y = 0; 
    followedBody = null;
  })
  
  let helpButton = document.getElementById("help");
  let helpMenu = document.getElementById("help-menu");
  helpMenu.style.display = "none"
  helpButton.addEventListener("click", function(){
    if (helpMenu.style.display === "none"){
      helpMenu.style.display = "block";
    } else {
      helpMenu.style.display = "none";
    }
  });
}
function draw() {
  
  background(0, 12, 26);
  dt = deltaTime/(50/3)  
// setting mouse coordinates in the original coordinate system
  realMouseX = original(mouseX, mouseY).x
  realMouseY = original(mouseX, mouseY).y  
  push();
  translate(width/2, height/2);
  scale(space.scale);
  translate(space.x/space.scale, space.y/space.scale);
  bodyProperties.x = realMouseX;
  bodyProperties.y = realMouseY;
  bodyProperties.color = randColor();
  

// collision checks for each collision mode  
// loop through each pair of bodies  
  for (i = 0; i < bodies.length; i++){
    for (j = i + 1; j < bodies.length; j++){
      if (bodies[i].collision(bodies[j])){
        // if two bodies overlap, repel them so that they are tangent
        let targetdist = bodies[i].size/2 + bodies[j].size/2;
        let distdiff = targetdist - dist(bodies[i].x, bodies[i].y, bodies[j].x, bodies[j].y);
        let theta = Math.atan2(-(bodies[j].y - bodies[i].y), bodies[j].x - bodies[i].x);
        v = createVector(distdiff*Math.cos(theta), distdiff*-Math.sin(theta))
        bodies[j].x += v.x * (bodies[i].mass/(bodies[i].mass+bodies[j].mass))
        bodies[j].y += v.y * (bodies[i].mass/(bodies[i].mass+bodies[j].mass))
        bodies[i].x -= v.x * (bodies[j].mass/(bodies[i].mass+bodies[j].mass))
        bodies[i].y -= v.y * (bodies[j].mass/(bodies[i].mass+bodies[j].mass))
        switch (space.collisionMode){
          case "add":              
            if (bodies[i].size > bodies[j].size){
              bodies[i].addMass(bodies[j]);
              deleteBody(j);
              
            } else {
              bodies[j].addMass(bodies[i]);
              deleteBody(i);
              j += 1000;
            }
            break;
          case "break":
            if (bodies[i].size > 1.7*bodies[j].size){
              bodies[i].addMass(bodies[j]);
              deleteBody(j);
              
            } else if (bodies[j].size > 1.7*bodies[i].size){
              bodies[j].addMass(bodies[i]);
              deleteBody(i);
              j += 1000;
            } else {
              if (bodies[i].layer <= 2 && bodies[j].layer <= 2){
                bodies[i].break(bodies[j]);  
              } else if (bodies[i].size > bodies[j].size){
                bodies[i].addMass(bodies[j]);
                deleteBody(j);
              } else {
                bodies[j].addMass(bodies[i]);
                deleteBody(i);
                j += 1000;
              }
              
              
            }

            break;
          case "bounce":
            bodies[i].bounce(bodies[j]);
            continue;
        }
      }
    }
    bodies[i].mass = 4*PI*Math.pow(bodies[i].size/2, 3)/3;
  }
  

  for (i = 0; i < bodies.length; i++){
    if (bodies[i].offMap()){
      deleteBody(i);
      continue;
    }
    for (j = 0; j < bodies.length; j++){      
      if (space.paused === false && i !== j){
// gravity vectors        
        if (bodies[j].size > bodies[i].size/10){
        v = createVector(bodies[j].x - bodies[i].x, bodies[j].y - bodies[i].y)
        v = v.div(v.mag());
        bodies[i].vector = bodies[i].vector.add(v.mult((space.gravity*bodies[j].mass*space.speed)/sq(dist(bodies[i].x, bodies[i].y, bodies[j].x, bodies[j].y))));
        }                
      }
    }    
  }
  
  // draw grid
  
  if (space.pov === "relative" && followingBody()){
    gridX = bodies[followedBody].x % 80;
    gridY = bodies[followedBody].y % 80;    
  } else {
    gridX = 0;
    gridY = 0;
  }
  
  for (let i = -40000 + gridX; i < 40000; i+=800){
    strokeWeight(8);
    stroke("white");
    line(i, -40000, i, 40000);
  }
  for (let j = -40000 + gridY; j < 40000; j+=800){
    strokeWeight(8);
    stroke("white");
    line(-40000, j, 40000, j);
  }  
  
// draw & animate bodies
  for (i = 0; i < bodies.length; i++){    
    bodies[i].draw();
    if (space.paused === false){
      bodies[i].move();
      if (space.pov === "absolute"){
        bodies[i].pastPositions.unshift([bodies[i].x, bodies[i].y]);  
      } else {
        a = translated(bodies[i].x, bodies[i].y)
        bodies[i].relativeTrail.unshift([bodies[i].x, bodies[i].y]); 
      }
      
    }
    
    for (j = 1; j < bodies[i].pastPositions.length - 1; j++){
      stroke(bodies[i].color);
      strokeWeight(bodies[i].size/10);
      if (space.pov === "relative" && followingBody()){        
        line(bodies[i].pastPositions[j][0] , bodies[i].pastPositions[j][1], bodies[i].pastPositions[j+1][0], bodies[i].pastPositions[j+1][1]);
      } else {
        line(bodies[i].pastPositions[j][0] , bodies[i].pastPositions[j][1], bodies[i].pastPositions[j+1][0], bodies[i].pastPositions[j+1][1]);
      }      
    
    }
     if (bodies[i].pastPositions.length > frameRate() - 20){       
      bodies[i].pastPositions.pop();
     }    
  }
  
  if (mouseispressed){
// drawing new body    
    strokeWeight(1/space.scale);
    stroke("white");
    noFill();
    ellipse(mouse1X, mouse1Y, bodyProperties.size);
    fill("white");
    ellipse(realMouseX, realMouseY, bodyProperties.size);
    line (mouse1X, mouse1Y, realMouseX, realMouseY);
    bodyProperties.size += 0.4*dt/space.scale;
  } else {
    bodyProperties.size = 3/space.scale;
  }
// panning
  if (!followingBody() || space.paused){
    if (keyIsPressed){
      if (keyIsDown(87) || keyIsDown(38)){
        space.y += 8*dt;
      }
      if (keyIsDown(83) || keyIsDown(40)){
        space.y -= 8*dt;
      }
      if (keyIsDown(65) || keyIsDown(37)){
        space.x += 8*dt;
      }
      if (keyIsDown(68) || keyIsDown(39)){
        space.x -= 8*dt;
      } 
    }     
  }
  
  if (followingBody() && !space.paused){
    a = translated(bodies[followedBody].x, bodies[followedBody].y);
    v = createVector(width/2 - a.x, height/2 - a.y);
    space.x += v.x;
    space.y += v.y;
  } 
  
  
  pop();
  
  document.getElementById("zoom").innerHTML = Math.round(space.scale*1000)/1000
  document.getElementById("bodies").innerHTML = bodies.length
  
  speedEl = Number(document.getElementById("speed-slider").value)/40;
  document.getElementById("speed-label").innerHTML = "Speed: " + Math.round(speedEl*40)
  space.speed = 5 * speedEl * dt;
  gravityEl = Number(document.getElementById("gravity-slider").value)/4
  if ((gravityEl*4) % 1 === 0){
    document.getElementById("gravity-label").innerHTML = "Gravity: " + (gravityEl*4) + ".0";
  } else {
    document.getElementById("gravity-label").innerHTML = "Gravity: " + (gravityEl*4);
  }
  space.gravity = 0.016 * gravityEl;
}
setInterval(function(){
  document.getElementById("fps").innerHTML = Math.round(60 / dt);
}, 500)

setInterval(function(){
  for (i in bodies){
    if (bodies[i].layer > 0){
      bodies[i].layer--;
    }    
  }
}, 5000)
