let previousPlayerState = null; // ตัวแปรสำหรับเก็บสถานะผู้เล่นก่อนการเปลี่ยนแปลง

// =================================================================================
// ส่วนที่ 1: Utility Functions (ฟังก์ชันพื้นฐาน)
// =================================================================================

function showCustomAlert(message, iconType = 'info', showCancel = false) {
    const buttonColor = iconType === 'error' ? '#dc3545' : '#28a745';
    Swal.fire({
        title: iconType === 'success' ? 'สำเร็จ!' : iconType === 'error' ? 'ข้อผิดพลาด!' : '⚠️ แจ้งเตือน!',
        text: message, icon: iconType, confirmButtonText: 'ตกลง',
        confirmButtonColor: buttonColor, showCancelButton: showCancel
    });
}

function getDefaultStats() {
    return { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 };
}

function getRaceStatBonus(charRace) {
    const baseStats = { STR: 5, DEX: 5, CON: 5, INT: 5, WIS: 5, CHA: 5 };
    const racialBonuses = {
      'มนุษย์': { STR: 3, DEX: 3, CON: 3, INT: 3, WIS: 3, CHA: 3 }, 'เอลฟ์': { DEX: 8, INT: 4 , CHA: 6}, 'คนแคระ': { CON: 9, STR: 5 }, 'ฮาล์ฟลิ่ง': { DEX: 12, CHA: 3 }, 'ไทฟลิ่ง': { DEX: 6, CHA: 6, INT: 3 }, 'แวมไพร์': { DEX: 7, CHA: 7 }, 'เงือก': { CON: 8, WIS: 4 }, 'ออร์ค': { STR: 10, CON: 5 }, 'โนม': { INT: 7, DEX: 4 }, 'เอลฟ์ดำ': { DEX: 9, CHA: 5 }, 'นางฟ้า': { WIS: 8, CHA: 4 }, 'มาร': { STR: 8, CHA: 8 }, 'โกเลม': { CON: 15, STR: 7 } 
    };
    const finalStats = { ...baseStats };
    const bonus = racialBonuses[charRace] || {};
    for (const stat in bonus) {
        finalStats[stat] += bonus[stat];
    }
    return finalStats;
}

function getClassStatBonus(charClass) {
    const classBonuses = {
      'นักรบ': { STR: 20, CON: 12 }, 'นักเวท': { INT: 25, WIS: 10 }, 'นักบวช': { WIS: 22, CHA: 8 }, 'โจร': { DEX: 30, CHA: 10 }, 'เรนเจอร์': { DEX: 15, WIS: 10, CON: 8 }, 'อัศวินศักดิ์สิทธิ์': { STR: 18, CHA: 15 }, 'บาร์บาเรียน': { STR: 35, CON: 15 }, 'พ่อค้า': { CHA: 25, INT: 10 }, 'แทงค์': { CON: 40, STR: 10 }, 'นักปราชญ์': { INT: 20, WIS: 15 }, 'อัศวิน': { STR: 18, CON: 15 }, 'เจ้าเมือง': { CHA: 50, INT: 50 } 
    };
    const defaultStats = { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 };
    return { ...defaultStats, ...classBonuses[charClass] };
}

function calculateHP(charRace, charClass, finalCon) {
    const racialBaseHP = {
        'มนุษย์': 10, 'เอลฟ์': 8, 'คนแคระ': 12, 'ฮาล์ฟลิ่ง': 8, 'ไทฟลิ่ง': 9, 'แวมไพร์': 9, 'เงือก': 10, 'ออร์ค': 14, 'โนม': 7, 'เอลฟ์ดำ': 8, 'นางฟ้า': 6, 'มาร': 11, 'โกเลม': 18
    };
    const classBaseHP = {
      'นักรบ': 12, 'นักเวท': 4, 'นักบวช': 8, 'โจร': 8, 'เรนเจอร์': 10, 'อัศวินศักดิ์สิทธิ์': 14, 'บาร์บาเรียน': 16, 'พ่อค้า': 6, 'แทงค์': 25, 'นักปราชญ์': 4, 'อัศวิน': 13, 'เจ้าเมือง': 15
    };
    const conModifier = Math.floor((finalCon - 10) / 2);
    const raceHP = racialBaseHP[charRace] || 8;
    const classHP = classBaseHP[charClass] || 6;
    return raceHP + classHP + conModifier;
}

