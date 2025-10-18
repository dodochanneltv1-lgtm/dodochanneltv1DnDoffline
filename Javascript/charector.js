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
 * [อัปเดต] เพิ่มค่าพลังพื้นฐาน 5 ให้ทุกเผ่า และบวกโบนัสทับเข้าไป
 */
function getRaceStatBonus(charRace) {
    const baseStats = { STR: 5, DEX: 5, CON: 5, INT: 5, WIS: 5, CHA: 5 };
    const racialBonuses = {
      'มนุษย์': { STR: 3, DEX: 3, CON: 3, INT: 3, WIS: 3, CHA: 3 }, 
      'เอลฟ์': { DEX: 8, INT: 4 , CHA: 6}, 
      'คนแคระ': { CON: 9, STR: 5 }, 
      'ฮาล์ฟลิ่ง': { DEX: 12, CHA: 3 }, 
      'ไทฟลิ่ง': { DEX: 6, CHA: 6, INT: 3 }, 
      'แวมไพร์': { DEX: 7, CHA: 7 }, 
      'เงือก': { CON: 8, WIS: 4 }, 
      'ออร์ค': { STR: 10, CON: 5 }, 
      'โนม': { INT: 7, DEX: 4 }, 
      'เอลฟ์ดำ': { DEX: 9, CHA: 5 }, 
      'นางฟ้า': { WIS: 8, CHA: 4 }, 
      'มาร': { STR: 8, CHA: 8 }, 
      'โกเลม': { CON: 15, STR: 7 } 
    };
    const finalStats = { ...baseStats };
    const bonus = racialBonuses[charRace] || {};
    for (const stat in bonus) {
        finalStats[stat] += bonus[stat];
    }
    return finalStats;
}

/**
 * [อัปเดต] ปรับโครงสร้างเพื่อความชัดเจน (ผลลัพธ์เหมือนเดิม)
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
 * [อัปเดต] เพิ่ม HP พื้นฐานของเผ่า และปรับสูตรคำนวณใหม่
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
    const raceHP = racialBaseHP[charRace] || 8; // เผ่าที่ไม่ระบุได้ 8
    const classHP = classBaseHP[charClass] || 6; // อาชีพที่ไม่ระบุได้ 6
    
    // สูตรใหม่: HP เผ่า + HP คลาส + โบนัส CON
    return raceHP + classHP + conModifier;
}

function createCharacter() {
    const name = document.getElementById('name').value.trim();
    const background = document.getElementById('background').value.trim();
    const age = document.getElementById('age').value.trim();
    const gender = document.getElementById('gender').value;
    const race = document.getElementById('race').value;
    const charClass = document.getElementById('class').value;
    const alignment = document.getElementById('alignment').value;
    
    if (race === 'นางฟ้า' && gender !== 'หญิง') {
        showCustomAlert("เผ่าพันธุ์ 'นางฟ้า' สามารถเลือกได้เฉพาะเพศ 'หญิง' เท่านั้น!", 'error');
        document.getElementById('gender').focus();
        return;
    }
    if (name === "") {
        showCustomAlert("กรุณาระบุชื่อตัวละครก่อน!", 'warning');
        document.getElementById('name').focus();
        return;
    }
    if (age === "" || parseInt(age) <= 0) {
        showCustomAlert("กรุณาระบุอายุที่ถูกต้อง (ต้องมากกว่า 0)!", 'warning');
        document.getElementById('age').focus();
        return;
    }
    if (background === "") {
        showCustomAlert("กรุณาระบุภูมิหลังตัวละครก่อน!", 'warning');
        document.getElementById('background').focus();
        return;
    }

    const baseRaceStats = getRaceStatBonus(race);
    const baseClassStats = getClassStatBonus(charClass);
    
    const investedStats = { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 };
    const tempStats = { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 };
    
    const initialCon = baseRaceStats.CON + baseClassStats.CON;
    const hp = calculateHP(race, charClass, initialCon);

    const characterData = {
        name, gender, age, race, class: charClass, background, alignment,
        level: 1, freeStatPoints: 10,
        stats: { baseRaceStats, baseClassStats, investedStats, tempStats },
        hp, inventory: [], quest: null, enemy: null
    };

    const players = JSON.parse(localStorage.getItem("players")) || {};
    
    if (players[name]) {
        showCustomAlert(`ชื่อตัวละคร "${name}" มีอยู่ในระบบแล้ว!`, 'error');
        return;
    }
    
    players[name] = characterData;
    localStorage.setItem("players", JSON.stringify(players));
    localStorage.setItem("character", name);

    showCustomAlert("สร้างตัวละครสำเร็จ! กำลังไปหน้าลงแต้มสถานะ", 'success');

    setTimeout(() => {
        window.location.href = "stat-assignment.html";
    }, 1000); 
}