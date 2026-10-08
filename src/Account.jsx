import { useState } from 'react'
import { R, LOC, LV } from './data.js'
import { LANGS } from './i18n.js'
import { signUp, logIn } from './auth.js'
import { Ach } from './Insights.jsx'

const Chip = ({ on, onClick, children }) => <button type="button" className="opt" style={{ padding: '8px 14px' }} aria-pressed={on} onClick={onClick}>{children}</button>
const Sw = ({ on, onChange, children }) => <label className="sw"><input type="checkbox" role="switch" checked={on} onChange={e => onChange(e.target.checked)} />{children}</label>

export function Auth({ t, onDone }) {
  const [mode, setMode] = useState('login'), [f, setF] = useState({ name: '', email: '', pw: '', pw2: '', rem: true })
  const [show, setShow] = useState(false), [err, setErr] = useState(''), [busy, setBusy] = useState(false)
  const su = mode === 'signup'
  const up = k => e => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  const submit = async e => {
    e.preventDefault(); setErr('')
    if (su && f.name.trim().length < 2) return setErr(t('eName'))
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) return setErr(t('eEmail'))
    if (f.pw.length < 6) return setErr(t('ePw'))
    if (su && f.pw !== f.pw2) return setErr(t('eMatch'))
    setBusy(true); const r = su ? await signUp(f) : await logIn(f); setBusy(false)
    if (r.err) return setErr(t(r.err))
    onDone(r.user, su)
  }
  const type = show ? 'text' : 'password'
  return (
    <div className="wrap"><div className="flow-in fade" style={{ maxWidth: 440 }}>
      <h2>{su ? t('signupT') : t('loginT')}</h2>
      <form className="card" onSubmit={submit} noValidate>
        {su && <div className="fld"><label htmlFor="n">{t('name')}</label><input id="n" type="text" autoComplete="name" value={f.name} onChange={up('name')} /></div>}
        <div className="fld"><label htmlFor="e">{t('email')}</label><input id="e" type="email" autoComplete="email" value={f.email} onChange={up('email')} /></div>
        <div className="fld"><label htmlFor="p">{t('pw')}</label><div className="pwr"><input id="p" type={type} autoComplete={su ? 'new-password' : 'current-password'} value={f.pw} onChange={up('pw')} />
          <button type="button" className="btn sm ghost" onClick={() => setShow(!show)} aria-pressed={show}>{show ? t('hide') : t('show')}</button></div></div>
        {su && <div className="fld"><label htmlFor="p2">{t('pw2')}</label><input id="p2" type={type} autoComplete="new-password" value={f.pw2} onChange={up('pw2')} /></div>}
        <Sw on={f.rem} onChange={v => setF({ ...f, rem: v })}>{t('rem')}</Sw>
        {err && <div className="msg err" role="alert">{err}</div>}
        <button className="btn" disabled={busy} style={{ width: '100%' }}>{su ? t('signup') : t('login')}</button>
      </form>
      <p style={{ textAlign: 'center' }}><button className="btn ghost sm" onClick={() => { setMode(su ? 'login' : 'signup'); setErr('') }}>{su ? t('haveA') : t('noA')}</button></p>
      <p style={{ color: 'var(--mut)', fontSize: 14, textAlign: 'center' }}>{t('guest')}</p>
    </div></div>)
}

export function Prefs({ prefs, set, t }) {
  const tg = v => set({ restr: prefs.restr.includes(v) ? prefs.restr.filter(x => x !== v) : [...prefs.restr, v] })
  const H = ({ k }) => <h3 style={{ margin: '18px 0 8px', fontSize: 16 }}>{t(k)}</h3>
  return (<div>
    <H k="level" /><div className="row" style={{ marginTop: 0 }}>{Object.keys(LV).map(k => <Chip key={k} on={prefs.level === k} onClick={() => set({ level: k })}>{t('l_' + k)}</Chip>)}</div>
    <H k="dur" /><div className="row" style={{ marginTop: 0 }}>{[3, 5, 10, 20, 30].map(m => <Chip key={m} on={prefs.time === m} onClick={() => set({ time: m })}>{m} {t('min')}</Chip>)}</div>
    <H k="intensity" /><div className="row" style={{ marginTop: 0 }}>{[0, 1, 2, 3].map(v => <Chip key={v} on={prefs.intensity === v} onClick={() => set({ intensity: v })}>{t('i' + v)}</Chip>)}</div>
    <H k="loc" /><div className="row" style={{ marginTop: 0 }}>{Object.keys(LOC).map(k => <Chip key={k} on={prefs.loc === k} onClick={() => set({ loc: k })}>{LOC[k].split(' ')[0]} {t('loc_' + k)}</Chip>)}</div>
    <Sw on={prefs.equip} onChange={v => set({ equip: v })}>{t('equipT')}</Sw>
    <H k="restr" /><div className="row" style={{ marginTop: 0 }}>{Object.keys(R).map(k => <Chip key={k} on={prefs.restr.includes(k)} onClick={() => tg(k)}>{t('r_' + k)}</Chip>)}</div>
  </div>)
}

