// auth helper - reads token from cookie (set by server) or localStorage (fallback)
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

function saveToken(tok){ localStorage.setItem('todo.auth.token', tok) }

function getToken(){ 
  // Try cookie first (server-set), then localStorage (legacy)
  return getCookie('auth_token') || localStorage.getItem('todo.auth.token') 
}

function clearToken(){ 
  localStorage.removeItem('todo.auth.token')
  // Clear cookie by setting it to expire
  document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
}

async function postJson(url, body){
  const res = await fetch(url, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) })
  return res
}

// Expose helpers for other scripts
function b64UrlDecode(str){
  // convert from base64url to base64
  str = str.replace(/-/g, '+').replace(/_/g, '/')
  // pad with = to multiple of 4
  while(str.length % 4) str += '='
  try{ return atob(str) }catch(e){ return null }
}

function parseJwt(token){
  try{
    const parts = (token || '').split('.')
    if(parts.length < 2) return null
    const payload = b64UrlDecode(parts[1])
    if(!payload) return null
    // payload is a JSON string
    return JSON.parse(payload)
  }catch(e){ return null }
}

function getUser(){
  const t = getToken()
  if(!t) return null
  const p = parseJwt(t)
  if(!p) return null
  return { username: p.username, userId: p.user_id, first_name: p.first_name || '' }
}

window.auth = { getToken, saveToken, clearToken, parseJwt, getUser, getCookie }

