// =================================================================================
// ส่วนที่ 1: Utility Functions และ Dependency ที่จำเป็น
// =================================================================================

function showCustomAlert(message, iconType = 'info') {
    // กำหนดสีปุ่มตามชนิดของไอคอน
    const buttonColor = iconType === 'error' ? '#dc3545' : '#28a745'; 

    Swal.fire({
        title: iconType === 'success' ? 'สำเร็จ!' : iconType === 'error' ? 'ข้อผิดพลาด!' : '⚠️ แจ้งเตือน!',
        text: message,
        icon: iconType, // ใช้ iconType ที่ส่งเข้ามา
        confirmButtonText: 'ตกลง',
        confirmButtonColor: buttonColor
    });
}

// 🟢 Dependency: ฟังก์ชันที่ใช้ในการโหลดรายชื่อผู้เล่นลงใน dropdown
function loadPlayerList() {
    const players = JSON.parse(localStorage.getItem("players")) || {};
    const select = document.getElementById("playerSelect");
    select.innerHTML = "";
    
    // เพิ่ม option ว่าง
    const defaultOption = document.createElement("option");
    defaultOption.textContent = "-- เลือกผู้เล่น --";
    defaultOption.value = "";
    defaultOption.disabled = true;
    defaultOption.selected = true;
    select.appendChild(defaultOption);

    for (let name in players) {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        select.appendChild(option);
    }
}

// =================================================================================
// ส่วนที่ 2: ฟังก์ชันการจัดการผู้เล่นและไอเทม
// =================================================================================

function deletePlayer() {
    const name = document.getElementById("playerSelect").value;
    const players = JSON.parse(localStorage.getItem("players")) || {};

    if (!name || !players[name]) {
        showCustomAlert("กรุณาเลือกผู้เล่นที่ต้องการลบ", 'warning'); 
        return;
    }

    Swal.fire({
        title: 'ยืนยันการลบ?',
        text: `คุณแน่ใจหรือไม่ว่าต้องการลบผู้เล่น "${name}"? การดำเนินการนี้ไม่สามารถย้อนกลับได้!`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545', 
        cancelButtonColor: '#6c757d', 
        confirmButtonText: 'ใช่, ลบเลย!',
        cancelButtonText: 'ยกเลิก'
    }).then((result) => {
        if (result.isConfirmed) {
            delete players[name];
            localStorage.setItem("players", JSON.stringify(players));
            
            showCustomAlert(`ลบผู้เล่น "${name}" เรียบร้อยแล้ว`, 'success');

            loadPlayerList();
            
            // เคลียร์ฟอร์มทั้งหมดใน playerEditor
            const playerEditor = document.getElementById("playerEditor");
            if (playerEditor) {
                playerEditor.querySelectorAll('input, select, textarea').forEach(input => {
                    if (input.type === 'number') {
                        input.value = 0;
                    } else if (input.tagName === 'SELECT') {
                         input.selectedIndex = 0; // เลือกตัวเลือกแรกสุด
                    } else {
                        input.value = "";
                    }
                });
            }
            // รีเฟรชรายการไอเทมและบันทึกการทอย
            loadItemList();
            loadExistingItemList();
            loadPlayerDiceLog(); 
        }
    });
}

function loadItemList() {
  const name = document.getElementById("playerSelect").value;
  const players = JSON.parse(localStorage.getItem("players")) || {};
  const items = players[name]?.inventory || [];
  const select = document.getElementById("itemSelect"); // สำหรับลบไอเทม

  select.innerHTML = "";

  if (items.length === 0) {
    const option = document.createElement("option");
    option.textContent = "ไม่มีไอเทม";
    option.disabled = true;
    option.value = "";
    select.appendChild(option);
    return;
  }

  items.forEach(item => {
    const option = document.createElement("option");
    option.value = item.name;
    option.textContent = `${item.name} (${item.quantity})`;
    select.appendChild(option);
  });
}

