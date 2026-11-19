/* Exam Cell Master Agent — runs fully in the browser */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const pad = n => String(n).padStart(2, '0');

/* ---------- default data ---------- */
// 5th sem CIE-2 timetable, exactly as issued by the department (Nov 2026)
const TT_SEM5 = [
  '03-11-2026 | FN | 22CY51 - Software Engineering',
  '03-11-2026 | AN | 22CY52 - Computer Network and Security',
  '04-11-2026 | FN | 22CY53 - Essentials of Cyber Security',
  '04-11-2026 | AN | 22CY551 - Artificial Intelligence in Cyber Security',
  '05-11-2026 | FN | 22RM56 - Research Methodology and IPR'
].join('\n');

const SUBJECT_BANK = {
  1: ['22MA11 - Engineering Mathematics I', '22PH12 - Engineering Physics', '22CS13 - Problem Solving with C', '22EE14 - Basic Electrical Engineering', '22EN15 - Communication Skills'],
  2: ['22MA21 - Engineering Mathematics II', '22CH22 - Engineering Chemistry', '22CS23 - Data Structures Basics', '22ME24 - Engineering Graphics', '22EC25 - Basic Electronics'],
  3: ['22MA31 - Discrete Mathematics', '22CY32 - Data Structures', '22CY33 - Digital Logic Design', '22CY34 - Object Oriented Programming', '22CY35 - Computer Organization'],
  4: ['22MA41 - Probability & Statistics', '22CY42 - Design & Analysis of Algorithms', '22CY43 - Theory of Computation', '22CY44 - Microprocessors', '22CY45 - Java Programming'],
  6: ['22CY61 - Compiler Design', '22CY62 - Cloud Security', '22CY63 - Digital Forensics', '22CY64 - Web Technologies', '22CY651 - Professional Elective: Data Mining'],
  7: ['22CY71 - Cryptography & Network Security', '22CY72 - Big Data Analytics', '22CY73 - Internet of Things', '22CY741 - Professional Elective: Deep Learning', '22CY751 - Open Elective: Project Management'],
  8: ['22CY81 - Professional Elective: Blockchain', '22CY82 - Open Elective: Cyber Law', '22CY83 - Industrial Management']
};
const EXAM_NAMES = { 'CIE-1': 'Continuous Internal Assessment Test-I', 'CIE-2': 'Continuous Internal Assessment Test-II', 'CIE-3': 'Continuous Internal Assessment Test-III' };
const DEFAULT_FACULTY = ['Dr. A. Ramesh', 'Prof. S. Meenakshi', 'Dr. K. Lakshmi', 'Prof. V. Suresh', 'Dr. P. Anitha', 'Prof. M. Karthik', 'Dr. N. Priya', 'Prof. R. Arun', 'Dr. T. Deepa', 'Prof. J. Vignesh', 'Dr. B. Kavitha', 'Prof. G. Harish', 'Dr. L. Sangeetha', 'Prof. D. Manoj', 'Dr. C. Revathi', 'Prof. H. Naveen', 'Dr. U. Bhuvana', 'Prof. F. Imran'].join('\n');

let PLAN = null;
let lastSem = null;
let LOGO = 'assets/logo.png';

/* ---------- init ---------- */
(function init() {
  $('#faculty').value = DEFAULT_FACULTY;
  $('#timetable').value = TT_SEM5; lastSem = 5;

  $('#run').addEventListener('click', runAgent);
  $('#cmd').addEventListener('keydown', e => { if (e.key === 'Enter') runAgent(); });
  $$('.chip').forEach(c => c.addEventListener('click', () => { $('#cmd').value = c.dataset.cmd; runAgent(); }));
  $$('.tab').forEach(t => t.addEventListener('click', () => switchTab(t.dataset.tab)));
  $('#printBtn').addEventListener('click', () => window.print());
  $('#csvBtn').addEventListener('click', downloadDutyCSV);
  $('#logo').addEventListener('change', e => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader(); r.onload = () => { LOGO = r.result; toast('Logo updated'); }; r.readAsDataURL(f);
  });
})();