// =================================================================================
// ส่วนที่ 2: การคำนวณและจัดการเลเวล/สถานะ
// =================================================================================

function adjustHpOnStatChange(player, oldMaxHp) {
    // คำนวณ Max HP ใหม่ โดยใช้ Race, Class และ Final CON ล่าสุด
    const newMaxHp = calculateHP(player.race, player.class, calculateTotalStat(player, 'CON'));
    
    // 🟢 เงื่อนไขที่คุณต้องการ: ถ้า Max HP เพิ่ม และ HP ปัจจุบันเต็มอยู่
    if (newMaxHp > oldMaxHp && player.hp === oldMaxHp) {
        player.hp = newMaxHp; 
    }
    // ⚠️ เงื่อนไขป้องกัน: ถ้า HP ปัจจุบันเกิน Max HP ใหม่ (เช่น Max HP ลดลง)
    if (player.hp > newMaxHp) {
        player.hp = newMaxHp;
    }
    return player;
}

function calculateTotalStat(charData, statKey) {
    if (!charData || !charData.stats) return 0;
    const stats = charData.stats;
    const permanentLevel = charData.level || 1;
    const tempLevel = charData.tempLevel || 0;
    const totalLevel = permanentLevel + tempLevel;
    const baseStat = (stats.baseRaceStats?.[statKey] || 0) +
                     (stats.baseClassStats?.[statKey] || 0) +
                     (stats.investedStats?.[statKey] || 0) +
                     (stats.tempStats?.[statKey] || 0);
    if (baseStat === 0) return 0;
    const levelBonus = baseStat * (totalLevel - 1) * 0.2;
    return Math.floor(baseStat + levelBonus);
}

function changeLevel(change) {
    const name = document.getElementById("playerSelect").value;
    const players = JSON.parse(localStorage.getItem("players")) || {};
    let player = players[name];
    if (!player) {
        showCustomAlert("กรุณาเลือกผู้เล่นก่อน", 'warning');
        return;
    }
    
    // [แก้ไขที่ 1]: คำนวณ Max HP เดิมโดยใช้ Race, Class, และ Final CON (ก่อนเปลี่ยน Level)
    const oldMaxHp = calculateHP(player.race, player.class, calculateTotalStat(player, 'CON'));
    
    let newLevel = (player.level || 1) + change;
    if (newLevel < 1) newLevel = 1;

    if (change > 0) {
        player.freeStatPoints = (player.freeStatPoints || 0) + (change * 2);
        showCustomAlert(`เพิ่มเลเวลของ ${name} เป็น ${newLevel}! และได้รับ 2 แต้มอิสระ`, 'success');
    } else if (change < 0 && player.level > 1) {
        player.freeStatPoints = Math.max(0, (player.freeStatPoints || 0) + (change * 2));
        showCustomAlert(`ลดเลเวลของ ${name} เป็น ${newLevel}! แต้มอิสระถูกปรับลด`, 'warning');
    }
    
    player.level = newLevel;
    
    // ส่ง oldMaxHp ที่คำนวณถูกต้องไปให้ adjustHpOnStatChange
    player = adjustHpOnStatChange(player, oldMaxHp);
    
    localStorage.setItem("players", JSON.stringify(players));
    loadPlayer();
}