function loadExistingItemList() {
  const name = document.getElementById("playerSelect").value;
  const players = JSON.parse(localStorage.getItem("players")) || {};
  const items = players[name]?.inventory || [];
  const select = document.getElementById("existingItemSelect"); // สำหรับเพิ่มจำนวนไอเทม

  select.innerHTML = "";

  if (items.length === 0) {
    const option = document.createElement("option");
    option.textContent = "ไม่มีไอเทม";
    option.disabled = true;
    option.value = "";
    select.appendChild(option);
    return;
  }

  items.forEach(item => {
    const option = document.createElement("option");
    option.value = item.name;
    option.textContent = `${item.name} (${item.quantity})`;
    select.appendChild(option);
  });
}

function increaseItemQuantity() {
    const name = document.getElementById("playerSelect").value;
    const itemName = document.getElementById("existingItemSelect").value;
    const qtyToAdd = parseInt(document.getElementById("existingItemQty").value);
    const players = JSON.parse(localStorage.getItem("players"));

    if (!name || name === "") {
        showCustomAlert("กรุณาเลือกผู้เล่น", 'warning');
        return;
    }
    
    if (!itemName || itemName === "") {
        showCustomAlert("กรุณาเลือกไอเทมที่ต้องการเพิ่ม", 'warning'); 
        return;
    }

    if (isNaN(qtyToAdd) || qtyToAdd <= 0) {
        showCustomAlert("กรุณาระบุจำนวนที่ถูกต้อง", 'warning'); 
        return;
    }

    const item = players[name].inventory.find(i => i.name === itemName);
    if (!item) {
        showCustomAlert("ไม่พบไอเทมในกระเป๋า", 'error'); 
        return;
    }

    item.quantity += qtyToAdd;
    localStorage.setItem("players", JSON.stringify(players));
    showCustomAlert(`เพิ่ม "${itemName}" จำนวน ${qtyToAdd} ให้ ${name} แล้ว`, 'success'); 

    document.getElementById("existingItemQty").value = 1;
    loadItemList(); // รีเฟรช dropdown (ItemSelect)
    loadExistingItemList(); // รีเฟรช dropdown (ExistingItemSelect)
}

function addItem() {
    const name = document.getElementById("playerSelect").value;
    const itemName = document.getElementById("itemName").value.trim();
    const itemQty = parseInt(document.getElementById("itemQty").value) || 1;
    const players = JSON.parse(localStorage.getItem("players"));

    if (!name || !players[name]) {
        showCustomAlert("กรุณาเลือกผู้เล่น", 'warning');
        return;
    }
    if (itemName === "") {
        showCustomAlert("กรุณากรอกชื่อไอเทม", 'warning');
        return;
    }
    if (itemQty <= 0) {
        showCustomAlert("จำนวนไอเทมต้องมากกว่า 0", 'warning');
        return;
    }

    let player = players[name];
    if (!player.inventory) {
        player.inventory = [];
    }

    const existingItem = player.inventory.find(i => i.name === itemName);

    if (existingItem) {
        existingItem.quantity += itemQty;
    } else {
        player.inventory.push({ name: itemName, quantity: itemQty });
    }

    localStorage.setItem("players", JSON.stringify(players));
    showCustomAlert(`เพิ่มไอเทม "${itemName}" จำนวน ${itemQty} ให้ ${name} แล้ว`, 'success');
    
    document.getElementById("itemName").value = "";
    document.getElementById("itemQty").value = 1;
    loadItemList();
    loadExistingItemList();
}

function removeItem() {
    const name = document.getElementById("playerSelect").value;
    const itemName = document.getElementById("itemSelect").value;
    const qtyToRemove = parseInt(document.getElementById("removeQty").value) || 1;
    const players = JSON.parse(localStorage.getItem("players"));

    if (!name || !players[name]) {
        showCustomAlert("กรุณาเลือกผู้เล่น", 'warning');
        return;
    }
    if (!itemName) {
        showCustomAlert("กรุณาเลือกไอเทมที่ต้องการลบ", 'warning');
        return;
    }
    if (qtyToRemove <= 0) {
        showCustomAlert("จำนวนที่ต้องการลบต้องมากกว่า 0", 'warning');
        return;
    }

    let player = players[name];
    const itemIndex = player.inventory.findIndex(i => i.name === itemName);

    if (itemIndex === -1) {
        showCustomAlert("ไม่พบไอเทมนี้ในกระเป๋าผู้เล่น", 'error');
        return;
    }

    const item = player.inventory[itemIndex];

    if (item.quantity <= qtyToRemove) {
        player.inventory.splice(itemIndex, 1); // ลบไอเทมออกทั้งหมด
        showCustomAlert(`ลบไอเทม "${itemName}" ทั้งหมดจาก ${name} แล้ว`, 'success');
    } else {
        item.quantity -= qtyToRemove;
        showCustomAlert(`ลบไอเทม "${itemName}" จำนวน ${qtyToRemove} จาก ${name} แล้ว`, 'success');
    }

    localStorage.setItem("players", JSON.stringify(players));
    document.getElementById("removeQty").value = 1;
    loadItemList();
    loadExistingItemList();
}

