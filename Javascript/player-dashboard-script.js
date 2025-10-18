let previousPlayerState = null;

// =================================================================================
// ส่วนที่ 1: Utility Functions
// =================================================================================

function showCustomAlert(message, iconType = 'info') {
    const buttonColor = iconType === 'error' ? '#dc3545' : '#28a745';
    Swal.fire({
        title: iconType === 'success' ? 'สำเร็จ!' : iconType === 'error' ? 'ข้อผิดพลาด!' : '⚠️ แจ้งเตือน!',
        text: message,
        icon: iconType,
        confirmButtonText: 'ตกลง',
        confirmButtonColor: buttonColor,
    });
}

/**
 * [ใหม่] คำนวณโบนัสสเตตัสเผ่า + ค่าพื้นฐาน
 */
function getRaceStatBonus(charRace) {
    const baseStats = { STR: 5, DEX: 5, CON: 5, INT: 5, WIS: 5, CHA: 5 };
    const racialBonuses = {
      'มนุษย์': { STR: 3, DEX: 3, CON: 3, INT: 3, WIS: 3, CHA: 3 }, 'เอลฟ์': { DEX: 8, INT: 4 , CHA: 6}, 
      'คนแคระ': { CON: 9, STR: 5 }, 'ฮาล์ฟลิ่ง': { DEX: 12, CHA: 3 }, 'ไทฟลิ่ง': { DEX: 6, CHA: 6, INT: 3 }, 
      'แวมไพร์': { DEX: 7, CHA: 7 }, 'เงือก': { CON: 8, WIS: 4 }, 'ออร์ค': { STR: 10, CON: 5 }, 
      'โนม': { INT: 7, DEX: 4 }, 'เอลฟ์ดำ': { DEX: 9, CHA: 5 }, 'นางฟ้า': { WIS: 8, CHA: 4 }, 
      'มาร': { STR: 8, CHA: 8 }, 'โกเลม': { CON: 15, STR: 7 } 
    };
    const finalStats = { ...baseStats };
    const bonus = racialBonuses[charRace] || {};
    for (const stat in bonus) {
        finalStats[stat] += bonus[stat];
    }
    return finalStats;
}

/**
 * [ใหม่] คำนวณโบนัสสเตตัสอาชีพ
 */
function getClassStatBonus(charClass) {
    const classBonuses = {
      'นักรบ': { STR: 20, CON: 12 }, 'นักเวท': { INT: 25, WIS: 10 }, 'นักบวช': { WIS: 22, CHA: 8 }, 
      'โจร': { DEX: 30, CHA: 10 }, 'เรนเจอร์': { DEX: 15, WIS: 10, CON: 8 }, 'อัศวินศักดิ์สิทธิ์': { STR: 18, CHA: 15 }, 
      'บาร์บาเรียน': { STR: 35, CON: 15 }, 'พ่อค้า': { CHA: 25, INT: 10 }, 'แทงค์': { CON: 40, STR: 10 }, 
      'นักปราชญ์': { INT: 20, WIS: 15 }, 'อัศวิน': { STR: 18, CON: 15 }, 'เจ้าเมือง': { CHA: 50, INT: 50 } 
    };
    const defaultStats = { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 };
    return { ...defaultStats, ...classBonuses[charClass] };
}

/**
 * [ใหม่] สูตรคำนวณ HP ใหม่ (HPเผ่า + HPคลาส + โบนัสCON)
 */
