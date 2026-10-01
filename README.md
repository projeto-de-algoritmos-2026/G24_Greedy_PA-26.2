# UniScheduler

Projeto demonstrativo de **algoritmos gulosos** aplicado à gestão de horários acadêmicos.

## Algoritmos

1. **Interval Partitioning** — aloca todas as aulas usando o menor número possível de salas.

## Como executar

Não há dependências nem build. Extraia o ZIP e abra `index.html` em um navegador moderno.

Para servir localmente (opcional):

```bash
python3 -m http.server 8000
```

Depois acesse `http://localhost:8000`.

As aulas editadas ficam salvas neste navegador (`localStorage`). Para rodar a suíte automatizada dos algoritmos com Node.js:

```bash
node tests/algorithms.test.js
```

Em ambientes com suporte à execução isolada do test runner, também funciona `node --test tests/algorithms.test.js`.

## Estrutura

- `index.html` — interface principal
- `js/algorithms.js` — implementação dos algoritmos
- `js/app.js` — interação, exemplos e visualizações
- `tests/test.html` — testes rápidos no navegador
- `tests/algorithms.test.js` — casos de borda e comparação com busca exaustiva

## Escopo

O sistema foi intencionalmente mantido pequeno: cadastro/edição de intervalos, execução do algoritmo de Interval Partitioning, visualização do resultado e execução passo a passo. O objetivo principal é demonstrar conhecimento de Projeto de Algoritmos.
