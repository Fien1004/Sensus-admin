<template>
  <main class="insights-view">
    <header class="page-header">
      <div class="title-block">
        <h1 class="page-title">Inzichten</h1>

        <nav class="tabs" aria-label="Inzichten tabs">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            type="button"
            class="tab-button"
            :class="{ active: activeTab === tab.key }"
            @click="activeTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </nav>
      </div>
    </header>

    <section class="kpi-row">
      <div class="kpi-card big">
        <div class="kpi-label">Sessies</div>
        <div class="kpi-value">689</div>
      </div>

      <div class="kpi-card big">
        <div class="kpi-label">Voltooid</div>
        <div class="kpi-value">70%</div>
      </div>

      <div class="kpi-card big">
        <div class="kpi-label">Afhaak %</div>
        <div class="kpi-value">32%</div>
        <div class="kpi-meta success">↑ 32% t.o.v. vorige week</div>
      </div>

      <div class="kpi-card big">
        <div class="kpi-label">Gem. sessieduur</div>
        <div class="kpi-value">11 min</div>
      </div>
    </section>

    <div class="selector-wrapper">
      <div class="selector-card">
        <label class="select-field">
          <span class="sr-only">Scenario</span>
          <select class="select-input">
            <option>Scenario: Online gesprek loopt vast</option>
          </select>
        </label>
      </div>
    </div>

    <div class="cards-row">
      <div class="insights-card">
        <h2 class="section-title">Kern inzichten voor dit scenario</h2>

        <div class="insights-grid">
          <div class="small-card">
            <div class="small-label">Voltooid %</div>
            <div class="small-value">95.7%</div>
          </div>

          <div class="small-card">
            <div class="small-label">Afhaak %</div>
            <div class="small-value">-50%</div>
          </div>

          <div class="warning-box">Afhaak ligt 18% hoger dan gemiddeld</div>
        </div>
      </div>

      <aside class="behavior-card">
        <h3 class="section-title">Gedrag van gebruikers</h3>

        <div class="behavior-grid-vertical">
          <div class="small-card">
            <div class="behavior-title">Populairste pad</div>
            <div class="behavior-value">B</div>
            <div class="behavior-meta">65% koos dit pad</div>
          </div>

          <div class="small-card">
            <div class="behavior-title">Minst populairste pad</div>
            <div class="behavior-value">A</div>
            <div class="behavior-meta">35% koos dit pad</div>
          </div>
        </div>

        <div class="behavior-note">65% kiest pad B, vaak om confrontatie te vermijden</div>
      </aside>
    </div>

    <section class="card reflections-card">
      <h3 class="section-title">Reflecties van gebruikers</h3>

      <div class="table-wrap">
        <table class="reflections-table">
          <thead>
            <tr>
              <th>Gebruiker/id</th>
              <th>Datum</th>
              <th>Leeftijd</th>
              <th>Gender</th>
              <th>Reflectie</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in reflections" :key="r.id" class="reflection-row">
              <td>{{ r.id }}</td>
              <td>{{ r.date }}</td>
              <td>{{ r.age }}</td>
              <td>{{ r.gender }}</td>
              <td class="reflection-text">{{ r.text }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <footer class="pagination">
        <button class="pagination-button">‹ Vorige</button>
        <span class="pagination-divider"></span>
        <button class="pagination-button">Volgende ›</button>
      </footer>
    </section>

    <section class="card behavior-breakdown">
      <h3 class="section-title">Gedrag in het scenario</h3>

      <div class="gender-grid">
        <div class="gender-card" v-for="g in genders" :key="g.key">
          <div class="gender-title">{{ g.label }}</div>
          <div class="progress-bar-container">
            <div class="progress-full">
              <div class="segment segment-a" :style="{ width: g.padA + '%' }">
                <span class="segment-text">{{ g.padA }}%</span>
              </div>
              <div class="segment segment-b" :style="{ width: g.padB + '%' }">
                <span class="segment-text">{{ g.padB }}%</span>
              </div>
              <div class="segment segment-drop" :style="{ width: g.drop + '%' }">
                <span class="segment-text segment-drop-text">{{ g.drop }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="legend" aria-hidden="true">
        <div class="legend-item"><span class="dot a"></span> Pad A</div>
        <div class="legend-item"><span class="dot b"></span> Pad B</div>
        <div class="legend-item"><span class="dot drop"></span> Afhaak</div>
      </div>
    </section>

    <section class="card drop-per-step">
      <h3 class="section-title">Afhaak per stap</h3>

      <div class="steps-outer">
        <div class="step-row" v-for="step in steps" :key="step.key">
          <div class="step-left">
            <div class="step-title">{{ step.title }}</div>
            <div class="step-desc">{{ step.desc }}</div>
          </div>

          <div class="step-center">
            <div class="bar-row">
              <div class="bar-wrap">
                <div class="bar-a" :style="{ width: step.padA + '%' }"><span class="bar-text">Pad A</span></div>
              </div>
              <div class="bar-percent">{{ step.padA }}%</div>
            </div>

            <div class="bar-row">
              <div class="bar-wrap">
                <div class="bar-b" :style="{ width: step.padB + '%' }"><span class="bar-text">Pad B</span></div>
              </div>
              <div class="bar-percent">{{ step.padB }}%</div>
            </div>
          </div>

          <div class="step-right">
            <div class="drop-card">Afhaak<br>{{ step.drop }}%</div>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup>
import { ref } from 'vue'

const tabs = [
  { key: 'all', label: 'Alle sessies' },
  { key: 'week', label: 'Deze week' },
  { key: 'today', label: 'Vandaag' },
]
const activeTab = ref('all')

const reflections = ref([
  { id: 'r85n5Te8gG', date: '17 dec 2025', age: 17, gender: 'V', text: 'Ik vindt het soms lastig om signalen van een ander te herkennen.' },
  { id: 'Ye8Psf592Ne', date: '17 dec 2025', age: 17, gender: 'M', text: 'Ik ben heel open, en merk dat mensen daardoor soms foute aannemen hebben. Ik weet niet altijd hoe ik daarop moet reageren.' },
  { id: 'je8e4b9He4F', date: '18 dec 2025', age: 15, gender: 'V', text: 'Als meisje is het makkelijker om met iemand te sturen. De meeste jongens vinden alles wel oké.' },
])

const genders = ref([
  { key: 'men', label: 'Mannen', padA: 64, padB: 36, drop: 15 },
  { key: 'women', label: 'Vrouwen', padA: 30, padB: 70, drop: 15 },
  { key: 'nonbinary', label: 'Non-binair', padA: 40, padB: 60, drop: 15 },
  { key: 'prefer', label: 'Wil ik liever niet zeggen', padA: 50, padB: 50, drop: 15 },
])

const steps = ref([
  { key: 's1', title: 'Stap 1', desc: 'Introductie & context', padA: 45, padB: 55, drop: 10 },
  { key: 's2', title: 'Stap 2', desc: 'Eerste interactie', padA: 38, padB: 62, drop: 18 },
  { key: 's3', title: 'Stap 3', desc: 'Confrontatie & keuze', padA: 28, padB: 72, drop: 32 },
])
</script>

<style scoped>
/* ---------- Base ---------- */
* { box-sizing: border-box }

/* Page layout */
.insights-view {
  padding: 0 var(--space-5) var(--space-5);
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* ---------- Header / Tabs ---------- */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-5);
  padding-top: 6px;
}
.title-block { display:flex; flex-direction:column; gap:14px }
.page-title { margin: 0; font-size: 48px; font-weight: 700; color: var(--color-neutral-900) }
.tabs { display:flex; gap:24px }
.tab-button { border: none; background: transparent; padding: 0; font-size: 18px; color: var(--color-neutral-800); cursor: pointer }
.tab-button.active { color: var(--color-neutral-900); font-weight: 600 }

/* ---------- KPI cards ---------- */
.kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px }
.kpi-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow-sm);
  height: 106px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
}
.kpi-card.big .kpi-label { color: var(--color-neutral-700); font-size: 14px }
.kpi-value { font-size: 34px; font-weight: 800; color: var(--color-primary-700); line-height: 1 }
.kpi-meta.success { color: var(--color-success); font-size: 13px; margin-top: 8px }

