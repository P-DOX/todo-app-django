// Todo app with per-date tasks and localStorage persistence
// Storage keys are user-specific to prevent data sharing between users
function getUserStorageKey(baseKey) {
  const user = (window.auth && window.auth.getUser && window.auth.getUser()) || null
  const username = user ? user.username : 'anonymous'
  return `${baseKey}.${username}`
}

// Helper function to get auth token
function getToken() {
  return (window.auth && window.auth.getToken && window.auth.getToken()) || localStorage.getItem('todo.auth.token')
}

let useServer = false

// Tabs support: two independent lists (personal, work) - migrate legacy names
const savedTab = localStorage.getItem('todo.currentTab')
const DEFAULT_TAB = 'personal'
let currentTab = savedTab || DEFAULT_TAB

const taskForm = document.getElementById('task-form')
const taskInput = document.getElementById('task-input')
const taskList = document.getElementById('task-list')
const filters = document.querySelectorAll('.filter')
const clearBtn = document.getElementById('clear-completed')
const daysContainer = document.getElementById('days')
const monthLabel = document.getElementById('month-label')
const prevMonthBtn = document.getElementById('prev-month')
const nextMonthBtn = document.getElementById('next-month')
const selectedDateLabel = document.getElementById('selected-date-label')
const tabButtons = document.querySelectorAll('.tab')
const weekTabsContainer = document.getElementById('week-tabs')
const prevWeekBtn = document.getElementById('prev-week')
const nextWeekBtn = document.getElementById('next-week')

// Admin defaults elements (admin UI moved to /admin.html). We still
// load defaults from localStorage so applyDefaultsForDate() can use them.
const tasksPanel = document.querySelector('.tasks-panel')
const adminDefaultsEl = document.getElementById('admin-defaults')

let tasks = []
let filter = 'all'
// helpers that use local timezone (avoid UTC ISO pitfalls)
function pad(n){ return n.toString().padStart(2,'0') }
function localIso(d){ return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}` }
function parseIso(s){ const [y,m,day] = (s||'').split('-').map(Number); return new Date(y, (m||1)-1, day||1) }

let selectedDate = localIso(new Date()) // YYYY-MM-DD (local)
let viewYear = (new Date()).getFullYear()
let viewMonth = (new Date()).getMonth()

function loadTasks(){
  const STORAGE_KEY = getUserStorageKey('todo.tasks.v1')
  try{
    const raw = localStorage.getItem(STORAGE_KEY)
    tasks = raw ? JSON.parse(raw) : []
  }catch(e){
    tasks = []
  }
  // Normalize legacy tasks (assign tab if missing)
  for(const t of tasks){
    if(!t.tab) t.tab = DEFAULT_TAB
  }
}

function saveTasks(){
  const STORAGE_KEY = getUserStorageKey('todo.tasks.v1')
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  if(useServer){
    // attempt to sync full state to server (best-effort)
    const token = (window.auth && window.auth.getToken && window.auth.getToken()) || localStorage.getItem('todo.auth.token')
    const headers = { 'Content-Type': 'application/json' }
    if(token) headers['Authorization'] = 'Bearer ' + token
    fetch('/api/sync', { method: 'POST', headers, body: JSON.stringify(tasks) })
      .catch(()=>{ /* ignore network errors, keep local copy */ })
  }
}

// Defaults: recurring weekly tasks stored separately
let defaults = []

// Default creation window: don't create defaults before Nov 1 of the current year
// and only create defaults up to this many days after today.
const DEFAULTS_MIN_MONTH = 10 // November (0-based month index)
const DEFAULTS_MAX_DAYS_AHEAD = 60 // create defaults up to 60 days ahead

async function loadDefaults(){
  const token = getToken()
  if (token && useServer) {
    try {
      const res = await fetch('/api/defaults/', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        defaults = data.map(d => ({
          id: d.id,
          weekday: d.weekday,
          title: d.title,
          tab: d.tab
        }))
        // Also save to localStorage for offline/fallback
        const DEFAULTS_KEY = getUserStorageKey('todo.defaults.v1')
        localStorage.setItem(DEFAULTS_KEY, JSON.stringify(defaults))
        return
      }
    } catch(e) {
      console.error('Error loading defaults from API:', e)
    }
  }
  // Fallback to localStorage
  const DEFAULTS_KEY = getUserStorageKey('todo.defaults.v1')
  try{ const raw = localStorage.getItem(DEFAULTS_KEY); defaults = raw ? JSON.parse(raw) : [] }catch(e){ defaults = [] }
}

function saveDefaults(){
  const DEFAULTS_KEY = getUserStorageKey('todo.defaults.v1')
  localStorage.setItem(DEFAULTS_KEY, JSON.stringify(defaults))
}

function weekdayName(n){ return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][n] || n }

function renderDefaults(){
  // rendering of defaults is handled on the dedicated admin page
  return
}

// defaults form handling has moved to /admin.html / js/admin.js

function checkServerAndSync(){
  // ping server; if available fetch authoritative state and merge carefully
  return fetch('/api/ping').then(r => r.json()).then(() => {
    useServer = true
    const token = getToken()
    const headers = {}
    if(token) {
      headers['Authorization'] = 'Bearer ' + token
    }
    return fetch('/api/tasks/', { headers }).then(r => r.json()).then(serverTasks => {
      const STORAGE_KEY = getUserStorageKey('todo.tasks.v1')
      const localRaw = localStorage.getItem(STORAGE_KEY)
      const localTasks = localRaw ? JSON.parse(localRaw) : []
      // If server has tasks, adopt server as authoritative for now
      if(Array.isArray(serverTasks) && serverTasks.length){
        tasks = serverTasks
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
      } else if(localTasks.length){
        // server empty but local has data: push local to server
        const syncHeaders = { 'Content-Type': 'application/json' }
        if(token) syncHeaders['Authorization'] = 'Bearer ' + token
        fetch('/api/sync', { method: 'POST', headers: syncHeaders, body: JSON.stringify(localTasks) }).catch(()=>{})
      } else {
        // both empty: nothing to do (avoid pushing empty array and wiping server)
      }
    })
  }).catch(()=>{ useServer = false })
}

function createTaskElement(task){
  const li = document.createElement('li')
  li.className = 'task-item'
  li.dataset.id = task.id

  const checkbox = document.createElement('input')
  checkbox.type = 'checkbox'
  checkbox.checked = !!task.completed
  checkbox.addEventListener('change', () => toggleCompleted(task.id))

  const label = document.createElement('div')
  label.className = 'task-label'

  const title = document.createElement('span')
  title.className = 'task-title'
  if(task.completed) title.classList.add('completed')
  title.textContent = task.title
  title.tabIndex = 0

  title.addEventListener('dblclick', () => startEdit(task.id, li))
  title.addEventListener('keydown', (e) => { if(e.key === 'Enter') startEdit(task.id, li) })

  label.appendChild(checkbox)
  label.appendChild(title)

  const actions = document.createElement('div')
  actions.className = 'task-actions'

  const editBtn = document.createElement('button')
  editBtn.className = 'icon-btn'
  editBtn.title = 'Edit'
  editBtn.textContent = '✏️'
  editBtn.addEventListener('click', () => startEdit(task.id, li))

  const delBtn = document.createElement('button')
  delBtn.className = 'icon-btn'
  delBtn.title = 'Delete'
  delBtn.textContent = '🗑️'
  delBtn.addEventListener('click', () => deleteTask(task.id))

  actions.appendChild(editBtn)
  actions.appendChild(delBtn)

  li.appendChild(label)
  li.appendChild(actions)
  return li
}

function renderTasks(){
  // reload tasks from storage to avoid stale in-memory state (other tabs or recent sync)
  loadTasks()
  taskList.innerHTML = ''
  const visible = tasks.filter(t => t.tab === currentTab).filter(t => t.date === selectedDate).filter(t => {
    if(filter === 'active') return !t.completed
    if(filter === 'completed') return t.completed
    return true
  })
  visible.forEach(task => taskList.appendChild(createTaskElement(task)))
  
  // Update tab counters
  updateTabCounters()
}

function updateTabCounters() {
  const tasksForDate = tasks.filter(t => t.date === selectedDate)
  
  // Personal tab counter
  const personalTasks = tasksForDate.filter(t => t.tab === 'personal')
  const personalCompleted = personalTasks.filter(t => t.completed).length
  const personalTotal = personalTasks.length
  const personalCounter = document.getElementById('counter-personal')
  if (personalCounter) {
    personalCounter.textContent = `${personalCompleted}/${personalTotal}`
  }
  
  // Work tab counter
  const workTasks = tasksForDate.filter(t => t.tab === 'work')
  const workCompleted = workTasks.filter(t => t.completed).length
  const workTotal = workTasks.length
  const workCounter = document.getElementById('counter-work')
  if (workCounter) {
    workCounter.textContent = `${workCompleted}/${workTotal}`
  }
}

async function addTask(title){
  const trimmed = title.trim()
  if(!trimmed) return
  const nowIso = new Date().toISOString()
  const task = { id: Date.now().toString(), title: trimmed, completed: false, date: selectedDate, createdAt: nowIso, lastModified: nowIso, tab: currentTab }
  tasks.unshift(task)
  
  // Save to server first
  const token = getToken()
  if(useServer && token){
    try {
      const res = await fetch('/api/tasks/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(task)
      })
      if(res.ok){
        const serverTask = await res.json()
        // Replace local task with server version (which has proper ID)
        const index = tasks.findIndex(t => t.id === task.id)
        if(index >= 0) tasks[index] = serverTask
      }
    } catch(e){
      console.error('Error creating task:', e)
    }
  }
  
  saveTasks()
  renderTasks()
  renderCalendar(viewYear, viewMonth)
  if(typeof renderWeekTabs === 'function') renderWeekTabs()
}

async function toggleCompleted(id){
  const t = tasks.find(x => x.id === id)
  if(!t) return
  t.completed = !t.completed
  t.lastModified = new Date().toISOString()
  
  // Update on server
  const token = getToken()
  if(useServer && token){
    try {
      await fetch(`/api/tasks/${id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ completed: t.completed })
      })
    } catch(e){
      console.error('Error updating task:', e)
    }
  }
  
  saveTasks()
  renderTasks()
  renderCalendar(viewYear, viewMonth)
  if(typeof renderWeekTabs === 'function') renderWeekTabs()
}

