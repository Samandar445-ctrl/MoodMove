import { A, LV } from './data.js'
export const DEF = { level: 'beginner', time: 10, loc: 'home', restr: [], intensity: 0, equip: false }
export const DS = { theme: 'system', lang: 'en', notif: { daily: true, streak: true, ach: true } }
const kd = e => 'moodmove.data.' + (e || 'guest')
export const load = e => { try { const d = JSON.parse(localStorage.getItem(kd(e))); if (d && Array.isArray(d.sessions)) return { sessions: d.sessions, prefs: { ...DEF, ...d.prefs } } } catch {} return { sessions: [], prefs: { ...DEF } } }
export const save = (e, db) => { try { localStorage.setItem(kd(e), JSON.stringify(db)) } catch {} }
export const loadS = () => { try { const s = JSON.parse(localStorage.getItem('moodmove.settings')); return { ...DS, ...s, notif: { ...DS.notif, ...(s && s.notif) } } } catch { return DS } }
export const saveS = s => { try { localStorage.setItem('moodmove.settings', JSON.stringify(s)) } catch {} }
export const sessOf = db => db.sessions.filter(s => s && s.actName && s.t)
export const fl = x => (x.feel != null ? x.feel : x.helped === 'yes' ? 1 : x.helped === 'little' ? 0 : x.helped === 'no' ? -1 : null)
const hv = x => { const f = fl(x); return f == null ? 0 : f >= 2 ? 1.2 : f === 1 ? 1 : f === 0 ? 0.3 : 0 }

