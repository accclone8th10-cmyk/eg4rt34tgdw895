const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// 1. CẤU HÌNH
const mapImg = new Image(); mapImg.src = 'map.png';
const mobImg = new Image(); mobImg.src = 'mob.png'; // Đảm bảo có file mob.png

const realms = [
    { name: "Luyện Khí", need: 100, absorb: 1.5, color: "#4facfe", atk: 30 },
    { name: "Trúc Cơ", need: 800, absorb: 4.0, color: "#00ff88", atk: 70 },
    { name: "Kim Đan", need: 3500, absorb: 10.0, color: "#f6d365", atk: 180 }
];

let player = {
    x: 1250, y: 1250, speed: 300,
    linhKhi: 0, realm: 0, hp: 100, maxHp: 100,
    mode: "BE_QUAN", lastShot: 0, shootDelay: 200
};

let bullets = [];
let mobs = [];
const keys = {};
const WORLD_SIZE = 2500;

// 2. LOGIC NÚT BẤM (TOGGLE)
function toggleMode() {
    const btn = document.getElementById('btn-toggle-mode');
    
    if (player.mode === "BE_QUAN") {
        player.mode = "HANH_TAU";
        btn.innerText = "BẾ QUAN"; // Chuyển tên nút khi vào thế giới
        spawnMobs(20);
    } else {
        player.mode = "BE_QUAN";
        btn.innerText = "HÀNH TẨU"; // Chuyển tên nút khi về động phủ
        mobs = [];
        player.x = canvas.width/2; 
        player.y = canvas.height/2;
    }
}

// 3. XỬ LÝ QUÁI VÀ ĐẠN
function spawnMobs(count) {
    mobs = [];
    for(let i=0; i<count; i++) {
        mobs.push({
            x: Math.random() * WORLD_SIZE,
            y: Math.random() * WORLD_SIZE,
            hp: 60 + player.realm * 100,
            maxHp: 60 + player.realm * 100,
            speed: 80 + Math.random() * 50
        });
    }
}

function update(dt) {
    const r = realms[player.realm];
    
    // Nạp linh khí
    let gain = r.absorb * (player.mode === "BE_QUAN" ? 10 : 1);
    player.linhKhi += gain * dt;

    if (player.mode === "HANH_TAU") {
        // Di chuyển nhân vật
        if (keys["w"]) player.y -= player.speed * dt;
        if (keys["s"]) player.y += player.speed * dt;
        if (keys["a"]) player.x -= player.speed * dt;
        if (keys["d"]) player.x += player.speed * dt;

        // Quái đuổi theo
        mobs.forEach(m => {
            let dx = player.x - m.x;
            let dy = player.y - m.y;
            let dist = Math.hypot(dx, dy);
            if (dist < 700) {
                m.x += (dx / dist) * m.speed * dt;
                m.y += (dy / dist) * m.speed * dt;
            }
            if (dist < 30) player.hp -= 5 * dt; // Quái cắn
        });

        // Xử lý đạn
        bullets.forEach((b, i) => {
            b.x += b.vx * dt; b.y += b.vy * dt;
            mobs.forEach((m, mi) => {
                if (Math.hypot(b.x - m.x, b.y - m.y) < 30) {
                    m.hp -= r.atk;
                    bullets.splice(i, 1);
                    if (m.hp <= 0) { mobs.splice(mi, 1); player.linhKhi += 20; spawnMobs(mobs.length + 1); }
                }
            });
        });
    }

    // Cập nhật giao diện
    document.getElementById("display-realm").innerText = r.name;
    document.getElementById("progress-bar").style.width = Math.min(100, (player.linhKhi / r.need * 100)) + "%";
    document.getElementById("hp-bar").style.width = (player.hp / player.maxHp * 100) + "%";
    document.getElementById("speed-tag").innerText = `+${gain.toFixed(1)}/s`;
}

// 4. VẼ (RENDER)
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (player.mode === "HANH_TAU") {
        ctx.save();
        let camX = Math.max(0, Math.min(player.x - canvas.width/2, WORLD_SIZE - canvas.width));
        let camY = Math.max(0, Math.min(player.y - canvas.height/2, WORLD_SIZE - canvas.height));
        ctx.translate(-camX, -camY);

        if (mapImg.complete) ctx.drawImage(mapImg, 0, 0, WORLD_SIZE, WORLD_SIZE);
        
        mobs.forEach(m => {
            if (mobImg.complete) ctx.drawImage(mobImg, m.x-25, m.y-25, 50, 50);
            else { ctx.fillStyle = "red"; ctx.beginPath(); ctx.arc(m.x, m.y, 20, 0, Math.PI*2); ctx.fill(); }
        });

        bullets.forEach(b => {
            ctx.strokeStyle = b.color; ctx.lineWidth = 4;
            ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - b.vx*0.05, b.y - b.vy*0.05); ctx.stroke();
        });

        ctx.fillStyle = "white"; ctx.fillRect(player.x-20, player.y-20, 40, 40);
        ctx.restore();
    } else {
        ctx.fillStyle = "#050a0f"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = realms[player.realm].color; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.arc(canvas.width/2, canvas.height/2, 120 + Math.sin(Date.now()/200)*10, 0, Math.PI*2); ctx.stroke();
        ctx.fillStyle = "white"; ctx.fillRect(canvas.width/2-20, canvas.height/2-20, 40, 40);
    }

    update(1/60);
    requestAnimationFrame(draw);
}

// SỰ KIỆN
canvas.addEventListener("mousedown", (e) => {
    if (player.mode === "HANH_TAU") {
        const camX = Math.max(0, Math.min(player.x - canvas.width/2, WORLD_SIZE - canvas.width));
        const camY = Math.max(0, Math.min(player.y - canvas.height/2, WORLD_SIZE - canvas.height));
        const angle = Math.atan2(e.clientY + camY - player.y, e.clientX + camX - player.x);
        bullets.push({ x: player.x, y: player.y, vx: Math.cos(angle)*900, vy: Math.sin(angle)*900, color: realms[player.realm].color });
    }
});

window.addEventListener("keydown", e => {
    keys[e.key.toLowerCase()] = true;
    if (e.code === "Space") { // Đột phá khi nhấn Space
        if (player.linhKhi >= realms[player.realm].need) {
            player.linhKhi = 0;
            player.realm = Math.min(player.realm + 1, realms.length - 1);
            player.maxHp += 200; player.hp = player.maxHp;
            canvas.style.filter = "brightness(3)"; setTimeout(() => canvas.style.filter = "none", 150);
        }
    }
});
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);
window.addEventListener("resize", () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; });
canvas.width = window.innerWidth; canvas.height = window.innerHeight;
draw();
