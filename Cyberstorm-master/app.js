let inSecretMode = false;
let phishingStepStatus = {
    1: "pending",
    2: "pending",
    3: "pending"
};

function getCurrentTaskList() {
    if (inSecretMode) return secretTasks;
    if (inBonusMode) return activeBonusTasks;
    return activeTasks;
}

window.addEventListener('DOMContentLoaded', () => {
    const allContainers = document.querySelectorAll('.container');

    allContainers.forEach(container => container.classList.add('hidden'));

    activeTasks.forEach((taskObj, index) => {
        const container = Array.from(allContainers).find(c =>
            c.querySelector('.task-title')?.getAttribute('data-title') === taskObj.title
        );

        if (container) {
            const titleElement = container.querySelector('.task-title');
            titleElement.textContent = `Uppdrag ${index + 1}: ${taskObj.title}`;
            container.classList.add('hidden');
        }
    });

    const firstContainer = Array.from(allContainers).find(c =>
        c.querySelector('.task-title')?.getAttribute('data-title') === firstTaskTitle
    );

    if (firstContainer) {
        firstContainer.classList.remove('hidden');

        if (["🔓 Dekryptera meddelandet", "🔦 UV-skattjakt", "💎 Spegelvänd Kod"].includes(firstTaskTitle)) {
            let modalText = "";
            switch (firstTaskTitle) {
                case "🔓 Dekryptera meddelandet":
                    modalText = "Be Agent X att ge dig det material du behöver inför detta uppdrag!";
                    break;
                case "🔦 UV-skattjakt":
                    modalText = "Be Agent X att ge dig en UV-lampa till detta uppdrag!";
                    break;
                case "💎 Spegelvänd Kod":
                    modalText = "Be Agent X att ge dig en spegel till detta uppdrag!";
                    break;
            }
            showMaterialModal("Material - " + firstTaskTitle, modalText);
        } else if (firstTaskTitle === "📧 Phishingfällan") {
            scheduleTip("tip-btn-phishing1", 180000);
        } else {
            const firstTipBtnMap = {
                "🔓 Dekryptera meddelandet": "tip-btn-cryptogram",
                "💪 Starkaste lösenordet": "tip-btn-passwords",
                "🔦 UV-skattjakt": "tip-btn-uv",
                "💎 Spegelvänd Kod": "tip-btn-mirror"
            };

            const tipBtnId = firstTipBtnMap[firstTaskTitle];
            if (tipBtnId) {
                scheduleTip(tipBtnId, 300000); // 5 min
            }
        }
    }
});

let codeWords = {};
let tipAlreadyScheduled = false;
let inBonusMode = false;

function addCodeWord(step, codeWord) {
    codeWords[step] = codeWord;
}

function showCodeWords() {
    const list = document.getElementById("codeword-list");
    list.innerHTML = "";

    activeTasks.forEach((taskObj, index) => {
        const step = Object.keys(codeWords).find(key => {
            const container = document.querySelector(`#task${key}`);
            const title = container?.querySelector('.task-title')?.getAttribute('data-title');
            return title === taskObj.title;
        });

        if (step) {
            const li = document.createElement("li");
            li.innerHTML = `<strong>Kodord ${index + 1}:</strong> ${codeWords[step]}`;
            list.appendChild(li);
        }
    });
}

const pendingTipTimers = new Set();

function isInVisibleTask(el) {
    if (!el) return false;
    const container = el.closest?.('.container');
    return !!container && !container.classList.contains('hidden');
}

function scheduleTip(btnId, delayMs) {
    const tid = setTimeout(() => {
        pendingTipTimers.delete(tid);
        const btn = document.getElementById(btnId);
        if (btn && isInVisibleTask(btn)) {
            showTipButton(btnId);
        }
    }, delayMs);
    pendingTipTimers.add(tid);
    return tid;
}

function cancelAllTipTimers() {
    for (const t of pendingTipTimers) clearTimeout(t);
    pendingTipTimers.clear();
}

function checkCryptogram(step) {
    const input = document.getElementById(`answer${step}`).value.trim().toLowerCase();
    const feedback = document.getElementById(`feedback${step}`);
    const nextBtn = document.getElementById(`next${step}`);
    if (input === "hemligtord 567") {
        const taskData = getCurrentTaskList().find(task => task.title === "🔓 Dekryptera meddelandet");
        const codeWord = taskData.codeWord;
        feedback.innerHTML = `<span style='color:#00ffaa;'>✅ Rätt! Kodordet är: <strong>${codeWord}</strong></span>`;
        addCodeWord(step, codeWord);
        nextBtn.classList.remove("hidden");
    } else {
        feedback.textContent = "Fel svar. Försök igen!";
        feedback.style.color = "#f85149";
    }
}

function checkPasswords(step) {
    const correct = ["NallePuh#2024!", "SäkerKod88#hemlig!", "Lösen#Bok2024Astrid", "JagälskarBanana#2023!"];
    const checkboxes = document.querySelectorAll('#password-options input[type="checkbox"]:checked');
    const resultBox = document.getElementById("password-result");
    const feedback = document.getElementById(`feedback${step}`);
    const nextBtn = document.getElementById(`next${step}`);

    if (checkboxes.length !== 3) {
        resultBox.innerHTML = "❗ Välj exakt <strong>3 lösenord</strong>!";
        resultBox.style.color = "#ff4444";
        return;
    }

    const chosen = Array.from(checkboxes).map(cb => cb.value);
    const allCorrect = chosen.every(val => correct.includes(val));

    if (allCorrect) {
        const codeWord = getCurrentTaskList().find(task => task.title === "💪 Starkaste lösenordet")?.codeWord;
        resultBox.innerHTML = `✅ Bra jobbat! Kodordet är <strong>${codeWord}</strong>!`;
        resultBox.style.color = "#00ffaa";
        addCodeWord(step, codeWord);
        nextBtn.classList.remove("hidden");
    } else {
        resultBox.innerHTML = "❌ Ett eller flera lösenord var inte starka nog. Försök igen!";
        resultBox.style.color = "#ff4444";
    }
}
function toggleTip(num) {
    const tip = document.getElementById(`tip${num}`);
    tip.classList.toggle("hidden");
}
function answerPhish(step, choice) {
    const feedback = document.getElementById(`phish-feedback-${step}`);
    if ((step === 1 || step === 3) && choice) {
        feedback.innerHTML = "✅ Rätt! Det ser misstänkt ut. Gå vidare.";
        document.getElementById(`reasons${step}`).classList.remove("hidden");
    } else if (step === 2 && !choice) {
        feedback.innerHTML = "✅ Bra! Det är ett riktigt mejl.";
        document.getElementById(`reasons${step}`).classList.remove("hidden");
    } else {
        feedback.innerHTML = "❌ Fel svar – fundera igen!";
    }
}

