// Prototype auth on localStorage. Replace these functions with real API calls later; the rest of the app only uses this interface.
const U = 'moodmove.users', S = 'moodmove.session'
const rd = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d } catch { return d } }
const hash = async s => {
  if (globalThis.crypto?.subtle) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('mm:' + s)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('') }
  let h = 0; for (const c of 'mm:' + s) h = (h * 31 + c.charCodeAt(0)) | 0; return 'x' + h
}
const setSession = (email, remember) => { try { localStorage.removeItem(S); sessionStorage.removeItem(S); (remember ? localStorage : sessionStorage).setItem(S, email) } catch {} }
export const currentUser = () => { try { const e = sessionStorage.getItem(S) || localStorage.getItem(S), u = rd(U, {}); return e && u[e] ? { email: e, name: u[e].name } : null } catch { return null } }
export async function signUp({ name, email, pw, rem }) {
  email = email.trim().toLowerCase(); const u = rd(U, {})
  if (u[email]) return { err: 'eTaken' }
  u[email] = { name: name.trim(), pw: await hash(pw) }
  try { localStorage.setItem(U, JSON.stringify(u)) } catch {}
  setSession(email, rem); return { user: { email, name: name.trim() } }
}
export async function logIn({ email, pw, rem }) {
  email = email.trim().toLowerCase(); const u = rd(U, {})
  if (!u[email] || u[email].pw !== await hash(pw)) return { err: 'eBad' }
  setSession(email, rem); return { user: { email, name: u[email].name } }
}
export const logOut = () => { try { localStorage.removeItem(S); sessionStorage.removeItem(S) } catch {} }
export const updateName = (email, name) => { const u = rd(U, {}); if (u[email]) { u[email].name = name; try { localStorage.setItem(U, JSON.stringify(u)) } catch {} } }
