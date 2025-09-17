// =================================================================
//         DATA & CONSTANTS
// =================================================================
const PILL_COLORS = { '1': '#F5F5DC', '2': 'orange', '3': 'skyblue', '5': 'hotpink' };

const dosageRules = {
    "Goal2-3": [ 
        { inr: '< 1.5', bleeding: 'no Bleeding', management: 'Increase weekly dose 10-20%', addOn: '' },
        { inr: '1.5-1.9', bleeding: 'no Bleeding', management: 'Increase weekly dose 5-10%', addOn: '' },
        { inr: '2-3', bleeding: 'no Bleeding', management: 'No change', addOn: '' },
        { inr: '3.1-3.9', bleeding: 'no Bleeding', management: 'Decrease weekly dose 5-10%', addOn: '' },
        { inr: '4-4.9', bleeding: 'no Bleeding', management: 'Decrease weekly dose 5-10%', addOn: 'Hold 1 dose' },
        { inr: '5-7.9', bleeding: 'no Bleeding', management: 'decrease dose by 10-20%', addOn: 'Hold 1-2 dose' },
        { inr: '5-7.9', bleeding: 'Minor Bleeding', management: 'decrease dose by 10-20%', addOn: 'Hold 1-2 dose, Vitamin K 1 mg orally, Restart INR < 5' },
        { inr: '8-8.9', bleeding: 'no Bleeding', management: 'decrease dose by 15-20%', addOn: 'Hold 1-2 dose, Vitamin K 1 mg orally, Restart INR < 5, ตาม INR ภายใน 24 ชั่วโมง' },
        { inr: '>= 9', bleeding: 'no Bleeding', management: 'decrease dose by 15-20%', addOn: 'Vitamin K 5-10 mg orally, ตาม INR ภายใน 24 ชั่วโมง' },
        { inr: 'Any INR', bleeding: 'Major Bleeding', management: 'decrease dose by 15-20%', addOn: 'Vitamin K 10 MG IV plus FFP, Repeat Vit K every 12 hrs if need' }
    ],
    "Goal2.5-3.5": [ 
        { inr: '< 1.9', bleeding: 'no Bleeding', management: 'Increase weekly dose 10-20%', addOn: '' },
        { inr: '1.9-2.4', bleeding: 'no Bleeding', management: 'Increase weekly dose 5-10%', addOn: '' },
        { inr: '2.5-3.5', bleeding: 'no Bleeding', management: 'No change', addOn: '' },
        { inr: '3.6-4.5', bleeding: 'no Bleeding', management: 'Decrease weekly dose 5-10%', addOn: '' },
        { inr: '4.6-4.9', bleeding: 'no Bleeding', management: 'Decrease weekly dose 5-10%', addOn: 'Hold 1 dose' },
        { inr: '5-7.9', bleeding: 'no Bleeding', management: 'decrease dose by 10-20%', addOn: 'Hold 1-2 dose' },
        { inr: '5-7.9', bleeding: 'Minor Bleeding', management: 'decrease dose by 10-20%', addOn: 'Hold 1-2 dose, Vitamin K 1 mg orally, Restart INR < 5' },
        { inr: '8-8.9', bleeding: 'no Bleeding', management: 'decrease dose by 15-20%', addOn: 'Hold 1-2 dose, Vitamin K 1 mg orally, Restart INR < 5, ตาม INR ภายใน 24 ชั่วโมง' },
        { inr: '>= 9', bleeding: 'no Bleeding', management: 'decrease dose by 15-20%', addOn: 'Vitamin K 5-10 mg orally, ตาม INR ภายใน 24 ชั่วโมง' },
        { inr: 'Any INR', bleeding: 'Major Bleeding', management: 'decrease dose by 15-20%', addOn: 'Vitamin K 10 MG IV plus FFP, Repeat Vit K every 12 hrs if need' }
    ]
};