/* Auto-generate a timetable for other semesters: 2 papers per day (FN + AN), Sundays skipped */
function fillTimetable(sem) {
  if (sem === 5) { $('#timetable').value = TT_SEM5; return; }
  const subs = SUBJECT_BANK[sem] || SUBJECT_BANK[6];
  const d = new Date($('#start').value + 'T12:00:00'); const lines = [];
  subs.forEach((s, i) => {
    if (i && i % 2 === 0) d.setDate(d.getDate() + 1);
    while (d.getDay() === 0) d.setDate(d.getDate() + 1);
    lines.push(`${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} | ${i % 2 ? 'AN' : 'FN'} | ${s}`);
  });
  $('#timetable').value = lines.join('\n');
}
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('show'), 2800);
}
function switchTab(name) {
  $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
  $$('.tabpanel').forEach(p => p.classList.toggle('active', p.id === 'tab-' + name));
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ord = n => n + ((n % 100 >= 11 && n % 100 <= 13) ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th'));

/* ---------- command parsing ---------- */
function parseCommand(text) {
  const cie = text.match(/ci[ea]\s*[-–]?\s*(\d)/i);
  const sem = text.match(/(\d)\s*(?:st|nd|rd|th)?\s*sem/i) || text.match(/sem(?:ester)?\s*(\d)/i);
  return { exam: cie ? 'CIE-' + Math.min(3, Math.max(1, +cie[1])) : 'CIE-2', sem: sem ? Math.min(8, Math.max(1, +sem[1])) : 5 };
}

/* ---------- agent pipeline ---------- */
async function runAgent() {
  const btn = $('#run'); btn.disabled = true;
  const cmd = parseCommand($('#cmd').value);
  if (cmd.sem !== lastSem) { fillTimetable(cmd.sem); lastSem = cmd.sem; }
  const steps = $$('#pipeline li');
  steps.forEach(s => s.classList.remove('active', 'done'));

  const cfg = readConfig(cmd);
  cfg.schedule = buildSchedule(cfg);
  if (!cfg.schedule.length) { toast('No valid timetable lines. Use: DD-MM-YYYY | FN | CODE - Subject'); btn.disabled = false; $('#settings details').open = true; return; }
  if (!cfg.faculty.length) { toast('Add at least one faculty member'); btn.disabled = false; $('#settings details').open = true; return; }

  for (let i = 0; i < steps.length; i++) {
    steps[i].classList.add('active');
    await sleep(420);
    if (i === 2) cfg.seating = buildSeating(cfg);
    if (i === 3) cfg.duty = buildDuty(cfg);
    steps[i].classList.remove('active'); steps[i].classList.add('done');
  }
  PLAN = cfg;
  renderAll();
  $('#results').hidden = false;
  switchTab('overview');
  $('#results').scrollIntoView({ behavior: 'smooth', block: 'start' });
  btn.disabled = false;
  toast('Plan ready for ' + cfg.exam + ' · ' + ord(cfg.sem) + ' sem');
}

function readConfig(cmd) {
  const lines = id => $(id).value.split('\n').map(s => s.trim()).filter(Boolean);
  return {
    ...cmd,
    inst: $('#inst').value, affil: $('#affil').value, addr: $('#addr').value, dept: $('#dept').value, ay: $('#ay').value,
    logo: LOGO,
    slot: { FN: [$('#fnS').value, $('#fnE').value], AN: [$('#anS').value, $('#anE').value] },
    students: Math.max(1, +$('#students').value || 60), benches: Math.max(4, +$('#benches').value || 15),
    prefix: $('#prefix').value.trim(), cs: $('#cs').value, coord: $('#coord').value, hod: $('#hod').value,
    ttLines: lines('#timetable'), faculty: lines('#faculty')
  };
}

/* ---------- date / time helpers ---------- */
const dmy = d => `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
const fmtDate = d => d.toLocaleDateString('en-IN', { weekday: 'short' }) + ', ' + dmy(d);
const fmtShort = d => `${pad(d.getDate())}-${pad(d.getMonth() + 1)}`;
const fmtT = t => { const [h, m] = t.split(':').map(Number); return `${(h % 12) || 12}.${pad(m)} ${h >= 12 ? 'pm' : 'am'}`; };
function addMinutes(t, mins) {
  const [h, m] = t.split(':').map(Number); const total = ((h * 60 + m + mins) % 1440 + 1440) % 1440;
  return pad(Math.floor(total / 60)) + ':' + pad(total % 60);
}
const slotText = (c, s) => `${fmtT(c.slot[s][0])} to ${fmtT(c.slot[s][1])}`;
const paperLabel = x => `${dmy(x.date)} ${x.session} · ${x.subject.code || x.subject.name}`;
const monthYear = c => c.schedule[0].date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

/* ---------- 1. schedule ---------- */
function buildSchedule(c) {
  const out = [];
  c.ttLines.forEach(line => {
    const p = line.split('|').map(s => s.trim());
    if (p.length < 3) return;
    const m = p[0].match(/(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})/);
    const sess = p[1].toUpperCase().startsWith('A') ? 'AN' : 'FN';
    if (!m) return;
    const parts = p.slice(2).join(' | ').split(/\s+-\s+/);
    const subject = parts.length > 1 ? { code: parts[0], name: parts.slice(1).join(' - ') } : { code: '', name: parts[0] };
    out.push({ date: new Date(+m[3], +m[2] - 1, +m[1], 12), session: sess, subject, from: c.slot[sess][0], to: c.slot[sess][1] });
  });
  out.sort((a, b) => a.date - b.date || (a.session === b.session ? 0 : a.session === 'FN' ? -1 : 1));
  out.forEach((x, i) => x.idx = i);
  return out;
}

/* Matrix timetable in the department's own format: Date | FN slot | AN slot */
function ttTable(c) {
  const keys = [...new Set(c.schedule.map(x => dmy(x.date)))];
  const sess = ['FN', 'AN'].filter(s => c.schedule.some(x => x.session === s));
  return `<table class="tt"><tr><th>Date</th>${sess.map(s => `<th>${slotText(c, s)}</th>`).join('')}</tr>` +
    keys.map(k => `<tr><td>${k}</td>${sess.map(s => {
      const x = c.schedule.find(y => dmy(y.date) === k && y.session === s);
      return `<td>${x ? `${esc(x.subject.name)}<br>(${esc(x.subject.code)})` : ''}</td>`;
    }).join('')}</tr>`).join('') + '</table>';
}

/* ---------- 2. seating ---------- */
const rollNo = (c, n) => c.prefix + String(n).padStart(3, '0');
function buildSeating(c) {
  const perRoom = c.benches * 2;
  const roomCount = Math.ceil(c.students / perRoom);
  const half = Math.ceil(c.students / 2);
  // pair roll i with roll i+half so classmates from the same roll block never share a bench
  const order = [];
  for (let i = 1; i <= half; i++) { order.push(i); if (i + half <= c.students) order.push(i + half); }
  const days = c.schedule.map((_, d) => {
    const shift = (d * 8) % order.length;
    const seq = order.slice(shift).concat(order.slice(0, shift));
    const rooms = [];
    for (let r = 0; r < roomCount; r++) {
      const chunk = seq.slice(r * perRoom, (r + 1) * perRoom);
      const benches = [];
      for (let b = 0; b < c.benches; b++) benches.push([chunk[b * 2] || null, chunk[b * 2 + 1] || null]);
      rooms.push({ name: 'Room ' + (101 + r), count: chunk.length, benches });
    }
    return rooms;
  });
  return { roomCount, perRoom, days };
}

/* ---------- 3. duty ---------- */
function buildDuty(c) {
  const F = c.faculty, R = c.seating.roomCount, need = R * 2 + 2;
  const counts = Object.fromEntries(F.map(f => [f, 0]));
  let p = 0; const rows = [];
  const warn = F.length < need ? `Only ${F.length} faculty available but ${need} duty slots are needed per session — some faculty are repeated within a session.` : null;
  c.schedule.forEach(s => {
    const take = k => { const f = F[(p + k) % F.length]; counts[f]++; return f; };
    const rooms = []; let k = 0;
    for (let r = 0; r < R; r++) rooms.push([take(k++), take(k++)]);
    const reliever = take(k++), squad = take(k++);
    p += need; rows.push({ s, rooms, reliever, squad });
  });
  return { rows, counts, need, warn };
}

/* ---------- rendering ---------- */
function renderAll() {
  $('#resTitle').textContent = `${PLAN.exam} · ${ord(PLAN.sem)} Semester`;
  $('#resEyebrow').textContent = 'Plan ready · ' + PLAN.ay;
  renderOverview(); renderSchedule(); renderSeating(); renderDuty(); renderForms();
}

function renderOverview() {
  const c = PLAN, S = c.schedule, last = S[S.length - 1];
  const totalDuties = Object.values(c.duty.counts).reduce((a, b) => a + b, 0);
  const vals = Object.values(c.duty.counts), mx = Math.max(...vals), mn = Math.min(...vals);
  const days = new Set(S.map(x => dmy(x.date))).size;
  const notes = [
    `<li class="ok">Exam window: <b>${fmtDate(S[0].date)}</b> to <b>${fmtDate(last.date)}</b> across ${days} day(s). FN ${slotText(c, 'FN')}, AN ${slotText(c, 'AN')}.</li>`,
    `<li>${c.students} students seated in <b>${c.seating.roomCount}</b> room(s) at 2 per bench. Roll numbers are paired across the class list (e.g. ${rollNo(c, 1)} with ${rollNo(c, Math.ceil(c.students / 2) + 1)}) to discourage copying.</li>`,
    `<li class="ok">Duty load is ${mx - mn <= 1 ? 'perfectly balanced' : 'balanced within ' + (mx - mn) + ' duties'} across ${c.faculty.length} faculty (max ${mx}, min ${mn}).</li>`,
    c.duty.warn ? `<li class="warn">${esc(c.duty.warn)}</li>` : '',
    `<li>Seating is rotated for every paper so nobody sits beside the same neighbour twice.</li>`
  ].join('');
  $('#tab-overview').innerHTML = `
    <div class="stats">
      <div class="stat" style="--c:var(--accent)"><b>${S.length}</b><span>Papers scheduled</span></div>
      <div class="stat" style="--c:var(--accent2)"><b>${c.seating.roomCount}</b><span>Exam halls</span></div>
      <div class="stat" style="--c:var(--accent3)"><b>${c.students}</b><span>Students</span></div>
      <div class="stat" style="--c:var(--ok)"><b>${totalDuties}</b><span>Duty slots assigned</span></div>
    </div>
    <div class="two">
      <div class="card"><h3>Timeline</h3><p class="hint">Generated by the Schedule agent</p>
        <div class="timeline">${S.map(x => `<div class="tl-item"><div class="d">${fmtDate(x.date)} · ${x.session}</div><div class="s">${esc(x.subject.name)}</div><div class="t">${esc(x.subject.code)} · ${slotText(c, x.session)}</div></div>`).join('')}</div>
      </div>
      <div class="card"><h3>Agent notes</h3><p class="hint">What the Master Agent decided</p><ul class="notes">${notes}</ul>
        <p class="hint" style="margin-top:18px">Open <b>Forms</b> for the timetable notice, circular, attendance sheets, duty orders, hall tickets and absentee statements.</p></div>
    </div>`;
}

function renderSchedule() {
  const c = PLAN;
  $('#tab-schedule').innerHTML = `<div class="card">
    <h3>${ord(c.sem)} sem ${esc(EXAM_NAMES[c.exam])} — Time Table</h3>
    <p class="hint">${esc(c.dept)} · ${monthYear(c)}</p>
    <div class="table-wrap">${ttTable(c)}</div></div>
    <div class="card" style="margin-top:20px"><h3>Paper-wise detail</h3><p class="hint">Every paper with its session and venue count</p>
    <div class="table-wrap"><table>
      <tr><th>#</th><th>Date</th><th>Session</th><th>Course code</th><th>Subject</th><th>Time</th><th>Halls</th></tr>
      ${c.schedule.map((x, i) => `<tr><td>${i + 1}</td><td><b>${fmtDate(x.date)}</b></td><td><span class="badge">${x.session}</span></td><td>${esc(x.subject.code || '—')}</td><td>${esc(x.subject.name)}</td><td>${slotText(c, x.session)}</td><td class="muted">${c.seating.roomCount}</td></tr>`).join('')}
    </table></div></div>`;
}

function renderSeating() {
  const c = PLAN;
  $('#tab-seating').innerHTML = `
    <div class="toolbar no-print"><label>Paper
      <select id="seatDay">${c.schedule.map((x, i) => `<option value="${i}">${esc(paperLabel(x))}</option>`).join('')}</select></label>
      <label>Find USN <input id="seatFind" placeholder="e.g. ${rollNo(c, 7)}"></label></div>
    <div id="seatOut"></div>`;
  const draw = () => {
    const d = +$('#seatDay').value, q = $('#seatFind').value.trim().toUpperCase();
    let found = null;
    const html = c.seating.days[d].map(r => `
      <div class="room"><header><strong>${r.name}</strong><span class="badge">${r.count} students</span></header>
        <div class="board"></div>
        <div class="bench-grid">${r.benches.map(b => `<div class="bench">${b.map(n => {
          if (!n) return '<span class="empty">—</span>';
          const rn = rollNo(c, n); const hit = q && rn.toUpperCase() === q; if (hit) found = r.name;
          return `<span style="${hit ? 'background:var(--warn);color:#000' : ''}">${rn.slice(c.prefix.length)}</span>`;
        }).join('')}</div>`).join('')}</div>
        <div class="legend"><span>USN prefix: ${esc(c.prefix)}</span><span>Left / right seat per bench</span></div></div>`).join('');
    $('#seatOut').innerHTML = (q ? `<p class="hint">${found ? `<b>${esc(q)}</b> sits in <b>${found}</b> for this paper.` : 'USN not found.'}</p>` : '') + `<div class="rooms">${html}</div>`;
  };
  $('#seatDay').addEventListener('change', draw); $('#seatFind').addEventListener('input', draw); draw();
}

function renderDuty() {
  const c = PLAN, D = c.duty, R = c.seating.roomCount;
  const max = Math.max(...Object.values(D.counts), 1);
  $('#tab-duty').innerHTML = `
    <div class="card" style="margin-bottom:20px">
      <h3>Invigilation Duty Chart</h3>
      <p class="hint">Chief Superintendent: <b>${esc(c.cs)}</b> · Coordinator: <b>${esc(c.coord)}</b></p>
      ${D.warn ? `<ul class="notes" style="margin-bottom:14px"><li class="warn">${esc(D.warn)}</li></ul>` : ''}
      <div class="table-wrap"><table>
        <tr><th>Date / session</th>${Array.from({ length: R }, (_, i) => `<th>Room ${101 + i}</th>`).join('')}<th>Reliever</th><th>Flying squad</th></tr>
        ${D.rows.map(r => `<tr><td><b>${fmtShort(r.s.date)} · ${r.s.session}</b><br><span class="muted">${esc(r.s.subject.code)}</span></td>
          ${r.rooms.map(p => `<td>${p.map(n => `<span class="fac">${esc(n)}</span>`).join('')}</td>`).join('')}
          <td><span class="fac">${esc(r.reliever)}</span></td><td><span class="fac">${esc(r.squad)}</span></td></tr>`).join('')}
      </table></div></div>
    <div class="card"><h3>Fairness meter</h3><p class="hint">Total duties per faculty across ${c.schedule.length} papers</p>
      <div class="fair">${Object.entries(D.counts).map(([n, v]) => `<div class="fair-row"><span>${esc(n)}</span><div class="bar"><i style="width:${v / max * 100}%"></i></div><b>${v}</b></div>`).join('')}</div></div>`;
}

/* ---------- forms ---------- */
function renderForms() {
  $('#tab-forms').innerHTML = `
    <div class="toolbar no-print">
      <label>Form <select id="formType">
        <option value="timetable">Time table notice</option>
        <option value="circular">Exam circular</option>
        <option value="attendance">Attendance sheet</option>
        <option value="duty">Duty order (faculty)</option>
        <option value="ticket">Hall ticket</option>
        <option value="absent">Absentee statement</option></select></label>
      <span id="formCtl" style="display:contents"></span>
      <button class="btn-ghost" onclick="window.print()">🖨 Print form</button>
    </div>
    <div class="paper-wrap"><div class="paper" id="paper"></div></div>`;
  $('#formType').addEventListener('change', setupFormControls);
  setupFormControls();
}

function setupFormControls() {
  const c = PLAN, t = $('#formType').value, ctl = $('#formCtl');
  const paperOpts = c.schedule.map((x, i) => `<option value="${i}">${esc(paperLabel(x))}</option>`).join('');
  const roomOpts = Array.from({ length: c.seating.roomCount }, (_, i) => `<option value="${i}">Room ${101 + i}</option>`).join('');
  if (t === 'attendance' || t === 'absent') ctl.innerHTML = `<label>Paper <select id="fDay">${paperOpts}</select></label><label>Room <select id="fRoom">${roomOpts}</select></label>`;
  else if (t === 'duty') ctl.innerHTML = `<label>Faculty <select id="fFac">${c.faculty.map((f, i) => `<option value="${i}">${esc(f)}</option>`).join('')}</select></label>`;
  else if (t === 'ticket') ctl.innerHTML = `<label>Roll no. <input id="fRoll" type="number" min="1" max="${c.students}" value="1" style="min-width:100px"></label>`;
  else ctl.innerHTML = '';
  $$('select,input', ctl).forEach(e => e.addEventListener('input', drawForm));
  drawForm();
}

const letterhead = c => `<div class="lh">${c.logo ? `<img src="${esc(c.logo)}" alt="" onerror="this.remove()">` : ''}
  <div><h4>${esc(c.inst)}</h4><p class="aff">${esc(c.affil)}</p><p>${esc(c.addr)}</p><h6>${esc(c.dept)}</h6></div></div>`;
const titleBlock = c => `<div class="ttl">${ord(c.sem)} sem ${esc(EXAM_NAMES[c.exam])}<br>${monthYear(c)}</div>`;
const signBlock = c => `<div class="sign"><div>${esc(c.coord)}<br><small>Exam Cell Coordinator</small></div><div>${esc(c.hod)}<br><small>Head of Department</small></div><div>${esc(c.cs)}<br><small>Chief Superintendent</small></div></div>`;

function drawForm() {
  const c = PLAN, t = $('#formType').value, P = $('#paper'), today = dmy(new Date());
  const paper = () => c.schedule[+($('#fDay') || { value: 0 }).value];
  let h = letterhead(c);

  if (t === 'timetable') {
    h += `${titleBlock(c)}<h5 class="plain">Time Table</h5>${ttTable(c)}
      <p class="small">Students must report to the examination hall 15 minutes before the commencement of each paper.</p>${signBlock(c)}`;
  }
  if (t === 'circular') {
    h += `<div class="meta"><span>Ref: DSCE/CSE-CY/${c.exam}/S${c.sem}</span><span>Date: ${today}</span></div>
      <h5>Circular</h5>
      <p><b>Subject:</b> Conduct of ${esc(EXAM_NAMES[c.exam])} — ${ord(c.sem)} Semester (${esc(c.ay)})</p>
      <p>All students of ${ord(c.sem)} semester are informed that the ${esc(EXAM_NAMES[c.exam])} will be conducted as per the following schedule:</p>
      ${ttTable(c)}
      <p><b>Instructions to candidates:</b></p>
      <ol><li>Report to the allotted hall <b>15 minutes</b> before the commencement of the examination.</li>
      <li>Carry your college ID card; entry without it will not be permitted.</li>
      <li>Mobile phones, smart watches and any electronic gadgets are strictly prohibited inside the hall.</li>
      <li>The seating arrangement will be displayed on the notice board before each examination.</li>
      <li>Any malpractice will be dealt with as per the institution's examination rules.</li></ol>
      ${signBlock(c)}`;
  }
  if (t === 'attendance') {
    const d = paper(), r = c.seating.days[d.idx][+$('#fRoom').value], seats = [];
    r.benches.forEach((b, i) => b.forEach((n, j) => { if (n) seats.push([`B${i + 1}-${j ? 'R' : 'L'}`, rollNo(c, n)]); }));
    h += `<h5>Attendance Sheet</h5>
      <div class="meta"><span>${ord(c.sem)} sem · ${esc(EXAM_NAMES[c.exam])}</span><span>${r.name}</span></div>
      <div class="meta"><span>${esc(d.subject.code)} – ${esc(d.subject.name)}</span><span>${dmy(d.date)} (${d.session}) · ${slotText(c, d.session)}</span></div>
      <table><tr><th>S.No</th><th>Seat</th><th>USN</th><th>Booklet No</th><th>Signature</th></tr>
      ${seats.map((s, i) => `<tr><td>${i + 1}</td><td>${s[0]}</td><td>${s[1]}</td><td></td><td></td></tr>`).join('')}</table>
      <p>Present: ______ &nbsp; Absent: ______ &nbsp; Total: ${seats.length}</p>
      <div class="sign"><div>Invigilator 1</div><div>Invigilator 2</div><div>Chief Superintendent</div></div>`;
  }
  if (t === 'duty') {
    const f = c.faculty[+$('#fFac').value], mine = [];
    c.duty.rows.forEach(r => {
      r.rooms.forEach((p, i) => { if (p.includes(f)) mine.push([r.s, 'Invigilator — Room ' + (101 + i)]); });
      if (r.reliever === f) mine.push([r.s, 'Reliever (Exam Cell)']);
      if (r.squad === f) mine.push([r.s, 'Flying squad']);
    });
    h += `<div class="meta"><span>Ref: DSCE/CSE-CY/DUTY/${c.exam}</span><span>Date: ${today}</span></div><h5>Invigilation Duty Order</h5>
      <p>To,<br><b>${esc(f)}</b><br>${esc(c.dept)}</p>
      <p>You are hereby assigned the following examination duties for the <b>${esc(EXAM_NAMES[c.exam])}</b> of ${ord(c.sem)} semester. Please report to the Exam Cell 30 minutes before the start of each session.</p>
      <table><tr><th>Date</th><th>Session</th><th>Course</th><th>Report by</th><th>Duty</th></tr>
      ${mine.map(m => `<tr><td>${dmy(m[0].date)}</td><td>${m[0].session} (${slotText(c, m[0].session)})</td><td>${esc(m[0].subject.code)}</td><td>${fmtT(addMinutes(m[0].from, -30))}</td><td>${m[1]}</td></tr>`).join('') || '<tr><td colspan="5">No duty assigned</td></tr>'}</table>
      <p>Total duties: <b>${mine.length}</b>. Duty exchanges require prior written approval of the Chief Superintendent.</p>${signBlock(c)}`;
  }
  if (t === 'ticket') {
    const n = Math.min(c.students, Math.max(1, +$('#fRoll').value || 1));
    h += `<h5>Hall Ticket — ${esc(EXAM_NAMES[c.exam])}</h5><div class="ticket">
      <div class="meta"><span>USN: ${rollNo(c, n)}</span><span>${ord(c.sem)} Semester · ${monthYear(c)}</span></div>
      <p>Name: ______________________________ &nbsp; Photo: ▭</p>${ttTable(c)}
      <div class="sign"><div>Student</div><div>Exam Cell Coordinator</div></div></div>`;
  }
  if (t === 'absent') {
    const d = paper(), r = c.seating.days[d.idx][+$('#fRoom').value];
    h += `<h5>Absentee Statement</h5><div class="meta"><span>${r.name}</span><span>${dmy(d.date)} (${d.session})</span></div>
      <p>Course: ${esc(d.subject.code)} – ${esc(d.subject.name)}</p>
      <table><tr><th>S.No</th><th>USN</th><th>Reason (if known)</th></tr>${Array.from({ length: 8 }, (_, i) => `<tr><td>${i + 1}</td><td>&nbsp;</td><td></td></tr>`).join('')}</table>
      <p>Total absent: ______ &nbsp; Booklets issued: ______ &nbsp; Booklets returned: ______</p>
      <div class="sign"><div>Invigilator 1</div><div>Invigilator 2</div><div>Chief Superintendent</div></div>`;
  }
  P.innerHTML = h;
}

/* ---------- export ---------- */
function downloadDutyCSV() {
  if (!PLAN) return;
  const R = PLAN.seating.roomCount;
  const head = ['Date', 'Session', 'Course', ...Array.from({ length: R }, (_, i) => `Room ${101 + i}`), 'Reliever', 'Flying squad'];
  const rows = PLAN.duty.rows.map(r => [dmy(r.s.date), r.s.session, r.s.subject.code, ...r.rooms.map(p => p.join(' & ')), r.reliever, r.squad]);
  const csv = [head, ...rows].map(r => r.map(x => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = `duty-chart-${PLAN.exam}-sem${PLAN.sem}.csv`; a.click();
  toast('Duty chart downloaded');
}