function checkReasons(step, correct, nextId) {
    const selected = Array.from(document.querySelectorAll(`#reasons${step} input[type="checkbox"]:checked`)).map(cb => cb.value);
    const feedback = document.getElementById(`reason-feedback-${step}`);
    const matchCount = correct.filter(val => selected.includes(val)).length;

    if (selected.length !== correct.length) {
        feedback.innerHTML = `❌ Du valde ${selected.length}. Du måste välja exakt ${correct.length}.`;
        return;
    }

    if (matchCount === correct.length) {
        const taskData = getCurrentTaskList().find(task => task.title === "📧 Phishingfällan");
        const codeWord = taskData.codeWord;
        feedback.innerHTML = `✅ Rätt! Kodordet är <strong>${codeWord}</strong>!`;
        phishingStepStatus[step] = "completed";

        if (nextId) {
            document.getElementById(nextId).classList.remove("hidden");
        }

        if (step === 3) {
            const codeWord = getCurrentTaskList().find(task => task.title === "📧 Phishingfällan")?.codeWord;
            addCodeWord(3, codeWord);
            document.getElementById("next3").classList.remove("hidden");
        }

        if (step === 1) {
            scheduleTip("tip-btn-phishing2", 180000);
        }

        if (step === 2) {
            scheduleTip("tip-btn-phishing3", 180000);
        }

    } else {
        feedback.innerHTML = `❌ Du fick ${matchCount} av ${correct.length} rätt. Försök igen!`;
    }
}

function checkDragDrop(step) {
    const safeZone = document.getElementById("safe-zone");
    const dangerZone = document.getElementById("danger-zone");
    const feedback = document.getElementById(`feedback${step}`);
    const nextBtn = document.getElementById(`next${step}`);

    let correct = true;

    for (let id of safeItems) {
        const item = document.getElementById(id);
        if (!safeZone.contains(item)) {
            correct = false;
            break;
        }
    }

    if (correct) {
        for (let id of dangerItems) {
            const item = document.getElementById(id);
            if (!dangerZone.contains(item)) {
                correct = false;
                break;
            }
        }
    }

    const totalSorted = safeZone.children.length + dangerZone.children.length;
    const totalItems = safeItems.length + dangerItems.length;

    if (correct && totalSorted === totalItems) {
        const codeWord = getCurrentTaskList().find(task => task.title === "🧩 Säkert eller Osäkert?")?.codeWord;
        feedback.innerHTML = `✅ Rätt! Kodordet är <strong>${codeWord}</strong>!`;
        feedback.style.color = "#00ffaa";
        addCodeWord(step, codeWord);
        nextBtn.classList.remove("hidden");
    } else {
        feedback.innerHTML = "❌ Något är felplacerat eller inte sorterat. Dubbelkolla!";
        feedback.style.color = "#ff4444";
    }
}

function checkMorse(step) {
    const expected = ['H', 'E', 'M'];
    let allCorrect = true;

    for (let i = 0; i < 3; i++) {
        const input = document.getElementById(`morse-input-${i + 1}`).value.trim().toUpperCase();
        const feedbackDiv = document.getElementById(`morse-feedback-${i + 1}`);

        if (input === expected[i]) {
            feedbackDiv.innerHTML = "✅ Rätt";
            feedbackDiv.style.color = "#00ffaa";
        } else {
            feedbackDiv.innerHTML = "❌ Fel";
            feedbackDiv.style.color = "#ff4444";
            allCorrect = false;
        }
    }

    const overallFeedback = document.getElementById("feedback5");
    const nextBtn = document.getElementById("next5");

    if (allCorrect) {
        const codeWord = getCurrentTaskList().find(task => task.title === "📡 Morsekoden")?.codeWord;
        overallFeedback.innerHTML = `🎉 Alla bokstäver är rätt! Kodordet är <strong>${codeWord}</strong>`;
        overallFeedback.style.color = "#00ffaa";
        addCodeWord(5, codeWord);
        nextBtn.classList.remove("hidden");
    } else {
        overallFeedback.innerHTML = `🔍 Någon bokstav är fel – försök igen!`;
        overallFeedback.style.color = "#ff4444";
    }
}

function checkUV_A() {
    const input = document.getElementById("answer6a").value.trim();
    const feedback = document.getElementById("feedback6a");

    if (input === "G.Ö.M.D") {
        feedback.innerHTML = "✅ Rätt kodord hittat!";
        feedback.style.color = "#00ffaa";

        document.getElementById("uv-title-a").innerHTML = "✅ A. Leta med UV-lampa – KLAR!";
        document.getElementById("uv-a-content").style.display = "none";

        document.getElementById("uv-part-b").style.display = "block";
        document.getElementById("uv-title-b").style.opacity = "1";

        scheduleTip("tip-btn-steganography", 240000);

    } else {
        feedback.innerHTML = "❌ Fel kodord – leta igen!";
        feedback.style.color = "#ff4444";
    }
}

function checkUV_B() {
    const input = document.getElementById("answer6b").value.trim().toUpperCase();
    const feedback = document.getElementById("feedback6b");
    const nextBtn = document.getElementById("next6");

    if (input === "FREDAGSMYS PÅ TORSDAG") {
        const codeWord = getCurrentTaskList().find(task => task.title === "🔦 UV-skattjakt")?.codeWord;
        feedback.innerHTML = `✅ Bra jobbat! Kodordet är <strong>${codeWord}</strong>!`;
        feedback.style.color = "#00ffaa";
        addCodeWord(6, codeWord);
        nextBtn.classList.remove("hidden");
    } else {
        feedback.innerHTML = "❌ Fel svar – försök att granska bilden noggrannare!";
        feedback.style.color = "#ff4444";
    }
}

