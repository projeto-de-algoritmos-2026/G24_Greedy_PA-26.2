🇧🇷 [Português](README.md) | 🇺🇸 **English**

<h1>UniScheduler - Room Allocation and Lab Scheduling with Greedy Algorithms</h1>

## Demo video

▶ [Watch the UniScheduler demo on YouTube](COLE_AQUI_O_LINK_DO_VIDEO)

<p align="center">
  <img src="docs/img/inicio.png" width="700"><br><br>
  <img src="docs/img/alocacao-de-salas.png" width="700"><br><br>
  <img src="docs/img/laboratorio-compartilhado.png" width="700">
</p>

> The interface is in Portuguese: **Alocação de Salas** = Room Allocation,
> **Laboratório Compartilhado** = Shared Lab.

---

## Real-world problem

At the start of every semester, universities face two scheduling problems that look alike but
have opposite goals. In the first one, **every class must take place**, and the department wants
the **smallest number of rooms** that fits the timetable with no time clashes. In the second one,
there is **a single lab** and many classes asking to use it. Not all of them fit, and the goal is
to serve the **largest possible number of requests** with no overlap.

Both start from the same data (classes with a start and end time) and are solved by classic
**greedy algorithms**, which make the best local decision and prove that it leads to the global
optimum:

| Problem | Algorithm | Greedy choice |
| --- | --- | --- |
| Fewest rooms for all classes | **Interval Partitioning** | sort by **start** and reuse the room that frees up first |
| Most classes in a single lab | **Interval Scheduling** | sort by **finish** and accept the next compatible class |

---

## Modeling

### Classes as intervals

