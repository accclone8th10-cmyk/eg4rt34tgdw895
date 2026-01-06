const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// --- DATA ---
const BASE_RATE = 10;
const LINH_CAN_MULT = 1.7; // Thiên Linh Căn
const realms = [
  { name: "Luyện Khí", need: 100, absorb: 1.0, color: "#4facfe" },
  { name: "Trúc Cơ", need: 500, absorb: 1.3, color: "#00ff88" },
  { name: "Kim Đan", need: 2000, absorb: 1.8, color: "#f6d365" }
];

let player = {
  x: window.innerWidth / 2,
  y: window.innerHeight / 2,
  size: 36,
  speed: 200,
  linhKhi: 0,
  realm: 0,
  angle: 0,
  state: "idle" // idle | move | cultivate
};

// --- INPUT SYSTEM ---
const keys = {};
window.addEventListener("keydown", e => {
    keys[e.key.toLowerCase()] = true;
    if (e.code === "Space") tryBreakthrough();
});
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);
canvas.addEventListener("mousedown", () => player.state = "cultivate");

// --- LOGIC ---
function update(dt) {
  // 1. Xử lý di chuyển
  let dx = 0, dy = 0;
  if (keys["w"]) dy--; if (keys["s"]) dy++;
  if (keys["a"]) dx--; if (keys["d"]) dx++;

  if (dx !== 0 || dy !== 0) {
    const len = Math.hypot(dx, dy);
    player.x += (dx / len) * player.speed * dt;
    player.y += (dy / len) * player.speed * dt;
    player.state = "move";
  } else if (player.state !== "cultivate") {
    player.state = "idle";
  }

  // 2. Tu luyện
  const realm = realms[player.realm] || realms[realms.length-1];
  let currentGain = 0;
  
  if (player.state === "cultivate") {
    currentGain = BASE_RATE * LINH_CAN_MULT * realm.absorb * 2; // Bonus x2 khi ngồi thiền
  } else {
    currentGain = BASE_RATE * LINH_CAN_MULT * realm.absorb * 0.2; // Tu bị động rất chậm khi đi lại
  }
  
  player.linhKhi += dt * currentGain;
  player.angle += dt * (player.state === "cultivate" ? 3 : 1);

  updateUI(currentGain, realm);
}

function updateUI(gain, realm) {
  document.getElementById("level-display").innerText = `Cảnh giới: ${realm.name}`;
  document.getElementById("spirit-count").innerText = Math.floor(player.linhKhi);
  document.getElementById("speed-tag").innerText = `Linh tốc: +${gain.toFixed(1)}/s`;
  document.getElementById("progress").style.width = Math.min((player.linhKhi / realm.need)*100, 100) + "%";
  
  const stateTxt = player.state === "move" ? "Đang di chuyển" : 
                   player.state === "cultivate" ? "Đang ngồi thiền" : "Đang đứng";
  document.getElementById("state-display").innerText = `Trạng thái: ${stateTxt}`;
}

function tryBreakthrough() {
  const realm = realms[player.realm];
  if (realm && player.linhKhi >= realm.need) {
    player.linhKhi = 0;
    player.realm++;
    player.state = "idle";
  }
}

// --- DRAW ---
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const realm = realms[player.realm] || realms[realms.length-1];

  // Vẽ vòng Linh khí
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.angle);
  ctx.strokeStyle = realm.color;
  ctx.setLineDash(player.state === "cultivate" ? [] : [5, 10]);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, player.size * 0.8 + 10, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Vẽ nhân vật
  ctx.save();
  ctx.translate(player.x, player.y);
  if (player.state === "cultivate") ctx.scale(1.2, 0.8); // Hiệu ứng ngồi xuống
  ctx.rotate(player.state === "move" ? player.angle/4 : 0);
  ctx.fillStyle = "white";
  ctx.shadowBlur = 15;
  ctx.shadowColor = realm.color;
  ctx.fillRect(-player.size/2, -player.size/2, player.size, player.size);
  ctx.restore();
}

function loop(time) {
  const dt = (time - (loop.last || time)) / 1000;
  loop.last = time;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
requestAnimationFrame(loop);
