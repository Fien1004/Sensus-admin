<template>
  <main class="sessions-view">
    <header class="page-header">
      <div class="title-block">
        <h1 class="page-title">Sessies</h1>

        <nav class="tabs" aria-label="Sessies overzicht tabs">
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

    <section class="card overview-card">
      <div class="filters-row">
        <label class="search-field">
          <span class="sr-only">Zoeken</span>
          <span class="search-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="7"></circle>
              <path d="M20 20l-3.6-3.6"></path>
            </svg>
          </span>
          <input v-model="searchQuery" type="search" class="search-input" placeholder="Zoeken" />
        </label>

        <label class="select-field">
          <span class="sr-only">Scenario</span>
          <select v-model="selectedScenario" class="select-input">
            <option value="all">Scenario</option>
            <option v-for="opt in scenarioOptions" :key="opt" :value="opt">{{ opt }}</option>
          </select>
        </label>

        <label class="select-field">
          <span class="sr-only">Datum</span>
          <select v-model="selectedDate" class="select-input">
            <option value="all">Datum</option>
            <option value="today">Vandaag</option>
            <option value="week">Deze week</option>
          </select>
        </label>
      </div>

      <div class="table-wrap">
        <table class="sessions-table">
          <thead>
            <tr>
              <th class="checkbox-col">
                <input type="checkbox" class="checkbox" aria-label="Selecteer alle sessies" />
              </th>
              <th>Naam/id</th>
              <th>Scenario</th>
              <th>Datum</th>
              <th>Start</th>
              <th>Einde</th>
              <th>Status</th>
              <th class="actions-col"></th>
            </tr>
          </thead>

          <tbody v-if="filteredSessions.length">
            <tr v-for="item in filteredSessions" :key="item.id" class="session-row">
              <td class="checkbox-col">
                <input type="checkbox" class="checkbox" :aria-label="`Selecteer ${item.id}`" />
              </td>
              <td class="name-cell">{{ item.id }}</td>
              <td>{{ item.scenario }}</td>
              <td>{{ item.date }}</td>
              <td>{{ item.start }}</td>
              <td>{{ item.end }}</td>
              <td>
                <span :class="['status-badge', item.status === 'Voltooid' ? 'status--done' : 'status--stopped']">{{ item.status }}</span>
              </td>
              <td class="actions-col">
                <button type="button" class="actions-button" aria-label="Acties">⋯</button>
              </td>
            </tr>
          </tbody>

          <tbody v-else>
            <tr>
              <td colspan="8">
                <div class="empty-state">Geen sessies gevonden.</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <footer class="pagination">
        <div></div>
        <div>
          <button type="button" class="pagination-button">‹ Vorige</button>
          <span class="pagination-divider"></span>
          <button type="button" class="pagination-button">Volgende ›</button>
        </div>
      </footer>

      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">Sessies deze week</div>
          <div class="kpi-value">128</div>
          <div class="kpi-meta">↑ 12% deze week</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-label">Voltooid</div>
          <div class="kpi-value">70%</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-label">Gem. sessie duur</div>
          <div class="kpi-value">11 min</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-label">Afhaak %</div>
          <div class="kpi-value">32%</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-label">Offline %</div>
          <div class="kpi-value">30%</div>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup>
import { computed, ref } from 'vue'

const searchQuery = ref('')
const selectedScenario = ref('all')
const selectedDate = ref('all')
const activeTab = ref('all')

const tabs = [
  { key: 'all', label: 'Alle sessies' },
  { key: 'active', label: 'Actief (6)' },
  { key: 'completed', label: 'Voltooid (2)' },
]

const sessions = ref([
  { id: '1ahb', scenario: 'Online gedrag', date: '17 dec 2025', start: '14:03', end: '14:14', status: 'Voltooid' },
  { id: 'lp2', scenario: 'Online gedrag', date: '17 dec 2025', start: '14:07', end: '14:23', status: 'Voltooid' },
  { id: 'mpj6', scenario: 'Online gedrag', date: '17 dec 2025', start: '14:07', end: '14:10', status: 'Gestopt' },
  { id: 'shuo7', scenario: 'Online gedrag', date: '17 dec 2025', start: '14:10', end: '14:19', status: 'Gestopt' },
  { id: '1nj', scenario: 'Online gedrag', date: '17 dec 2025', start: '14:11', end: '14:25', status: 'Voltooid' },
])

const scenarioOptions = computed(() => [...new Set(sessions.value.map((s) => s.scenario))])