function checkMirrorCode(step) {
    const input = document.getElementById(`answer${step}`).value.trim();
    const feedback = document.getElementById(`feedback${step}`);
    const nextBtn = document.getElementById(`next${step}`);

    if (input === "I sPegeLN göMd SEr du miG LevA bAklÄngeS") {
        const taskData = (inSecretMode ? secretTasks : activeTasks).find(task => task.title === "💎 Spegelvänd Kod");
        const codeWord = getCurrentTaskList().find(task => task.title === "💎 Spegelvänd Kod")?.codeWord;
        feedback.innerHTML = `✅ Bra jobbat! Kodordet är <strong>${codeWord}</strong>`;
        feedback.style.color = "#00ffaa";
        addCodeWord(step, codeWord);
        nextBtn.classList.remove("hidden");
    } else {
        feedback.innerHTML = "❌ Fel – titta noga i spegeln!";
        feedback.style.color = "#ff4444";
    }
}

// Dragable objects
const dragItemsData = [
    { id: 'drag-123456', text: 'Lösenord: 123456', hint: '🤔 Hint: Tänk, är detta lösenord enkelt för någon att gissa?' },
    { id: 'drag-ilovesecurity', text: 'Lösenord: JagÄlskarSäkerhet#2025!', hint: '🤔 Hint: Bra lösenord är ofta längre än 12 tecken och innehåller både stora och små bokstäver, siffror och symboler.' },
    { id: 'drag-iphone', text: 'Klicka här för att vinna iPhone', hint: '🤔 Hint: Tycker du det känns rimligt? Skulle du ge bort en telefon gratis?' },
    { id: 'drag-bank', text: 'Besöka https://riktigbank.se', hint: '🤔 Hint: Titta efter låset 🔒 i webbläsaren.' },
    { id: 'drag-antivirus', text: 'Använda antivirus på datorn', hint: '🤔 Hint: Vad gör antivirus? Kan det skydda dig från skadliga filer och virus?' },
    { id: 'drag-download', text: 'Ladda ner spel från okända sidor', hint: '🤔 Hint: Vet du om du kan lita på en okänd sida? Kan den innehålla virus?' },
    { id: 'drag-address', text: 'Berätta vart du bor till okända personer på Roblox', hint: '🤔 Hint: Ska du berätta personlig information till någon du inte känner? Vad kan hända?' },
    { id: 'drag-update', text: 'Uppdatera appar och spel', hint: '🤔 Hint: Varför uppdaterar man appar? Fixas det något som kan göra dem bättre eller säkrare?' },
    { id: 'drag-sharepassword', text: 'Ge bort ditt lösenord till någon online',hint: '🤔 Hint: Du ska aldrig dela ditt lösenord med någon, inte ens om de säger att de är från spelet eller skolan!'},
    { id: 'drag-askparent', text: 'Fråga mamma eller pappa innan du laddar ner ett spel', hint: '🤔 Hint: Kan föräldrar hjälpa dig att veta om ett spel är säkert att ladda ner?' },
    { id: 'drag-drag-nameagepass', text: 'Ett lösenord som är ditt namn + ålder', hint: '🤔 Hint: Är detta enkelt för dina vänner att gissa?' },
];

// Correct answers
const safeItems = [
    "drag-ilovesecurity",
    "drag-bank",
    "drag-antivirus",
    "drag-update",
    "drag-askparent",
];

const dangerItems = [
    "drag-123456",
    "drag-iphone",
    "drag-download",
    "drag-address",
    "drag-sharepassword",
    "drag-drag-nameagepass",
];

window.onload = function () {
    const itemsContainer = document.getElementById('items');

    dragItemsData.forEach(item => {
        const div = document.createElement('div');
        div.className = 'drag-item';
        div.id = item.id;
        div.innerHTML = `
              ${item.text}
              <button class="read-more-btn" onclick="toggleHint('hint-${item.id}')">❓</button>
              <div id="hint-${item.id}" class="info-text hidden">
                ${item.hint}
              </div>
            `;

        itemsContainer.appendChild(div);
        if (window.initTouchDnD) window.initTouchDnD();
    });
};

// Max HINT amount
let helpCount = 0;
const maxHelp = 3;
const usedHints = new Set();

function toggleHint(id) {

    const hintBox = document.getElementById(id);

    if (!hintBox.classList.contains("hidden")) {
        hintBox.classList.add("hidden");
        return;
    }

    if (!usedHints.has(id)) {
        if (helpCount >= maxHelp) {
            alert("🚫 Du har använt alla dina 3 tips. Försök nu fundera själv!");
            return;
        }

        helpCount++;
        usedHints.add(id);

        const helpRemaining = document.getElementById("help-remaining");
        if (helpRemaining) {
            const tipsLeft = maxHelp - helpCount;
            helpRemaining.textContent = tipsLeft;

            helpRemaining.style.fontWeight = "bold";

            if (tipsLeft === 3) {
                helpRemaining.style.color = "#00ffaa";
            } else if (tipsLeft === 2) {
                helpRemaining.style.color = "yellow";
            } else if (tipsLeft === 1) {
                helpRemaining.style.color = "orange";
            } else if (tipsLeft === 0) {
                helpRemaining.style.color = "red";
            }
        }

    }

    hintBox.classList.remove("hidden");
}

function resetHelp() {
    helpCount = 0;
    usedHints.clear();

    const helpRemaining = document.getElementById("help-remaining");
    if (helpRemaining) {
        helpRemaining.textContent = maxHelp;

        helpRemaining.style.color = "#00ffaa";
        helpRemaining.style.fontWeight = "bold";
    }
}