// =================================================================
//                    EVENT LISTENERS
// =================================================================
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.segmented-control .btn').forEach(button => {
        button.addEventListener('click', function() {
            document.querySelectorAll('.segmented-control .btn').forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });
    document.getElementById('warfarin-form').addEventListener('submit', function(e) {
        e.preventDefault(); 
        const availablePills = Array.from(document.querySelectorAll('.available-pills:checked')).map(cb => parseFloat(cb.value));
        if (availablePills.length === 0) { 
            alert("กรุณาเลือกขนาดยาที่มีในโรงพยาบาลอย่างน้อย 1 ขนาด"); 
            return; 
        }
        const inrTargetValue = document.querySelector('#inrTarget .btn.active').dataset.value;
        const data = { 
            inrTarget: inrTargetValue, 
            inrLevel: parseFloat(document.getElementById('inrLevel').value), 
            weeklyDose: parseFloat(document.getElementById('weeklyDose').value), 
            bleeding: document.getElementById('bleeding').value, 
            availablePills: availablePills 
        };
        document.getElementById('results-wrapper').style.display = 'block';
        document.getElementById('loading-spinner').style.display = 'block';
        document.getElementById('results').innerHTML = '';
        document.getElementById('regimen-results').innerHTML = '';
        try {
            setTimeout(() => {
                const result = calculateDosageAdjustment(data);
                displayAdjustmentOptions(result);
            }, 50);
        } catch (error) {
            showError(error);
        }
    });
});

// =================================================================
//                    CORE FUNCTIONS
// =================================================================

function calculateDosageAdjustment(data) {
    const sheetName = data.inrTarget === "2-3" ? "Goal2-3" : "Goal2.5-3.5";
    const rules = dosageRules[sheetName];
    if (!rules) throw new Error(`ไม่พบชุดกฎที่ชื่อว่า: ${sheetName}`);
    let matchedRule = null;
    for (const rule of rules) {
        const inrRule = rule.inr.trim().toLowerCase();
        const bleedingRule = rule.bleeding.trim().toLowerCase();
        let isMatch = false;
        if (bleedingRule.replace(/ /g, '') !== data.bleeding.trim().toLowerCase().replace(/ /g, '')) {
            continue;
        }
        if (inrRule === 'any inr') {
            isMatch = true;
        } else if (inrRule.startsWith('<')) {
            const limit = parseFloat(inrRule.replace(/<| /g, ''));
            if (data.inrLevel < limit) isMatch = true;
        } else if (inrRule.startsWith('>=')) {
            const limit = parseFloat(inrRule.replace(/>=| /g, ''));
            if (data.inrLevel >= limit) isMatch = true;
        } else if (inrRule.includes('-')) {
            const [min, max] = inrRule.split('-').map(parseFloat);
            if (data.inrLevel >= min && data.inrLevel <= max) isMatch = true;
        }
        if (isMatch) {
            matchedRule = rule;
            break;
        }
    }
    if (!matchedRule) {
        return { error: "ไม่พบเกณฑ์การปรับยาที่ตรงกับข้อมูลที่ระบุ" };
    }
    const managementText = matchedRule.management.toLowerCase();
    const currentDose = data.weeklyDose;
    let newDoses = [];
    if (managementText.includes('no change')) {
        newDoses.push({ percent: 0, dose: currentDose });
    } else {
        const uniqueDoseOptions = new Map();
        if (managementText.includes('increase') || managementText.includes('decrease')) {
            const percentages = managementText.match(/\d+/g);
            if (percentages && percentages.length > 0) {
                const minPercent = parseInt(percentages[0]);
                const maxPercent = parseInt(percentages[1] || percentages[0]);
                const midPercent = (minPercent + maxPercent) / 2;
                const adjustments = [...new Set([minPercent, midPercent, maxPercent])];
                adjustments.forEach(percent => {
                    let baseAdjustment = currentDose * (percent / 100);
                    let baseDose = managementText.includes('increase') ? currentDose + baseAdjustment : currentDose - baseAdjustment;
                    const roundedBaseDose = Math.round(baseDose * 2) / 2;
                    const potentialDoses = [roundedBaseDose, Math.round((roundedBaseDose * 0.98) * 2) / 2, Math.round((roundedBaseDose * 1.02) * 2) / 2];
                    potentialDoses.forEach(dose => {
                        if (dose > 0 && !uniqueDoseOptions.has(dose)) {
                            const actualPercentChange = ((dose - currentDose) / currentDose) * 100;
                            uniqueDoseOptions.set(dose, { percent: actualPercentChange, dose: dose });
                        }
                    });
                });
            }
        }
        newDoses = Array.from(uniqueDoseOptions.values());
        newDoses = newDoses.filter(option => Math.abs(option.dose - currentDose) > 0.01);
        const percentages = managementText.match(/\d+/g);
        if (percentages && percentages.length > 0) {
            const minPercent = parseInt(percentages[0]);
            const maxPercent = parseInt(percentages[1] || percentages[0]);
            const tolerance = 3.5;
            newDoses = newDoses.filter(option => {
                const changePercent = option.percent;
                if (managementText.includes('increase')) {
                    return changePercent >= minPercent - tolerance && changePercent <= maxPercent + tolerance;
                } else {
                    return changePercent <= -(minPercent - tolerance) && changePercent >= -(maxPercent + tolerance);
                }
            });
        }
    }
    newDoses.sort((a, b) => a.dose - b.dose);
    return { success: true, newDoses, addOn: matchedRule.addOn, management: matchedRule.management };
}