/* ---------- Selector (standalone) ---------- */
.selector-wrapper { margin-bottom: 0 }
.selector-card { padding: 0 }
.selector-card .select-input {
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: 14px;
  padding: 18px 20px;
  background: var(--color-surface);
  box-sizing: border-box;
}

/* ---------- Cards row: two equal cards ---------- */
.cards-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  align-items: stretch; /* ensure equal heights */
}
.insights-card,
.behavior-card,
.reflections-card,
.behavior-breakdown,
.drop-per-step {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  padding: 18px;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
}
.cards-row > .insights-card,
.cards-row > .behavior-card { flex: 1 1 auto }

.section-title { margin: 0 0 12px 0; font-size: 18px; font-weight: 600 }

/* ---------- Insights grid & small cards ---------- */
.insights-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; align-items: stretch }
.small-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 12px;
}
.small-label { color: var(--color-neutral-700); font-size: 13px }
.small-value { font-size: 22px; font-weight: 700 }
.warning-box {
  grid-column: 1 / -1;
  background: rgba(255,235,230,0.9);
  border: 1px solid rgba(255,180,160,0.5);
  padding: 12px;
  border-radius: 10px;
  color: var(--color-danger);
}

/* ---------- Behavior cards inside the right column ---------- */
.behavior-grid-vertical { display: grid; grid-template-columns: 1fr 1fr; gap: 12px }
.behavior-card.small { padding: 12px }
.behavior-title { color: var(--color-neutral-700); font-weight: 600 }
.behavior-value { font-size: 22px; font-weight: 700 }
.behavior-meta { font-size: 13px; color: var(--color-neutral-700) }
.behavior-note { margin-top: 10px; color: var(--color-neutral-700) }