// =================================================================================
// ส่วนที่ 3: ฟังก์ชันการจัดการมอนสเตอร์
// =================================================================================

const monsterTemplates = {
  "ก็อบลิน": { hp: 15, stats: { STR: 8, DEX: 14, CON: 10, INT: 8, WIS: 8, CHA: 6 } },
  "ออร์ค": { hp: 30, stats: { STR: 16, DEX: 12, CON: 14, INT: 7, WIS: 11, CHA: 10 } },
  "โครงกระดูก": { hp: 13, stats: { STR: 10, DEX: 14, CON: 15, INT: 6, WIS: 8, CHA: 5 } },
  "หมาป่า": { hp: 20, stats: { STR: 12, DEX: 15, CON: 12, INT: 3, WIS: 12, CHA: 6 } },
  "มังกรน้อย": { hp: 45, stats: { STR: 18, DEX: 12, CON: 16, INT: 14, WIS: 13, CHA: 15 } }
};

function populateMonsterTemplates() {
  const select = document.getElementById("monsterTemplateSelect");
  if (!select) return;

  for (let name in monsterTemplates) {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    select.appendChild(option);
  }
  loadMonsterTemplate(); // โหลดตัวแรกทันที
}

function loadMonsterTemplate() {
  const name = document.getElementById("monsterTemplateSelect").value;
  const monster = monsterTemplates[name];

  if (!monster) return;

  document.getElementById("monsterHp").value = monster.hp;
  document.getElementById("monsterStr").value = monster.stats.STR;
  document.getElementById("monsterDex").value = monster.stats.DEX;
  document.getElementById("monsterCon").value = monster.stats.CON;
  document.getElementById("monsterInt").value = monster.stats.INT;
  document.getElementById("monsterWis").value = monster.stats.WIS;
  document.getElementById("monsterCha").value = monster.stats.CHA;
}

function sendMonster() {
  const monsterName = document.getElementById("monsterTemplateSelect").value;
  const hp = parseInt(document.getElementById("monsterHp").value);
  
  const stats = {
    STR: parseInt(document.getElementById("monsterStr").value),
    DEX: parseInt(document.getElementById("monsterDex").value),
    CON: parseInt(document.getElementById("monsterCon").value),
    INT: parseInt(document.getElementById("monsterInt").value),
    WIS: parseInt(document.getElementById("monsterWis").value),
    CHA: parseInt(document.getElementById("monsterCha").value)
  };

  const playerName = document.getElementById("playerSelect").value;
  const players = JSON.parse(localStorage.getItem("players")) || {};

  if (!playerName || !players[playerName]) {
    showCustomAlert("กรุณาเลือกผู้เล่นที่ต้องการส่งมอนสเตอร์ให้", 'warning');
    return;
  }
  if (!monsterName) {
      showCustomAlert("กรุณาเลือกมอนสเตอร์", 'warning');
      return;
  }

  // ส่งข้อมูลมอนสเตอร์เป็น Object เต็ม
  players[playerName].enemy = { name: monsterName, hp, stats };
  localStorage.setItem("players", JSON.stringify(players));
  showCustomAlert(`ส่งมอนสเตอร์ "${monsterName}" (HP: ${hp}) ให้ผู้เล่น ${playerName} แล้ว`, 'success');
}