function applyTempLevel() {
    const name = document.getElementById("playerSelect").value;
    const players = JSON.parse(localStorage.getItem("players")) || {};
    let player = players[name];
    if (!player) {
        showCustomAlert("กรุณาเลือกผู้เล่นก่อน", 'warning');
        return;
    }
    
    // [แก้ไขที่ 2]: คำนวณ Max HP เดิมโดยใช้ Race, Class, และ Final CON (ก่อนเปลี่ยน Temp Level)
    const oldMaxHp = calculateHP(player.race, player.class, calculateTotalStat(player, 'CON'));
    
    player.tempLevel = parseInt(document.getElementById("tempLevelInput").value) || 0;
    
    // ส่ง oldMaxHp ที่คำนวณถูกต้องไปให้ adjustHpOnStatChange
    player = adjustHpOnStatChange(player, oldMaxHp);
    
    localStorage.setItem("players", JSON.stringify(players));
    showCustomAlert(`ใช้ Temp Level: ${player.tempLevel >= 0 ? '+' : ''}${player.tempLevel} ให้กับ ${name} แล้ว!`, 'success');
    loadPlayer();
}

function clearTempLevel() {
    const name = document.getElementById("playerSelect").value;
    const players = JSON.parse(localStorage.getItem("players")) || {};
    let player = players[name];
    if (!player) {
        showCustomAlert("กรุณาเลือกผู้เล่นก่อน", 'warning');
        return;
    }
    
    // [แก้ไขที่ 3]: คำนวณ Max HP เดิมโดยใช้ Race, Class, และ Final CON (ก่อนรีเซ็ต Temp Level)
    const oldMaxHp = calculateHP(player.race, player.class, calculateTotalStat(player, 'CON'));

    player.tempLevel = 0;
    
    // ส่ง oldMaxHp ที่คำนวณถูกต้องไปให้ adjustHpOnStatChange
    player = adjustHpOnStatChange(player, oldMaxHp);
    
    document.getElementById("tempLevelInput").value = 0;
    localStorage.setItem("players", JSON.stringify(players));
    showCustomAlert(`รีเซ็ต Temp Level ของ ${name} เป็น 0 เรียบร้อย!`, 'success');
    loadPlayer();
}

// =================================================================================
// ส่วนที่ 3: การโหลดและบันทึกข้อมูล (DM Panel Core)
// =================================================================================

function loadPlayerList() {
    const players = JSON.parse(localStorage.getItem("players")) || {};
    const select = document.getElementById("playerSelect");
    select.innerHTML = "";
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "--- เลือกผู้เล่น ---";
    select.appendChild(defaultOption);
    for (let name in players) {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        select.appendChild(option);
    }
}

function resetPlayerEditor() {
    const editor = document.getElementById("playerEditor");
    if (!editor) return;
    editor.querySelectorAll('input[type="text"], input[type="number"], textarea').forEach(input => {
        input.value = input.type === 'number' ? 0 : '';
    });
    editor.querySelectorAll('select').forEach(select => select.selectedIndex = 0);
    document.getElementById("editName").value = '';
    document.getElementById("editLevel").textContent = 'N/A';
    document.getElementById("editFreeStatPoints").textContent = 'N/A';
    previousPlayerState = null;
    displayPlayerSummary(null);
}

function loadPlayer() {
    const name = document.getElementById("playerSelect").value;
    const players = JSON.parse(localStorage.getItem("players"));
    if (!name || !players || !players[name]) {
        resetPlayerEditor();
        return;
    }
    const player = players[name];

    // Load Basic Info & Level
    document.getElementById("editName").value = player.name;
    document.getElementById("editRace").value = player.race || "มนุษย์";
    document.getElementById("editGender").value = player.gender || "ไม่ระบุ";
    document.getElementById("editAge").value = player.age || "";
    document.getElementById("editClass").value = player.class || "นักรบ";
    document.getElementById("editBackground").value = player.background || "";
    document.getElementById("editHp").value = player.hp;
    document.getElementById("editLevel").textContent = player.level || 1;
    document.getElementById("editFreeStatPoints").textContent = player.freeStatPoints || 0;
    document.getElementById("tempLevelInput").value = player.tempLevel || 0;

    // Load and Calculate Stats
    const statsKeys = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
    statsKeys.forEach(stat => {
        document.getElementById(`edit${stat}Race`).value = player.stats?.baseRaceStats?.[stat] || 0;
        document.getElementById(`edit${stat}Class`).value = player.stats?.baseClassStats?.[stat] || 0;
        document.getElementById(`edit${stat}Invested`).value = player.stats?.investedStats?.[stat] || 0;
        document.getElementById(`edit${stat}Temp`).value = player.stats?.tempStats?.[stat] || 0;
        document.getElementById(`edit${stat}Total`).value = calculateTotalStat(player, stat);
    });

    // Load other modules
    displayPlayerSummary(player);
    loadItemList();
    loadExistingItemList();
    loadPlayerDiceLog();
}