/* Make sure the right column card places the note at the bottom */
.cards-row > .behavior-card { justify-content: space-between }

/* ---------- Reflections table ---------- */
.table-wrap { overflow: hidden; border-radius: 12px; margin-top: 8px; border: 1px solid var(--color-border); background: var(--color-surface) }
.reflections-table { width: 100%; border-collapse: collapse }
.reflections-table thead th { text-align: left; color: #6d7280; font-size: 14px; padding: 16px 20px; border-bottom: 1px solid #e3e7ef }
.reflections-table td { padding: 18px 20px; border-bottom: 1px solid #e3e7ef; color: #6d7280; vertical-align: middle; height: 64px; white-space: normal }
.reflection-text { color: #374151; white-space: normal }
.reflection-row:hover { background: #fafbfe }
.pagination { display: flex; justify-content: flex-end; gap: 10px; padding-top: 10px }
.pagination-button { border: none; background: transparent; font-weight: 600; cursor: pointer }
.pagination-divider { width: 1px; height: 18px; background: var(--color-border) }

/* ---------- Gender breakdown (stacked bars) ---------- */
.gender-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px }
.gender-card {
  border-radius: 12px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  padding: 10px;
  height: 107px;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
}
.gender-title { font-weight: 700; margin-bottom: 8px }
.progress-bar-container { display: flex; align-items: center }
.progress-full {
  width: 100%;
  background: var(--color-neutral-200);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  height: 46px;
}
.segment {
  height: 46px;
  display: flex;
  align-items: center;
  padding-left: 12px;
  font-size: 14px;
  font-weight: 700;
  line-height: 22px;
  white-space: nowrap;
}
.segment-a { background: var(--color-secondary-600); color: #fff }
.segment-b { background: var(--color-primary-600); color: #fff }
.segment-drop { background: var(--color-neutral-300); color: var(--color-text) }

/* ---------- Steps / Afhaak per stap ---------- */
.steps-outer {
  background: var(--color-surface);
  border-radius: 12px;
  border: 1px solid var(--color-border);
  padding: 24px 8px;
  box-shadow: var(--shadow-sm);
}
.step-row {
  display: grid;
  grid-template-columns: 180px 1fr 90px;
  align-items: center;
  column-gap: 24px;
  padding: 24px 8px;
  border-bottom: 1px solid var(--color-border);
}
.step-row:last-child { border-bottom: none }
.step-left { display: flex; flex-direction: column; gap: 6px }
.step-left .step-title { font-weight: 700 }
.step-left .step-desc { color: var(--color-neutral-700); font-size: 13px }
.step-center { width: 100%; display: flex; flex-direction: column; gap: 10px }
.bar-row { display: grid; grid-template-columns: auto 40px; align-items: center; gap: 12px }
.bar-wrap { display: block; width: 100% }
.bar-a,
.bar-b {
  height: 46px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  padding: 0 30px;
  color: #fff;
  font-weight: 700;
  font-size: 14px;
  white-space: nowrap;
}
.bar-a { background: var(--color-secondary-600) }
.bar-b { background: var(--color-primary-600) }
.bar-text { display: inline-block }
.bar-percent { width: 40px; font-size: 14px; color: var(--color-text); text-align: left }
.step-right { width: 90px; justify-self: end }
.drop-card {
  width: 90px;
  min-height: 72px;
  border-radius: 8px;
  background: var(--color-neutral-100);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

/* ---------- Legend ---------- */
.legend { display: flex; gap: 12px; margin-top: 12px; align-items: center }
.legend-item { display: flex; gap: 8px; align-items: center; color: var(--color-neutral-700); font-size: 13px }
.dot { width: 12px; height: 12px; border-radius: 3px; display: inline-block }
.dot.a { background: #0f5a78 }
.dot.b { background: var(--color-primary-600) }
.dot.drop { background: #eef2f6; border: 1px solid var(--color-border) }

/* ---------- Utilities / Accessibility ---------- */
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0 }
</style>