function addCustomEnemy() {
  const playerName = document.getElementById("playerSelect").value;
  const players = JSON.parse(localStorage.getItem("players")) || {};

  if (!playerName || !players[playerName]) {
    showCustomAlert("กรุณาเลือกผู้เล่นก่อนเพิ่มคู่ต่อสู้", 'warning');
    return;
  }
  
  const enemyName = document.getElementById("customEnemyName").value;
  if (!enemyName.trim()) {
      showCustomAlert("กรุณากรอกชื่อคู่ต่อสู้", 'warning');
      return;
  }

  const enemy = {
    name: enemyName,
    hp: parseInt(document.getElementById("customEnemyHp").value) || 1,
    stats: {
      STR: parseInt(document.getElementById("customEnemyStr").value) || 0,
      DEX: parseInt(document.getElementById("customEnemyDex").value) || 0,
      CON: parseInt(document.getElementById("customEnemyCon").value) || 0,
      INT: parseInt(document.getElementById("customEnemyInt").value) || 0,
      WIS: parseInt(document.getElementById("customEnemyWis").value) || 0,
      CHA: parseInt(document.getElementById("customEnemyCha").value) || 0
    }
  };

  players[playerName].enemy = enemy;
  localStorage.setItem("players", JSON.stringify(players));
  showCustomAlert(`เพิ่มคู่ต่อสู้ "${enemy.name}" (HP: ${enemy.hp}) ให้ผู้เล่น ${playerName} แล้ว`, 'success');
}

function clearEnemy() {
    const playerName = document.getElementById("playerSelect").value;
    const players = JSON.parse(localStorage.getItem("players")) || {};

    if (!playerName || !players[playerName]) {
        showCustomAlert("กรุณาเลือกผู้เล่นที่ต้องการลบศัตรูให้", 'warning');
        return;
    }

    if (!players[playerName].enemy) {
        showCustomAlert(`ผู้เล่น ${playerName} ไม่มีศัตรูอยู่แล้ว`, 'info');
        return;
    }

    players[playerName].enemy = null;
    localStorage.setItem("players", JSON.stringify(players));
    showCustomAlert(`กำจัดศัตรูให้กับผู้เล่น ${playerName} เรียบร้อยแล้ว!`, 'success');
}

// =================================================================================
// ส่วนที่ 4: ฟังก์ชันการจัดการ Dice Log
// =================================================================================

function rollDmDice() {
  const type = parseInt(document.getElementById("dmDiceType").value);
  const count = parseInt(document.getElementById("dmDiceCount").value);
  const resultDiv = document.getElementById("dmDiceResult");
  
  if (isNaN(type) || isNaN(count) || count <= 0 || type <= 1) {
    resultDiv.innerHTML = "<p style='color:red;'>โปรดระบุชนิดและจำนวนลูกเต๋าที่ถูกต้อง</p>";
    return;
  }
    
  let results = [];
  let total = 0;

  for (let i = 0; i < count; i++) {
    const roll = Math.floor(Math.random() * type) + 1;
    results.push(roll);
    total += roll;
  }

  resultDiv.innerHTML =
    `ผลการทอย **${count}d${type}**: [${results.join(', ')}] <br> **รวมทั้งหมด:** ${total}`;

    // บันทึก Log การทอยของ DM
    const dmLog = {
        name: "DM",
        dice: type,
        count: count,
        result: results,
        timestamp: new Date().toLocaleTimeString('th-TH')
    };
    let logs = JSON.parse(localStorage.getItem("diceLogs")) || [];
    logs.push(dmLog);
    localStorage.setItem("diceLogs", JSON.stringify(logs));
}


function loadPlayerDiceLog() {
  const logs = JSON.parse(localStorage.getItem("diceLogs")) || [];
  const list = document.getElementById("playerDiceLog");
  list.innerHTML = "";

  const recentLogs = logs.reverse().slice(0, 10); // เอา 10 รายการล่าสุดมาแสดง

  if (recentLogs.length === 0) {
    list.innerHTML = "<li>ยังไม่มีข้อมูลการทอย</li>";
    return;
  }
  
  recentLogs.forEach(log => {
    const li = document.createElement("li");
    // แสดงเวลา ชื่อ และผลรวมในการทอย
    const total = log.result.reduce((a, b) => a + b, 0);
    li.textContent = `[${log.timestamp || new Date().toLocaleTimeString('th-TH')}] ${log.name} ทอย ${log.count}d${log.dice}: [${log.result.join(', ')}] รวม: ${total}`;
    list.appendChild(li);
  });
}

