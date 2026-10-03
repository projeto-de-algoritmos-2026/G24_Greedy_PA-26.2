const test = require("node:test");
const assert = require("node:assert/strict");
const {
  intervalPartitioning,
  intervalScheduling,
  peakConcurrency,
  validateItems,
} = require("../js/algorithms.js");

function time(minutes) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

function interval(name, start, end) {
  return { name, start: time(start), end: time(end) };
}

function bruteForceRoomCount(items) {
  const sorted = [...items].sort(
    (a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end),
  );
  let best = items.length;


  function assign(index, roomEnds) {
    if (index === sorted.length) {
      best = Math.min(best, roomEnds.length);
      return;
    }
    if (roomEnds.length >= best) return;

    const start = sorted[index].start;
    const end = sorted[index].end;
    const triedEnds = new Set();
    for (let room = 0; room < roomEnds.length; room += 1) {
      if (roomEnds[room] <= start && !triedEnds.has(roomEnds[room])) {
        triedEnds.add(roomEnds[room]);
        const previousEnd = roomEnds[room];
        roomEnds[room] = end;
        assign(index + 1, roomEnds);
        roomEnds[room] = previousEnd;
      }
    }

    if (roomEnds.length + 1 < best) {
      roomEnds.push(end);
      assign(index + 1, roomEnds);
      roomEnds.pop();
    } else if (roomEnds.length + 1 === best && index + 1 === sorted.length) {
      best = roomEnds.length + 1;
    }
  }

  if (items.length === 0) return 0;
  assign(0, []);
  return best;
}

function bruteForceScheduleCount(items) {
  let best = 0;
  for (let mask = 0; mask < 1 << items.length; mask += 1) {
    const chosen = items.filter((_, index) => mask & (1 << index));
    if (chosen.length <= best) continue;

    let compatible = true;
    for (let left = 0; left < chosen.length && compatible; left += 1) {
      for (let right = left + 1; right < chosen.length; right += 1) {
        if (
          chosen[left].start < chosen[right].end &&
          chosen[right].start < chosen[left].end
        ) {
          compatible = false;
          break;
        }
      }
    }
    if (compatible) best = chosen.length;
  }
  return best;
}

test("casos de borda do Partitioning", () => {
  assert.equal(intervalPartitioning([]).rooms.length, 0);
  assert.equal(
    intervalPartitioning([interval("única", 480, 540)]).rooms.length,
    1,
  );
  assert.equal(
    intervalPartitioning([
      interval("A", 480, 540),
      interval("B", 540, 600),
    ]).rooms.length,
    1,
  );
  assert.equal(
    intervalPartitioning([
      interval("A", 480, 540),
      interval("B", 480, 540),
      interval("C", 480, 540),
    ]).rooms.length,
    3,
  );
});

test("casos de borda do Scheduling", () => {
  assert.equal(intervalScheduling([]).selected.length, 0);
  assert.equal(
    intervalScheduling([interval("única", 480, 540)]).selected.length,
    1,
  );
  assert.equal(
    intervalScheduling([
      interval("A", 480, 540),
      interval("B", 540, 600),
    ]).selected.length,
    2,
  );
  assert.equal(
    intervalScheduling([
      interval("A", 480, 540),
      interval("B", 480, 540),
      interval("C", 480, 540),
    ]).selected.length,
    1,
  );
});

test("pico de simultaneidade trata intervalos adjacentes como compatíveis", () => {
  const peak = peakConcurrency([
    interval("A", 480, 540),
    interval("B", 540, 600),
  ]);
  assert.deepEqual(peak, { count: 1, time: 480 });
  assert.deepEqual(peakConcurrency([]), { count: 0, time: null });
});

test("validação aponta linha e impede horários em branco ou inválidos", () => {
  assert.deepEqual(
    validateItems([
      interval("Aula válida", 480, 540),
      { name: "Aula sem início", start: "", end: "09:00" },
      { name: "Aula sem fim", start: "09:00", end: "" },
    ]),
    [
      { index: 1, message: "Aula 2: informe o horário de início." },
      { index: 2, message: "Aula 3: informe o horário de término." },
    ],
  );
  assert.equal(
    validateItems([{ name: "Horário impossível", start: "25:00", end: "26:00" }])[0]
      .message,
    "Aula 1: o horário de início é inválido.",
  );
});

test("Partitioning e Scheduling coincidem com busca exaustiva em entradas aleatórias", () => {
  let seed = 20261005;
  const random = (maximum) => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed % maximum;
  };

  for (let sample = 0; sample < 100; sample += 1) {
    const count = random(9);
    const items = Array.from({ length: count }, (_, index) => {
      const start = random(12 * 60);
      const duration = 1 + random(180);
      return interval(`Aula ${index}`, start, start + duration);
    });

    assert.equal(
      intervalPartitioning(items).rooms.length,
      bruteForceRoomCount(items),
      `Partitioning divergiu na amostra ${sample}`,
    );
    assert.equal(
      intervalPartitioning(items).rooms.length,
      peakConcurrency(items).count,
      `Certificado de simultaneidade divergiu na amostra ${sample}`,
    );
    assert.equal(
      intervalScheduling(items).selected.length,
      bruteForceScheduleCount(items),
      `Scheduling divergiu na amostra ${sample}`,
    );
  }
});