const morseCode = [
    // H
    { type: 'dot' }, { type: 'dot' }, { type: 'dot' }, { type: 'dot' },
    { type: 'pause' },
    // E
    { type: 'dot' },
    { type: 'pause' },
    // M
    { type: 'dash' }, { type: 'dash' }
];

function startMorse() {
    const light = document.getElementById('morse-light');
    let i = 0;

    function blink() {
        if (i >= morseCode.length) {
            light.style.backgroundColor = '#0f0f0f';
            return;
        }

        const signal = morseCode[i];
        if (signal.type === 'dot') {
            light.style.backgroundColor = '#00ffaa';
            setTimeout(() => {
                light.style.backgroundColor = '#0f0f0f';
                setTimeout(() => {
                    i++;
                    blink();
                }, 300);
            }, 300);
        } else if (signal.type === 'dash') {
            light.style.backgroundColor = '#00ffaa';
            setTimeout(() => {
                light.style.backgroundColor = '#0f0f0f';
                setTimeout(() => {
                    i++;
                    blink();
                }, 300);
            }, 900);
        } else if (signal.type === 'pause') {
            light.style.backgroundColor = '#0f0f0f';
            setTimeout(() => {
                i++;
                blink();
            }, 700);
        }
    }

    blink();
}

const morseSequencePerLetter = {
    1: [{ type: 'dot' }, { type: 'dot' }, { type: 'dot' }, { type: 'dot' }], // H
    2: [{ type: 'dot' }], // E
    3: [{ type: 'dash' }, { type: 'dash' }] // M
};

function startMorseLetter(num) {
    const light = document.getElementById(`morse-light-${num}`);
    const sequence = morseSequencePerLetter[num];
    let i = 0;

    function blink() {
        if (i >= sequence.length) {
            light.style.backgroundColor = '#0f0f0f';
            return;
        }

        const signal = sequence[i];
        if (signal.type === 'dot') {
            light.style.backgroundColor = '#00ffaa';
            setTimeout(() => {
                light.style.backgroundColor = '#0f0f0f';
                setTimeout(() => {
                    i++;
                    blink();
                }, 300);
            }, 300);
        } else if (signal.type === 'dash') {
            light.style.backgroundColor = '#00ffaa';
            setTimeout(() => {
                light.style.backgroundColor = '#0f0f0f';
                setTimeout(() => {
                    i++;
                    blink();
                }, 300);
            }, 900);
        }
    }

    blink();
}

//Zoom och PAN
/* Desktop: pan + wheel zoom
Touch/iPad: static image, let the browser handle pinch-to-zoom on the page */
(function () {
    const container = document.getElementById("zoom-container");
    const image = document.getElementById("zoom-image");
    if (!container || !image) return;

    container.style.touchAction = "none";
    image.style.transformOrigin = "top left";
    image.style.userSelect = "none";
    image.style.webkitUserSelect = "none";
    image.draggable = false;

    let scale = 1, minScale = 0.5, maxScale = 6;
    let translate = { x: 0, y: 0 };

    function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
    function update(){ image.style.transform = `translate(${translate.x}px, ${translate.y}px) scale(${scale})`; }

    // --- Desktop: wheel zoom + drag pan ---
    let mDrag = false, mStart = {x:0,y:0};
    container.addEventListener("wheel", (e) => {
        e.preventDefault();
        const rect = container.getBoundingClientRect();
        const mx = e.clientX - rect.left, my = e.clientY - rect.top;
        const delta = e.deltaY > 0 ? -0.12 : 0.12;
        const ns = clamp(scale + delta, minScale, maxScale);
        const f = ns / scale;
        translate.x = mx - (mx - translate.x) * f;
        translate.y = my - (my - translate.y) * f;
        scale = ns; update();
    }, { passive: false });

    container.addEventListener("mousedown", (e) => {
        mDrag = true;
        mStart.x = e.clientX - translate.x;
        mStart.y = e.clientY - translate.y;
        container.style.cursor = "grabbing";
    });
    window.addEventListener("mousemove", (e) => {
        if(!mDrag) return;
        translate.x = e.clientX - mStart.x;
        translate.y = e.clientY - mStart.y;
        update();
    });
    window.addEventListener("mouseup", () => { mDrag = false; container.style.cursor = "grab"; });

    // --- Pointer Events path (newer iPadOS) ---
    const supportsPointer = "PointerEvent" in window;
    const pts = new Map();
    let pinchInfo = null;
    let lastMid = null;

    function midpoint(a,b){ return { x:(a.x+b.x)/2, y:(a.y+b.y)/2 }; }
    function distance(a,b){ return Math.hypot(a.x-b.x, a.y-b.y); }

    function onPointerDown(e){
        pts.set(e.pointerId, {x:e.clientX, y:e.clientY});
    }
    function onPointerMove(e){
        if(!pts.has(e.pointerId)) return;
        pts.set(e.pointerId, {x:e.clientX, y:e.clientY});
        if (pts.size === 1){
            // 1-finger pan
            const p = [...pts.values()][0];
            if(!lastMid) lastMid = { ...p };
            translate.x += p.x - lastMid.x;
            translate.y += p.y - lastMid.y;
            lastMid = { ...p }; update();
        } else if (pts.size >= 2){
            // 2-finger pinch
            const [p0, p1] = [...pts.values()].slice(0,2);
            const mid = midpoint(p0, p1);
            if (!pinchInfo){
                pinchInfo = {
                    startDist: Math.max(10, distance(p0, p1)),
                    startScale: scale,
                    anchor: mid
                };
                lastMid = mid;
            }
            const rect = container.getBoundingClientRect();
            const ax = pinchInfo.anchor.x - rect.left;
            const ay = pinchInfo.anchor.y - rect.top;

            const ratio = distance(p0, p1) / pinchInfo.startDist;
            const ns = clamp(pinchInfo.startScale * ratio, minScale, maxScale);
            const f = ns / scale;

            translate.x = ax - (ax - translate.x) * f;
            translate.y = ay - (ay - translate.y) * f;
            scale = ns;

            translate.x += (mid.x - lastMid.x);
            translate.y += (mid.y - lastMid.y);
            lastMid = mid; update();
        }
    }
    function onPointerUp(e){
        pts.delete(e.pointerId);
        if (pts.size < 2) pinchInfo = null;
        if (pts.size === 0) lastMid = null;
    }

    if (supportsPointer){
        container.addEventListener("pointerdown", onPointerDown, { passive: true });
        container.addEventListener("pointermove", onPointerMove, { passive: false });
        container.addEventListener("pointerup", onPointerUp, { passive: true });
        container.addEventListener("pointercancel", onPointerUp, { passive: true });
    } else {

        let tLast = null;
        let tPinch = null;

        container.addEventListener("touchstart", (e) => {
            if (e.touches.length === 1) {
                tLast = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            } else if (e.touches.length >= 2) {
                const t0 = e.touches[0], t1 = e.touches[1];
                const mid = midpoint({x:t0.clientX,y:t0.clientY},{x:t1.clientX,y:t1.clientY});
                tPinch = {
                    startDist: Math.max(10, distance(
                        {x:t0.clientX,y:t0.clientY},
                        {x:t1.clientX,y:t1.clientY}
                    )),
                    startScale: scale,
                    anchor: mid
                };
                tLast = mid;
            }
        }, { passive: true });

        container.addEventListener("touchmove", (e) => {
            if (e.touches.length === 1 && tPinch == null) {
                e.preventDefault();
                const t = e.touches[0];
                if (!tLast) tLast = { x: t.clientX, y: t.clientY };
                translate.x += t.clientX - tLast.x;
                translate.y += t.clientY - tLast.y;
                tLast = { x: t.clientX, y: t.clientY };
                update();
            } else if (e.touches.length >= 2) {
                e.preventDefault();
                const t0 = e.touches[0], t1 = e.touches[1];
                const mid = midpoint({x:t0.clientX,y:t0.clientY},{x:t1.clientX,y:t1.clientY});
                if (!tPinch) {
                    tPinch = {
                        startDist: Math.max(10, distance(
                            {x:t0.clientX,y:t0.clientY},
                            {x:t1.clientX,y:t1.clientY}
                        )),
                        startScale: scale,
                        anchor: mid
                    };
                    tLast = mid;
                }
                const rect = container.getBoundingClientRect();
                const ax = tPinch.anchor.x - rect.left;
                const ay = tPinch.anchor.y - rect.top;

                const ratio = distance(
                    {x:t0.clientX,y:t0.clientY},
                    {x:t1.clientX,y:t1.clientY}
                ) / tPinch.startDist;

                const ns = clamp(tPinch.startScale * ratio, minScale, maxScale);
                const f = ns / scale;

                translate.x = ax - (ax - translate.x) * f;
                translate.y = ay - (ay - translate.y) * f;
                scale = ns;

                translate.x += (mid.x - tLast.x);
                translate.y += (mid.y - tLast.y);
                tLast = mid; update();
            }
        }, { passive: false });

        container.addEventListener("touchend", (e) => {
            if (e.touches.length < 2) tPinch = null;
            if (e.touches.length === 0) tLast = null;
        }, { passive: true });

        container.addEventListener("touchcancel", (e) => {
            tPinch = null; tLast = null;
        }, { passive: true });
    }

    // Public reset
    window.resetZoom = function () {
        scale = 1; translate = {x:0, y:0}; pinchInfo = null; lastMid = null;
        update();
        const btn = document.getElementById("reset-btn");
        if (btn) { btn.style.boxShadow = "0 0 12px #00ffaa"; setTimeout(()=>btn.style.boxShadow="0 0 5px #00ffaa22",300); }
    };
    update();
})();

