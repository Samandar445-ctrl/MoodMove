import { useState, useEffect, useMemo, useRef } from 'react'
import { MOODS, LOC, A, QUICK } from './data.js'
import * as E from './engine.js'
import * as AU from './auth.js'
import { mk } from './i18n.js'
import Player from './Player.jsx'
import Insights from './Insights.jsx'
import { Auth, Profile, Settings } from './Account.jsx'

const HC = [['Reset & Recover', '10 min · Home · Gentle'], ['Release the Pressure', '10 min · Home · Medium'], ['Mood Lift', '5 min · Outdoors · Easy'], ['Energy Burst', '10 min · Gym · High']]
const Opt = ({ on, onClick, children, style }) => <button className="opt" style={style} aria-pressed={on} onClick={onClick}>{children}</button>
const Moods = ({ sel, onPick, t }) => (
  <div className="opts" role="group" aria-label="Mood">{MOODS.map(([id, em]) => <Opt key={id} on={sel === id} onClick={() => onPick(id)}><span className="e">{em}</span>{t('m_' + id)}</Opt>)}</div>)
const fmt = s => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0')

function Hero() {
  const [h, setH] = useState(0)
  useEffect(() => { const x = setInterval(() => setH(v => (v + 1) % HC.length), 3000); return () => clearInterval(x) }, [])
  return (
    <div className="stage" aria-hidden="true">
      <div className="fc" style={{ top: 0, left: 0 }}>😴</div><div className="fc" style={{ top: 30, right: 0, animationDelay: '-1s' }}>⚡</div>
      <div className="fc" style={{ bottom: 20, left: 10, animationDelay: '-2s' }}>😰</div><div className="fc" style={{ bottom: 0, right: 10, animationDelay: '-3s' }}>😔</div>
      <div className="core"><small>MOODMOVE</small><b>{HC[h][0]}<br /><span style={{ fontWeight: 500, fontSize: 16 }}>{HC[h][1]}</span></b></div>
    </div>)
}

function Home({ t, st, daily, notif, onStart, onAgain, onQuick, onDaily }) {
  useEffect(() => {
    const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && e.target.classList.add('in')), { threshold: 0.15 })
    document.querySelectorAll('.rv').forEach(el => io.observe(el)); return () => io.disconnect()
  }, [])
  const rem = notif.streak && st && st.cur > 0 && !st.doneToday ? t('streakR', { n: st.cur }) : notif.daily && !(st && st.doneToday) ? t('dailyD') : null
  return (<>
    <div className="wrap">
      <div className="hero"><div>
        <span className="badge">{t('badge')}</span>
        <h1>{t('h1a')}<br /><em>{t('h1b')}</em></h1>
        <p className="lead">{t('lead')}</p>
        <div className="row"><button className="btn" onClick={onStart}>{t('cta')}</button>
          <button className="btn ghost" onClick={() => document.getElementById('how').scrollIntoView({ behavior: 'smooth' })}>{t('see')}</button></div>
      </div><Hero /></div>
      <div className="two" style={{ marginBottom: 28 }}>
        <div className="card fade"><span className="badge">{t('dailyT').toUpperCase()}</span>
          <h3 style={{ margin: '12px 0 4px' }}>{daily.act.n}</h3>
          <p style={{ color: 'var(--mut)', margin: '0 0 14px' }}>{rem || t('dailyD')}</p>
          <button className="btn sm" onClick={onDaily}>{t('go')}</button></div>
        {st?.topAct && st.effective[0] ? <div className="card fade"><span className="badge">{t('recT')}</span>
          <h3 style={{ margin: '12px 0 14px' }}>{t('helpedN', { a: st.effective[0][0] })}</h3>
          <button className="btn sm" onClick={() => onAgain(st.effective[0][0])}>{t('again')}</button></div> : null}
      </div>
      <h3>{t('qmT')}</h3>
      <div className="qm" style={{ marginTop: 12 }}>{E.QM.map(q => <Opt key={q[0]} on={false} onClick={() => onQuick(q[0])}><span className="e">{q[1]}</span>{t('qm_' + q[0])}</Opt>)}</div>
    </div>
    <section id="how"><div className="wrap"><h2 className="rv">{t('how')}</h2><div className="grid3">
      {[1, 2, 3].map(i => <div className="card rv" key={i} style={{ transitionDelay: `${i * 0.08}s` }}><div className="num">0{i}</div><h3>{t(`c${i}t`)}</h3><p style={{ color: 'var(--mut)', margin: 0 }}>{t(`c${i}d`)}</p></div>)}
    </div></div></section>
    <section><div className="wrap"><h2 className="rv">{t('diffT')}</h2><p className="big rv">{t('diffB')}</p>
      <div className="cmp rv"><div className="card"><span className="badge" style={{ color: 'var(--mut)', background: 'var(--line)' }}>{t('trad')}</span><div className="flow" style={{ marginTop: 16 }}>{t('workout')} <span>↓</span> {t('user')}</div></div>
        <div className="card" style={{ borderColor: 'var(--acc)' }}><span className="badge">MOODMOVE</span><div className="flow" style={{ marginTop: 16 }}>{t('f1')}<span>↓</span>{t('f2')}<span>↓</span>{t('f3')}<span>↓</span>{t('f4')}<span>↓</span>{t('f5')}</div></div></div></div></section>
  </>)
}