function saveBasicInfo() {
    const name = document.getElementById("playerSelect").value;
    const players = JSON.parse(localStorage.getItem("players"));
    let player = players[name];
    if (!player) {
        showCustomAlert("กรุณาเลือกผู้เล่นก่อนบันทึกข้อมูล", 'warning');
        return;
    }
    
    // [แก้ไขที่ 4]: คำนวณ Max HP เดิมโดยใช้ Race, Class, และ Final CON (ก่อนเปลี่ยน Race/Class)
    const oldMaxHp = calculateHP(player.race, player.class, calculateTotalStat(player, 'CON'));

    // อัปเดตข้อมูลใหม่ (Race/Class/HP)
    player.race = document.getElementById("editRace").value;
    player.gender = document.getElementById("editGender").value;
    player.age = parseInt(document.getElementById("editAge").value) || 0;
    player.class = document.getElementById("editClass").value;
    player.background = document.getElementById("editBackground").value;
    player.hp = parseInt(document.getElementById("editHp").value) || 0;
    
    // สร้าง/อัปเดต Base Stats ตาม Race/Class ใหม่
    if (!player.stats) player.stats = {};
    player.stats.baseRaceStats = getRaceStatBonus(player.race);
    player.stats.baseClassStats = getClassStatBonus(player.class);
    
    // ปรับ HP ปัจจุบันเทียบกับ Max HP ใหม่
    player = adjustHpOnStatChange(player, oldMaxHp);
    
    localStorage.setItem("players", JSON.stringify(players));
    showCustomAlert("บันทึกข้อมูลทั่วไปเรียบร้อยแล้ว!", 'success');
    loadPlayer();
}

function saveStats() {
    const name = document.getElementById("playerSelect").value;
    const players = JSON.parse(localStorage.getItem("players"));
    let player = players[name];
    if (!player) {
        showCustomAlert("กรุณาเลือกผู้เล่นก่อนบันทึกสถานะ", 'warning');
        return;
    }
    
    // [แก้ไขที่ 5]: คำนวณ Max HP เดิมโดยใช้ Race, Class, และ Final CON (ก่อนเปลี่ยน Temp Stats)
    const oldMaxHp = calculateHP(player.race, player.class, calculateTotalStat(player, 'CON'));

    const statsKeys = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
    if (!player.stats) player.stats = {};
    if (!player.stats.tempStats) player.stats.tempStats = {};
    statsKeys.forEach(stat => {
        // อัปเดต Temp Stats ใหม่
        player.stats.tempStats[stat] = parseInt(document.getElementById(`edit${stat}Temp`).value) || 0;
    });
    
    // ปรับ HP ปัจจุบันเทียบกับ Max HP ใหม่
    player = adjustHpOnStatChange(player, oldMaxHp);
    
    localStorage.setItem("players", JSON.stringify(players));
    showCustomAlert("บันทึกบัฟ/ดีบัฟเรียบร้อยแล้ว!", 'success');
    loadPlayer();
}

// =================================================================================
// ส่วนที่ 4: การจัดการส่วนแสดงผลและอื่นๆ
// =================================================================================