function goToNext(currentStep) {
    cancelAllTipTimers()
    Array.from(document.querySelectorAll('.pulsing-tip')).forEach(btn => {
        if (!isInVisibleTask(btn)) btn.classList.remove('pulsing-tip');
    });

    const containers = document.querySelectorAll('.container');
    const currentContainer = document.querySelector(`#task${currentStep}`);
    if (!currentContainer) return;

    const currentTaskTitle = currentContainer.querySelector('.task-title')?.getAttribute('data-title');

    currentContainer.classList.add("hidden");

    if (inSecretMode) {
        const currentSecretIndex = secretTasks.findIndex(task => task.title === currentTaskTitle);

        if (currentSecretIndex + 1 < secretTasks.length) {
            const nextSecretTitle = secretTasks[currentSecretIndex + 1].title;
            const nextSecretContainer = Array.from(containers).find(c =>
                c.querySelector('.task-title')?.getAttribute('data-title') === nextSecretTitle
            );

            if (nextSecretContainer) {
                nextSecretContainer.classList.remove("hidden");
                handleMaterialModalOrTip(nextSecretTitle);
            }
        } else {
            // End of secret tasks, do not show result, only message
            showMaterialModal("🕶 Hemligt uppdrag klart", "Du har slutfört alla hemliga uppdrag. Bra jobbat, Agent!");
        }

    } else if (!inBonusMode) {
        const currentIndex = activeTasks.findIndex(task => task.title === currentTaskTitle);

        if (currentIndex + 1 < activeTasks.length) {
            const nextTaskTitle = activeTasks[currentIndex + 1].title;
            const nextContainer = Array.from(containers).find(c =>
                c.querySelector('.task-title')?.getAttribute('data-title') === nextTaskTitle
            );

            if (nextContainer) {
                nextContainer.classList.remove('hidden');
                handleMaterialModalOrTip(nextTaskTitle);
            }
        } else {
            document.getElementById("result").classList.remove("hidden");
            showCodeWords();

            showMaterialModal("🎉 Slutfört!", "Ni har klarat alla uppdrag – visa kodorden för Agent X för att rädda servern!");

            if (activeBonusTasks.length > 0) {
                const bonusBtn = document.querySelector('button[onclick="bonusNotAvailable()"]');
                bonusBtn.textContent = "🎁 Visa BONUSUPPDRAG";
                bonusBtn.onclick = startBonusTasks;
            }
        }

    } else {
        const currentBonusIndex = activeBonusTasks.findIndex(task => task.title === currentTaskTitle);

        if (currentBonusIndex + 1 < activeBonusTasks.length) {
            const nextBonusTitle = activeBonusTasks[currentBonusIndex + 1].title;
            const nextBonusContainer = Array.from(containers).find(c =>
                c.querySelector('.task-title')?.getAttribute('data-title') === nextBonusTitle
            );

            if (nextBonusContainer) {
                nextBonusContainer.classList.remove('hidden');
                handleMaterialModalOrTip(nextBonusTitle);
            }
        } else {
            alert("🎉 Du har klarat alla BONUSUPPDRAG! Bra jobbat!");
            document.getElementById("result").classList.remove("hidden");
        }
    }
}

