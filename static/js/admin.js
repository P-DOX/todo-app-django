// Admin page script to manage default weekly tasks (stored in localStorage)
// Wait for auth.js to load before initializing
(function() {
  // Use user-specific storage key
  function getUserStorageKey(baseKey) {
    const user = (window.auth && window.auth.getUser && window.auth.getUser()) || null
    const username = user ? user.username : 'anonymous'
    return `${baseKey}.${username}`
  }

  const defaultForm = document.getElementById('default-form')
  const defaultWeekday = document.getElementById('default-weekday')
  const defaultTitle = document.getElementById('default-title')
  const defaultTab = document.getElementById('default-tab')
  const defaultsTableBody = document.querySelector('#defaults-table tbody')
  const taskCount = document.getElementById('task-count')
  const emptyState = document.getElementById('empty-state')

  let defaults = []

  function loadDefaults(){
    const DEFAULTS_KEY = getUserStorageKey('todo.defaults.v1')
    try{ const raw = localStorage.getItem(DEFAULTS_KEY); defaults = raw ? JSON.parse(raw) : [] }catch(e){ defaults = [] }
  }

  function saveDefaults(){
    const DEFAULTS_KEY = getUserStorageKey('todo.defaults.v1')
    localStorage.setItem(DEFAULTS_KEY, JSON.stringify(defaults))
  }

  function weekdayName(n){ return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][n] || n }

  function updateTaskCount() {
    const count = defaults.length
    if (taskCount) {
      taskCount.textContent = count === 1 ? '1 task' : `${count} tasks`
    }
  }

  function renderDefaults(){
    defaultsTableBody.innerHTML = ''
    
    if (defaults.length === 0) {
      if (emptyState) emptyState.classList.add('visible')
    } else {
      if (emptyState) emptyState.classList.remove('visible')
      
      for(const d of defaults){
        const tr = document.createElement('tr')
        
        const tdDay = document.createElement('td')
        tdDay.textContent = weekdayName(d.weekday)
        
        const tdTitle = document.createElement('td')
        tdTitle.textContent = d.title
        tdTitle.setAttribute('data-label', 'Title')
        
        const tdTab = document.createElement('td')
        tdTab.setAttribute('data-label', 'Category')
        const badge = document.createElement('span')
        badge.className = 'tab-badge'
        badge.setAttribute('data-tab', d.tab)
        badge.textContent = d.tab
        tdTab.appendChild(badge)
        
        const tdAct = document.createElement('td')
        tdAct.className = 'defaults-actions'
        tdAct.setAttribute('data-label', 'Actions')
        
        const del = document.createElement('button')
        del.className = 'delete-btn'
        del.innerHTML = '<span>🗑️</span> Delete'
        del.addEventListener('click', () => { 
          if (confirm(`Delete "${d.title}"?`)) {
            defaults = defaults.filter(x => x.id !== d.id)
            saveDefaults()
            renderDefaults()
          }
        })
        tdAct.appendChild(del)
        
        tr.appendChild(tdDay)
        tr.appendChild(tdTitle)
        tr.appendChild(tdTab)
        tr.appendChild(tdAct)
        defaultsTableBody.appendChild(tr)
      }
    }
    
    updateTaskCount()
  }

  if(defaultForm){
    defaultForm.addEventListener('submit', (e) => {
      e.preventDefault()
      const w = Number(defaultWeekday.value)
      const t = defaultTitle.value.trim()
      const tab = defaultTab.value || 'personal'
      if(!t) return
      const id = Date.now().toString()
      defaults.push({ id, weekday: w, title: t, tab })
      saveDefaults()
      renderDefaults()
      defaultTitle.value = ''
      defaultWeekday.value = '1' // Reset to Monday
    })
  }

  // Wait a bit for auth.js to initialize
  setTimeout(() => {
    loadDefaults()
    renderDefaults()
  }, 100)
})();
