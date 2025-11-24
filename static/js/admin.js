// Admin page script to manage default weekly tasks (synced with backend)
// Wait for auth.js to load before initializing
(function() {
  // Use user-specific storage key
  function getUserStorageKey(baseKey) {
    const user = (window.auth && window.auth.getUser && window.auth.getUser()) || null
    const username = user ? user.username : 'anonymous'
    return `${baseKey}.${username}`
  }

  const defaultForm = document.getElementById('default-form')
  const defaultTitle = document.getElementById('default-title')
  const defaultTab = document.getElementById('default-tab')
  const defaultsTableBody = document.querySelector('#defaults-table tbody')
  const taskCount = document.getElementById('task-count')
  const emptyState = document.getElementById('empty-state')

  let defaults = []

  // Load defaults from backend API
  async function loadDefaults(){
    const token = localStorage.getItem('todo.auth.token')
    if (!token) {
      console.log('No auth token, skipping default tasks load')
      return
    }
    
    console.log('[DefaultTasks] Loading defaults from /api/defaults/ with token:', token.substring(0, 20) + '...')
    
    try {
      const res = await fetch('/api/defaults/', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      console.log('[DefaultTasks] Response status:', res.status)
      if (res.ok) {
        const data = await res.json()
        defaults = data.map(d => ({
          id: d.id,
          weekday: d.weekday,
          title: d.title,
          tab: d.tab
        }))
        // Also save to localStorage for offline access
        const DEFAULTS_KEY = getUserStorageKey('todo.defaults.v1')
        localStorage.setItem(DEFAULTS_KEY, JSON.stringify(defaults))
      } else {
        console.error('Failed to load defaults from API:', res.status)
        // Fallback to localStorage
        const DEFAULTS_KEY = getUserStorageKey('todo.defaults.v1')
        const raw = localStorage.getItem(DEFAULTS_KEY)
        defaults = raw ? JSON.parse(raw) : []
      }
    } catch(e) {
      console.error('Error loading defaults:', e)
      // Fallback to localStorage
      const DEFAULTS_KEY = getUserStorageKey('todo.defaults.v1')
      const raw = localStorage.getItem(DEFAULTS_KEY)
      defaults = raw ? JSON.parse(raw) : []
    }
  }

  // Save to backend (not needed as we create/delete individually)
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
        del.addEventListener('click', async () => { 
          if (confirm(`Delete "${d.title}"?`)) {
            // Delete from backend
            const token = localStorage.getItem('todo.auth.token')
            if (token && d.id) {
              try {
                await fetch(`/api/defaults/${d.id}/`, {
                  method: 'DELETE',
                  headers: { 'Authorization': `Bearer ${token}` }
                })
              } catch(e) {
                console.error('Error deleting default:', e)
              }
            }
            // Remove from local array
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
    defaultForm.addEventListener('submit', async (e) => {
      e.preventDefault()
      const checkedBoxes = document.querySelectorAll('input[name="weekday"]:checked')
      const weekdays = Array.from(checkedBoxes).map(cb => Number(cb.value))
      const t = defaultTitle.value.trim()
      const tab = defaultTab.value || 'personal'
      
      if(!t || weekdays.length === 0) {
        alert('Please enter a task title and select at least one weekday.')
        return
      }
      
      const token = localStorage.getItem('todo.auth.token')
      console.log('[DefaultTasks] Creating default tasks for weekdays:', weekdays, 'Title:', t, 'Tab:', tab)
      console.log('[DefaultTasks] Token present:', !!token)
      
      let successCount = 0
      let failCount = 0
      
      // Create a task for each selected weekday
      for (const w of weekdays) {
        if (token) {
          try {
            console.log('[DefaultTasks] POSTing to /api/defaults/ for weekday', w)
            const res = await fetch('/api/defaults/', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ weekday: w, title: t, tab })
            })
            console.log('[DefaultTasks] Create response status:', res.status)
            if (res.ok) {
              const newDefault = await res.json()
              console.log('[DefaultTasks] Created successfully:', newDefault)
              defaults.push({
                id: newDefault.id,
                weekday: newDefault.weekday,
                title: newDefault.title,
                tab: newDefault.tab
              })
              successCount++
            } else {
              const errorText = await res.text()
              console.error('[DefaultTasks] Failed to create default:', res.status, errorText)
              failCount++
            }
          } catch(e) {
            console.error('Error creating default:', e)
            failCount++
          }
        } else {
          // No token, save to localStorage only
          const id = `${Date.now()}-${w}`
          defaults.push({ id, weekday: w, title: t, tab })
          successCount++
        }
      }
      
      saveDefaults()
      renderDefaults()
      
      // Show result message and reset form
      if (failCount > 0) {
        alert(`Created ${successCount} default task(s). ${failCount} failed.`)
      } else if (successCount > 0) {
        defaultTitle.value = ''
        // Uncheck all and keep Monday checked by default
        document.querySelectorAll('input[name="weekday"]').forEach(cb => {
          cb.checked = cb.value === '1'
        })
      }
    })
  }

  // Wait a bit for auth.js to initialize
  setTimeout(async () => {
    await loadDefaults()
    renderDefaults()
  }, 100)
})();