// TIP FUNCTIONS
function toggleTipCryptogram() {
    const tipBox = document.getElementById("tip-box-cryptogram");
    const tipBtn = document.getElementById("tip-btn-cryptogram");
    tipBox.style.display = tipBox.style.display === "none" ? "block" : "none";
    tipBtn?.classList.remove("pulsing-tip");
}

function toggleTipPasswords() {
    const tipBox = document.getElementById("tip-box-passwords");
    const tipBtn = document.getElementById("tip-btn-passwords");
    tipBox.style.display = tipBox.style.display === "none" ? "block" : "none";
    tipBtn?.classList.remove("pulsing-tip");
}

function toggleTipPhishing1() {
    const tipBox = document.getElementById("tip-box-phishing1");
    const tipBtn = document.getElementById("tip-btn-phishing1");
    tipBox.classList.toggle("hidden");
    tipBtn?.classList.remove("pulsing-tip");
}

function toggleTipPhishing2() {
    const tipBox = document.getElementById("tip-box-phishing2");
    const tipBtn = document.getElementById("tip-btn-phishing2");
    tipBox.classList.toggle("hidden");
    tipBtn?.classList.remove("pulsing-tip");
}

function toggleTipPhishing3() {
    const tipBox = document.getElementById("tip-box-phishing3");
    const tipBtn = document.getElementById("tip-btn-phishing3");
    tipBox.classList.toggle("hidden");
    tipBtn?.classList.remove("pulsing-tip");
}

function toggleTipUV() {
    const tipBox = document.getElementById("tip-box-uv");
    const tipBtn = document.getElementById("tip-btn-uv");
    tipBox.style.display = tipBox.style.display === "none" ? "block" : "none";
    tipBtn?.classList.remove("pulsing-tip");
}

function toggleTipSteganography() {
    const tipBox = document.getElementById("tip-box-steganography");
    const tipBtn = document.getElementById("tip-btn-steganography");
    tipBox.style.display = tipBox.style.display === "none" ? "block" : "none";
    tipBtn?.classList.remove("pulsing-tip");
}

function toggleTipMirror() {
    const tipBox = document.getElementById("tip-box-mirror");
    const tipBtn = document.getElementById("tip-btn-mirror");
    tipBox.style.display = tipBox.style.display === "none" ? "block" : "none";
    tipBtn?.classList.remove("pulsing-tip");
}
function toggleMorseTip() {
    const tipBox = document.getElementById("morse-tip-box");
    const tipBtn = document.getElementById("tip-btn-morse");

    tipBox.style.display = tipBox.style.display === "none" ? "block" : "none";
    if (tipBtn) tipBtn.classList.remove("pulsing-tip");
}


function startBonusTasks() {
    cancelAllTipTimers();

    inBonusMode = true;
    document.getElementById("result").classList.add("hidden");

    if (activeBonusTasks.length === 0) {
        alert("Inga bonusuppdrag just nu.");
        return;
    }

    const bonusTaskTitle = activeBonusTasks[0].title;
    const bonusContainer = Array.from(document.querySelectorAll('.container')).find(c =>
        c.querySelector('.task-title')?.getAttribute('data-title') === bonusTaskTitle
    );

    if (bonusContainer) {
        bonusContainer.classList.remove('hidden');
    }
}

function showTipButton(id) {
    const tipBtn = document.getElementById(id);
    const modal = document.getElementById("material-modal");

    if (!tipBtn) return;
    if (!isInVisibleTask(tipBtn)) return;
    if (modal && !modal.classList.contains("hidden")) return;

    if (tipBtn.dataset.tipShown === "true") return;
    tipBtn.dataset.tipShown = "true";

    tipBtn.style.display = "inline-block";
    tipBtn.style.visibility = "hidden";

    requestAnimationFrame(() => {
        const targetRect = tipBtn.getBoundingClientRect();

        const modalDiv = document.createElement("div");
        modalDiv.textContent = "💡 Tips tillgängligt!";
        Object.assign(modalDiv.style, {
            position: "fixed",
            background: "#00ffaa",
            color: "#0f0f0f",
            padding: "16px 24px",
            borderRadius: "12px",
            fontSize: "1.2em",
            zIndex: 9999,
            opacity: 1,
            animation: "pulseGlow 1.2s infinite",
            pointerEvents: "none",
            transition: "all 1s ease",
        });

        document.body.appendChild(modalDiv);

        const centerX = window.innerWidth / 2 - modalDiv.offsetWidth / 2;
        const centerY = window.innerHeight / 2 - modalDiv.offsetHeight / 2;
        modalDiv.style.left = `${centerX}px`;
        modalDiv.style.top = `${centerY}px`;

        setTimeout(() => {
            const modalRect = modalDiv.getBoundingClientRect();
            const targetX = targetRect.left + targetRect.width / 2 - modalRect.width / 2;
            const targetY = targetRect.top + targetRect.height / 2 - modalRect.height / 2;

            modalDiv.style.position = "absolute";
            modalDiv.style.left = `${modalRect.left}px`;
            modalDiv.style.top = `${modalRect.top}px`;
            modalDiv.style.animation = "none";

            requestAnimationFrame(() => {
                modalDiv.style.left = `${targetX}px`;
                modalDiv.style.top = `${targetY}px`;
                modalDiv.style.opacity = "0.3";
                modalDiv.style.transform = "scale(0.9)";
            });

            setTimeout(() => {
                tipBtn.style.visibility = "visible";
                tipBtn.classList.add("pulsing-tip");
                modalDiv.remove();
            }, 1000);
        }, 3000);
    });
}


