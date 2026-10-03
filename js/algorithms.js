function mins(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function clock(minutes) {
  return (
    String(Math.floor(minutes / 60)).padStart(2, "0") +
    ":" +
    String(minutes % 60).padStart(2, "0")
  );
}

function isValidTime(value) {
  if (typeof value !== "string" || !/^\d{2}:\d{2}$/.test(value)) return false;
  const [hours, minutes] = value.split(":").map(Number);
  return hours < 24 && minutes < 60;
}

function validateItems(items) {
  return items.flatMap((item, index) => {
    const line = index + 1;
    if (typeof item.name !== "string" || !item.name.trim()) {
      return [{ index, message: `Aula ${line}: informe o nome da disciplina.` }];
    }
    if (!item.start) {
      return [{ index, message: `Aula ${line}: informe o horário de início.` }];
    }
    if (!isValidTime(item.start)) {
      return [{ index, message: `Aula ${line}: o horário de início é inválido.` }];
    }
    if (!item.end) {
      return [{ index, message: `Aula ${line}: informe o horário de término.` }];
    }
    if (!isValidTime(item.end)) {
      return [{ index, message: `Aula ${line}: o horário de término é inválido.` }];
    }
    if (mins(item.end) <= mins(item.start)) {
      return [{ index, message: `Aula ${line}: o término precisa ser posterior ao início.` }];
    }
    return [];
  });
}

class MinHeap {
  constructor(compare) {
    this.items = [];
    this.compare = compare;
  }

  get size() {
    return this.items.length;
  }

  peek() {
    return this.items[0];
  }

  push(value) {
    const items = this.items;
    items.push(value);
    let index = items.length - 1;

    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (this.compare(items[parent], items[index]) <= 0) break;
      [items[parent], items[index]] = [items[index], items[parent]];
      index = parent;
    }
  }

  pop() {
    const items = this.items;
    if (items.length === 0) return undefined;

    const minimum = items[0];
    const last = items.pop();
    if (items.length > 0) {
      items[0] = last;
      let index = 0;

      while (true) {
        const left = 2 * index + 1;
        const right = left + 1;
        let smallest = index;

        if (left < items.length && this.compare(items[left], items[smallest]) < 0) {
          smallest = left;
        }
        if (right < items.length && this.compare(items[right], items[smallest]) < 0) {
          smallest = right;
        }
        if (smallest === index) break;
        [items[index], items[smallest]] = [items[smallest], items[index]];
        index = smallest;
      }
    }

    return minimum;
  }
}

function intervalScheduling(items) {
  const sorted = [...items].sort(
    (a, b) => mins(a.end) - mins(b.end) || mins(a.start) - mins(b.start),
  );
  let lastEnd = -Infinity;
  const selected = [];
  const rejected = [];
  const steps = [];

  for (const item of sorted) {
    // Invariante: as aulas selecionadas são compatíveis e lastEnd é o término da última delas.
    if (mins(item.start) >= lastEnd) {
      selected.push(item);
      lastEnd = mins(item.end);
      steps.push(
        `✓ ${item.name} (${item.start}–${item.end}) selecionada: é compatível e termina cedo.`,
      );
    } else {
      rejected.push(item);
      steps.push(
        `× ${item.name} (${item.start}–${item.end}) rejeitada por conflito com a última seleção.`,
      );
   }
  } 
  return { selected, rejected, steps };
}

function intervalPartitioning(items) {
  const sorted = [...items].sort(
    (a, b) => mins(a.start) - mins(b.start) || mins(a.end) - mins(b.end),
  );
  const rooms = [];
  const steps = [];
  const roomsByEnd = new MinHeap(
    (a, b) => a.end - b.end || a.roomIndex - b.roomIndex,
  );

  // Invariante: a heap tem uma entrada por sala, ordenada pelo término da última aula alocada nela.
  for (const item of sorted) {
    const start = mins(item.start);
    const end = mins(item.end);
    const earliestRoom = roomsByEnd.peek();

    // Escolha gulosa: reutilizar a sala que fica livre primeiro, quando possível.
    if (earliestRoom && earliestRoom.end <= start) {
      const room = roomsByEnd.pop();
      rooms[room.roomIndex].items.push(item);
      roomsByEnd.push({ end, roomIndex: room.roomIndex });
      steps.push(
        `“${item.name}” inicia às ${item.start}; Sala ${room.roomIndex + 1} está livre. Aula alocada nela.`,
      );
    } else {
      const roomIndex = rooms.length;
      rooms.push({ items: [item] });
      roomsByEnd.push({ end, roomIndex });
      steps.push(
        `“${item.name}” inicia às ${item.start}; nenhuma sala está livre. Criada Sala ${rooms.length}.`,
      );
    }
  }

  return { rooms, steps };
}

// Certificado independente por varredura: no mesmo horário, términos vêm antes de inícios,
// então intervalos que apenas se encostam não contam como sobrepostos.
function peakConcurrency(items) {
  const events = items.flatMap((item) => [
    { time: mins(item.start), change: 1 },
    { time: mins(item.end), change: -1 },
  ]);
  events.sort((a, b) => a.time - b.time || a.change - b.change);

  let active = 0;
  let peak = 0;
  let time = null;

  for (const event of events) {
    active += event.change;
    if (active > peak) {
      peak = active;
      time = event.time;
    }
  }

  return { count: peak, time };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    clock,
    intervalPartitioning,
    intervalScheduling,
    mins,
    peakConcurrency,
    validateItems,
  };
}