function calculateHP(charRace, charClass, finalCon) {
    const racialBaseHP = {
        'มนุษย์': 10, 'เอลฟ์': 8, 'คนแคระ': 12, 'ฮาล์ฟลิ่ง': 8, 'ไทฟลิ่ง': 9,
        'แวมไพร์': 9, 'เงือก': 10, 'ออร์ค': 14, 'โนม': 7, 'เอลฟ์ดำ': 8,
        'นางฟ้า': 6, 'มาร': 11, 'โกเลม': 18
    };
    const classBaseHP = {
      'นักรบ': 12, 'นักเวท': 4, 'นักบวช': 8, 'โจร': 8, 'เรนเจอร์': 10, 'อัศวินศักดิ์สิทธิ์': 14,
      'บาร์บาเรียน': 16, 'พ่อค้า': 6, 'แทงค์': 25, 'นักปราชญ์': 4, 'อัศวิน': 13, 'เจ้าเมือง': 15
    };
    const conModifier = Math.floor((finalCon - 10) / 2);
    const raceHP = racialBaseHP[charRace] || 8;
    const classHP = classBaseHP[charClass] || 6;
    return raceHP + classHP + conModifier;
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

// =================================================================================
// ส่วนที่ 2: ฟังก์ชันหลักในการโหลดและแสดงข้อมูล
// =================================================================================

function loadCharacter() {
    const currentName = localStorage.getItem("character");
    const players = JSON.parse(localStorage.getItem("players")) || {};
    const character = players[currentName];
    const infoPanel = document.getElementById("characterInfoPanel");

    if (!character || !infoPanel) {
        infoPanel.innerHTML = `<h2>ข้อมูลตัวละคร</h2><p>ไม่พบตัวละครในระบบ</p><a href="PlayerCharecter.html"><button>ไปหน้าสร้างตัวละคร</button></a>`;
        return;
    }

    const buffColor = '#00ff00';
    const debuffColor = '#ff4d4d';
    const shadowStyle = 'text-shadow: 1px 1px 3px #000, -1px -1px 3px #000;';

    const currentStats = {
        Level: character.level || 1,
        TempLevel: character.tempLevel || 0,
        HP: character.hp,
        MaxHP: calculateHP(character.race, character.class, calculateTotalStat(character, 'CON')),
        STR: calculateTotalStat(character, 'STR'),
        DEX: calculateTotalStat(character, 'DEX'),
        CON: calculateTotalStat(character, 'CON'),
        INT: calculateTotalStat(character, 'INT'),
        WIS: calculateTotalStat(character, 'WIS'),
        CHA: calculateTotalStat(character, 'CHA'),
    };
    
    let html = `<h2>ข้อมูลตัวละคร</h2>
                <div style="padding: 10px; text-align: center;">
                    <label for="characterSelect"><strong>เลือกตัวละคร:</strong></label>
                    <select id="characterSelect" onchange="switchCharacter()"></select>
                </div>
                <p><strong>ชื่อ:</strong> <span>${character.name}</span></p>
                <p><strong>เผ่าพันธุ์:</strong> <span>${character.race}</span></p>
                <p><strong>อาชีพ:</strong> <span>${character.class}</span></p>`;

    if (!previousPlayerState || previousPlayerState.name !== currentName) {
        let levelDisplay = `${currentStats.Level}`;
        if (currentStats.TempLevel !== 0) {
            const totalLevel = currentStats.Level + currentStats.TempLevel;
            levelDisplay += ` <span style="color: ${currentStats.TempLevel > 0 ? buffColor : debuffColor}; ${shadowStyle}">(${totalLevel}) ${currentStats.TempLevel > 0 ? '⏫' : '⏬'}</span>`;
        }
        html += `<p><strong>เลเวล:</strong> ${levelDisplay}</p>`;
        html += `<p><strong>พลังชีวิต:</strong> ${currentStats.HP} / ${currentStats.MaxHP}</p>`;
        html += `<ul>
                    <li>พลังโจมตี (STR): ${currentStats.STR}</li>
                    <li>ความคล่องแคล่ว (DEX): ${currentStats.DEX}</li>
                    <li>ความทนทาน (CON): ${currentStats.CON}</li>
                    <li>สติปัญญา (INT): ${currentStats.INT}</li>
                    <li>จิตใจ (WIS): ${currentStats.WIS}</li>
                    <li>เสน่ห์ (CHA): ${currentStats.CHA}</li>
                 </ul>`;
    } else {
        let levelDisplay = '';
        if(previousPlayerState.Level !== currentStats.Level){
            levelDisplay = `${previousPlayerState.Level} -> <span style="color: ${currentStats.Level > previousPlayerState.Level ? buffColor : debuffColor}; ${shadowStyle}">${currentStats.Level} ${currentStats.Level > previousPlayerState.Level ? '⏫' : '⏬'}</span>`;
        } else {
            levelDisplay = `${currentStats.Level}`;
            if (currentStats.TempLevel !== 0) {
                const totalLevel = currentStats.Level + currentStats.TempLevel;
                levelDisplay += ` <span style="color: ${currentStats.TempLevel > 0 ? buffColor : debuffColor}; ${shadowStyle}">(${totalLevel}) ${currentStats.TempLevel > 0 ? '⏫' : '⏬'}</span>`;
            }
        }
        html += `<p><strong>เลเวล:</strong> ${levelDisplay}</p>`;

        const statOrder = ['HP', 'STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
        for(const stat of statOrder){
            const oldValue = previousPlayerState[stat];
            const newValue = currentStats[stat];
            let indicator = newValue > oldValue ? '⏫' : (newValue < oldValue ? '⏬' : '');
            let color = newValue > oldValue ? buffColor : debuffColor;

            if (stat === 'HP') {
                const maxHP = currentStats.MaxHP;
                html += `<p><strong>พลังชีวิต:</strong> ${oldValue !== newValue ? `${oldValue} -> <span style="color:${color}; ${shadowStyle}">${newValue} ${indicator}</span>` : newValue} / ${maxHP}</p><ul>`;
            } else {
                const label = {'STR':'พลังโจมตี', 'DEX':'ความคล่องแคล่ว', 'CON':'ความทนทาน', 'INT':'สติปัญญา', 'WIS':'จิตใจ', 'CHA':'เสน่ห์'}[stat];
                html += `<li>${label} (${stat}): ${oldValue !== newValue ? `${oldValue} -> <span style="color:${color}; ${shadowStyle}">${newValue} ${indicator}</span>` : newValue}</li>`;
            }
        }
        html += `</ul>`;
    }
    
    infoPanel.innerHTML = html;
    populateCharacterSelect();
    
    const upgradeButton = document.getElementById("goToStatsButton");
    const freePoints = character.freeStatPoints || 0;
    if (freePoints > 0) {
        upgradeButton.style.display = 'block';
        upgradeButton.textContent = `✨ อัปเกรดสถานะ (${freePoints} แต้ม) ✨`;
    } else {
        upgradeButton.style.display = 'none';
    }
    
    previousPlayerState = { name: currentName, ...currentStats };
}

function loadStory() {
    const story = localStorage.getItem("currentStory");
    document.getElementById("story").textContent = story || "ยังไม่มีเนื้อเรื่อง";
}

function loadQuest() {
    const currentName = localStorage.getItem("character");
    const players = JSON.parse(localStorage.getItem("players")) || {};
    const quest = players[currentName]?.quest;
    const questPanel = document.getElementById("questPanel"); // ใช้ ID ที่เรากำหนด

    if (quest && quest.title) {
        // เพิ่มไฮไลท์เมื่อมีเควส
        if(questPanel) {
            questPanel.style.border = '1px solid #ffc107';
            questPanel.style.boxShadow = '0 0 15px rgba(255, 193, 7, 0.4)';
        }
        document.getElementById("questTitle").textContent = quest.title;
        document.getElementById("questDetail").textContent = quest.detail;
        document.getElementById("questReward").textContent = quest.reward || "-";
    } else {
        // เอาไฮไลท์ออกเมื่อไม่มีเควส
        if(questPanel) {
            questPanel.style.border = '';
            questPanel.style.boxShadow = '';
        }
        document.getElementById("questTitle").textContent = "ไม่มีเควส";
        document.getElementById("questDetail").textContent = "-";
        document.getElementById("questReward").textContent = "-";
    }
}


function loadInventory() {
    const currentName = localStorage.getItem("character");
    const players = JSON.parse(localStorage.getItem("players")) || {};
    const inventory = players[currentName]?.inventory || [];
    const list = document.getElementById("inventory");
    list.innerHTML = "";

    if (inventory.length === 0) {
        list.innerHTML = "<li>ยังไม่มีไอเทม</li>";
        return;
    }

    inventory.forEach(item => {
        const li = document.createElement("li");
        li.textContent = `${item.name} (x${item.quantity})`;
        list.appendChild(li);
    });
}
function loadEnemy() {
    const currentName = localStorage.getItem("character");
    const players = JSON.parse(localStorage.getItem("players")) || {};
    const enemy = players[currentName]?.enemy;
    const enemyPanel = document.getElementById("enemyPanel"); // ใช้ ID ที่เรากำหนด

    const defaultStats = { STR: '-', DEX: '-', CON: '-', INT: '-', WIS: '-', CHA: '-' };

    if (enemy && enemy.name) {
        if(enemyPanel) {
            enemyPanel.style.border = '1px solid #dc3545';
            enemyPanel.style.boxShadow = '0 0 15px rgba(220, 53, 69, 0.4)';
        }
        document.getElementById("enemyName").textContent = enemy.name;
        document.getElementById("enemyHp").textContent = enemy.hp;
        document.getElementById("enemyStr").textContent = enemy.stats?.STR || defaultStats.STR;
        document.getElementById("enemyDex").textContent = enemy.stats?.DEX || defaultStats.DEX;
        document.getElementById("enemyCon").textContent = enemy.stats?.CON || defaultStats.CON;
        document.getElementById("enemyInt").textContent = enemy.stats?.INT || defaultStats.INT;
        document.getElementById("enemyWis").textContent = enemy.stats?.WIS || defaultStats.WIS;
        document.getElementById("enemyCha").textContent = enemy.stats?.CHA || defaultStats.CHA;
    } else {
        if(enemyPanel) {
            enemyPanel.style.border = '';
            enemyPanel.style.boxShadow = '';
        }
        document.getElementById("enemyName").textContent = "-";
        document.getElementById("enemyHp").textContent = "-";
        document.getElementById("enemyStr").textContent = "-";
        document.getElementById("enemyDex").textContent = "-";
        document.getElementById("enemyCon").textContent = "-";
        document.getElementById("enemyInt").textContent = "-";
        document.getElementById("enemyWis").textContent = "-";
        document.getElementById("enemyCha").textContent = "-";
    }
}
function playerRollDice() {
    const diceType = parseInt(document.getElementById("diceType").value);
    const diceCount = parseInt(document.getElementById("diceCount").value);
    const resultDiv = document.getElementById("dice-result");
    const name = localStorage.getItem("character") || "ผู้เล่นไม่ทราบชื่อ";

    if (isNaN(diceType) || isNaN(diceCount) || diceCount <= 0 || diceType <= 1) {
        resultDiv.innerHTML = "<p style='color:red;'>โปรดระบุชนิดและจำนวนลูกเต๋าที่ถูกต้อง</p>";
        return;
    }

    let results = [];
    let total = 0;

    for (let i = 0; i < diceCount; i++) {
        const roll = Math.floor(Math.random() * diceType) + 1;
        results.push(roll);
        total += roll;
    }

    resultDiv.innerHTML =
        `คุณทอย **${diceCount}d${diceType}** ได้: [${results.join(', ')}] <br> **รวมทั้งหมด:** ${total}`;

    // บันทึก Log การทอยของผู้เล่น
    const playerLog = {
        name: name,
        dice: diceType,
        count: diceCount,
        result: results,
        timestamp: new Date().toLocaleTimeString('th-TH')
    };
    let logs = JSON.parse(localStorage.getItem("diceLogs")) || [];
    logs.push(playerLog);
    localStorage.setItem("diceLogs", JSON.stringify(logs));
}


function loadData() {
    loadCharacter();
    loadStory();
    loadQuest();
    loadInventory();
    loadEnemy();
}

function populateCharacterSelect() {
    const players = JSON.parse(localStorage.getItem("players")) || {};
    const select = document.getElementById("characterSelect");
    if (!select) return;
    const currentCharacter = localStorage.getItem("character");
    
    const previouslySelected = select.value;
    select.innerHTML = "";
    if (Object.keys(players).length === 0) {
        const opt = document.createElement("option");
        opt.textContent = "ไม่มีตัวละคร";
        select.appendChild(opt);
        return;
    }
    for (let name in players) {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        select.appendChild(option);
    }
    select.value = currentCharacter || previouslySelected || Object.keys(players)[0];
}

function switchCharacter() {
    const selectedName = document.getElementById("characterSelect").value;
    if(selectedName){
        localStorage.setItem("character", selectedName);
        previousPlayerState = null;
        loadData();
        showCustomAlert(`เปลี่ยนเป็นตัวละคร ${selectedName}`, 'info');
    }
}

// =================================================================================
// ส่วนที่ 3: การเริ่มต้นและรีเฟรชข้อมูล
// =================================================================================

document.addEventListener('DOMContentLoaded', () => {
    const players = JSON.parse(localStorage.getItem("players")) || {};
    const playerNames = Object.keys(players);
    let currentCharacter = localStorage.getItem("character");

    if ((!currentCharacter || !players[currentCharacter]) && playerNames.length > 0) {
        localStorage.setItem("character", playerNames[0]);
    }
    
    loadData();
});

setInterval(loadData, 3000);