function showMaterialModal(title, text) {
    const modal = document.getElementById("material-modal");
    const titleEl = document.getElementById("material-modal-title");
    const textEl = document.getElementById("material-modal-text");

    if (titleEl && textEl && modal) {
        titleEl.textContent = title;
        textEl.textContent = text;
        modal.classList.remove("hidden");
    }
}

function closeMaterialModal() {
    const modal = document.getElementById("material-modal");
    if (modal) {
        modal.classList.add("hidden");
    }

    cancelAllTipTimers();

    // Find visible tasks
    const visibleContainer = Array.from(document.querySelectorAll('.container'))
        .find(c => !c.classList.contains("hidden"));

    const currentTaskTitle = visibleContainer?.querySelector('.task-title')?.getAttribute('data-title');

    const tipBtnMap = {
        "🔓 Dekryptera meddelandet": "tip-btn-cryptogram",
        "💪 Starkaste lösenordet": "tip-btn-passwords",
        "📧 Phishingfällan": "tip-btn-phishing1",
        "🔦 UV-skattjakt": "tip-btn-uv",
        "💎 Spegelvänd Kod": "tip-btn-mirror"
    };

    const tipBtnId = tipBtnMap[currentTaskTitle];
    if (tipBtnId) {
        scheduleTip(tipBtnId, 300000); // 5 minutes
    }
}


function handleMaterialModalOrTip(taskTitle) {
    cancelAllTipTimers();
    if (["🔓 Dekryptera meddelandet", "🔦 UV-skattjakt", "💎 Spegelvänd Kod"].includes(taskTitle)) {
        let modalText = "";
        switch (taskTitle) {
            case "🔓 Dekryptera meddelandet":
                modalText = "Be Agent X att ge dig det material du behöver inför detta uppdrag!";
                break;
            case "🔦 UV-skattjakt":
                modalText = "Be Agent X att ge dig en UV-lampa till detta uppdrag!";
                break;
            case "💎 Spegelvänd Kod":
                modalText = "Be Agent X att ge dig en spegel till detta uppdrag!";
                break;
        }
        showMaterialModal(taskTitle, modalText);
    } else {
        const btnId = {
            "🔓 Dekryptera meddelandet": "tip-btn-cryptogram",
            "💪 Starkaste lösenordet": "tip-btn-passwords",
            "📧 Phishingfällan": "tip-btn-phishing1",
            "🔦 UV-skattjakt": "tip-btn-uv",
            "💎 Spegelvänd Kod": "tip-btn-mirror",
        }[taskTitle];

        if (btnId) scheduleTip(btnId, 300000);
    }
}

const allBonusTitles = activeBonusTasks.map(t => t.title);
document.querySelectorAll('.container').forEach(container => {
    const title = container.querySelector('.task-title')?.getAttribute('data-title');
    const backBtn = container.querySelector('#back-to-result');
    if (backBtn && allBonusTitles.includes(title)) {
        backBtn.classList.remove("hidden");
    }
});

function goToResult() {
    cancelAllTipTimers();
    document.querySelectorAll('.container').forEach(c => c.classList.add("hidden"));
    document.getElementById("result").classList.remove("hidden");
    showCodeWords();
}

//SECRET INPUT FIELD
function revealSecretInput() {
    const wrapper = document.getElementById('secret-input-wrapper');
    if (wrapper && wrapper.classList.contains('hidden')) {
        wrapper.classList.remove('hidden');
        wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}
function startSecretTasksSafe() {
    if (typeof startSecretTasks === 'function') startSecretTasks();
}

function bindSecretLogoHandlers() {
    if (window.__secretLogoBound) return true;
    const logo = document.getElementById('logo');
    if (!logo) return false;

    window.__secretLogoBound = true;

    logo.style.cursor = 'pointer';
    logo.style.touchAction = 'manipulation';
    logo.style.userSelect = 'none';
    logo.style.webkitUserSelect = 'none';
    logo.style.webkitTouchCallout = 'none';
    logo.setAttribute('draggable', 'false');
    logo.addEventListener('dragstart', e => e.preventDefault());

    // --- Multi-tap (5 taps in 2.5s) ---
    let taps = 0, tapTimer = null;
    const resetTaps = () => { taps = 0; clearTimeout(tapTimer); tapTimer = null; };
    logo.addEventListener('pointerup', () => {
        taps += 1;
        if (!tapTimer) tapTimer = setTimeout(resetTaps, 2500);
        if (taps >= 5) { resetTaps(); revealSecretInput(); }
    }, { passive: true });

    // --- Long-press (800ms) ---
    let pressTimer = null, holdFired = false, sx = 0, sy = 0;
    const HOLD_MS = 800, MOVE_CANCEL = 8;

    function clearPress(){ clearTimeout(pressTimer); pressTimer = null; }
    logo.addEventListener('pointerdown', (e) => {
        holdFired = false; sx = e.clientX; sy = e.clientY;
        clearPress();
        pressTimer = setTimeout(() => { holdFired = true; clearPress(); revealSecretInput(); }, HOLD_MS);
    });

    logo.addEventListener('pointermove', (e) => {
        if (!pressTimer) return;
        if (Math.hypot(e.clientX - sx, e.clientY - sy) > MOVE_CANCEL) clearPress();
    }, { passive: false });

    const end = () => clearPress();
    logo.addEventListener('pointerup', end);
    logo.addEventListener('pointerleave', end);
    logo.addEventListener('pointercancel', end);

    logo.addEventListener('pointerup', (e) => {
        if (holdFired) e.stopImmediatePropagation?.();
    }, true);

    return true;
}

if (!bindSecretLogoHandlers()) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bindSecretLogoHandlers, { once: true });
    } else {
        setTimeout(bindSecretLogoHandlers, 0);
    }
}

(function urlSwitch() {
    const h = (location.hash || '').toLowerCase();
    const q = (location.search || '').toLowerCase();
    if (h.includes('#agent') || q.includes('secret=1')) {
        requestAnimationFrame(revealSecretInput);
    }
})();