async function deleteTask(id){
  // Delete from server first
  const token = getToken()
  if(useServer && token){
    try {
      await fetch(`/api/tasks/${id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
    } catch(e){
      console.error('Error deleting task:', e)
    }
  }
  
  tasks = tasks.filter(x => x.id !== id)
  saveTasks()
  renderTasks()
  renderCalendar(viewYear, viewMonth)
  if(typeof renderWeekTabs === 'function') renderWeekTabs()
}

function startEdit(id, li){
  const t = tasks.find(x => x.id === id)
  if(!t) return
  li.innerHTML = ''

  const input = document.createElement('input')
  input.className = 'edit-input'
  input.value = t.title
  li.appendChild(input)

  input.focus()
  input.select()

  async function commit(){
    const val = input.value.trim()
    if(val){
      t.title = val
      t.lastModified = new Date().toISOString()
      
      // Update on server
      const token = getToken()
      if(useServer && token){
        try {
          await fetch(`/api/tasks/${id}/`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ title: t.title })
          })
        } catch(e){
          console.error('Error updating task:', e)
        }
      }
    } else {
      // Delete if empty
      await deleteTask(id)
      return
    }
    
    saveTasks()
    renderTasks()
    renderCalendar(viewYear, viewMonth)
    if(typeof renderWeekTabs === 'function') renderWeekTabs()
  }

  input.addEventListener('blur', commit)
  input.addEventListener('keydown', (e) => {
    if(e.key === 'Enter') commit()
    if(e.key === 'Escape') renderTasks()
  })
}

function clearCompleted(){
  // clear completed for selected date only
  tasks = tasks.filter(x => !(x.date === selectedDate && x.completed))
  saveTasks()
  renderTasks()
  renderCalendar(viewYear, viewMonth)
  if(typeof renderWeekTabs === 'function') renderWeekTabs()
}

function setFilter(newFilter) {
  filter = newFilter
  if (currentLevel === 'daily') {
    renderTasks()
  } else if (currentLevel === 'weekly') {
    renderWeeklyView()
  } else if (currentLevel === 'monthly') {
    renderMonthlyView()
  } else if (currentLevel === 'yearly') {
    renderYearlyView()
  }
}

window.setFilter = setFilter

async function clearCompletedWeekly() {
  const token = getToken()
  if (!token) return
  const toDelete = weeklyTasks.filter(t => t.tab === currentTab && t.completed)
  try {
    await Promise.all(toDelete.map(task => 
      fetch(`/api/weekly-tasks/${task.id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token }
      })
    ))
    await loadWeeklyTasks()
  } catch(e) { console.error(e) }
}

async function clearCompletedMonthly() {
  const token = getToken()
  if (!token) return
  const toDelete = monthlyTasks.filter(t => t.tab === currentTab && t.completed)
  try {
    await Promise.all(toDelete.map(task => 
      fetch(`/api/monthly-tasks/${task.id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token }
      })
    ))
    await loadMonthlyTasks()
  } catch(e) { console.error(e) }
}

async function clearCompletedYearly() {
  const token = getToken()
  if (!token) return
  const toDelete = yearlyTasks.filter(t => t.completed)
  try {
    await Promise.all(toDelete.map(task => 
      fetch(`/api/yearly-tasks/${task.id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token }
      })
    ))
    await loadYearlyTasks()
  } catch(e) { console.error(e) }
}

window.clearCompletedWeekly = clearCompletedWeekly
window.clearCompletedMonthly = clearCompletedMonthly
window.clearCompletedYearly = clearCompletedYearly