function displayAdjustmentOptions(result) {
    document.getElementById('loading-spinner').style.display = 'none';
    const resultsDiv = document.getElementById('results');
    if (result.error) { showError({ message: result.error }); return; }
    let html = `<h4><i class="fas fa-poll"></i> ผลการประเมิน</h4>`;
    html += `<div class="alert alert-info"><strong>แนวทางการจัดการ:</strong> ${result.management}</div>`;
    if (result.addOn) { html += `<div class="alert alert-warning"><strong>หมายเหตุเพิ่มเติม (Add on):</strong> ${result.addOn}</div>`; }
    html += `<h5><i class="fas fa-prescription-bottle-alt"></i> เลือกขนาดยาต่อสัปดาห์ใหม่:</h5>`;
    resultsDiv.innerHTML = html;
    const gridContainer = document.createElement('div');
    gridContainer.className = 'dose-options-grid';
    result.newDoses.forEach(option => {
        let changeText = '';
        let iconClass = 'fa-equals';
        let cardClass = 'dose-no-change';
        if (option.percent > 0.1) {
            changeText = `เพิ่ม ${option.percent.toFixed(0)}%`;
            iconClass = 'fa-arrow-up';
            cardClass = 'dose-increase';
        } else if (option.percent < -0.1) {
            changeText = `ลด ${Math.abs(option.percent).toFixed(0)}%`;
            iconClass = 'fa-arrow-down';
            cardClass = 'dose-decrease';
        } else {
            changeText = 'คงเดิม';
        }
        const optionDiv = document.createElement('div');
        optionDiv.className = `dose-option ${cardClass}`;
        optionDiv.dataset.dose = option.dose;
        optionDiv.innerHTML = `
        <div class="dose-icon"><i class="fas ${iconClass}"></i></div>
        <div class="dose-info">
          <div class="dose-value">${option.dose.toFixed(1)} mg/wk</div>
          <div class="dose-percent">${changeText}</div>
        </div>`;
        optionDiv.addEventListener('click', function() {
            document.querySelectorAll('.dose-option').forEach(el => el.classList.remove('selected'));
            this.classList.add('selected');
            generateDailyRegimens(this.dataset.dose);
        });
        gridContainer.appendChild(optionDiv);
    });
    resultsDiv.appendChild(gridContainer);
}

function generateDailyRegimens(selectedDose) {
    document.getElementById('loading-spinner').style.display = 'block';
    document.getElementById('regimen-results').innerHTML = '';
    const availablePills = Array.from(document.querySelectorAll('.available-pills:checked')).map(cb => parseFloat(cb.value));
    setTimeout(() => {
        const regimens = generateRegimens(parseFloat(selectedDose), availablePills);
        displayRegimens(regimens);
    }, 50);
}