export function valid(a, p) {
  const r = p.restr
  if (!a.l.includes(p.loc)) return false
  if (a.eq && !p.equip && p.loc !== 'gym') return false
  if (r.includes('nojump') && a.jump) return false
  if (r.includes('noeq') && a.eq) return false
  if (r.includes('low') && a.i > 1) return false
  if (r.includes('quiet') && !a.quiet && a.i > 1) return false
  if (r.includes('small') && !a.small && a.i > 2) return false
  return true
}
export function score(a, p, ss) {
  let s = p.mood ? (a.m.includes(p.mood) ? 40 : 0) : 10
  const [lo, hi] = a.e
  s += p.energy >= lo && p.energy <= hi ? 25 : -6 * (p.energy < lo ? lo - p.energy : p.energy - hi)
  s += p.time <= 5 ? (a.q ? 10 : -10) : p.time >= 20 && a.i >= 2 ? 6 : 0
  const lv = LV[p.level][2]
  s += a.d > lv ? -25 : a.d < lv ? -4 : 10
  if (p.intensity && a.i === p.intensity) s += 10
  if (p.restr.length) s += 8
  s += Math.min(18, ss.filter(x => x.actId === a.id).reduce((t, x) => t + hv(x) * 6, 0))
  const ix = ss.slice(-3).map(x => x.actId).reverse().indexOf(a.id)
  if (ix >= 0) s -= 12 - 4 * ix
  if (!ss.some(x => x.actId === a.id)) s += 5
  return s
}
export function recommend(p, ss, skip) {
  let pool = A.filter(a => valid(a, p))
  if (!pool.length) pool = A.filter(a => a.id === 'reset')
  let c = pool.filter(a => !skip.includes(a.id))
  if (!c.length) { skip = []; c = pool }
  c = [...c].sort((a, b) => score(b, p, ss) - score(a, p, ss))
  return { act: c[0], skip: [...skip, c[0].id] }
}
export function why(a, p, ss, t) {
  const r = [p.energy <= 3 ? t('rE1') : p.energy <= 6 ? t('rE2') : t('rE3')]
  if (p.mood) r.push(t('rM', { m: t('m_' + p.mood).toLowerCase() }))
  r.push(t('rT', { n: p.time }))
  let s = t('rec_') + ' ' + r.join(', ') + '.'
  const h = ss.filter(x => x.actId === a.id && fl(x) >= 1).length
  s += h ? ' ' + t('rH', { n: h }) : !ss.some(x => x.actId === a.id) ? ' ' + t('rNew') : ''
  if (p.restr.length) s += ' ' + t('rR')
  return s
}
export function build(a, mins) {
  const n = a.ex.length, total = mins * 60
  const rounds = Math.max(1, Math.ceil(total / (n * 50))), sec = Math.max(15, Math.round(total / (n * rounds)))
  const out = []
  for (let r = 0; r < rounds; r++) a.ex.forEach(x => out.push({ n: x[0], c: x[1], s: sec, r: rounds > 1 ? r + 1 : 0, R: rounds }))
  return out
}
export function analyze(text) {
  const t = text.toLowerCase()
  const mp = { tired: /tired|exhaust|sleepy|drained/, stressed: /stress|anxious|overwhelm|pressure|relax/, irritated: /angry|irritat|annoy|mad\b|frustrat/, sad: /\bsad|down\b|low\b|lonely/, energetic: /energetic|tons of energy|happy|great|pumped|hyper/, bored: /bored|boring/, normal: /calm|fine|okay|normal/ }
  const en = { tired: 3, stressed: 5, irritated: 6, sad: 3, energetic: 9, bored: 5, normal: 5 }
  const mood = Object.keys(mp).find(k => mp[k].test(t)) || null
  const m = t.match(/(\d+)\s*(?:min|minute)/)
  const time = m ? [3, 5, 10, 20, 30].reduce((a, b) => (Math.abs(b - +m[1]) < Math.abs(a - +m[1]) ? b : a)) : null
  const loc = /school|class|campus/.test(t) ? 'school' : /gym/.test(t) ? 'gym' : /outside|park|outdoor/.test(t) ? 'outdoors' : /home|house|room/.test(t) ? 'home' : null
  const restr = [/quiet|silent/.test(t) && 'quiet', /small space|tiny room/.test(t) && 'small', /relax/.test(t) && 'low'].filter(Boolean)
  return { mood, energy: mood ? en[mood] : null, time, loc, restr, ctx: ['school', 'work', 'home'].filter(w => t.includes(w)) }
}
export const QZ = [['heavy', 'wired', 'ok'], ['racing', 'flat', 'restless', 'clear'], ['calm', 'lift', 'move']]
const QS = { heavy: [{ tired: 2 }, 2], wired: [{ stressed: 1, irritated: 1 }, 6], ok: [{ normal: 2 }, 5], racing: [{ stressed: 2 }], flat: [{ sad: 2 }], restless: [{ bored: 2 }], clear: [{ normal: 2 }], calm: [{ stressed: 1, tired: 1 }], lift: [{ sad: 1, bored: 1 }], move: [{ energetic: 2 }] }
export function quiz(ans) {
  const sc = {}; let en = 5
  ans.forEach((a, i) => { const [m, e] = QS[a]; for (const k in m) sc[k] = (sc[k] || 0) + m[k]; if (i === 0) en = e; if (i === 2) en += a === 'calm' ? -1 : a === 'move' ? 2 : 1 })
  return { mood: Object.keys(sc).sort((a, b) => sc[b] - sc[a])[0], energy: Math.max(1, Math.min(10, en)) }
}
export const QM = [['reset', '⚡', null], ['five', '🕔', { time: 5 }], ['stress', '🌊', { mood: 'stressed', energy: 5 }], ['boost', '🔋', { mood: 'energetic', energy: 8 }], ['calm', '🍃', { mood: 'stressed', energy: 3, restr: ['low'] }], ['wake', '☀️', { mood: 'tired', energy: 4, time: 5 }], ['noeq', '🙌', { restr: ['noeq'] }], ['quiet', '🤫', { restr: ['quiet'] }], ['small', '📦', { restr: ['small'] }]]
const day = t => { const d = new Date(t); return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() }
export function streaks(ss) {
  const ds = [...new Set(ss.map(s => day(s.t)))].sort((a, b) => a - b)
  let best = 0, run = 0, prev = null
  for (const d of ds) { run = prev !== null && Math.round((d - prev) / 864e5) === 1 ? run + 1 : 1; best = Math.max(best, run); prev = d }
  const doneToday = ds.length && ds[ds.length - 1] === day(Date.now())
  const cur = ds.length && Math.round((day(Date.now()) - ds[ds.length - 1]) / 864e5) <= 1 ? run : 0
  return { cur, best, doneToday: !!doneToday }
}
export function stats(db) {
  const s = sessOf(db); if (!s.length) return null
  const cnt = f => s.reduce((m, x) => { const k = f(x); if (k) m[k] = (m[k] || 0) + 1; return m }, {})
  const top = o => Object.keys(o).sort((a, b) => o[b] - o[a])[0]
  const moods = cnt(x => x.mood), acts = cnt(x => x.actName), st = streaks(s), ef = {}
  s.forEach(x => { const f = fl(x); if (f != null) (ef[x.actName] = ef[x.actName] || []).push(f) })
  const effective = Object.entries(ef).map(([n, v]) => [n, v.reduce((a, b) => a + b, 0) / v.length, v.length]).filter(e => e[1] > 0).sort((a, b) => b[1] - a[1] || b[2] - a[2]).slice(0, 3)
  const today = day(Date.now())
  const week = [...Array(7)].map((_, i) => { const d = today - (6 - i) * 864e5; return { d, n: s.filter(x => Math.round((day(x.t) - d) / 864e5) === 0).length } })
  const min = s.reduce((t, x) => t + (x.dur || 0), 0)
  return { n: s.length, min, avg: Math.round(min / s.length), mood: top(moods), moods, topAct: top(acts), nActs: Object.keys(acts).length, nMoods: Object.keys(moods).length, cur: st.cur, best: st.best, doneToday: st.doneToday, effective, ba: [-1, 0, 1, 2].map(v => s.filter(x => fl(x) === v).length), en: s.filter(x => x.eBefore != null && x.eAfter != null), week }
}
export const ACH = [['first', '🌱', s => s.n >= 1], ['s3', '🔥', s => s.best >= 3], ['s7', '🏔️', s => s.best >= 7], ['v5', '🧭', s => s.nActs >= 5], ['m30', '⏱️', s => s.min >= 30], ['mx', '🎭', s => s.nMoods >= 4], ['vm', '🌈', s => s.nActs >= 8]]
export const unlocked = db => { const st = stats(db); return st ? ACH.filter(a => a[2](st)).map(a => a[0]) : [] }
export function insight(db, t) {
  const s = sessOf(db), hv2 = {}
  s.forEach(x => { if (fl(x) >= 1) hv2[x.actName] = (hv2[x.actName] || 0) + 1 })
  const wk = Object.keys(hv2).find(k => hv2[k] >= 2)
  if (wk) return t('iWork', { a: wk })
  const sh = s.filter(x => x.dur <= 5 && fl(x) != null), lg = s.filter(x => x.dur > 5 && fl(x) != null), r = a => a.reduce((q, x) => q + hv(x), 0) / a.length
  if (sh.length >= 2 && lg.length >= 1 && r(sh) > r(lg)) return t('iShort')
  return t('iMore')
}
export function daily(db) {
  const pr = db.prefs, ss = sessOf(db), l = ss[ss.length - 1]
  const p = { mood: l?.mood || null, energy: l?.eBefore || 5, time: Math.min(pr.time, 5), loc: pr.loc, level: pr.level, restr: pr.restr, intensity: pr.intensity, equip: pr.equip }
  let pool = A.filter(a => valid(a, p)); if (!pool.length) pool = A.filter(a => a.id === 'reset')
  pool.sort((a, b) => score(b, p, ss) - score(a, p, ss))
  return { act: pool[Math.floor(Date.now() / 864e5) % Math.min(3, pool.length)], p }
}