// Remove tasks older than retentionDays (rolling window)
const RETENTION_DAYS = 365
function cleanupOldTasks(){
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - RETENTION_DAYS)
  const before = tasks.length
  tasks = tasks.filter(t => {
    try{
      const d = parseIso(t.date)
      if(isNaN(d)) return true
      return d >= cutoff
    }catch(e){
      return true
    }
  })
  return tasks.length !== before
}

// Event handlers
taskForm.addEventListener('submit', async (e) => {
  e.preventDefault()
  await addTask(taskInput.value)
  taskInput.value = ''
  taskInput.focus()
})

filters.forEach(btn => btn.addEventListener('click', () => {
  filters.forEach(b => b.classList.remove('active'))
  btn.classList.add('active')
  filter = btn.dataset.filter
  renderTasks()
}))

clearBtn.addEventListener('click', clearCompleted)

// init
// Calendar and date logic
function formatMonthLabel(year, month){
  const d = new Date(year, month, 1)
  return d.toLocaleString(undefined, { month: 'long', year: 'numeric' })
}

function startOfMonth(year, month){ return new Date(year, month, 1) }

// Track the current rendering operation to prevent overlapping renders
let currentRenderPromise = null
let renderCounter = 0

async function renderCalendar(year, month){
  // Increment counter to identify this render
  const myRenderId = ++renderCounter
  
  // Wait for any ongoing render to complete
  if(currentRenderPromise){
    await currentRenderPromise
    // If a newer render was initiated while we were waiting, abort this one
    if(renderCounter !== myRenderId) return
  }
  
  // Start new render and track the promise
  currentRenderPromise = (async () => {
    // ensure we have the latest tasks before computing heatmap/counts
    loadTasks()
    monthLabel.textContent = formatMonthLabel(year, month)
    daysContainer.innerHTML = ''
    const first = startOfMonth(year, month)
    const startDay = first.getDay() // 0..6
    const daysInMonth = new Date(year, month+1, 0).getDate()

    // Ensure defaults are applied for the visible calendar grid (pre-create default tasks)
    // Compute the grid start (beginning Sunday) and end (end Saturday) for the month view
    const gridStart = new Date(year, month, 1)
    gridStart.setDate(gridStart.getDate() - gridStart.getDay())
    const last = new Date(year, month, daysInMonth)
    const gridEnd = new Date(last)
    gridEnd.setDate(gridEnd.getDate() + (6 - last.getDay()))
    
    // Collect all dates in the visible grid for batch processing
    const datesToProcess = []
    for(let d = new Date(gridStart); d <= gridEnd; d.setDate(d.getDate() + 1)){
      const dateStr = isoDate(d)
      const parsedDate = parseIso(dateStr)
      if(isNaN(parsedDate)) continue
      
      // Apply same date checks as applyDefaultsForDate
      const now = new Date()
      const minDate = new Date(now.getFullYear(), DEFAULTS_MIN_MONTH, 1)
      if(parsedDate < minDate) continue
      const maxDate = new Date()
      maxDate.setDate(maxDate.getDate() + DEFAULTS_MAX_DAYS_AHEAD)
      if(parsedDate > maxDate) continue
      
      datesToProcess.push(dateStr)
    }
    
    // Make a single batch API call for all dates
    if(datesToProcess.length > 0){
      await applyDefaultsForDates(datesToProcess)
    }

    // Check if we're still the active render
    if(renderCounter !== myRenderId) return

    // previous month's tail
    const prevMonthLastDate = new Date(year, month, 0).getDate()
    for(let i = startDay - 1; i >= 0; i--){
      const d = prevMonthLastDate - i
      const date = new Date(year, month-1, d)
      const el = await renderDayCell(date, true)
      daysContainer.appendChild(el)
    }

    // current month days
    for(let d=1; d<=daysInMonth; d++){
      const date = new Date(year, month, d)
      const el = await renderDayCell(date, false)
      daysContainer.appendChild(el)
    }

    // fill to complete grid (optional)
    while(daysContainer.children.length % 7 !== 0){
      const day = new Date(year, month+1, 1).getDate() // placeholder
      const el = document.createElement('div')
      el.className = 'day other-month'
      el.textContent = ''
      daysContainer.appendChild(el)
    }
  })()
  
  await currentRenderPromise
  currentRenderPromise = null
}

// Weekly tabs rendering and navigation
let weekStartDate = (function(){
  // start of the week (Sunday) for currently selectedDate (use local parse)
  const d = parseIso(selectedDate)
  const start = new Date(d)
  start.setDate(d.getDate() - d.getDay())
  start.setHours(0,0,0,0)
  return start
})()

// week tabs interaction helpers: init pointer-drag scrolling and centering
let _weekTabsInit = false
function initWeekTabsInteractions(){
  if(_weekTabsInit) return
  _weekTabsInit = true
  if(!weekTabsContainer) return
  // pointer drag to scroll (desktop + touch)
  let isDown = false, startX = 0, scrollLeft = 0, activePointerId = null, hasDragged = false
  weekTabsContainer.addEventListener('pointerdown', (e) => {
    // Don't prevent default on buttons - let clicks work normally
    if(e.target.closest('.week-tab')) return
    isDown = true
    activePointerId = e.pointerId
    weekTabsContainer.setPointerCapture(activePointerId)
    startX = e.clientX
    scrollLeft = weekTabsContainer.scrollLeft
    hasDragged = false
  })
  weekTabsContainer.addEventListener('pointermove', (e) => {
    if(!isDown) return
    if(e.pointerId !== activePointerId) return
    const dx = Math.abs(startX - e.clientX)
    if(dx > 5) hasDragged = true
    if(hasDragged){
      weekTabsContainer.classList.add('dragging')
      weekTabsContainer.scrollLeft = scrollLeft + (startX - e.clientX)
    }
  })
  function release(e){
    if(!isDown) return
    isDown = false
    try{ if(activePointerId != null) weekTabsContainer.releasePointerCapture(activePointerId) }catch(err){}
    activePointerId = null
    hasDragged = false
    weekTabsContainer.classList.remove('dragging')
  }
  weekTabsContainer.addEventListener('pointerup', release)
  weekTabsContainer.addEventListener('pointercancel', release)
  weekTabsContainer.addEventListener('pointerleave', release)

  // ensure keyboard focusable and smooth scroll on focus
  weekTabsContainer.addEventListener('focusin', (e) => {
    if(e.target && e.target.classList && e.target.classList.contains('week-tab')){
      e.target.scrollIntoView({behavior:'smooth', inline:'center', block:'nearest'})
    }
  })
}

function formatDayName(date){
  return date.toLocaleDateString(undefined, { weekday: 'short' })
}