Each class is an interval `[start, end)` with a name and `HH:MM` start and end times. To compare
times, [`mins`](js/algorithms.js#L1) converts each time into **minutes since 00:00**
(`08:30 → 510`), and [`clock`](js/algorithms.js#L6) converts back for display.

### Compatibility

Two classes are **compatible** when they do not overlap. Intervals are closed at the start and
open at the end, so a class ending at `10:00` and another starting at `10:00` **can share a
room**. This convention is the same in both algorithms, in the optimality certificate and in the
tests.

### Validation

Before any run, [`validateItems`](js/algorithms.js#L20) checks every row and points out **which
class** is wrong and **why**: empty name, missing time, impossible time (`25:00`) or an end time
that is not after the start. The invalid row is highlighted in the table and the algorithm does
not run until it is fixed.

---

## Interval Partitioning

[`intervalPartitioning`](js/algorithms.js#L103). Allocates **every** class using the **fewest
rooms**.

1. Sort the classes by **start** time (ties: earliest finish first).
2. For each class, look at the room that **frees up first**.
3. If that room is already free when the class starts, the class goes there. Otherwise no other
   room is free either, and the algorithm **opens a new room**.

### Min-heap of rooms

To find the room that frees up first in `O(log k)`, rooms are kept in a
[`MinHeap`](js/algorithms.js#L45) (a binary heap implemented in the project), keyed by the end time
of each room's last class.

```
Invariant: the heap has exactly one entry per room,
           keyed by the end time of the last class allocated to it.
→ the root is always the room that frees up first.
→ if not even the root is free, no room is.
```

### Why it is optimal

When the algorithm opens room `k`, all `k - 1` existing rooms are busy at the start of the current
class. Since classes are processed in order of start time, this means **`k` classes are happening
at the same moment**. No valid solution can use fewer than `k` rooms, because those `k` classes
must be in different rooms. So the number of rooms used equals the **depth** (the peak of
simultaneous classes), which is the lower bound.

### Optimality certificate

The interface does not ask you to trust the proof: [`peakConcurrency`](js/algorithms.js#L170)
computes the depth with an **independent sweep line**. Each class becomes two events (`+1` at the
start and `-1` at the end), sorted by time, with ends before starts at the same minute. The
largest running total is the peak, shown on screen as, for example,
`Pico: 3 aulas às 08:30 → 3 salas` (peak: 3 classes at 08:30 → 3 rooms).

**Complexity:** `O(n log n)`. Sorting costs `O(n log n)`, and each class does at most one removal
and one insertion in the heap, in `O(log k)`, with `k ≤ n`.

---

## Interval Scheduling

[`intervalScheduling`](js/algorithms.js#L140). With **a single lab**, selects the **largest
possible number** of non-overlapping classes.

1. Sort the requests by **finish** time (ties: earliest start first).
2. Walk the list keeping the finish time of the last accepted class.
3. Accept the class if it starts **after or exactly when** the last accepted one ends. Otherwise
   it is marked as a conflict.

```
Invariant: accepted classes are mutually compatible,
           and lastEnd is the finish time of the last accepted one.
```

### Why it is optimal (exchange argument)

Let `a` be the class that finishes first and `O` any optimal solution. If `O` does not contain
`a`, swap the first class of `O` for `a`: since `a` finishes no later, it does not conflict with
any of the others, and the solution keeps the same size. So **there is an optimal solution that
starts with `a`**. Applying the same argument to what remains after `a`, by induction, the greedy
choice produces an optimal solution.

Finishing first is the right criterion because it leaves the **most free time** for the next
requests. Choosing the **shortest** class or the one that **starts first** can fail: a long class
that starts early blocks several short ones.

**Complexity:** `O(n log n)` to sort and `O(n)` to scan.

---

## Visualization

[`js/app.js`](js/app.js) turns each algorithm's result into something you can explain in a
presentation:

| Feature | Partitioning | Scheduling |
| --- | --- | --- |
| **Timeline** | one lane per room, with its classes | one lane per class, selected in green and conflicts in gray |
| **Metrics** | rooms needed, classes allocated, complexity | selected, conflicts, complexity |
| **On-screen proof** | peak concurrency certificate | explanation of the greedy choice |
| **Step by step** | room created or reused for each class | class accepted or rejected at each step |

The timeline scale adapts to the given times ([`timelineScale`](js/app.js#L216)), so evening or
early classes are shown in full. Course names go through [`escapeHtml`](js/app.js#L97) before
reaching the page, and edited classes are saved in the browser (`localStorage`).

---

## Project structure

```
unischeduler/
├── index.html                    # Page structure and navigation
├── css/
│   └── style.css                 # Visual identity and responsive layout
├── js/
│   ├── algorithms.js             # MinHeap, Partitioning, Scheduling, certificate and validation
│   └── app.js                    # Screens, editing, timeline and step by step
├── tests/
│   ├── algorithms.test.js        # Node suite: edge cases and exhaustive search
│   └── test.html                 # Quick tests in the browser
└── docs/img/                     # Screenshots used in this README
```

> **Design note:** [`js/algorithms.js`](js/algorithms.js) does not depend on the browser. The same
> functions run in the interface and in the Node test suite, so what is tested is exactly what the
> screen runs.

---

## Demo scenarios

The **Carregar exemplo** (load example) button on each screen brings a case designed for the
presentation:

| Screen | Input | Result |
| --- | --- | --- |
| **Room Allocation** | 5 classes between 08:00 and 12:00 | **3 rooms**. Peak of 3 classes at 08:30 (Algoritmos, Banco de Dados and Cálculo I). Engenharia de Software and Inteligência Artificial reuse freed rooms |
| **Shared Lab** | 7 requests between 08:00 and 15:00 | **5 selected** and **2 conflicts**. Visão Computacional (08:00–10:00) is rejected even though it starts first, because Machine Learning finishes earlier |

---

## How to run

No dependencies and no build: the project is plain HTML, CSS and JavaScript.

**Option 1:** open `index.html` directly in the browser.

**Option 2:** serve the folder locally:

```bash
python3 -m http.server 8000
```

Open [http://localhost:8000](http://localhost:8000).

**Option 3 (VS Code):** install the **Live Server** extension, right-click `index.html` and choose
**Open with Live Server**.

## How to run the tests

Requirement: **Node.js 18+**.

```bash
node --test tests/algorithms.test.js
```

There are 5 tests covering edge cases (empty list, single class, identical classes, adjacent
times), input validation, the peak certificate and a comparison of both algorithms against
**exhaustive search** on 100 deterministic random inputs. The quick tests can also be opened in
the browser at `tests/test.html`.

---

## Contributors

| [Camila Cavalcante](https://github.com/CamilaSilvaC) | [Luísa Ferreira](https://github.com/luisa12ll) |
| :---: | :---: |
| <img src="https://github.com/CamilaSilvaC.png" alt="camila" width="120"> | <img src="https://github.com/luisa12ll.png" alt="luisa" width="120"> |