function updateStatTotals(statKey) {
    const name = document.getElementById("playerSelect").value;
    const players = JSON.parse(localStorage.getItem("players"));
    let player = players[name];
    if (!player) return;

    // จำลองการอัปเดต player.stats.tempStats[statKey] 
    const tempValue = parseInt(document.getElementById(`edit${statKey}Temp`).value) || 0;
    
    // สร้าง Object ชั่วคราวเพื่อคำนวณ
    const tempPlayer = JSON.parse(JSON.stringify(player));
    if (!tempPlayer.stats.tempStats) tempPlayer.stats.tempStats = {};
    tempPlayer.stats.tempStats[statKey] = tempValue;
    
    // คำนวณค่ารวมใหม่ และอัปเดตใน UI
    document.getElementById(`edit${statKey}Total`).value = calculateTotalStat(tempPlayer, statKey);
}

function displayPlayerSummary(player) {
    const output = document.getElementById("playerSummaryPanel");
    if (!output) return;

    if (!player) {
        output.innerHTML = "<h3>สรุปข้อมูลตัวละคร</h3><p>โปรดเลือกผู้เล่นเพื่อดูสรุปข้อมูล</p>";
        previousPlayerState = null;
        return;
    }
    
    const buffColor = '#00ff00';
    const debuffColor = '#ff4d4d';
    const shadowStyle = 'text-shadow: 1px 1px 3px #000, -1px -1px 3px #000;';

    const permLevel = player.level || 1;
    const tempLevel = player.tempLevel || 0;
    
    const currentStats = {
        Level: permLevel,
        TempLevel: tempLevel,
        HP: player.hp,
        MaxHP: calculateHP(player.race, player.class, calculateTotalStat(player, 'CON')),
        STR: calculateTotalStat(player, 'STR'),
        DEX: calculateTotalStat(player, 'DEX'),
        CON: calculateTotalStat(player, 'CON'),
        INT: calculateTotalStat(player, 'INT'),
        WIS: calculateTotalStat(player, 'WIS'),
        CHA: calculateTotalStat(player, 'CHA'),
    };

    let htmlContent = `<h3>สรุปข้อมูลตัวละคร</h3>`;

    if (!previousPlayerState || previousPlayerState.name !== player.name) {
        // --- โหลดครั้งแรก หรือเปลี่ยนตัวละคร ---
        let levelDisplay = `<strong>ระดับ (Level):</strong> ${currentStats.Level}`;
        if (currentStats.TempLevel !== 0) {
            const totalLevel = currentStats.Level + currentStats.TempLevel;
            levelDisplay += ` <span style="color: ${currentStats.TempLevel > 0 ? buffColor : debuffColor}; ${shadowStyle}">(${totalLevel}) ${currentStats.TempLevel > 0 ? '⏫' : '⏬'}</span>`;
        }
        htmlContent += `<p>${levelDisplay}</p><p><strong>เผ่าพันธุ์/อาชีพ:</strong> ${player.race} ${player.class}</p><hr>`;
        htmlContent += `<p><strong>HP:</strong> ${currentStats.HP} / ${currentStats.MaxHP}</p>`;
        const statOrder = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
        for(const stat of statOrder){
            htmlContent += `<p><strong>${stat}:</strong> ${currentStats[stat]}</p>`;
        }
    } else {
        // --- โหลดซ้ำ (เปรียบเทียบค่า) ---
        let levelHtml = '';
        if(previousPlayerState.Level !== currentStats.Level){
            levelHtml = `<p><strong>ระดับ (Level):</strong> ${previousPlayerState.Level} -> <span style="color:${currentStats.Level > previousPlayerState.Level ? buffColor : debuffColor}; ${shadowStyle}">${currentStats.Level} ${currentStats.Level > previousPlayerState.Level ? '⏫' : '⏬'}</span></p>`;
        } else {
            let levelDisplay = `<strong>ระดับ (Level):</strong> ${currentStats.Level}`;
            if (currentStats.TempLevel !== 0) {
                 const newTotalLevel = currentStats.Level + currentStats.TempLevel;
                 levelDisplay += ` <span style="color: ${currentStats.TempLevel > 0 ? buffColor : debuffColor}; ${shadowStyle}">(${newTotalLevel}) ${currentStats.TempLevel > 0 ? '⏫' : '⏬'}</span>`;
            }
            levelHtml = `<p>${levelDisplay}</p>`;
        }
        htmlContent += `${levelHtml}<p><strong>เผ่าพันธุ์/อาชีพ:</strong> ${player.race} ${player.class}</p><hr>`;

        const statOrder = ['HP', 'STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
        for (const stat of statOrder) {
            const oldValue = previousPlayerState[stat];
            const newValue = currentStats[stat];
            let indicator = newValue > oldValue ? '⏫' : (newValue < oldValue ? '⏬' : '');
            const color = newValue > oldValue ? buffColor : debuffColor;

            if (stat === 'HP') {
                htmlContent += `<p><strong>HP:</strong> ${oldValue !== newValue ? `${oldValue} -> <span style="color:${color}; ${shadowStyle}">${newValue} ${indicator}</span>` : newValue} / ${currentStats.MaxHP}</p>`;
            } else {
                 if (oldValue !== newValue) {
                    htmlContent += `<p><strong>${stat}:</strong> ${oldValue} -> <span style="color:${color}; ${shadowStyle}">${newValue} ${indicator}</span></p>`;
                } else {
                    htmlContent += `<p><strong>${stat}:</strong> ${newValue}</p>`;
                }
            }
        }
    }
    output.innerHTML = htmlContent;
    previousPlayerState = { name: player.name, ...currentStats };
}

function loadItemList() {
    const name = document.getElementById("playerSelect").value;
    const players = JSON.parse(localStorage.getItem("players"));
    const player = players ? players[name] : null;
    const select = document.getElementById("itemSelect");
    select.innerHTML = "";
    if (player && Array.isArray(player.inventory) && player.inventory.length > 0) {
        player.inventory.forEach(item => {
            const option = document.createElement("option");
            option.value = item.name;
            option.textContent = `${item.name} (x${item.quantity})`;
            select.appendChild(option);
        });
    } else {
        const option = document.createElement("option");
        option.textContent = "ไม่มีไอเทม";
        option.disabled = true;
        select.appendChild(option);
    }
}

function loadExistingItemList() {
    const name = document.getElementById("playerSelect").value;
    const players = JSON.parse(localStorage.getItem("players"));
    const player = players ? players[name] : null;
    const select = document.getElementById("existingItemSelect");
    if (!select) return;
    select.innerHTML = "";
    if (player && Array.isArray(player.inventory) && player.inventory.length > 0) {
        player.inventory.forEach(item => {
            const option = document.createElement("option");
            option.value = item.name;
            option.textContent = `${item.name} (x${item.quantity})`;
            select.appendChild(option);
        });
    } else {
        const option = document.createElement("option");
        option.textContent = "ไม่มีไอเทม";
        option.disabled = true;
        select.appendChild(option);
    }
}

function loadPlayerDiceLog() {
    const logs = JSON.parse(localStorage.getItem("diceLogs")) || [];
    const logList = document.getElementById("playerDiceLog");
    if (!logList) return;
    logList.innerHTML = "";
    if (logs.length === 0) {
        logList.innerHTML = "<li>ไม่มีบันทึกการทอยเต๋า</li>";
        return;
    }
    logs.slice().reverse().slice(0, 10).forEach(log => {
        const li = document.createElement("li");
        const total = log.result.reduce((a, b) => a + b, 0);
        li.textContent = `[${log.timestamp || ''}] ${log.name} ทอย ${log.count}d${log.dice}: [${log.result.join(', ')}] รวม: ${total}`;
        logList.appendChild(li);
    });
}

// =================================================================================
// ส่วนที่ 5: Event Listener เริ่มต้นการทำงาน
// =================================================================================

window.onload = function() {
    loadPlayerList();
    const playerSelect = document.getElementById("playerSelect");
    if (playerSelect) {
        playerSelect.addEventListener('change', loadPlayer);
    }
};