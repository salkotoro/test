// ======================================================
// ADMIN PAGE LOGIC
// ======================================================
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('groupForm');
    const fieldsEl = document.getElementById('codeword-fields');
    const resetGroupsBtn = document.getElementById('reset-groups-btn');
    const resetTimerBtn  = document.getElementById('reset-timer-btn');
    const badgeMins  = document.getElementById('badge-mins');
    const badgeWords = document.getElementById('badge-words');

    const btn45 = document.getElementById('set-45-btn');
    const btn90 = document.getElementById('set-90-btn');

    const savedMode     = parseInt(localStorage.getItem('modeMinutes') || '0', 10);
    const savedDuration = parseInt(localStorage.getItem('durationMinutes') || '0', 10);
    const initialMode   = Number.isFinite(savedMode) && savedMode > 0 ? savedMode : 45;

    if (!Number.isFinite(savedDuration) || savedDuration <= 0) {
        localStorage.setItem('durationMinutes', String(initialMode));
    }

    setGameMode(initialMode, { resetDuration: false });

    btn45?.addEventListener('click', () => setGameMode(45, { resetDuration: true }));
    btn90?.addEventListener('click', () => setGameMode(90, { resetDuration: true }));

    function showStatus(msg, type = 'info') {
        let el = document.getElementById('status-msg');
        if (!el) {
            el = document.createElement('div');
            el.id = 'status-msg';
            el.style.position = 'fixed';
            el.style.bottom = '20px';
            el.style.right = '20px';
            el.style.padding = '10px 16px';
            el.style.borderRadius = '8px';
            el.style.fontFamily = 'Share Tech Mono, monospace';
            el.style.background = '#00ffaa22';
            el.style.border = '1px solid #00ffaa66';
            el.style.color = '#00ffaa';
            el.style.fontSize = '0.95rem';
            el.style.zIndex = '9999';
            el.style.transition = 'opacity 0.4s ease';
            document.body.appendChild(el);
        }
        el.textContent = msg;
        el.style.opacity = '1';
        el.style.color = (type === 'error') ? '#ff5555' : '#00ffaa';
        clearTimeout(el._hideTimer);
        el._hideTimer = setTimeout(() => { el.style.opacity = '0'; }, 2000);
    }

    if (!form || !fieldsEl) return;

    if (!localStorage.getItem('startTime')) {
        localStorage.setItem('startTime', Date.now().toString());
    }
    if (localStorage.getItem('isPaused') == null) {
        localStorage.setItem('isPaused', '0');
    }
    if (localStorage.getItem('pausedTotal') == null) {
        localStorage.setItem('pausedTotal', '0'); // ms
    }

    // --- Submit handler ---
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;

        const expectedCodeWords = safeParseJSON(
            form.dataset?.expected,
            []
        ).map(s => String(s).trim().toLocaleUpperCase('sv-SE'));

        const group = document.getElementById('group')?.value.trim();
        const userWords = expectedCodeWords.map((_, i) =>
            (document.getElementById(`code${i + 1}`)?.value ?? "")
                .trim()
                .toLocaleUpperCase('sv-SE')
        ).filter(Boolean);

        const expectedSet = new Set(expectedCodeWords);
        const userSet = new Set(userWords);
        const allPresent = expectedCodeWords.every(w => userSet.has(w));

        if (!allPresent || userSet.size < expectedSet.size) {
            showStatus("Fel kodord! Kontrollera stavningen.", "error");
            for (let i = 0; i < expectedCodeWords.length; i++) {
                const val = (document.getElementById(`code${i + 1}`)?.value || "").trim();
                if (!val) { document.getElementById(`code${i + 1}`).focus(); break; }
            }
            if (submitBtn) submitBtn.disabled = false;
            return;
        }

        const elapsedSeconds = computeElapsedSeconds();
        const mm = Math.floor(elapsedSeconds / 60);
        const ss = elapsedSeconds % 60;
        const elapsed = `${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;

        const existing = safeParseJSON(localStorage.getItem('klaradeGrupper'), []);
        existing.push({
            id: cryptoRandomId(),
            group,
            elapsed,
            when: new Date().toISOString()
        });
        localStorage.setItem('klaradeGrupper', JSON.stringify(existing));

        showStatus("✅ Grupp registrerad!");
        form.reset();
        document.getElementById('group')?.focus();
        if (submitBtn) submitBtn.disabled = false;
    });

    // --- Reset groups ---
    resetGroupsBtn?.addEventListener('click', () => {
        if (confirm("Vill du verkligen radera alla registrerade grupper?")) {
            localStorage.removeItem('klaradeGrupper');
            showStatus("🗑️ Alla grupper borttagna.");
        }
    });

    // --- Reset timer ---
    resetTimerBtn?.addEventListener('click', () => {
        const mode = parseInt(localStorage.getItem('modeMinutes') || '45', 10);
        localStorage.setItem('startTime', Date.now().toString());
        localStorage.setItem('durationMinutes', String(mode));
        localStorage.setItem('isPaused', '0');
        localStorage.removeItem('pausedAt');
        localStorage.setItem('pausedTotal', '0');
        updateTimerStatePill();
        showStatus(`⏱️ Timer återställd (${mode} min)`);
    });

    // ---- Active Servers ----
    const serverCountInput = document.getElementById('server-count');
    const applyServerCountBtn = document.getElementById('apply-server-count-btn');
    const currentServersPill = document.getElementById('current-servers-pill');

    const storedTotal = parseInt(localStorage.getItem('totalGroups') || '0', 10);
    const defaultTotal = Number.isFinite(storedTotal) && storedTotal > 0
        ? storedTotal
        : (safeParseJSON(form.dataset?.expected, []).length || 6);

    if (serverCountInput) serverCountInput.value = String(defaultTotal);
    if (currentServersPill) currentServersPill.textContent = String(defaultTotal);

    applyServerCountBtn?.addEventListener('click', () => {
        const n = parseInt(serverCountInput?.value || '0', 10);
        if (!Number.isFinite(n) || n < 1) {
            showStatus('⚠️ Ange ett giltigt antal servrar (minst 1).', 'error');
            serverCountInput?.focus();
            return;
        }

        const saved = safeParseJSON(localStorage.getItem('klaradeGrupper'), []);
        if (Array.isArray(saved) && saved.length > n) {
            const ok = confirm(
                `Du sänker antalet servrar till ${n}. Trimma listan över registrerade grupper till ${n}?`
            );
            if (ok) {
                localStorage.setItem('klaradeGrupper', JSON.stringify(saved.slice(0, n)));
            }
        }

        localStorage.setItem('totalGroups', String(n));
        if (currentServersPill) currentServersPill.textContent = String(n);
        showStatus(`🖥️ Antal servrar uppdaterat till ${n}`);
    });

    // ---- Timer adjustment buttons ----
    const pauseBtn  = document.getElementById('pause-timer-btn');
    const resumeBtn = document.getElementById('resume-timer-btn');
    const plus5Btn  = document.getElementById('plus-5-btn');
    const plus1Btn  = document.getElementById('plus-1-btn');
    const minus5Btn = document.getElementById('minus-5-btn');
    const minus1Btn = document.getElementById('minus-1-btn');

    function adjustTimer(minutesDelta) {
        const current = parseInt(localStorage.getItem('durationMinutes') || '45', 10);
        const newValue = Math.max(1, current + minutesDelta);
        localStorage.setItem('durationMinutes', String(newValue));
        showStatus(`${minutesDelta > 0 ? '➕' : '➖'} Timer justerad: ${newValue} min`);
    }

    plus5Btn?.addEventListener('click', () => adjustTimer(5));
    plus1Btn?.addEventListener('click', () => adjustTimer(1));
    minus5Btn?.addEventListener('click', () => adjustTimer(-5));
    minus1Btn?.addEventListener('click', () => adjustTimer(-1));

    function updateTimerStatePill() {
        const pills = [
            document.getElementById('timer-state-pill-top'),
            document.getElementById('timer-state-pill-bottom')
        ];
        const isPaused = localStorage.getItem('isPaused') === '1';
        pills.forEach(pill => {
            if (!pill) return;
            pill.textContent = isPaused ? 'Pausad' : 'Kör';
            pill.classList.toggle('pill--warning', isPaused);
        });
    }

    function pauseTimer() {
        const isPaused = localStorage.getItem('isPaused') === '1';
        if (isPaused) return;
        localStorage.setItem('isPaused', '1');
        localStorage.setItem('pausedAt', Date.now().toString());
        updateTimerStatePill();
        showStatus('⏸️ Timer pausad');
    }

    function resumeTimer() {
        const isPaused = localStorage.getItem('isPaused') === '1';
        if (!isPaused) return;
        const pausedAt = parseInt(localStorage.getItem('pausedAt') || '0', 10);
        const pausedTotal = parseInt(localStorage.getItem('pausedTotal') || '0', 10);
        const add = Math.max(0, Date.now() - (Number.isFinite(pausedAt) ? pausedAt : Date.now()));
        localStorage.setItem('pausedTotal', String(pausedTotal + add));
        localStorage.setItem('isPaused', '0');
        localStorage.removeItem('pausedAt');
        updateTimerStatePill();
        showStatus('▶️ Timer fortsätter');
    }

    pauseBtn?.addEventListener('click', pauseTimer);
    resumeBtn?.addEventListener('click', resumeTimer);
    updateTimerStatePill();

    // --- shared elapsed helper  ---
    function computeElapsedSeconds() {
        const start = parseInt(localStorage.getItem('startTime') || `${Date.now()}`, 10);
        const isPaused = localStorage.getItem('isPaused') === '1';
        const pausedAt = parseInt(localStorage.getItem('pausedAt') || '0', 10);
        const pausedTotal = parseInt(localStorage.getItem('pausedTotal') || '0', 10);
        const now = Date.now();
        const effectiveNow = isPaused && Number.isFinite(pausedAt) && pausedAt > 0 ? pausedAt : now;
        const elapsedMs = Math.max(0, (effectiveNow - start) - pausedTotal);
        return Math.floor(elapsedMs / 1000);
    }

    // ------------------------------------------------------------------
    // setGameMode — sets MODE (45/90) & UI; optionally resets live duration
    // ------------------------------------------------------------------
    function setGameMode(minutes, opts = { resetDuration: true }) {
        if (!form || !fieldsEl) return;

        const newWords = minutes === 90
            ? ["PIXELPÄRON", "CYBERCITRON", "DATADRUVA", "FIKONFIL", "HACKERHALLON", "KIWIKOD"]
            : ["PIXELPÄRON", "CYBERCITRON", "DATADRUVA", "FIKONFIL"];

        localStorage.setItem('modeMinutes', String(minutes));

        if (opts.resetDuration) {
            localStorage.setItem('durationMinutes', String(minutes));
        }

        form.dataset.duration = String(minutes);
        form.dataset.expected = JSON.stringify(newWords);

        if (badgeMins)  badgeMins.textContent  = String(minutes);
        if (badgeWords) badgeWords.textContent = String(newWords.length);

        fieldsEl.innerHTML = "";
        newWords.forEach((_, i) => {
            const input = document.createElement('input');
            input.type = 'text';
            input.id = `code${i + 1}`;
            input.placeholder = `Kodord ${i + 1}`;
            input.required = true;
            input.className = 'admin-input';
            fieldsEl.appendChild(input);
        });

        showStatus(`✅ Speltid satt till ${minutes} min (${newWords.length} kodord)`);

        const btn45El = document.getElementById('set-45-btn');
        const btn90El = document.getElementById('set-90-btn');
        if (minutes === 45) {
            btn45El.classList.add('active-mode');
            btn45El.classList.remove('btn--ghost');
            btn90El.classList.remove('active-mode');
            btn90El.classList.add('btn--ghost');
        } else {
            btn90El.classList.add('active-mode');
            btn90El.classList.remove('btn--ghost');
            btn45El.classList.remove('active-mode');
            btn45El.classList.add('btn--ghost');
        }
    }
});

// ======================================================
// SHARED HELPERS
// ======================================================
function safeParseJSON(str, fallback) {
    try { const v = JSON.parse(str); return v ?? fallback; }
    catch { return fallback; }
}

function cryptoRandomId() {
    if (window.crypto?.getRandomValues) {
        const arr = new Uint32Array(2);
        crypto.getRandomValues(arr);
        return [...arr].map(n => n.toString(36)).join('');
    }
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ======================================================
// CYBERSTORM TV PAGE LOGIC
// ======================================================
document.addEventListener("DOMContentLoaded", () => {
    if (!document.body.classList.contains("tv-page")) return;

    function parseJSON(str, fb) {
        try { const v = JSON.parse(str); return v ?? fb; }
        catch { return fb; }
    }

    function getDurationSecs() {
        const mins = parseInt(localStorage.getItem("durationMinutes") || "45", 10);
        return (Number.isFinite(mins) && mins > 0 ? mins : 45) * 60;
    }

    function formatTime(s) {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    }

    // elapsed excluding paused time
    function computeElapsedSeconds() {
        const start = parseInt(localStorage.getItem('startTime') || `${Date.now()}`, 10);
        const isPaused = localStorage.getItem('isPaused') === '1';
        const pausedAt = parseInt(localStorage.getItem('pausedAt') || '0', 10);
        const pausedTotal = parseInt(localStorage.getItem('pausedTotal') || '0', 10);

        const now = Date.now();
        const effectiveNow = isPaused && Number.isFinite(pausedAt) && pausedAt > 0 ? pausedAt : now;
        const elapsedMs = Math.max(0, (effectiveNow - start) - pausedTotal);
        return Math.floor(elapsedMs / 1000);
    }

    let totalGroups = 0;
    let timerInterval = null;
    let serversInterval = null;

    window.startMission = function startMission() {
        const count = parseInt(document.getElementById("groupCount").value, 10);
        if (!Number.isFinite(count) || count < 1)
            return alert("Vänligen ange antal grupper.");

        totalGroups = count;
        localStorage.setItem("totalGroups", String(count));
        localStorage.setItem("klaradeGrupper", JSON.stringify([]));
        localStorage.setItem("startTime", Date.now().toString());
        localStorage.setItem("isPaused", '0');
        localStorage.removeItem("pausedAt");
        localStorage.setItem("pausedTotal", '0');
        initDisplay();
    };

    function updateTimer() {
        const startStr = localStorage.getItem("startTime");
        if (!startStr) {
            document.getElementById("timer").textContent = "--:--";
            return;
        }
        const elapsed = computeElapsedSeconds();
        const remaining = Math.max(0, getDurationSecs() - elapsed);
        document.getElementById("timer").textContent = formatTime(remaining);
    }

    function updateServers() {
        const saved = parseJSON(localStorage.getItem("klaradeGrupper"), []);
        const total = parseInt(localStorage.getItem("totalGroups") || "0", 10) || 0;

        const container = document.getElementById("servers");
        container.innerHTML = "";

        const elapsed = computeElapsedSeconds();
        const expired = elapsed >= getDurationSecs();

        for (let i = 0; i < total; i++) {
            const entry = saved[i];
            const div = document.createElement("div");
            div.className = "server-box";

            if (entry) {
                div.innerHTML = `
          🖥️ <strong>Server ${i + 1}</strong><br>
          <span class="rescued">Räddad av ${entry.group} efter ${entry.elapsed}!</span>`;
            } else {
                div.innerHTML = `
          🖥️ <strong>Server ${i + 1}</strong><br>
          <span class="${expired ? "warning" : ""}">
            ${expired ? "⛔ Server ej räddad i tid!" : "❌ Inget skydd ännu"}
          </span>`;
            }
            container.appendChild(div);
        }
    }

    function initDisplay() {
        const groupCount = parseInt(localStorage.getItem("totalGroups") || "0", 10);
        const start = localStorage.getItem("startTime");

        if (!groupCount || !start) {
            document.getElementById("setup").classList.remove("hidden");
            document.getElementById("timer-section").classList.add("hidden");
            document.getElementById("servers").classList.add("hidden");
            return;
        }

        totalGroups = groupCount;

        document.getElementById("setup").classList.add("hidden");
        document.getElementById("timer-section").classList.remove("hidden");
        document.getElementById("servers").classList.remove("hidden");

        updateTimer();
        updateServers();

        if (timerInterval) clearInterval(timerInterval);
        if (serversInterval) clearInterval(serversInterval);
        timerInterval = setInterval(updateTimer, 1000);
        serversInterval = setInterval(updateServers, 2000);
    }

    initDisplay();
});