(function keyboard404() {
    const seq = ['4','0','4'];
    let buf = [];
    document.addEventListener('keydown', (e) => {
        const k = (e.key || '').toString();
        if (!k) return;
        buf.push(k);
        if (buf.length > 3) buf.shift();
        if (buf.join('') === seq.join('')) revealSecretInput();
    });
})();

(function watchSecretInput() {
    const secretInput = document.getElementById('secret-input');
    if (!secretInput) return;

    secretInput.addEventListener('input', () => {
        const v = secretInput.value.trim().toUpperCase();
        if (v === 'LÖSENORDLIME') startSecretTasksSafe();
    });
})();

function startSecretTasks() {
    const overlay = document.getElementById("explosion-overlay");
    const text = overlay.querySelector(".explosion-text");

    overlay.classList.remove("hidden");
    overlay.style.animation = "glitchExplosion 4s ease-in-out forwards";

    text.style.animation = "none";
    void text.offsetWidth;
    text.style.animation = "showText 3s ease-in-out forwards";

    setTimeout(() => {
        overlay.classList.add("hidden");
        overlay.style.animation = "none";

        inSecretMode = true;
        cancelAllTipTimers();

        document.getElementById("secret-input").readOnly = true;

        document.querySelectorAll('.container').forEach(c => c.classList.add("hidden"));
        document.getElementById("result").classList.add("hidden");

        const firstSecret = secretTasks[0].title;
        const container = Array.from(document.querySelectorAll('.container')).find(c =>
            c.querySelector('.task-title')?.getAttribute('data-title') === firstSecret
        );

        if (container) {
            container.classList.remove("hidden");
            handleMaterialModalOrTip(firstSecret);
        }

    }, 2000);
}
// END TIPS FUNCTIONS
// BONUS BUTTON
function bonusNotAvailable() {
    alert("🛠 BONUSUPPDRAG är inte tillgängligt ännu... men håll ögonen öppna! 👀");
}

    /* ---------- Centralized Touch/Pointer Drag (click-safe) ---------- */
    (function () {
    const isCoarse = window.matchMedia?.('(pointer: coarse)').matches || 'ontouchstart' in window;
    const hasPointer = !!window.PointerEvent;
    const DRAG_THRESHOLD = 6;

    const ZONES = () => Array.from(document.querySelectorAll('.drop-zone'));
    const ITEMS = () => Array.from(document.querySelectorAll('.drag-item'));

    let dragging = null;
    let ghost = null;
    let startX = 0, startY = 0;
    let ox = 0, oy = 0;
    let moved = false;

    function attachHandlers() {
    ITEMS().forEach(el => {
    el.removeAttribute('draggable');
    el.style.touchAction = 'none';

    if (hasPointer) {
    el.addEventListener('pointerdown', onPointerDown);
} else {
    el.addEventListener('touchstart', onTouchStart, { passive: false });
}
});
}

    function isInteractiveTarget(t) {
    return !!t.closest?.('button, a, input, textarea, select, label');
}

    function createGhost(fromEl, rect) {
    const g = fromEl.cloneNode(true);
    g.id = '';
    Object.assign(g.style, {
    position: 'fixed',
    left: rect.left + 'px',
    top: rect.top + 'px',
    width: rect.width + 'px',
    pointerEvents: 'none',
    opacity: '0.9',
    zIndex: 99999
});
    g.classList.add('dragging-ghost');
    document.body.appendChild(g);
    return g;
}

    // ----- Pointer path -----
    function onPointerDown(e) {
    if (isInteractiveTarget(e.target)) return;
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();

    dragging = target;
    startX = e.clientX;
    startY = e.clientY;
    ox = startX - rect.left;
    oy = startY - rect.top;
    moved = false;

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp, { once: true });
    window.addEventListener('pointercancel', cleanup, { once: true });
}

    function onPointerMove(e) {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (!moved) {
    if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    moved = true;
    const rect = dragging.getBoundingClientRect();
    ghost = createGhost(dragging, rect);
    dragging.style.opacity = '0.4';
    e.preventDefault?.();
}

    if (ghost) {
    ghost.style.left = (e.clientX - ox) + 'px';
    ghost.style.top  = (e.clientY - oy) + 'px';
}
}

    function onPointerUp(e) {
    if (moved) dropAtPoint(e.clientX, e.clientY);
    cleanup();
}

    // ----- Touch fallback -----
    function onTouchStart(e) {
    if (isInteractiveTarget(e.target)) return;
    const t = e.touches[0];
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();

    dragging = target;
    startX = t.clientX;
    startY = t.clientY;
    ox = startX - rect.left;
    oy = startY - rect.top;
    moved = false;

    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { once: true });
    window.addEventListener('touchcancel', cleanup, { once: true });
}

    function onTouchMove(e) {
    if (!dragging) return;
    const t = e.touches[0];
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;

    if (!moved) {
    if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    moved = true;
    const rect = dragging.getBoundingClientRect();
    ghost = createGhost(dragging, rect);
    dragging.style.opacity = '0.4';
}

    e.preventDefault();
    ghost.style.left = (t.clientX - ox) + 'px';
    ghost.style.top  = (t.clientY - oy) + 'px';
}

    function onTouchEnd(e) {
    if (moved) {
    const t = e.changedTouches[0];
    dropAtPoint(t.clientX, t.clientY);
}
    cleanup();
}

    // ----- Common helpers -----
    function dropAtPoint(x, y) {
    const el = document.elementFromPoint(x, y);
    const zone = el && el.closest ? el.closest('.drop-zone') : null;
    if (zone && dragging) zone.appendChild(dragging);
}

    function cleanup() {
    if (ghost) ghost.remove();
    if (dragging) dragging.style.opacity = '';
    ghost = null;
    dragging = null;

    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('touchmove', onTouchMove);
}

    window.initTouchDnD = attachHandlers;

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(attachHandlers, 0);
} else {
    window.addEventListener('DOMContentLoaded', () => setTimeout(attachHandlers, 0));
}
})();