function CheckIn({ t, step, setStep, p, setP, det, setDet, onBack, onNext, toast }) {
  const [text, setText] = useState(''), [qz, setQz] = useState(null)
  const set = o => setP(x => ({ ...x, ...o }))
  const analyze = () => {
    if (!text.trim()) return toast(t('wfirst'))
    const d = E.analyze(text); setDet(d)
    set({ ...(d.mood && { mood: d.mood, energy: d.energy }), ...(d.time && { time: d.time }), ...(d.loc && { loc: d.loc }), ...(d.restr.length && { restr: [...new Set([...p.restr, ...d.restr])] }) })
    if (d.mood) toast(t('det_ok'))
  }
  const answer = a => {
    const n = [...qz, a]
    if (n.length < 3) return setQz(n)
    const r = E.quiz(n); set({ mood: r.mood, energy: r.energy }); setQz(null); setStep(1)
  }
  const ok = step !== 0 || p.mood
  const L = ['q_b', 'q_m', 'q_w']
  return (
    <div className="wrap"><div className="flow-in fade" key={step + '' + (qz ? qz.length : 'x')}>
      <div className="prog"><span>0{step + 1} / 05</span><div className="bar" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={5}><i style={{ width: `${(step + 1) * 20}%` }} /></div></div>
      {step === 0 && qz && (<><p style={{ color: 'var(--mut)', margin: 0 }}>{t('qz_t')} · {qz.length + 1}/3</p><h2>{t(L[qz.length])}</h2>
        <div className="opts">{E.QZ[qz.length].map(a => <Opt key={a} on={false} onClick={() => answer(a)}>{t('o_' + a)}</Opt>)}</div>
        <button className="btn ghost" onClick={() => setQz(qz.length ? qz.slice(0, -1) : null)}>{t('back')}</button></>)}
      {step === 0 && !qz && (<><h2>{t('q1')}</h2><Moods t={t} sel={p.mood} onPick={m => set({ mood: m })} />
        <button className="btn ghost" onClick={() => setQz([])} style={{ marginBottom: 18 }}>{t('dk')}</button>
        <div className="card"><h3>{t('own')}</h3><p style={{ color: 'var(--mut)', margin: '0 0 10px', fontSize: 14 }}>{t('ownH')}</p>
          <textarea aria-label={t('own')} rows={2} value={text} onChange={e => setText(e.target.value)} placeholder={t('ph')} />
          <div className="row" style={{ marginTop: 12 }}><button className="btn sm ghost" onClick={analyze}>{t('analyze')}</button>
            {det && (det.mood || det.time || det.loc ? <span>{t('detected')} {det.mood && <span className="chip">{MOODS.find(m => m[0] === det.mood)[1]} {t('m_' + det.mood)}</span>}{det.time && <span className="chip">{det.time} {t('min')}</span>}{det.loc && <span className="chip">{t('loc_' + det.loc)}</span>}</span> : <span className="chip">{t('nodet')}</span>)}</div></div></>)}
      {step === 1 && (<><h2>{t('q2')}</h2><div className="card" style={{ margin: '22px 0' }}>
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>{t('en')}: {p.energy} / 10</div>
        <input type="range" min="1" max="10" value={p.energy} aria-label={t('en')} onChange={e => set({ energy: +e.target.value })} />
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--mut)', fontSize: 14 }}><span>1<br />{t('lo')}</span><span style={{ textAlign: 'center' }}>5<br />{t('mi')}</span><span style={{ textAlign: 'right' }}>10<br />{t('hi')}</span></div></div></>)}
      {step === 2 && (<><h2>{t('q3')}</h2><div className="opts">{[3, 5, 10, 20, 30].map(m => <Opt key={m} on={p.time === m} onClick={() => set({ time: m })}><span className="e" style={{ fontSize: 28 }}>{m}{m === 30 ? '+' : ''}</span>{t('min')}</Opt>)}</div>
        <button className="btn ghost" onClick={() => { set({ time: 3 }); onNext(true) }}>{t('few')}</button></>)}
      {step === 3 && (<><h2>{t('q4')}</h2><div className="opts">{Object.keys(LOC).map(k => <Opt key={k} on={p.loc === k} onClick={() => set({ loc: k })}><span className="e">{LOC[k].split(' ')[0]}</span>{t('loc_' + k)}</Opt>)}</div></>)}
      {step === 4 && (<><h2>{t('q5')}</h2><div className="opts">{['beginner', 'intermediate', 'advanced'].map(k => <Opt key={k} on={p.level === k} onClick={() => set({ level: k })}><b>{t('l_' + k)}</b><small>{t('ld_' + k)}</small></Opt>)}</div>
        <h3>{t('restT')}</h3><div className="row" style={{ marginTop: 10 }}>
          {['nojump', 'noeq', 'low', 'quiet', 'small'].map(k => <Opt key={k} style={{ padding: '10px 16px' }} on={p.restr.includes(k)} onClick={() => set({ restr: p.restr.includes(k) ? p.restr.filter(x => x !== k) : [...p.restr, k] })}>{t('r_' + k)}</Opt>)}
          <Opt style={{ padding: '10px 16px' }} on={!p.restr.length} onClick={() => set({ restr: [] })}>{t('rno')}</Opt></div></>)}
      {!qz && <div className="row"><button className="btn ghost" onClick={onBack}>{t('back')}</button><button className="btn" disabled={!ok} onClick={() => onNext()}>{step === 4 ? t('getm') : t('cont')}</button></div>}
    </div></div>)
}

function Rec({ t, act, p, ss, onBack, onAnother, onGo }) {
  const n = E.build(act, p.time).length
  return (
    <div className="wrap"><div className="flow-in fade" key={act.id}>
      <span className="badge">{t('match')}</span>
      <h1 style={{ fontSize: 'clamp(36px,7vw,64px)' }}>{act.n}</h1>
      <p style={{ fontWeight: 600, fontSize: 18, margin: 0 }}>{p.time} {t('min')} · {t('loc_' + p.loc)} · {t('i' + act.i)} {t('intL')}</p>
      <div className="card" style={{ margin: '22px 0', background: 'var(--acc2)', boxShadow: 'none' }}><h3>{t('whyT')}</h3><p style={{ margin: 0 }}>{E.why(act, p, ss, t)}</p></div>
      <h3>{t('sess')}</h3>
      {act.ex.map((x, i) => <div className="ex" key={x[0]}><b>0{i + 1}</b><div><b style={{ color: 'var(--ink)' }}>{x[0]}</b><div style={{ color: 'var(--mut)', fontSize: 14 }}>{x[1]}</div></div></div>)}
      <p style={{ color: 'var(--mut)' }}>{n > act.ex.length && t('rounds') + ' '}{t('equipL')}: {act.eq ? '✔' : t('none')} · {t('diffL')}: {t('l_' + ['', 'beginner', 'intermediate', 'advanced'][act.d])}</p>
      <div className="row"><button className="btn ghost" onClick={onBack}>{t('edit')}</button><button className="btn ghost" onClick={onAnother}>↻ {t('another')}</button><button className="btn" onClick={onGo}>{t('startS')}</button></div>
    </div></div>)
}

function Reflect({ t, eb, onSave }) {
  const [feel, setFeel] = useState(null), [ea, setEa] = useState(eb ?? 5), [note, setNote] = useState('')
  return (
    <div className="wrap"><div className="flow-in fade">
      <h2>{t('rq')}</h2>
      <div className="opts" role="group">{[[-1, '😖'], [0, '😐'], [1, '🙂'], [2, '😄']].map(([v, e]) => <Opt key={v} on={feel === v} onClick={() => setFeel(v)}><span className="e">{e}</span>{t('fe' + v)}</Opt>)}</div>
      <div className="card" style={{ marginBottom: 18 }}><div style={{ fontWeight: 700, fontSize: 18 }}>{t('enNow')}: {ea} / 10{eb != null && <span style={{ color: 'var(--mut)', fontWeight: 400 }}> ({eb} →)</span>}</div>
        <input type="range" min="1" max="10" value={ea} aria-label={t('enNow')} onChange={e => setEa(+e.target.value)} /></div>
      <label htmlFor="nt" style={{ fontWeight: 600 }}>{t('note')}</label><input type="text" id="nt" style={{ marginTop: 8 }} value={note} onChange={e => setNote(e.target.value)} />
      <div className="row"><button className="btn" disabled={feel === null} onClick={() => onSave({ feel, ea, note })}>{t('save')}</button></div>
    </div></div>)
}

export default function App() {
  const [S, setS] = useState(E.loadS)
  const [user, setUser] = useState(AU.currentUser)
  const [db, setDb] = useState(() => E.load(AU.currentUser()?.email))
  const [view, setView] = useState('home'), [step, setStep] = useState(0), [p, setP] = useState(null)
  const [det, setDet] = useState(null), [act, setAct] = useState(null), [skip, setSkip] = useState([])
  const [run, setRun] = useState(null), [sum, setSum] = useState(null), [last, setLast] = useState(null)
  const [msg, setMsg] = useState(''), [menu, setMenu] = useState(false), tm = useRef()
  const t = useMemo(() => mk(S.lang), [S.lang])
  const ss = useMemo(() => E.sessOf(db), [db]), st = useMemo(() => E.stats(db), [db]), ach = useMemo(() => E.unlocked(db), [db])
  const daily = useMemo(() => E.daily(db), [db])
  useEffect(() => { E.saveS(S); const r = document.documentElement; S.theme === 'system' ? r.removeAttribute('data-theme') : r.setAttribute('data-theme', S.theme); r.lang = S.lang }, [S])
  useEffect(() => { E.save(user?.email, db) }, [db, user])
  const toast = m => { setMsg(m); clearTimeout(tm.current); tm.current = setTimeout(() => setMsg(''), 2800) }
  const go = v => { setView(v); setMenu(false); window.scrollTo(0, 0) }
  const setPrefs = o => setDb(d => ({ ...d, prefs: { ...d.prefs, ...o } }))
  const base = () => ({ mood: null, energy: 5, ...db.prefs })
  const pick = (pp, sk) => { const r = E.recommend(pp, ss, sk); setAct(r.act); setSkip(r.skip) }
  const start = () => { setP(base()); setDet(null); setSkip([]); setStep(0); go('checkin') }
  const toHow = () => { go('home'); setTimeout(() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' }), 60) }
  const play = (ex, name, actId, mins, eb) => { setRun({ ex, name, actId, mins, eb }); go('play') }
  const quick = id => {
    if (id === 'reset') { setP(base()); return play(QUICK.map(x => ({ n: x[0], c: x[1], s: 30, r: 0, R: 1 })), '3-Minute Reset', 'quick', 3, null) }
    const cfg = E.QM.find(q => q[0] === id)[2], b = base(), pp = { ...b, ...cfg, restr: [...new Set([...b.restr, ...(cfg.restr || [])])] }
    setP(pp); pick(pp, []); go('rec')
  }
  const next = fast => {
    if (fast) return setStep(3)
    if (step < 4) return setStep(step + 1)
    setView('loading'); setTimeout(() => { pick(p, []); go('rec') }, 700)
  }
  const again = name => { const l = ss[ss.length - 1], a = A.find(x => x.n === name); if (!a) return; setP({ ...base(), mood: l?.mood || null, time: l?.time || db.prefs.time }); setAct(a); setSkip([a.id]); go('rec') }
  const startDaily = () => { setP(daily.p); setAct(daily.act); setSkip([daily.act.id]); go('rec') }
  const save = r => {
    const s = { t: Date.now(), mood: p?.mood || null, eBefore: run.eb, eAfter: r.ea, feel: r.feel, actId: run.actId, actName: run.name, dur: Math.max(1, Math.round(sum.sec / 60)), time: run.mins, loc: p?.loc, note: r.note }
    const nd = { ...db, sessions: [...db.sessions, s] }, b = E.unlocked(db), a = E.unlocked(nd).filter(x => !b.includes(x))
    setDb(nd); setLast({ eb: run.eb, ea: r.ea, feel: r.feel, nd })
    toast(S.notif.ach && a.length ? '🏆 ' + t('ach') + ': ' + a.map(x => t('a_' + x)).join(', ') : t('saved')); go('thanks')
  }
  const onAuth = (u, su) => {
    if (su) E.save(u.email, E.load(null))
    setUser(u); setDb(E.load(u.email)); toast(t('wel', { n: u.name })); go('home')
  }
  const logout = () => { AU.logOut(); setUser(null); setDb(E.load(null)); toast(t('bye')); go('home') }
  const clear = k => {
    if (k === 'w') setDb(d => ({ ...d, sessions: [] }))
    if (k === 'm') setDb(d => ({ ...d, sessions: d.sessions.map(x => ({ ...x, mood: null })) }))
    if (k === 'p') setDb(d => ({ ...d, prefs: { ...E.DEF } }))
    if (k === 'a') { setDb({ sessions: [], prefs: { ...E.DEF } }); setS(E.DS) }
    toast(t('cleared'))
  }
  const NAV = [['home', () => go('home')], ['how', toHow], ['find', start], ['ins', () => go('insights')], ['settings', () => go('settings')]]
  const doneNow = view === 'thanks' && last

  return (<>
    <nav aria-label="Main"><div className="wrap">
      <button className="logo" onClick={() => go('home')}><i />MoodMove</button>
      <div className="links">{NAV.map(n => <button key={n[0]} onClick={n[1]}>{t(n[0])}</button>)}</div>
      <div className="rgt">
        <button className="menu" aria-label={t('menu')} aria-expanded={menu} onClick={() => setMenu(!menu)}>☰</button>
        {user ? <><button className="av" aria-label={t('profile')} onClick={() => go('profile')}>{user.name[0].toUpperCase()}</button><button className="btn sm ghost" onClick={logout}>{t('logout')}</button></> : <button className="btn sm ghost" onClick={() => go('auth')}>{t('login')}</button>}
        <button className="btn sm" onClick={start}>{t('start')}</button>
      </div></div>
      {menu && <div className="mlinks">{NAV.map(n => <button key={n[0]} onClick={n[1]}>{t(n[0])}</button>)}
        {user ? <><button onClick={() => go('profile')}>{t('profile')}</button><button onClick={logout}>{t('logout')}</button></> : <button onClick={() => go('auth')}>{t('login')}</button>}</div>}
    </nav>
    <main>
      {view === 'home' && <Home t={t} st={st} daily={daily} notif={S.notif} onStart={start} onAgain={again} onQuick={quick} onDaily={startDaily} />}
      {view === 'auth' && <Auth t={t} onDone={onAuth} />}
      {view === 'profile' && <Profile t={t} user={user} db={db} st={st} ach={ach} setPrefs={setPrefs} onName={n => { AU.updateName(user.email, n); setUser({ ...user, name: n }); toast(t('ok')) }} onAuth={() => go('auth')} />}
      {view === 'settings' && <Settings t={t} S={S} setS={setS} db={db} setPrefs={setPrefs} onClear={clear} />}
      {view === 'checkin' && p && <CheckIn t={t} step={step} setStep={setStep} p={p} setP={setP} det={det} setDet={setDet} onBack={() => (step > 0 ? setStep(step - 1) : go('home'))} onNext={next} toast={toast} />}
      {view === 'loading' && <div className="wrap"><div className="flow-in fade" style={{ textAlign: 'center', paddingTop: 120 }}><div style={{ fontSize: 50 }}>✨</div><h2>{t('finding')}</h2></div></div>}
      {view === 'rec' && (act && p ? <Rec t={t} act={act} p={p} ss={ss} onBack={() => { setStep(4); go('checkin') }} onAnother={() => { pick(p, skip); toast(t('newAlt')) }} onGo={() => play(E.build(act, p.time), act.n, act.id, p.time, p.energy)} />
        : <div className="wrap"><div className="flow-in" style={{ textAlign: 'center' }}><h2>{t('errT')}</h2><button className="btn" onClick={start}>{t('cta')}</button></div></div>)}
      {view === 'play' && run && <Player ex={run.ex} name={run.name} t={t} onDone={s => { setSum(s); go('done') }} onQuit={() => go('home')} />}
      {view === 'done' && sum && <div className="wrap"><div className="flow-in fade" style={{ textAlign: 'center', paddingTop: 50 }}><div className="pop" style={{ fontSize: 76 }}>🎉</div><h2>{t('doneT')}</h2>
        <div className="card" style={{ maxWidth: 440, margin: '20px auto', textAlign: 'left' }}><h3>{t('sumT')}</h3>
          {[[t('sDur'), fmt(sum.sec)], [t('sEx'), `${sum.done} / ${sum.total}`], [t('sSk'), sum.skipped]].map(r => <div className="hist" key={r[0]}><span className="a">{r[0]}</span><b style={{ marginLeft: 'auto' }}>{r[1]}</b></div>)}</div>
        <div className="row" style={{ justifyContent: 'center' }}><button className="btn" onClick={() => go('reflect')}>{t('reflectB')}</button></div></div></div>}
      {view === 'reflect' && run && <Reflect t={t} eb={run.eb} onSave={save} />}
      {doneNow && <div className="wrap"><div className="flow-in fade" style={{ textAlign: 'center', paddingTop: 60 }}><div className="pop" style={{ fontSize: 60 }}>🌱</div><h2>{t('thanksT')}</h2>
        <div className="card" style={{ margin: '24px auto', maxWidth: 520, background: 'var(--acc2)' }}>
          {last.eb != null && last.ea > last.eb && <p style={{ margin: '0 0 8px', fontWeight: 700 }}>{t('impE', { a: last.eb, b: last.ea })}</p>}
          {last.feel >= 1 ? <p style={{ margin: '0 0 8px', fontWeight: 700 }}>{t('impF')}</p> : last.feel <= 0 && !(last.eb != null && last.ea > last.eb) ? <p style={{ margin: '0 0 8px' }}>{t('flat')}</p> : null}
          <b>{E.insight(last.nd, t)}</b></div>
        <div className="row" style={{ justifyContent: 'center' }}><button className="btn" onClick={() => go('insights')}>{t('ins')}</button><button className="btn ghost" onClick={start}>{t('find')}</button></div></div></div>}
      {view === 'insights' && <Insights db={db} t={t} lang={S.lang} ach={ach} onStart={start} />}
    </main>
    <footer><div className="wrap"><b style={{ color: 'var(--ink)' }}>MoodMove</b> — {t('tag')}<br /><br />
      <a role="link" tabIndex={0} onClick={toHow}>{t('how')}</a><a role="link" tabIndex={0} onClick={start}>{t('find')}</a><a role="link" tabIndex={0} onClick={() => go('insights')}>{t('ins')}</a>
      <a role="link" tabIndex={0} onClick={() => toast(t('privM'))}>Privacy</a><a role="link" tabIndex={0} onClick={() => go('settings')}>{t('settings')}</a>
      <p>{t('built')}</p><p>{t('disc')}</p></div></footer>
    {view !== 'play' && <button className="btn" id="q" onClick={() => quick('reset')}>⚡ {t('q3m')}</button>}
    <div id="toast" role="status" aria-live="polite" className={msg ? 'on' : ''}>{msg}</div>
  </>)
}