function formatDayLabel(date){
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function renderWeekTabs(){
  // ensure we have latest tasks (in case of recent save or sync)
  loadTasks()
  weekTabsContainer.innerHTML = ''
  for(let i=0;i<7;i++){
    const d = new Date(weekStartDate)
    d.setDate(weekStartDate.getDate() + i)
    const iso = isoDate(d)
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.setAttribute('role', 'tab')
    btn.tabIndex = 0
    btn.className = 'week-tab' + (iso === selectedDate ? ' active' : '')
    btn.dataset.date = iso
    const dayName = document.createElement('span')
    dayName.className = 'day-name'
    dayName.textContent = formatDayName(d)
    const dayDate = document.createElement('span')
    dayDate.className = 'day-date'
    dayDate.textContent = formatDayLabel(d)
    // show count for current tab
    const count = countTasksForDate(iso)
    if(count){
      const c = document.createElement('div')
      c.className = 'badge'
      c.textContent = `${count}`
      c.title = `${count} task${count>1?'s':''}`
      c.style.marginTop = '6px'
      c.style.fontSize = '0.8rem'
      btn.appendChild(c)
    }
    // apply heat level class
    const lvl = getHeatLevel(iso)
    for(let h=0; h<=4; h++) btn.classList.remove('heat-'+h)
    if(lvl > 0) btn.classList.add('heat-'+lvl)
    btn.appendChild(dayName)
    btn.appendChild(dayDate)
    btn.addEventListener('click', async () => {
      selectedDate = iso
      updateSelectedDateLabel()
      // apply defaults for this date and active tab before rendering
      await applyDefaultsForDate(selectedDate)
      renderWeekTabs()
      renderCalendar(viewYear, viewMonth)
      renderTasks()
    })
    // also handle keyboard activation for accessibility
    btn.addEventListener('keydown', (e) => {
      if(e.key === 'Enter' || e.key === ' ') btn.click()
    })
    weekTabsContainer.appendChild(btn)
  }
  // init interactions (drag-to-scroll) once and try to center active
  initWeekTabsInteractions()
  // center active tab into view on render (if present)
  const active = weekTabsContainer.querySelector('.week-tab.active')
  if(active){
    try{ active.scrollIntoView({behavior:'smooth', inline:'center', block:'nearest'}) }catch(e){}
  }
}

function shiftWeek(days){
  weekStartDate.setDate(weekStartDate.getDate() + days)
  renderWeekTabs()
}

prevWeekBtn.addEventListener('click', () => { shiftWeek(-7) })
nextWeekBtn.addEventListener('click', () => { shiftWeek(7) })


// isoDate now returns local YYYY-MM-DD for a Date object
function isoDate(d){ return localIso(d) }

function countTasksForDate(dateStr){
  return tasks.filter(t => t.tab === currentTab && t.date === dateStr).length
}

function countCompletedForDate(dateStr){
  return tasks.filter(t => t.tab === currentTab && t.date === dateStr && t.completed).length
}

// map completion ratio to a heat level 0..4
function getHeatLevel(dateStr){
  const total = countTasksForDate(dateStr)
  if(total === 0) return 0
  const completed = countCompletedForDate(dateStr)
  const ratio = completed / total
  if(ratio === 0) return 1
  if(ratio <= 0.25) return 1
  if(ratio <= 0.5) return 2
  if(ratio <= 0.75) return 3
  return 4
}

// Apply defaults for multiple dates in a single API call
async function applyDefaultsForDates(dates){
  if(!dates || dates.length === 0) return false
  
  const token = getToken()
  if(useServer && token){
    try {
      const res = await fetch('/api/defaults/apply/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ dates: dates, tab: currentTab })
      })
      if(res.ok){
        const result = await res.json()
        if(result.created > 0){
          // Fetch updated tasks from server
          const tasksRes = await fetch('/api/tasks/', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          if(tasksRes.ok){
            tasks = await tasksRes.json()
            const STORAGE_KEY = getUserStorageKey('todo.tasks.v1')
            localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
            return true
          }
        }
        return result.created > 0
      }
    } catch(e){
      console.error('Error applying defaults via batch API:', e)
    }
  }
  
  // Fallback to local-only mode - process each date
  let anyAdded = false
  for(const dateStr of dates){
    const added = await applyDefaultsForDate(dateStr)
    if(added) anyAdded = true
  }
  return anyAdded
}

async function applyDefaultsForDate(dateStr){
  const d = parseIso(dateStr)
  if(isNaN(d)) return false
  const now = new Date()
  const minDate = new Date(now.getFullYear(), DEFAULTS_MIN_MONTH, 1)
  if(d < minDate) return false
  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + DEFAULTS_MAX_DAYS_AHEAD)
  if(d > maxDate) return false
  const wd = d.getDay()
  let added = false
  
  // If using server, call the backend API to apply defaults
  const token = getToken()
  if(useServer && token){
    try {
      const res = await fetch('/api/defaults/apply/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ date: dateStr, tab: currentTab })
      })
      if(res.ok){
        const result = await res.json()
        if(result.created > 0){
          // Fetch updated tasks from server
          const tasksRes = await fetch('/api/tasks/', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          if(tasksRes.ok){
            tasks = await tasksRes.json()
            const STORAGE_KEY = getUserStorageKey('todo.tasks.v1')
            localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
            added = true
          }
        }
        return added
      }
    } catch(e){
      console.error('Error applying defaults via API:', e)
    }
  }
  
  // Fallback to local-only mode
  for(const def of defaults){
    if(def.weekday !== wd) continue
    if(def.tab !== currentTab) continue
    const exists = tasks.some(t => t.tab === currentTab && t.date === dateStr && t.title === def.title)
    if(!exists){
      const nowIso = new Date().toISOString()
      tasks.unshift({ id: Date.now().toString() + Math.random().toString(36).slice(2,6), title: def.title, completed: false, date: dateStr, createdAt: nowIso, lastModified: nowIso, tab: currentTab })
      added = true
    }
  }
  if(added) saveTasks()
  return added
}

async function renderDayCell(date, otherMonth){
  const el = document.createElement('div')
  el.className = 'day' + (otherMonth ? ' other-month' : '')
  const dateStr = isoDate(date)
  
  // Create date number element
  const dateNum = document.createElement('div')
  dateNum.textContent = date.getDate()
  dateNum.style.fontSize = '0.9rem'
  
  // apply heat level class
  for(let h=0; h<=4; h++) el.classList.remove('heat-'+h)
  const heat = getHeatLevel(dateStr)
  if(heat > 0) el.classList.add('heat-'+heat)
  if(dateStr === selectedDate) el.classList.add('selected')
  if(isoDate(new Date()) === dateStr) el.classList.add('today')
  
  el.appendChild(dateNum)
  
  const count = countTasksForDate(dateStr)
  if(count) {
    const badge = document.createElement('span')
    badge.className = 'badge'
    badge.textContent = `${count}`
    badge.title = `${count} task${count>1?'s':''}`
    el.appendChild(badge)
  }
  el.addEventListener('click', async () => {
    if(otherMonth){
      // navigate to that month
      viewYear = date.getFullYear(); viewMonth = date.getMonth();
      renderCalendar(viewYear, viewMonth)
    } else {
      selectedDate = dateStr
      updateSelectedDateLabel()
      // ensure defaults exist for this date (backend only, no UI refresh)
      await applyDefaultsForDate(selectedDate)
      // Only update the selected state without re-rendering entire calendar
      document.querySelectorAll('.day').forEach(d => d.classList.remove('selected'))
      el.classList.add('selected')
      renderTasks()
    }
  })
  return el
}