export function Profile({ t, user, db, st, ach, setPrefs, onName, onAuth }) {
  const [nm, setNm] = useState(user?.name || '')
  if (!user) return <div className="wrap"><div className="flow-in fade"><h2>{t('profT')}</h2><p style={{ color: 'var(--mut)' }}>{t('guest')}</p><button className="btn" onClick={onAuth}>{t('login')} / {t('signup')}</button><div className="card" style={{ marginTop: 20 }}><Prefs prefs={db.prefs} set={setPrefs} t={t} /></div></div></div>
  return (
    <div className="wrap"><div className="flow-in fade" style={{ maxWidth: 820 }}>
      <h2>{t('profT')}</h2>
      <div className="card"><div className="fld"><label htmlFor="pn">{t('name')}</label><div className="row" style={{ marginTop: 0 }}><input id="pn" type="text" value={nm} onChange={e => setNm(e.target.value)} style={{ flex: 1, minWidth: 160 }} /><button className="btn sm" disabled={nm.trim().length < 2 || nm.trim() === user.name} onClick={() => onName(nm.trim())}>{t('saveB')}</button></div></div>
        <p style={{ margin: 0, color: 'var(--mut)' }}>{t('email')}: <b style={{ color: 'var(--ink)' }}>{user.email}</b></p></div>
      <div className="stats" style={{ margin: '18px 0' }}><div className="card"><b>{st ? st.n : 0}</b><span>{t('doneW')}</span></div><div className="card"><b>{st ? st.cur : 0} {t('d')}</b><span>{t('cur')}</span></div><div className="card"><b>{st ? st.best : 0} {t('d')}</b><span>{t('bestS')}</span></div><div className="card"><b>{ach.length}/7</b><span>{t('achT')}</span></div></div>
      <div className="card"><h3>{t('prefT')}</h3><Prefs prefs={db.prefs} set={setPrefs} t={t} /></div>
      <h3 style={{ marginTop: 24 }}>{t('achT')}</h3><Ach ids={ach} t={t} />
    </div></div>)
}

export function Settings({ t, S, setS, db, setPrefs, onClear }) {
  const nt = (k, v) => setS({ ...S, notif: { ...S.notif, [k]: v } })
  return (
    <div className="wrap"><div className="flow-in fade" style={{ maxWidth: 820 }}>
      <h2>{t('setT')}</h2>
      <div className="card" style={{ marginBottom: 16 }}><h3>{t('appr')}</h3><div className="row" style={{ marginTop: 8 }}>{['system', 'light', 'dark', 'dusk', 'sand'].map(k => <Chip key={k} on={S.theme === k} onClick={() => setS({ ...S, theme: k })}>{t('th_' + k)}</Chip>)}</div></div>
      <div className="card" style={{ marginBottom: 16 }}><h3>{t('langT')}</h3><div className="row" style={{ marginTop: 8 }}>{LANGS.map(l => <Chip key={l[0]} on={S.lang === l[0]} onClick={() => setS({ ...S, lang: l[0] })}>{l[1]} {l[2]}</Chip>)}</div></div>
      <div className="card" style={{ marginBottom: 16 }}><h3>{t('prefT')}</h3><Prefs prefs={db.prefs} set={setPrefs} t={t} /></div>
      <div className="card" style={{ marginBottom: 16 }}><h3>{t('notT')}</h3>{[['daily', 'n_daily'], ['streak', 'n_streak'], ['ach', 'n_ach']].map(([k, l]) => <Sw key={k} on={S.notif[k]} onChange={v => nt(k, v)}>{t(l)}</Sw>)}</div>
      <div className="card"><h3>{t('privT')}</h3><div className="row" style={{ marginTop: 8 }}>{[['clrW', 'w'], ['clrM', 'm'], ['rstP', 'p'], ['rstA', 'a']].map(([l, k]) => <button key={k} className="btn sm ghost" onClick={() => window.confirm(t('conf')) && onClear(k)}>{t(l)}</button>)}</div></div>
    </div></div>)
}
