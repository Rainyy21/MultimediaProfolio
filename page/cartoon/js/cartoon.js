const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");

ctx.fillStyle = "#87CEEB";
ctx.fillRect(0,0,canvas.width, canvas.height);

//substring
ctx.beginPath();
ctx.arc(700, 100, 50, 0, Math.PI * 2);
ctx.fillStyle = "yellow";
ctx.fill();
ctx.stroke();

//ground
ctx.fillStyle = "#228B22";
ctx.fillRect(0, 350 , canvas.width,150);

//house base
ctx.fillStyle = "#CD853F";
ctx.fillRect(250,220,300,150);
ctx.strokeRect(250, 220, 300, 150);

//roof
ctx.beginPath();
ctx.moveTo(230, 220);
ctx.lineTo(400, 150);
ctx.lineTo(570, 220);
ctx.closePath();
ctx.fillStyle = "#8B0000";
ctx.fill();
ctx.stroke();


//door
ctx.fillStyle = "#654321";
ctx.fillRect(375,280, 50,90);
ctx.strokeRect(375,280,50,90);

//window
ctx.fillStyle = "#ADD8E6";

ctx.fillRect(290,250,60,50);
ctx.strokeRect(290,250,60,50);

ctx.fillRect(450,250,60,50);
ctx.strokeRect(450,250,60,50);

//grass
ctx.save();
ctx.translate(0, 350);

for(let i = 0 ; i<40 ; i++ ){
  ctx.beginPath();
  ctx.moveTo(0,0);
  ctx.lineTo(5,-20);
  ctx.lineTo(10,0);
  ctx.strokeStyle = "darkgreen";
  if(i< 13 || i> 27){
    ctx.stroke();
  }
  ctx.translate(20, 0);
}
ctx.restore;

ctx.save();
ctx.translate(10, 365);
for(let i = 0 ; i<40 ; i++ ){
  ctx.beginPath();
  ctx.moveTo(0,0);
  ctx.lineTo(5,-15);
  ctx.lineTo(10,0);
  ctx.strokeStyle = "green";
  if(i< 13 || i> 27){
    ctx.stroke();
  }
  ctx.translate(20, 0);
}

ctx.restore();