function displayRegimens(regimens) {
    document.getElementById('loading-spinner').style.display = 'none';
    const regimenDiv = document.getElementById('regimen-results');
    if (!regimens || regimens.length === 0 || !regimens[0].days || regimens[0].days.length === 0) { 
      regimenDiv.innerHTML = `<div class="alert alert-warning">ไม่สามารถสร้างแผนการทานยาแบบง่ายได้ด้วยขนาดยาที่มีอยู่</div>`; return; 
    }
    const dayClasses = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    let html = `<h4><i class="fas fa-calendar-check"></i> เลือกแผนการรับประทานยา (Regimen)</h4>`;
    regimens.forEach((regimen, index) => {
        const regimenJson = JSON.stringify(regimen).replace(/"/g, '&quot;');
        const doseCounts = regimen.days.reduce((acc, day) => { acc[day.dose] = (acc[day.dose] || 0) + 1; return acc; }, {});
        const mainDose = Object.keys(doseCounts).length > 0 ? parseFloat(Object.keys(doseCounts).reduce((a, b) => doseCounts[a] > doseCounts[b] ? a : b)) : 0;
        const dailyCardsHtml = regimen.days.map((day, dayIndex) => {
          const dayClass = `day-${dayClasses[dayIndex]}`;
          const specialClass = day.dose !== mainDose ? 'day-card-special' : '';
          let instructionHtml = 'ไม่ทานยา';
          if (day.icons && day.icons.length > 0) {
            instructionHtml = day.icons.map(icon => `<i class="${icon.class}" style="color: ${icon.color};"></i>`).join('');
          }
          return `<div class="col"><div class="day-card ${dayClass} ${specialClass}"><div class="day-header">${day.day}</div><div class="day-dose">(${day.dose.toFixed(1)} mg)</div><div class="day-instruction">${instructionHtml}</div></div></div>`;
        }).join('');
        const summaryPills = {};
        regimen.days.forEach(day => {
            if(day.combo) {
                day.combo.forEach(pill => {
                    const key = `${pill.mg}mg`;
                    const amount = pill.count * (pill.half ? 0.5 : 1);
                    summaryPills[key] = (summaryPills[key] || 0) + amount;
                });
            }
        });
        const summaryHtml = Object.entries(summaryPills).map(([pill, count]) => {
          const color = PILL_COLORS[pill.replace('mg','')] || 'gray';
          return `<li><i class="fas fa-circle" style="color: ${color}; ${pill === '1mg' ? 'border: 1px solid #ccc;' : ''}"></i> ${pill}: ${count} เม็ด</li>`;
        }).join('');
        html += `
          <div class="regimen-card">
            <h5>ตัวเลือก ${index + 1}: ${regimen.title}</h5>
            <div class="row no-gutters">${dailyCardsHtml}</div>
            <div class="mt-3">
              <strong>รวมยาที่ใช้สำหรับ 1 สัปดาห์:</strong>
              <ul class="pill-summary-list">${summaryHtml}</ul>
            </div>
            <button class="btn btn-sm btn-outline-secondary mt-2" onclick='printLabel(${regimenJson})'>
              <i class="fas fa-print"></i> พิมพ์ฉลากยา
            </button>
          </div>`;
    });
    regimenDiv.innerHTML = html;
}

function printLabel(regimen) {
    const printArea = document.getElementById('print-area');
    const dayClasses = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    const styles = `
      <style>
        .print-container { width: 98%; height: 95%; display: flex; justify-content: space-around; align-items: stretch; gap: 1.5%; }
        .print-day-card { flex: 1; display: flex; flex-direction: column; border: 0.5px solid #aaaaaa; border-radius: 4px; overflow: hidden; text-align: center; }
        .print-day-header { padding: 4% 0; font-size: 2.2vw; font-weight: bold; color: #333; }
        .print-day-body { flex-grow: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2% 0; background-color: white; }
        .print-dose-mg { font-size: 2.0vw; color: #555; }
        .print-dose-icons { margin-top: 5%; }
        .print-dose-icons i { font-size: 4vw; margin: 0 2%; }
        .p-day-mon .print-day-header { background-color: hsl(55, 100%, 92%) !important; }
        .p-day-tue .print-day-header { background-color: hsl(340, 100%, 95%) !important; }
        .p-day-wed .print-day-header { background-color: hsl(120, 100%, 94%) !important; }
        .p-day-thu .print-day-header { background-color: hsl(30, 100%, 93%) !important; }
        .p-day-fri .print-day-header { background-color: hsl(205, 100%, 94%) !important; }
        .p-day-sat .print-day-header { background-color: hsl(270, 100%, 95%) !important; }
        .p-day-sun .print-day-header { background-color: hsl(0, 100%, 95%) !important; }
      </style>
    `;
    const dailyCardsHtml = regimen.days.map((day, index) => {
        const dayClass = `p-day-${dayClasses[index]}`;
        let instructionHtml = '<span>-</span>';
        if (day.icons && day.icons.length > 0) {
            instructionHtml = day.icons.map(icon => {
                const beigeFixStyle = icon.color === '#F5F5DC' ? 'border: 0.5px solid #ccc;' : '';
                return `<i class="${icon.class}" style="color: ${icon.color}; ${beigeFixStyle}"></i>`;
            }).join('');
        }
        return `
        <div class="print-day-card ${dayClass}"> 
          <div class="print-day-header">${day.day}</div>
          <div class="print-day-body">
            <div class="print-dose-mg">(${day.dose.toFixed(1)} mg)</div>
            <div class="print-dose-icons">${instructionHtml}</div>
          </div>
        </div>`;
    }).join('');
    printArea.innerHTML = styles + `<div class="print-container">${dailyCardsHtml}</div>`;
    setTimeout(function() {
        window.print();
    }, 100);
}

function showError(error) {
    document.getElementById('loading-spinner').style.display = 'none';
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = `<div class="alert alert-danger"><strong><i class="fas fa-exclamation-triangle"></i> เกิดข้อผิดพลาด:</strong> ${error.message}</div>`;
}

function findPillCombinationsForDose(targetDose, availablePills, maxPills = 3) {
    const results = [];
    const pillOptions = [];
    availablePills.sort((a, b) => b - a).forEach(p => {
        pillOptions.push({ mg: p, half: false });
        pillOptions.push({ mg: p, half: true });
    });
    function findRecursive(remainingDose, currentCombo, startIndex) {
        if (Math.abs(remainingDose) < 0.01) {
            const aggregated = {};
            currentCombo.forEach(pill => {
                const key = `${pill.mg}-${pill.half}`;
                if (!aggregated[key]) aggregated[key] = { mg: pill.mg, half: pill.half, count: 0 };
                aggregated[key].count++;
            });
            results.push(Object.values(aggregated));
            return;
        }
        if (remainingDose < 0 || currentCombo.length >= maxPills || startIndex >= pillOptions.length) { return; }
        const currentPill = pillOptions[startIndex];
        const currentPillValue = currentPill.half ? currentPill.mg / 2 : currentPill.mg;
        if (currentPillValue <= remainingDose + 0.01) {
            currentCombo.push(currentPill);
            findRecursive(remainingDose - currentPillValue, currentCombo, startIndex);
            currentCombo.pop();
        }
        findRecursive(remainingDose, currentCombo, startIndex + 1);
    }
    findRecursive(targetDose, [], 0);
    const seen = new Set();
    return results.filter(combo => {
        const key = JSON.stringify(combo.sort((a, b) => a.mg - b.mg));
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function generateRegimens(weeklyDose, availablePills) {
    let options = [];
    const seenOptions = new Set();
    const FLOAT_TOLERANCE = 0.01;
    const dailyDose = weeklyDose / 7;
    if (dailyDose >= 0) {
        const uniformCombos = findPillCombinationsForDose(dailyDose, availablePills);
        uniformCombos.forEach(combo => {
            const key = `uniform-${JSON.stringify(combo)}`;
            if (!seenOptions.has(key)) {
                seenOptions.add(key);
                options.push({ type: 'uniform', combo: combo, weeklyDoseActual: weeklyDose, priority: 0 });
            }
        });
    }
    const possibleDailyDoses = getPossibleDailyDoses(availablePills).filter(d => d > 0);
    for (let numStopDays = 1; numStopDays <= 3; numStopDays++) {
        const activeDays = 7 - numStopDays;
        if (activeDays <= 0) continue;
        const targetDose = weeklyDose / activeDays;
        const normalDayCombos = findPillCombinationsForDose(targetDose, availablePills);
        if (normalDayCombos.length > 0) {
            getCombinationsOfIndices(7, numStopDays).forEach(stopDaysIndices => {
                const comboWeekly = Array(7).fill(null);
                let actualWeeklyDose = 0;
                for (let i = 0; i < 7; i++) {
                    if (!stopDaysIndices.includes(i)) {
                        comboWeekly[i] = normalDayCombos[0];
                        actualWeeklyDose += targetDose;
                    } else {
                        comboWeekly[i] = [];
                    }
                }
                const key = `stop-${numStopDays}-${JSON.stringify(normalDayCombos[0])}`;
                if (!seenOptions.has(key)) {
                    seenOptions.add(key);
                    options.push({ type: 'non-uniform', comboWeekly, weeklyDoseActual: actualWeeklyDose, numStopDays, numSpecialDays: 0, priority: 1 });
                }
            });
        }
    }
    for (let numSpecialDays = 1; numSpecialDays <= 3; numSpecialDays++) {
        const normalDays = 7 - numSpecialDays;
        if (normalDays <= 0) continue;
        for (const normalDose of possibleDailyDoses) {
            const specialDoseTotal = weeklyDose - (normalDays * normalDose);
            if (specialDoseTotal >= 0) {
                const specialDose = specialDoseTotal / numSpecialDays;
                if (specialDose >= 0 && Math.abs(specialDose - normalDose) > FLOAT_TOLERANCE) {
                    const normalDayCombos = findPillCombinationsForDose(normalDose, availablePills);
                    const specialDayCombos = findPillCombinationsForDose(specialDose, availablePills);
                    if (normalDayCombos.length > 0 && specialDayCombos.length > 0) {
                        const key = `special-${numSpecialDays}-${JSON.stringify(normalDayCombos[0])}-${JSON.stringify(specialDayCombos[0])}`;
                        if (!seenOptions.has(key)) {
                            seenOptions.add(key);
                            const comboWeekly = Array(normalDays).fill(normalDayCombos[0]).concat(Array(numSpecialDays).fill(specialDayCombos[0]));
                            options.push({ type: 'non-uniform', comboWeekly, weeklyDoseActual: weeklyDose, numStopDays: 0, numSpecialDays, priority: 1 });
                        }
                    }
                }
            }
        }
    }
    options.sort((a, b) => {
        const aHalfComplexity = getHalfPillComplexity(a);
        const bHalfComplexity = getHalfPillComplexity(b);
        if (aHalfComplexity !== bHalfComplexity) return aHalfComplexity - bHalfComplexity;
        if (a.priority !== b.priority) return a.priority - b.priority;
        const aComplexity = (a.numStopDays || 0) + (a.numSpecialDays || 0);
        const bComplexity = (b.numStopDays || 0) + (b.numSpecialDays || 0);
        if (aComplexity !== bComplexity) return aComplexity - bComplexity;
        const aColors = countPillColors(a);
        const bColors = countPillColors(b);
        if (aColors !== bColors) return aColors - bColors;
        const aTotalPills = countTotalPillObjects(a);
        const bTotalPills = countTotalPillObjects(b);
        if (aTotalPills !== bTotalPills) return aTotalPills - bTotalPills;
        return 0;
    });
    return options.slice(0, 5).map(option => {
        let dailyCombos = [];
        if (option.type === 'uniform') {
            dailyCombos = Array(7).fill(option.combo);
        } else {
            dailyCombos = option.comboWeekly;
        }
        return createRegimenDetail(option.weeklyDoseActual, dailyCombos);
    });
}

function getCombinationsOfIndices(totalItems, numToChoose) {
    const result = [];
    function findRecursive(start, currentCombo) {
        if (currentCombo.length === numToChoose) { result.push([...currentCombo]); return; }
        if (start >= totalItems) return;
        for (let i = start; i < totalItems; i++) {
            currentCombo.push(i);
            findRecursive(i + 1, currentCombo);
            currentCombo.pop();
        }
    }
    findRecursive(0, []);
    return result;
}

function getHalfPillComplexity(o) {
    const halfPillStrengths = new Set();
    const combosToScan = o.type === 'uniform' ? [o.combo] : (o.comboWeekly || []);
    combosToScan.forEach(dayCombo => {
        if (dayCombo) { dayCombo.forEach(pill => { if (pill.half) halfPillStrengths.add(pill.mg); }); }
    });
    return halfPillStrengths.size;
}

function countPillColors(o) {
    const colors = new Set();
    const combosToScan = o.type === 'uniform' ? [o.combo] : (o.comboWeekly || []);
    combosToScan.forEach(day => day && day.forEach(p => (p.count > 0 || p.half) && colors.add(p.mg)));
    return colors.size;
}

function countTotalPillObjects(o) {
    const dailyPillObjects = (day) => day ? day.reduce((s, p) => s + p.count, 0) : 0;
    if (o.type === 'uniform') return dailyPillObjects(o.combo) * 7;
    return (o.comboWeekly || []).reduce((s, day) => s + dailyPillObjects(day), 0);
}

function createRegimenDetail(weeklyDose, dailyCombos) {
    const days = ['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.'];
    let regimen = { title: '', days: [], pillsForWeek: {} };
    const dailyPlan = dailyCombos.map(combo => {
        if (!combo || combo.length === 0) return 0;
        return combo.reduce((sum, p) => sum + (p.half ? p.mg * 0.5 * p.count : p.mg * p.count), 0);
    });
    const counts = dailyPlan.reduce((acc, dose) => { acc[dose] = (acc[dose] || 0) + 1; return acc; }, {});
    regimen.title = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([dose, count]) => `${parseFloat(dose).toFixed(1).replace('.0', '')} mg (${count} วัน)`).join(', ');
    for (let i = 0; i < 7; i++) {
        const currentDose = dailyPlan[i];
        const currentCombo = dailyCombos[i];
        let finalIcons = [];
        let finalTextParts = [];
        if (currentCombo && currentCombo.length > 0) {
            currentCombo.forEach(pill => {
                const pillStr = pill.mg.toString();
                const color = PILL_COLORS[pillStr] || 'gray';
                if (pill.half) {
                    for (let j = 0; j < pill.count; j++) finalIcons.push({ class: 'fas fa-adjust', color: color });
                    finalTextParts.push(`${pillStr} mg x(ครึ่ง)`);
                } else {
                    for (let j = 0; j < pill.count; j++) finalIcons.push({ class: 'fas fa-circle', color: color });
                    finalTextParts.push(`${pillStr} mg x${pill.count}`);
                }
            });
        }
        regimen.days.push({
            day: days[i],
            dose: currentDose,
            text: finalTextParts.join(', ') || 'ไม่ทานยา',
            icons: finalIcons,
            combo: currentCombo
        });
    }
    return regimen;
}

function getPossibleDailyDoses(availablePills) {
    const getPillInstructionSuccess = (dose) => {
        return findPillCombinationsForDose(dose, availablePills).length > 0;
    }
    const parts = [];
    availablePills.forEach(p => { parts.push(p); parts.push(p / 2); });
    const possibleDoses = new Set([0]);
    parts.forEach(p => possibleDoses.add(p));
    for (let i = 0; i < parts.length; i++) {
        for (let j = i; j < parts.length; j++) { possibleDoses.add(parts[i] + parts[j]); }
    }
    for (let i = 0; i < parts.length; i++) {
        for (let j = i; j < parts.length; j++) {
            for (let k = j; k < parts.length; k++) { possibleDoses.add(parts[i] + parts[j] + parts[k]); }
        }
    }
    return [...possibleDoses].filter(d => getPillInstructionSuccess(d)).sort((a, b) => a - b);
}

function sortDailyPlan(dailyPlan) {
    const counts = dailyPlan.reduce((acc, dose) => { acc[dose] = (acc[dose] || 0) + 1; return acc; }, {});
    if (Object.keys(counts).length === 0) return [];
    const mainDose = parseFloat(Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b));
    let mainDoses = dailyPlan.filter(d => d === mainDose);
    let specialDoses = dailyPlan.filter(d => d !== mainDose);
    specialDoses.sort((a, b) => a - b);
    return [...mainDoses, ...specialDoses];
}