function updateSelectedDateLabel(){
  const d = parseIso(selectedDate)
  selectedDateLabel.textContent = `Selected: ${d.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })} — ${currentTab.charAt(0).toUpperCase() + currentTab.slice(1)}`
}

prevMonthBtn.addEventListener('click', () => { viewMonth--; if(viewMonth<0){ viewMonth=11; viewYear--; } renderCalendar(viewYear, viewMonth); if(typeof updateGoalsStatus === 'function') updateGoalsStatus() })
nextMonthBtn.addEventListener('click', () => { viewMonth++; if(viewMonth>11){ viewMonth=0; viewYear++; } renderCalendar(viewYear, viewMonth); if(typeof updateGoalsStatus === 'function') updateGoalsStatus() })

loadTasks()
// Load defaults asynchronously, then proceed
loadDefaults().then(() => {
  // try enabling server storage if available; best-effort
  checkServerAndSync().then(() => {
    // normalize tasks after server sync in case server data lacks tab metadata
    for(const t of tasks){
      if(!t.tab) t.tab = DEFAULT_TAB
    }
    // after server check, re-run cleanup and render
    if(cleanupOldTasks()) saveTasks()
    renderCalendar(viewYear, viewMonth)
    if(typeof renderWeekTabs === 'function') renderWeekTabs()
    renderTasks()
    // Update auth UI after everything is loaded
    if(typeof updateAuthUI === 'function') updateAuthUI()
    // Update goals status summary
    if(typeof updateGoalsStatus === 'function') updateGoalsStatus()
    // Initialize goal status click handlers
    if(typeof initGoalStatusHandlers === 'function') initGoalStatusHandlers()
  })
})

// Listen for changes to defaults made in other tabs (admin page)
window.addEventListener('storage', async (e) => {
  if(!e) return
  const DEFAULTS_KEY = getUserStorageKey('todo.defaults.v1')
  if(e.key === DEFAULTS_KEY){
    // reload defaults and ensure they are applied for the currently selected date/tab
    await loadDefaults()
    // apply defaults for the visible selected date and re-render
    const added = await applyDefaultsForDate(selectedDate)
    if(added) renderTasks()
    renderCalendar(viewYear, viewMonth)
    if(typeof renderWeekTabs === 'function') renderWeekTabs()
  }
})
// migrate legacy tasks without date to today
const todayIso = localIso(new Date())
let migrated = false
for(const t of tasks){
  if(!t.date){
    t.date = todayIso
    t.createdAt = t.createdAt || new Date().toISOString()
    t.lastModified = t.lastModified || t.createdAt
    if(!t.tab) t.tab = DEFAULT_TAB
    migrated = true
  }
}
if(migrated) saveTasks()

// cleanup tasks older than retention window
if(cleanupOldTasks()) saveTasks()

updateSelectedDateLabel()
renderCalendar(viewYear, viewMonth)
// ensure defaults are applied for the selected date before final render
applyDefaultsForDate(selectedDate).then(() => {
  if(typeof renderWeekTabs === 'function') renderWeekTabs()
  renderTasks()
})

// Tab switching logic
async function switchTab(tabId){
  if(!tabId) return
  currentTab = tabId
  localStorage.setItem('todo.currentTab', currentTab)
  tabButtons.forEach(b => b.classList.toggle('active', b.dataset.tab === currentTab))
  // re-render calendar (counts) and tasks for the selected tab
  // show admin UI if admin tab selected
    // Removed admin UI handling as admin is on a separate page now
  await applyDefaultsForDate(selectedDate)
  // Update tasks and selected date label without full calendar re-render
  renderTasks()
  updateSelectedDateLabel()
  if(typeof renderWeekTabs === 'function') renderWeekTabs()
  
  // Reload level-specific tasks when switching tabs
  if (currentLevel === 'weekly') loadWeeklyTasks()
  if (currentLevel === 'monthly') loadMonthlyTasks()
  
  // Update goals status summary
  if (typeof updateGoalsStatus === 'function') updateGoalsStatus()
}

window.switchTab = switchTab

tabButtons.forEach(b => b.addEventListener('click', () => switchTab(b.dataset.tab)))

// initialize tabs UI state
tabButtons.forEach(b => b.classList.toggle('active', b.dataset.tab === currentTab))

// show admin UI if current tab is admin

// Helper to show/hide admin UI

// If URL hash is #admin, switch to admin tab on load

// Auth UI: show login/register or username + logout; control Admin link visibility
const authArea = document.getElementById('auth-area')
const adminLink = document.getElementById('admin-link')

function updateAuthUI(){
  const user = (window.auth && window.auth.getUser && window.auth.getUser()) || null
  if(user){
    const displayName = user.first_name || user.username || 'User'
    authArea.innerHTML = `<span class="who">👤 ${displayName}</span> <button class="logout" id="btn-logout">Logout</button>`
    const btn = document.getElementById('btn-logout')
    if(btn) btn.addEventListener('click', () => {
      window.auth.clearToken();
      updateAuthUI();
      // After logout, redirect to login so the app enforces authentication
      window.location.href = '/login.html'
    })
    if(adminLink) adminLink.classList.remove('hidden')
  } else {
    authArea.innerHTML = `<a href="/login.html" id="link-login" class="auth-link">Login</a> <a href="/register.html" id="link-register" class="auth-link">Register</a>`
    if(adminLink) adminLink.classList.add('hidden')
  }
}

updateAuthUI()

// Ensure Admin link prompts login if unauthenticated
const adminLinkEl = document.getElementById('admin-link')
if(adminLinkEl){
  adminLinkEl.addEventListener('click', (e) => {
    const token = (window.auth && window.auth.getToken && window.auth.getToken()) || localStorage.getItem('todo.auth.token')
    if(!token){
      e.preventDefault()
      // send user to login and return to admin after login
      window.location.href = '/login.html?returnTo=/admin.html'
    }
  })
}

// Initial auth flow: if no users exist, force registration; else if users exist and no token, force login
async function initialAuthRedirect(){
  try{
    // avoid redirecting when already on login/register pages
    const path = window.location.pathname || ''
    const isLoginPage = path.endsWith('/login.html')
    const isRegisterPage = path.endsWith('/register.html')
    // query server to see if users exist
    const r = await fetch('/api/auth/exists')
    if(!r.ok) return
    const body = await r.json()
    const usersExist = !!body.exists
    const token = (window.auth && window.auth.getToken && window.auth.getToken()) || localStorage.getItem('todo.auth.token')
    if(!usersExist){
      // no users: send to register unless already there
      if(!isRegisterPage) window.location.href = '/register.html'
      return
    }
    // users exist: require login if not authenticated
    if(usersExist && !token){
      if(!isLoginPage) window.location.href = '/login.html'
      return
    }
  }catch(e){
    // if server unreachable, don't redirect
    return
  }
}

// run initial auth redirect check (non-blocking)
initialAuthRedirect()

