const examples = {
  partition: [
    { name: "Algoritmos", start: "08:00", end: "09:40" },
    { name: "Banco de Dados", start: "08:00", end: "10:00" },
    { name: "Cálculo I", start: "08:30", end: "10:30" },
    { name: "Engenharia de Software", start: "09:50", end: "11:30" },
    { name: "Inteligência Artificial", start: "10:20", end: "12:00" },
  ],
};

const STORAGE_KEY = "unischeduler-data-v1";

function loadData() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (
      saved &&
      Array.isArray(saved.partition) &&
      saved.partition.every(
        (item) =>
          item &&
          typeof item.name === "string" &&
          typeof item.start === "string" &&
          typeof item.end === "string",
      )
    ) {
      return { partition: saved.partition };
    }
  } catch {
    // Storage can be unavailable or contain invalid JSON; use the examples.
  }
  return structuredClone(examples);
}

let data = loadData();
let view = "home";
const app = document.querySelector("#app");

document.querySelectorAll("nav button[data-view]").forEach((button) => {
  button.onclick = () => go(button.dataset.view);
});

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // The app remains usable if the browser blocks local storage.
  }
}

function go(nextView) {
  view = nextView;
  document.querySelectorAll("nav button").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === nextView);
  });
  render();
}

function render() {
  if (view === "home") home();
  else if (view === "about") about();
  else moduleView(view);
}

