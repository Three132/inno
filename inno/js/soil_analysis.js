document.addEventListener('DOMContentLoaded', () => {
    
    // ---- Elements ----
    const btnAnalyze = document.getElementById('btn-analyze');
    const hsvInput = document.getElementById('hsv-input');
    const analysisResult = document.getElementById('analysis-result');
    const resultColorBox = document.getElementById('result-color-box');
    const resultRisk = document.getElementById('result-risk');
    const riskBar = document.getElementById('risk-bar');
    const analysisDetails = document.getElementById('analysis-details');

    // ---- Analysis Logic ----
    if(btnAnalyze) {
        btnAnalyze.addEventListener('click', () => {
            const rawData = hsvInput.value;
            // Regex to match Color(h=0, s=40, v=76)
            const regex = /Color\(h=(\d+),\s*s=(\d+),\s*v=(\d+)\)/g;
            let match;
            let totalH = 0, totalS = 0, totalV = 0, count = 0;

            // Parse all matches
            while ((match = regex.exec(rawData)) !== null) {
                totalH += parseInt(match[1]);
                totalS += parseInt(match[2]);
                totalV += parseInt(match[3]);
                count++;
            }

            // Error Handling
            if(count === 0) {
                alert("SYSTEM ERROR: NO VALID HSV DATA PACKETS DETECTED.\nPlease ensure format matches: Color(h=0, s=0, v=0)");
                return;
            }

            // Calculate Averages
            const avgH = totalH / count;
            const avgS = totalS / count;
            const avgV = totalV / count;

            // Convert result to RGB for visual display
            const rgb = hsvToRgb(avgH / 360, avgS / 100, avgV / 100);
            
            // ---- UI Updates ----
            analysisResult.style.display = 'block';
            
            // 1. Show Average Color
            resultColorBox.style.backgroundColor = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
            
            // 2. Determine Risk Level
            let riskLevel = "UNKNOWN";
            let barColor = "#00ff00";
            let barWidth = "0%";
            let detailsText = "";
            let soilType = "standard";

            // --- Comprehensive Scientific Soil Logic (Thai) ---
            
            // 🟦 1. ดินกเลย์ (Gleysol - Blue-Gray) - VERY HIGH RISK
            if (avgH >= 180 && avgH <= 240 && avgS <= 20 && avgV >= 35 && avgV <= 65) {
                soilType = "gleysol";
                riskLevel = "สถานะ: พื้นที่อันตรายสูงสุด - มีความเสี่ยงต่อการพังทลายสไลด์ (GLEY)";
                barColor = "#FF2A6D";
                barWidth = "98%";
                detailsText = `
                    <strong style="color:#fff;">หมวดหมู่: ดินกเลย์ (Gleysol - ดินสีเทา/น้ำเงิน)</strong><br>
                    <span style="color:var(--text-secondary);">ลักษณะทางกายภาพ:</span> ดินอิ่มน้ำเป็นระยะเวลานาน สภาพไร้ออกซิเจน เหล็กถูกรีดิวซ์ (Fe²⁺)<br>
                    <span style="color:var(--accent-color);">การประเมินความเสถียร:</span> แรงดันน้ำสูงและแรงเฉือนต่ำมาก ดินมีสภาวะอ่อนตัวและลื่น เสี่ยงต่อสภาวะวิกฤต
                `;
            } 
            // สถานะรีดิวซ์ (Reduced Soil - Greenish-Gray)
            else if (avgH >= 90 && avgH <= 160 && avgS >= 10 && avgS <= 30 && avgV >= 40 && avgV <= 65) {
                soilType = "reduced";
                riskLevel = "สถานะ: อันตรายมาก | ใกล้ถล่ม (REDUCED)";
                barColor = "#FF2A6D";
                barWidth = "95%";
                detailsText = `
                    <strong style="color:#fff;">หมวดหมู่: ดินเขียวหม่น (Greenish-Gray Reduced Soil)</strong><br>
                    <span style="color:var(--text-secondary);">ลักษณะทางกายภาพ:</span> ได้รับผลกระทบจากน้ำใต้ดินหรือน้ำท่วมขังตามฤดูกาล บ่งชี้สภาวะความชื้นที่ไม่คงที่<br>
                    <span style="color:var(--accent-color);">การประเมินความเสถียร:</span> ความแข็งแรงของดินผันผวนตามระดับน้ำ เสี่ยงต่อการอ่อนตัวและพังทลายอย่างกะทันหัน
                `;
            }
            // ⬛ 3. ดินดำ (Organic Soil) - MODERATE
            else if (avgS <= 15 && avgV <= 35) {
                soilType = "organic";
                riskLevel = "สถานะ: พื้นที่ความเสี่ยงปานกลาง (ORGANIC)";
                barColor = "#7B2CBF";
                barWidth = "60%";
                detailsText = `
                    <strong style="color:#fff;">หมวดหมู่: ดินอินทรียวัตถุสูง (Organic-rich Soil)</strong><br>
                    <span style="color:var(--text-secondary);">ลักษณะทางกายภาพ:</span> องค์ประกอบเป็นตะกอนอินทรีย์และโคลน มีความหนาแน่นต่ำเมื่อเปียก<br>
                    <span style="color:var(--accent-color);">การประเมินความเสถียร:</span> มีแนวโน้มเสียกำลังรับน้ำหนักอย่างรวดเร็วเมื่อได้รับความชื้นเพิ่ม เสี่ยงต่อการทรุดตัวเชิงระนาบ
                `;
            }
            // 🟫 4. ดินน้ำตาลเข้ม (Dark Brown) - MODERATE
            else if (avgH >= 15 && avgH <= 35 && avgS >= 30 && avgS <= 50 && avgV >= 35 && avgV <= 55) {
                soilType = "brown";
                riskLevel = "สถานะ: พื้นที่ความเสี่ยงปานกลาง (DARK BROWN)";
                barColor = "#00f0ff";
                barWidth = "45%";
                detailsText = `
                    <strong style="color:#fff;">หมวดหมู่: ดินน้ำตาลเข้ม (Dark Brown Soil)</strong><br>
                    <span style="color:var(--text-secondary);">ลักษณะทางกายภาพ:</span> ดินชื้นสะสม สภาพชั้นตะกอนเก่า มีการยึดเกาะในระดับปานกลาง<br>
                    <span style="color:var(--accent-color);">การประเมินความเสถียร:</span> สภาพดินค่อนข้างคงตัว แต่ยังมีความเสี่ยงจากการอ่อนตัวตามปริมาณน้ำไหลซึม
                `;
            }
            // 🟫 5. ดินน้ำตาลอ่อน (Light Brown) - LOW RISK (🟢)
            else if (avgH >= 25 && avgH <= 35 && avgS >= 40 && avgS <= 50 && avgV >= 65 && avgV <= 75) {
                soilType = "light_brown_safe";
                riskLevel = "สถานะ: พื้นที่ความเสี่ยงต่ำ (LIGHT BROWN)";
                barColor = "#ADFF2F"; 
                barWidth = "25%";
                detailsText = `
                    <strong style="color:#fff;">หมวดหมู่: ดินน้ำตาลอ่อน (Light Brown Soil)</strong><br>
                    <span style="color:var(--text-secondary);">ลักษณะทางกายภาพ:</span> สภาพดินร่วน ไม่มีการขังน้ำ มีการระบายน้ำระดับปกติ<br>
                    <span style="color:var(--accent-color);">การประเมินความเสถียร:</span> โครงสร้างดินสามารถรับแรงได้ดี อัตราการสูญเสียกำลังมีความเป็นไปได้ต่ำ
                `;
            }
            // 🟨 6. ดินเหลือง (Yellow Soil) - LOW RISK (🟢)
            else if (avgH >= 50 && avgH <= 60 && avgS >= 60 && avgS <= 70 && avgV >= 75 && avgV <= 85) {
                soilType = "yellow_safe";
                riskLevel = "สถานะ: พื้นที่ความเสี่ยงต่ำ (YELLOW)";
                barColor = "#ADFF2F"; 
                barWidth = "20%";
                detailsText = `
                    <strong style="color:#fff;">หมวดหมู่: ดินกลุ่มเหล็กออกไซด์ (Yellow / Iron Oxide)</strong><br>
                    <span style="color:var(--text-secondary);">ลักษณะทางกายภาพ:</span> บ่งชี้สภาพดินที่มีการเกิดปฏิกิริยาออกซิเดชันสูง ไม่มีการอิ่มน้ำ<br>
                    <span style="color:var(--accent-color);">การประเมินความเสถียร:</span> สถาปัตยกรรมทางดินมีประสิทธิภาพในการระบายน้ำและยึดเกาะ มีอัตราความเสถียรสูง
                `;
            }
            // 🟥 7. ดินแดง (Red Soil) - VERY SAFE (🟢)
            else if (avgH >= 5 && avgH <= 15 && avgS >= 70 && avgS <= 85 && avgV >= 60 && avgV <= 70) {
                soilType = "red_safe";
                riskLevel = "สถานะ: พื้นที่ความปลอดภัยเชิงโครงสร้างสูง (RED SOIL)";
                barColor = "#00ff00"; 
                barWidth = "10%";
                detailsText = `
                    <strong style="color:#fff;">หมวดหมู่: ดินกลุ่มแลเทอริติก (Red / Lateritic Soil)</strong><br>
                    <span style="color:var(--text-secondary);">ลักษณะทางกายภาพ:</span> องค์ประกอบดินมีความแน่นสูง สภาพพื้นผิวแห้งและแข็งแรง<br>
                    <span style="color:var(--accent-color);">การประเมินความเสถียร:</span> มีกำลังรับน้ำหนักสูงสุดในกลุ่มดินตัวอย่าง โครงสร้างมีความเสถียรถาวร
                `;
            }
            // Fallback
            else {
                riskLevel = "ปกติ / คงตัว";
                barColor = "#00ff00";
                barWidth = "20%";
                detailsText = "ดินมีการระบายน้ำปกติ สภาพโครงสร้างพื้นฐานมีความเสถียร";
            }

            // --- Handle Image Display ---
            const referenceImage = document.getElementById('soil-reference-img');
            const imageMap = {
                'gleysol': 'images/soil/gley_soil_final.png',
                'mottled': 'images/soil/mottled_soil_final.jpg',
                'organic': 'images/soil/organic_soil_final.png',
                'brown': 'images/soil/dark_brown_final.jpg',
                'light_brown_safe': 'images/soil/brown_cave_entry.png',
                'yellow_safe': 'images/soil/yellow_soil_final.png',
                'red_safe': 'images/soil/red_soil_final.jpg'
            };

            if (referenceImage) {
                if (imageMap[soilType]) {
                    referenceImage.src = imageMap[soilType];
                    referenceImage.style.display = 'block';
                } else {
                    referenceImage.style.display = 'none';
                }
            }

            // Apply Risk Updates
            resultRisk.innerText = riskLevel;
            resultRisk.style.color = barColor;

            // Update Details
            if(analysisDetails) {
                analysisDetails.style.display = 'block';
                analysisDetails.innerHTML = detailsText;
            }

            // Timeout to allow display:block to render before animating width
            setTimeout(() => {
                riskBar.style.width = barWidth;
                riskBar.style.backgroundColor = barColor;
            }, 100);
        });
    }
});

// ---- Helper Functions ----

// HSV to RGB Converter
// h, s, v in range [0, 1]
function hsvToRgb(h, s, v) {
    let r, g, b;
    let i = Math.floor(h * 6);
    let f = h * 6 - i;
    let p = v * (1 - s);
    let q = v * (1 - f * s);
    let t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