// Level Switcher Logic
let currentLevel = localStorage.getItem('todo.currentLevel') || 'daily'
const levelButtons = document.querySelectorAll('.level-btn')

// Weekly task management
let weeklyTasks = []
let currentWeekStart = getMonday(new Date())

function getMonday(d) {
  d = new Date(d)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.setDate(diff))
}

function formatWeekRange(monday) {
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return `Week of ${monday.toLocaleDateString('en-US', {month: 'short', day: 'numeric'})} - ${sunday.toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}`
}

async function loadWeeklyTasks() {
  const token = getToken()
  if (!token) {
    return
  }
  try {
    const weekStart = localIso(currentWeekStart)
    const url = `/api/weekly-tasks/?week_start=${weekStart}&tab=${currentTab}`
    const r = await fetch(url, {
      headers: { 'Authorization': 'Bearer ' + token }
    })
    if (r.ok) {
      weeklyTasks = await r.json()
      renderWeeklyView()
    } else {
      console.error('Failed to load weekly tasks:', r.status, r.statusText)
    }
  } catch(e) { 
    console.error('Error loading weekly tasks:', e) 
  }
}

async function addWeeklyTask(title) {
  const token = getToken()
  if (!token || !title.trim()) return
  try {
    const r = await fetch('/api/weekly-tasks/', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: title.trim(),
        week_start_date: localIso(currentWeekStart),
        tab: currentTab,
        completed: false
      })
    })
    if (r.ok) {
      await loadWeeklyTasks()
    }
  } catch(e) { console.error(e) }
}

async function toggleWeeklyTask(id, completed) {
  const token = getToken()
  if (!token) return
  try {
    await fetch(`/api/weekly-tasks/${id}/`, {
      method: 'PATCH',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ completed })
    })
    await loadWeeklyTasks()
    if (typeof updateGoalsStatus === 'function') updateGoalsStatus()
  } catch(e) { console.error(e) }
}

async function deleteWeeklyTask(id) {
  const token = getToken()
  if (!token) return
  try {
    await fetch(`/api/weekly-tasks/${id}/`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + token }
    })
    await loadWeeklyTasks()
  } catch(e) { console.error(e) }
}

// Monthly task management
let monthlyTasks = []
let currentMonth = new Date().getMonth() + 1
let currentYear = new Date().getFullYear()

async function loadMonthlyTasks() {
  console.log('loadMonthlyTasks called')
  const token = getToken()
  console.log('Token:', token ? 'exists' : 'missing')
  if (!token) {
    console.error('No auth token found for monthly tasks')
    return
  }
  try {
    const r = await fetch(`/api/monthly-tasks/?month=${currentMonth}&year=${currentYear}&tab=${currentTab}`, {
      headers: { 'Authorization': 'Bearer ' + token }
    })
    if (r.ok) {
      monthlyTasks = await r.json()
      renderMonthlyView()
    }
  } catch(e) { console.error(e) }
}

async function addMonthlyTask(title, priority = 'medium') {
  const token = getToken()
  if (!token || !title.trim()) return
  try {
    const r = await fetch('/api/monthly-tasks/', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: title.trim(),
        month: currentMonth,
        year: currentYear,
        tab: currentTab,
        priority,
        completed: false
      })
    })
    if (r.ok) {
      await loadMonthlyTasks()
    }
  } catch(e) { console.error(e) }
}

async function toggleMonthlyTask(id, completed) {
  const token = getToken()
  if (!token) return
  try {
    await fetch(`/api/monthly-tasks/${id}/`, {
      method: 'PATCH',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ completed })
    })
    await loadMonthlyTasks()
    if (typeof updateGoalsStatus === 'function') updateGoalsStatus()
  } catch(e) { console.error(e) }
}

async function deleteMonthlyTask(id) {
  const token = getToken()
  if (!token) return
  try {
    await fetch(`/api/monthly-tasks/${id}/`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + token }
    })
    await loadMonthlyTasks()
  } catch(e) { console.error(e) }
}

// Yearly task management
let yearlyTasks = []
let selectedYear = new Date().getFullYear()

async function loadYearlyTasks() {
  const token = getToken()
  if (!token) {
    return
  }
  try {
    const r = await fetch(`/api/yearly-tasks/?year=${selectedYear}`, {
      headers: { 'Authorization': 'Bearer ' + token }
    })
    if (r.ok) {
      yearlyTasks = await r.json()
      renderYearlyView()
    }
  } catch(e) { console.error(e) }
}

async function addYearlyTask(title, quarter = '') {
  const token = getToken()
  if (!token || !title.trim()) return
  try {
    const r = await fetch('/api/yearly-tasks/', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: title.trim(),
        year: selectedYear,
        quarter,
        completed: false
      })
    })
    if (r.ok) {
      await loadYearlyTasks()
    }
  } catch(e) { console.error(e) }
}

async function toggleYearlyTask(id, completed) {
  const token = getToken()
  if (!token) return
  try {
    await fetch(`/api/yearly-tasks/${id}/`, {
      method: 'PATCH',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ completed })
    })
    await loadYearlyTasks()
    if (typeof updateGoalsStatus === 'function') updateGoalsStatus()
  } catch(e) { console.error(e) }
}

async function deleteYearlyTask(id) {
  const token = getToken()
  if (!token) return
  try {
    await fetch(`/api/yearly-tasks/${id}/`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + token }
    })
    await loadYearlyTasks()
  } catch(e) { console.error(e) }
}

function renderWeeklyView() {
  let container = document.getElementById('weekly-container')
  if (!container) {
    container = document.createElement('div')
    container.id = 'weekly-container'
    container.className = 'level-container'
    document.querySelector('.tasks-panel').appendChild(container)
  }
  container.style.display = 'block'
  
  const filteredTasks = weeklyTasks.filter(t => t.tab === currentTab)
  const activeTasks = filteredTasks.filter(t => !t.completed)
  const completedTasks = filteredTasks.filter(t => t.completed)
  
  let displayTasks = filteredTasks
  if (filter === 'active') displayTasks = activeTasks
  if (filter === 'completed') displayTasks = completedTasks
  
  container.innerHTML = `
    <div class="tabs">
      <button class="tab ${currentTab === 'personal' ? 'active' : ''}" onclick="switchTab('personal')">Personal</button>
      <button class="tab ${currentTab === 'work' ? 'active' : ''}" onclick="switchTab('work')">Work</button>
    </div>
    
    <div class="level-header">
      <button class="nav-btn" onclick="changeWeek(-7)">◀</button>
      <h3>${formatWeekRange(currentWeekStart)}</h3>
      <button class="nav-btn" onclick="changeWeek(7)">▶</button>
    </div>
    
    <form class="task-form" onsubmit="event.preventDefault(); addWeeklyTask(document.getElementById('weekly-input').value); document.getElementById('weekly-input').value='';">
      <input id="weekly-input" type="text" placeholder="Add weekly goal..." required>
      <button type="submit">Add Goal</button>
    </form>
    
    <div class="controls">
      <div class="filters">
        <button class="${filter === 'all' ? 'active' : ''}" onclick="setFilter('all')">All</button>
        <button class="${filter === 'active' ? 'active' : ''}" onclick="setFilter('active')">Active</button>
        <button class="${filter === 'completed' ? 'active' : ''}" onclick="setFilter('completed')">Completed</button>
      </div>
      <button class="clear" onclick="clearCompletedWeekly()" style="${completedTasks.length === 0 ? 'visibility:hidden' : ''}">Clear completed</button>
    </div>
    
    <ul class="task-list">
      ${displayTasks.map(task => `
        <li class="task-item ${task.completed ? 'completed' : ''}">
          <label class="task-label">
            <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleWeeklyTask(${task.id}, this.checked)">
            <span class="task-title ${task.completed ? 'completed' : ''}">${task.title}</span>
          </label>
          <div class="task-actions">
            <button class="icon-btn" onclick="deleteWeeklyTask(${task.id})" title="Delete">🗑️</button>
          </div>
        </li>
      `).join('')}
    </ul>
    
    ${displayTasks.length === 0 ? '<p class="hint">No tasks to show. Add a new goal above!</p>' : ''}
    <p class="hint">${activeTasks.length} active, ${completedTasks.length} completed</p>
  `
  container.style.display = 'block'
}