function clearDiceLogs() {
    Swal.fire({
        title: 'ยืนยันการล้างประวัติ?',
        text: "คุณแน่ใจหรือไม่ว่าต้องการล้างประวัติการทอยทั้งหมด?",
        icon: 'warning',
        showCancelButton: true, 
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'ใช่, ล้างเลย!',
        cancelButtonText: 'ยกเลิก'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem("diceLogs");
            
            showCustomAlert("ล้างประวัติการทอยเรียบร้อยแล้ว!", 'success');
            
            loadPlayerDiceLog(); // รีเฟรชรายการหลังล้าง
        }
    });
}

function saveStory() {
    const story = document.getElementById("story").value;
    localStorage.setItem("currentStory", story);
    showCustomAlert("บันทึกเนื้อเรื่องเรียบร้อยแล้ว!", 'success');
}

function sendMessageToPlayer() {
    const name = document.getElementById("playerSelect").value;
    const message = document.getElementById("dmMessage").value.trim();

    if (!name || name === "") {
        showCustomAlert("กรุณาเลือกผู้เล่นที่ต้องการส่งข้อความ", 'warning');
        return;
    }
    if (message === "") {
        showCustomAlert("กรุณากรอกข้อความที่ต้องการส่ง", 'warning');
        return;
    }

    // ใช้ SweetAlert2 เพื่อแสดงข้อความให้ DM ทราบว่าส่งข้อความสำเร็จ
    Swal.fire({
        title: `ส่งข้อความถึง ${name}`,
        text: message,
        icon: 'info',
        confirmButtonText: 'ตกลง'
    }).then(() => {
        // ส่งข้อความไปที่หน้าแดชบอร์ดของผู้เล่น (โดยใช้ชื่อผู้เล่นเป็นคีย์)
        // จริงๆ แล้วระบบนี้ควรใช้ WebSockets แต่เราจะใช้ localStorage เพื่อจำลอง
        const currentMessage = JSON.parse(localStorage.getItem("dmMessages")) || {};
        currentMessage[name] = message;
        localStorage.setItem("dmMessages", JSON.stringify(currentMessage));
        document.getElementById("dmMessage").value = "";
        showCustomAlert(`ส่งข้อความให้ ${name} เรียบร้อยแล้ว`, 'success');
    });
}

function sendQuest() {
    const playerName = document.getElementById("playerSelect").value;
    const questTitle = document.getElementById("questTitle").value.trim();
    const questDetail = document.getElementById("questDetail").value.trim();
    const questReward = document.getElementById("questReward").value.trim();
    const players = JSON.parse(localStorage.getItem("players"));

    if (!playerName || !players[playerName]) {
        showCustomAlert("กรุณาเลือกผู้เล่นก่อนส่งเควส", 'warning');
        return;
    }
    if (!questTitle) {
        showCustomAlert("กรุณากรอกชื่อเควส", 'warning');
        return;
    }

    players[playerName].quest = {
        title: questTitle,
        detail: questDetail,
        reward: questReward
    };

    localStorage.setItem("players", JSON.stringify(players));
    showCustomAlert(`ส่งเควส "${questTitle}" ให้ผู้เล่น ${playerName} เรียบร้อยแล้ว`, 'success');

    // เคลียร์ฟอร์ม
    document.getElementById("questTitle").value = "";
    document.getElementById("questDetail").value = "";
    document.getElementById("questReward").value = "";
}

// 🟢 โหลดรายชื่อผู้เล่นและมอนสเตอร์เมื่อเปิดหน้า
loadPlayerList();
populateMonsterTemplates();

// 🟢 ตั้งเวลาให้รีเฟรช Log ทุก 3 วินาที
setInterval(() => {
  loadPlayerDiceLog();
}, 3000);