function home() {
  app.innerHTML = `
    <h1>Otimização de horários acadêmicos</h1>
    <p class="lead">Aplicação de algoritmos gulosos à organização de horários acadêmicos.</p>
    <div class="grid2">
      <div class="card choice">
        <h2>Alocação de salas</h2>
        <p>Todas as aulas precisam acontecer. Descubra o menor número de salas necessário e distribua os horários sem conflitos.</p>
        <span class="tag">INTERVAL PARTITIONING</span><br>
        <button class="btn" onclick="go('partition')">Alocar aulas →</button>
      </div>
    </div>`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

function rows(type) {
  return data[type]
    .map(
      (item, index) => `
        <tr data-row="${index}">
          <td><input aria-label="Disciplina, aula ${index + 1}" value="${escapeHtml(item.name)}" onchange="edit('${type}', ${index}, 'name', this.value)"></td>
          <td><input aria-label="Início, aula ${index + 1}" type="time" value="${escapeHtml(item.start)}" onchange="edit('${type}', ${index}, 'start', this.value)"></td>
          <td><input aria-label="Fim, aula ${index + 1}" type="time" value="${escapeHtml(item.end)}" onchange="edit('${type}', ${index}, 'end', this.value)"></td>
          <td><button class="btn secondary" onclick="removeItem('${type}', ${index})">Remover</button></td>
        </tr>`,
    )
    .join("");
}

function moduleView(type) {
  app.innerHTML = `
    <h1>Alocação de Salas</h1>
    <p class="lead">Todas as aulas precisam acontecer. Encontre o menor número de salas necessário.</p>
    <div class="work">
      <div class="card">
        <div class="toolbar">
          <div><h2>Solicitações</h2><small>Edite os intervalos ou carregue o exemplo.</small></div>
          <div>
            <button class="btn secondary" onclick="reset('${type}')">Carregar exemplo</button>
            <button class="btn" onclick="add('${type}')">+ Adicionar aula</button>
          </div>
        </div>
        <div class="table-scroll">
          <table class="table">
            <thead><tr><th>Disciplina</th><th>Início</th><th>Fim</th><th></th></tr></thead>
            <tbody>${rows(type)}</tbody>
          </table>
        </div>
      </div>
      <div class="card action">
        <h2>Executar algoritmo</h2>
        <p>O Interval Partitioning aloca todas as aulas com o menor número de salas.</p>
        <button class="btn" onclick="run('partition')">▶ Encontrar alocação ótima</button>
      </div>
    </div>
    <div id="result" aria-live="polite"></div>`;
}

function edit(type, index, key, value) {
  data[type][index][key] = value;
  saveData();
  clearResult();
  const row = document.querySelector(`tr[data-row="${index}"]`);
  if (row) row.classList.toggle("invalid-row", validateItems([data[type][index]]).length > 0);
}

function add(type) {
  data[type].push({ name: "Nova aula", start: "08:00", end: "09:00" });
  saveData();
  moduleView(type);
}

function removeItem(type, index) {
  data[type].splice(index, 1);
  saveData();
  moduleView(type);
}

function reset(type) {
  data[type] = structuredClone(examples[type]);
  saveData();
  moduleView(type);
}

function clearResult() {
  const result = document.querySelector("#result");
  if (result) result.innerHTML = "";
}

function run(type) {
  clearResult();
  const errors = validateItems(data[type]);
  if (errors.length) {
    errors.forEach((error) => {
      document
        .querySelector(`tr[data-row="${error.index}"]`)
        ?.classList.add("invalid-row");
    });
    document.querySelector("#result").innerHTML = `
      <div class="card result validation-message" role="alert">
        <h2>Revise os dados</h2>
        <ul>${errors.map((error) => `<li>${escapeHtml(error.message)}</li>`).join("")}</ul>
      </div>`;
    return;
  }

  if (type === "partition") showPartition();
}

function timelineScale(items) {
  if (items.length === 0) {
    return { start: 8 * 60, end: 16 * 60, ticks: [480, 600, 720, 840, 960] };
  }

  const first = Math.min(...items.map((item) => mins(item.start)));
  const last = Math.max(...items.map((item) => mins(item.end)));
  const step = [15, 30, 60, 120, 180, 240, 360, 480].find(
    (candidate) => candidate >= (last - first) / 5,
  ) || 480;
  const start = Math.floor(first / step) * step;
  let end = Math.ceil(last / step) * step;
  if (end <= start) end = start + step;
  const ticks = [];
  for (let time = start; time <= end; time += step) ticks.push(time);
  return { start, end, ticks };
}

function renderAxis(scale, labelWidth = 105) {
  const span = scale.end - scale.start;
  return `
    <div class="axis" style="--label-width:${labelWidth}px">
      <div class="axis-label"></div>
      <div class="axis-track">
        ${scale.ticks
          .map(
            (time) =>
              `<span style="left:${((time - scale.start) / span) * 100}%">${clock(time)}</span>`,
          )
          .join("")}
      </div>
    </div>`;
}

function eventStyle(item, scale) {
  const span = scale.end - scale.start;
  const left = ((mins(item.start) - scale.start) / span) * 100;
  const width = ((mins(item.end) - mins(item.start)) / span) * 100;
  return `left:${left}%;width:${width}%`;
}

function showPartition() {
  const result = intervalPartitioning(data.partition);
  const peak = peakConcurrency(data.partition);
  const scale = timelineScale(data.partition);
  const rooms = result.rooms
    .map(
      (room, index) => `
        <div class="room">
          <div class="roomname">Sala ${index + 1}</div>
          <div class="track">
            ${room.items
              .map(
                (item) => `
                  <div class="event" title="${escapeHtml(item.name)} — ${item.start}–${item.end}" style="${eventStyle(item, scale)}">
                    <b>${escapeHtml(item.name)}</b><span class="event-time">${item.start}–${item.end}</span>
                  </div>`,
              )
              .join("")}
          </div>
        </div>`,
    )
    .join("");
  const peakExplanation = peak.count
    ? `Pico: ${peak.count} ${peak.count === 1 ? "aula" : "aulas"} às ${clock(peak.time)} → ${peak.count} ${peak.count === 1 ? "sala" : "salas"}.`
    : "Não há aulas para alocar.";

  document.querySelector("#result").innerHTML = `
    <div class="card result">
      <div class="toolbar"><div><h2>Resultado da alocação</h2><small>Distribuição encontrada pelo algoritmo.</small></div></div>
      <div class="metrics">
        <div class="metric"><b>${result.rooms.length}</b>salas necessárias</div>
        <div class="metric"><b>${data.partition.length}</b>aulas alocadas</div>
        <div class="metric"><b>O(n log n)</b>complexidade</div>
      </div>
      <div class="timeline">
        ${renderAxis(scale)}
        ${rooms || '<p class="empty-state">Adicione aulas para visualizar a distribuição.</p>'}
      </div>
      <div class="note">
        <b>Certificado de otimalidade</b><br>
        ${peakExplanation} O pico de simultaneidade é um limite inferior para o número de salas; o algoritmo usa exatamente esse número.
      </div>
      <details><summary>Ver execução passo a passo</summary><div class="steps">${result.steps
        .map((step) => `<div class="step">${escapeHtml(step)}</div>`)
        .join("")}</div></details>
    </div>`;
}

function about() {
  app.innerHTML = `
    <h1>Sobre o projeto</h1>
    <p class="lead">Uma aplicação didática para demonstrar algoritmos gulosos em um cenário universitário.</p>
    <div class="card">
      <h2>Objetivo</h2>
      <p>O UniScheduler resolve o problema <b>Interval Partitioning</b>, que atende todas as aulas usando o menor número de salas.</p>
      <p>O algoritmo ordena os intervalos e realiza escolhas gulosas. A interface permite editar casos, executar as soluções e acompanhar as decisões passo a passo.</p>
      <h2>Complexidade</h2>
      <p>O Partitioning ordena as aulas e atualiza uma min-heap em <b>O(n log n)</b>.</p>
    </div>`;
}

render();