function renderMonthlyView() {
  let container = document.getElementById('monthly-container')
  if (!container) {
    container = document.createElement('div')
    container.id = 'monthly-container'
    container.className = 'level-container'
    document.querySelector('.tasks-panel').appendChild(container)
  }
  container.style.display = 'block'
  
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const filteredTasks = monthlyTasks.filter(t => t.tab === currentTab)
  const activeTasks = filteredTasks.filter(t => !t.completed)
  const completedTasks = filteredTasks.filter(t => t.completed)
  
  let displayTasks = filteredTasks
  if (filter === 'active') displayTasks = activeTasks
  if (filter === 'completed') displayTasks = completedTasks
  
  container.innerHTML = `
    <div class="tabs">
      <button class="tab ${currentTab === 'personal' ? 'active' : ''}" onclick="switchTab('personal')">Personal</button>
      <button class="tab ${currentTab === 'work' ? 'active' : ''}" onclick="switchTab('work')">Work</button>
    </div>
    
    <div class="level-header">
      <button class="nav-btn" onclick="changeMonth(-1)">◀</button>
      <h3>${monthNames[currentMonth - 1]} ${currentYear}</h3>
      <button class="nav-btn" onclick="changeMonth(1)">▶</button>
    </div>
    
    <form class="task-form" onsubmit="event.preventDefault(); addMonthlyTask(document.getElementById('monthly-input').value, document.getElementById('monthly-priority').value); document.getElementById('monthly-input').value='';">
      <input id="monthly-input" type="text" placeholder="Add monthly milestone..." required>
      <select id="monthly-priority">
        <option value="low">Low</option>
        <option value="medium" selected>Medium</option>
        <option value="high">High</option>
      </select>
      <button type="submit">Add Milestone</button>
    </form>
    
    <div class="controls">
      <div class="filters">
        <button class="${filter === 'all' ? 'active' : ''}" onclick="setFilter('all')">All</button>
        <button class="${filter === 'active' ? 'active' : ''}" onclick="setFilter('active')">Active</button>
        <button class="${filter === 'completed' ? 'active' : ''}" onclick="setFilter('completed')">Completed</button>
      </div>
      <button class="clear" onclick="clearCompletedMonthly()" style="${completedTasks.length === 0 ? 'visibility:hidden' : ''}">Clear completed</button>
    </div>
    
    <ul class="task-list">
      ${displayTasks.map(task => `
        <li class="task-item ${task.completed ? 'completed' : ''}">
          <label class="task-label">
            <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleMonthlyTask(${task.id}, this.checked)">
            <span class="task-title ${task.completed ? 'completed' : ''}">${task.title}</span>
          </label>
          <div class="task-actions">
            <span class="priority-badge priority-${task.priority}">${task.priority}</span>
            <button class="icon-btn" onclick="deleteMonthlyTask(${task.id})" title="Delete">🗑️</button>
          </div>
        </li>
      `).join('')}
    </ul>
    
    ${displayTasks.length === 0 ? '<p class="hint">No tasks to show. Add a new milestone above!</p>' : ''}
    <p class="hint">${activeTasks.length} active, ${completedTasks.length} completed</p>
  `
  container.style.display = 'block'
}

function renderYearlyView() {
  let container = document.getElementById('yearly-container')
  if (!container) {
    container = document.createElement('div')
    container.id = 'yearly-container'
    container.className = 'level-container'
    document.querySelector('.tasks-panel').appendChild(container)
  }
  container.style.display = 'block'
  
  const activeTasks = yearlyTasks.filter(t => !t.completed)
  const completedTasks = yearlyTasks.filter(t => t.completed)
  
  let displayTasks = yearlyTasks
  if (filter === 'active') displayTasks = activeTasks
  if (filter === 'completed') displayTasks = completedTasks
  
  container.innerHTML = `
    <div class="level-header">
      <button class="nav-btn" onclick="changeYear(-1)">◀</button>
      <h3>${selectedYear} Goals</h3>
      <button class="nav-btn" onclick="changeYear(1)">▶</button>
    </div>
    
    <form class="task-form" onsubmit="event.preventDefault(); addYearlyTask(document.getElementById('yearly-input').value, document.getElementById('yearly-quarter').value); document.getElementById('yearly-input').value='';">
      <input id="yearly-input" type="text" placeholder="Add yearly goal..." required>
      <select id="yearly-quarter">
        <option value="">Any Quarter</option>
        <option value="Q1">Q1 (Jan-Mar)</option>
        <option value="Q2">Q2 (Apr-Jun)</option>
        <option value="Q3">Q3 (Jul-Sep)</option>
        <option value="Q4">Q4 (Oct-Dec)</option>
      </select>
      <button type="submit">Add Goal</button>
    </form>
    
    <div class="controls">
      <div class="filters">
        <button class="${filter === 'all' ? 'active' : ''}" onclick="setFilter('all')">All</button>
        <button class="${filter === 'active' ? 'active' : ''}" onclick="setFilter('active')">Active</button>
        <button class="${filter === 'completed' ? 'active' : ''}" onclick="setFilter('completed')">Completed</button>
      </div>
      <button class="clear" onclick="clearCompletedYearly()" style="${completedTasks.length === 0 ? 'visibility:hidden' : ''}">Clear completed</button>
    </div>
    
    <ul class="task-list">
      ${displayTasks.map(task => `
        <li class="task-item ${task.completed ? 'completed' : ''}">
          <label class="task-label">
            <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleYearlyTask(${task.id}, this.checked)">
            <span class="task-title ${task.completed ? 'completed' : ''}">${task.title}</span>
          </label>
          <div class="task-actions">
            ${task.quarter ? `<span class="quarter-badge">${task.quarter}</span>` : ''}
            <button class="icon-btn" onclick="deleteYearlyTask(${task.id})" title="Delete">🗑️</button>
          </div>
        </li>
      `).join('')}
    </ul>
    
    ${displayTasks.length === 0 ? '<p class="hint">No tasks to show. Add a new goal above!</p>' : ''}
    <p class="hint">${activeTasks.length} active, ${completedTasks.length} completed</p>
  `
  container.style.display = 'block'
}