const filteredSessions = computed(() => {
  let items = [...sessions.value]

  if (activeTab.value === 'active') {
    items = items.filter((s) => s.status !== 'Voltooid')
  }

  if (activeTab.value === 'completed') {
    items = items.filter((s) => s.status === 'Voltooid')
  }

  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    items = items.filter((s) => `${s.id} ${s.scenario}`.toLowerCase().includes(q))
  }

  if (selectedScenario.value !== 'all') {
    items = items.filter((s) => s.scenario === selectedScenario.value)
  }

  return items
})
</script>

<style scoped>
.sessions-view {
  padding: 0 var(--space-5) var(--space-5);
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-5);
  padding-top: 6px;
}

.title-block {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.page-title {
  margin: 0;
  font-size: 48px;
  font-weight: 700;
  line-height: 0.98;
  color: var(--color-neutral-900);
  letter-spacing: -0.03em;
}

.tabs {
  display: flex;
  align-items: center;
  gap: 24px;
  padding-bottom: 2px;
}

.tab-button {
  border: none;
  background: transparent;
  padding: 0;
  font-family: var(--font-family-base);
  font-size: 18px;
  color: var(--color-neutral-800);
  cursor: pointer;
  position: relative;
}

.tab-button.active {
  color: var(--color-neutral-900);
  font-weight: 600;
}

.tab-button.active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -10px;
  height: 2px;
  background: var(--color-neutral-900);
}

.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.overview-card {
  padding: 14px 10px 10px;
  border-radius: 18px;
}

.filters-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 150px 150px;
  gap: 10px;
  margin-bottom: 0;
}

.search-field,
.select-field {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 14px;
  color: var(--color-neutral-700);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.search-input,
.select-input {
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: 14px;
  background: var(--color-surface);
  color: var(--color-neutral-900);
  font-family: var(--font-family-base);
  font-size: 17px;
  outline: none;
  box-sizing: border-box;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.05);
}

.search-input {
  padding: 14px 16px 14px 42px;
}

.select-input {
  padding: 14px 40px 14px 14px;
  appearance: none;
  background-image: linear-gradient(45deg, transparent 50%, var(--color-neutral-700) 50%), linear-gradient(135deg, var(--color-neutral-700) 50%, transparent 50%);
  background-position: calc(100% - 20px) 20px, calc(100% - 14px) 20px;
  background-size: 6px 6px, 6px 6px;
  background-repeat: no-repeat;
}

.table-wrap {
  overflow: hidden;
  border-radius: 14px;
  margin-top: 12px;
  border: 1px solid var(--color-border);
}

.sessions-table {
  width: 100%;
  border-collapse: collapse;
}

.sessions-table thead th {
  text-align: left;
  color: #6d7280;
  font-size: 16px;
  font-weight: 500;
  padding: 16px 18px 14px;
  border-bottom: 1px solid #e3e7ef;
}

.sessions-table td {
  padding: 14px 18px;
  border-bottom: 1px solid #e3e7ef;
  color: #6d7280;
  font-size: 16px;
  vertical-align: middle;
}

.session-row:hover {
  background: #fafbfe;
}

.checkbox-col,
.actions-col {
  width: 1%;
  white-space: nowrap;
}

.checkbox-col {
  text-align: center;
  vertical-align: middle;
}

.checkbox {
  width: 24px;
  height: 24px;
  margin: 0;
  vertical-align: middle;
  accent-color: var(--color-primary-600);
  cursor: pointer;
}

.name-cell {
  color: #4b5563;
  font-weight: 600;
}

.actions-button {
  border: none;
  background: transparent;
  color: #111827;
  font-size: 26px;
  line-height: 1;
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.actions-button:hover {
  background: var(--color-neutral-100);
}

.status-badge {
  display: inline-block;
  padding: 6px 10px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 13px;
}

.status--done {
  background: rgba(16, 185, 129, 0.12);
  color: var(--color-success);
}

.status--stopped {
  background: rgba(239, 68, 68, 0.08);
  color: var(--color-danger);
}

.empty-state {
  min-height: 96px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-soft);
  font-size: var(--text-md);
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding-top: 10px;
  color: #6b7280;
}

.pagination-button {
  border: none;
  background: transparent;
  color: inherit;
  font-family: var(--font-family-base);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 0;
}

.pagination-divider {
  width: 1px;
  height: 18px;
  background: var(--color-border);
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 14px;
  margin-top: 18px;
}

.kpi-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  padding: 18px;
  box-shadow: var(--shadow-sm);
}

.kpi-label {
  color: var(--color-neutral-700);
  font-size: 14px;
  margin-bottom: 8px;
}

.kpi-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-primary-600);
}

.kpi-meta {
  color: var(--color-success);
  font-size: 13px;
  margin-top: 8px;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