window.changeWeek = (days) => {
  currentWeekStart.setDate(currentWeekStart.getDate() + days)
  loadWeeklyTasks()
}

window.changeMonth = (delta) => {
  currentMonth += delta
  if (currentMonth > 12) { currentMonth = 1; currentYear++ }
  if (currentMonth < 1) { currentMonth = 12; currentYear-- }
  loadMonthlyTasks()
  // Update goals status to reflect the new month
  if (typeof updateGoalsStatus === 'function') updateGoalsStatus()
}

window.changeYear = (delta) => {
  selectedYear += delta
  loadYearlyTasks()
  // Update goals status to reflect the new year
  if (typeof updateGoalsStatus === 'function') updateGoalsStatus()
}

window.addWeeklyTask = addWeeklyTask
window.toggleWeeklyTask = toggleWeeklyTask
window.deleteWeeklyTask = deleteWeeklyTask
window.addMonthlyTask = addMonthlyTask
window.toggleMonthlyTask = toggleMonthlyTask
window.deleteMonthlyTask = deleteMonthlyTask
window.addYearlyTask = addYearlyTask
window.toggleYearlyTask = toggleYearlyTask
window.deleteYearlyTask = deleteYearlyTask

// Update goals status summary
async function updateGoalsStatus() {
  const token = getToken()
  if (!token) {
    console.log('No auth token, skipping goals status update')
    return
  }
  
  // Use the calendar's viewMonth and viewYear for all status calculations
  // This ensures status reflects the displayed calendar period
  const displayMonth = viewMonth + 1  // viewMonth is 0-based (0=Jan, 11=Dec)
  const displayYear = viewYear
  
  // For yearly status: use viewYear
  const displayYearForYearly = viewYear
  
  try {
    // Fetch all weekly tasks for current tab, then filter by displayed month
    const weeklyRes = await fetch(`/api/weekly-tasks/?tab=${currentTab}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    
    // Fetch monthly tasks for display month/year
    const monthlyRes = await fetch(`/api/monthly-tasks/?month=${displayMonth}&year=${displayYear}&tab=${currentTab}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    
    // Fetch yearly tasks for display year
    const yearlyRes = await fetch(`/api/yearly-tasks/?year=${displayYearForYearly}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    
    if (weeklyRes.ok) {
      const allWeeklyData = await weeklyRes.json()
      
      // Filter weekly tasks to only those with week_start_date in the displayed month
      const weeklyData = allWeeklyData.filter(task => {
        const weekStart = new Date(task.week_start_date)
        return weekStart.getMonth() === viewMonth && weekStart.getFullYear() === viewYear
      })
      
      const completed = weeklyData.filter(t => t.completed).length
      const total = weeklyData.length
      const weeklyEl = document.getElementById('weekly-status')
      const progressEl = weeklyEl?.querySelector('.goal-progress')
      if (progressEl) {
        progressEl.textContent = `${completed}/${total}`
        weeklyEl.classList.toggle('completed', completed === total && total > 0)
      }
    }
    
    if (monthlyRes.ok) {
      const monthlyData = await monthlyRes.json()
      const completed = monthlyData.filter(t => t.completed).length
      const total = monthlyData.length
      const monthlyEl = document.getElementById('monthly-status')
      const progressEl = monthlyEl?.querySelector('.goal-progress')
      if (progressEl) {
        progressEl.textContent = `${completed}/${total}`
        monthlyEl.classList.toggle('completed', completed === total && total > 0)
      }
    } else {
      console.error('Monthly tasks request failed:', monthlyRes.status)
    }
    
    if (yearlyRes.ok) {
      const yearlyData = await yearlyRes.json()
      const completed = yearlyData.filter(t => t.completed).length
      const total = yearlyData.length
      const yearlyEl = document.getElementById('yearly-status')
      const progressEl = yearlyEl?.querySelector('.goal-progress')
      if (progressEl) {
        progressEl.textContent = `${completed}/${total}`
        yearlyEl.classList.toggle('completed', completed === total && total > 0)
      }
    }
  } catch (error) {
    console.error('Error updating goals status:', error)
  }
}

// Add click handlers for goal status boxes
function initGoalStatusHandlers() {
  const weeklyEl = document.getElementById('weekly-status')
  const monthlyEl = document.getElementById('monthly-status')
  const yearlyEl = document.getElementById('yearly-status')
  
  if (weeklyEl) {
    weeklyEl.style.cursor = 'pointer'
    weeklyEl.addEventListener('click', () => {
      switchLevel('weekly')
    })
  }
  
  if (monthlyEl) {
    monthlyEl.style.cursor = 'pointer'
    monthlyEl.addEventListener('click', () => {
      switchLevel('monthly')
    })
  }
  
  if (yearlyEl) {
    yearlyEl.style.cursor = 'pointer'
    yearlyEl.addEventListener('click', () => {
      switchLevel('yearly')
    })
  }
}

function switchLevel(level){
  currentLevel = level
  localStorage.setItem('todo.currentLevel', level)
  
  // Update button states
  levelButtons.forEach(btn => {
    const isActive = btn.dataset.level === level
    btn.classList.toggle('active', isActive)
    btn.setAttribute('aria-selected', isActive)
  })
  
  // Update page title
  const titles = {
    daily: 'Daily Tasks',
    weekly: 'Weekly Goals',
    monthly: 'Monthly Milestones',
    yearly: 'Yearly Objectives'
  }
  const h1 = document.querySelector('.tasks-header h1')
  if(h1) h1.textContent = titles[level] || 'Tasks'
  
  // Hide all level containers
  const containers = ['weekly-container', 'monthly-container', 'yearly-container']
  containers.forEach(id => {
    const el = document.getElementById(id)
    if (el) el.style.display = 'none'
  })
  
  // Show/hide appropriate views
  const dailyElements = document.querySelectorAll('.tabs, .week-controls, .selected-date-card, #task-form, .controls, #task-list, .task-footer')
  
  if(level === 'daily'){
    dailyElements.forEach(el => { if(el) el.style.display = '' })
    // Re-render the current day's tasks
    renderTasks()
    renderCalendar(viewYear, viewMonth)
    if(typeof renderWeekTabs === 'function') renderWeekTabs()
  } else {
    dailyElements.forEach(el => { if(el) el.style.display = 'none' })
    
    // Load and show the appropriate level
    if (level === 'weekly') {
      loadWeeklyTasks()
    } else if (level === 'monthly') {
      loadMonthlyTasks()
    } else if (level === 'yearly') {
      loadYearlyTasks()
    }
  }
}

// Initialize level switcher
levelButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    switchLevel(btn.dataset.level)
  })
})

// Set initial level
switchLevel(currentLevel)
