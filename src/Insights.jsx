import { useState, useEffect } from 'react'
import { stats, ACH } from './engine.js'
import { ml } from './i18n.js'

export const Ach = ({ ids, t }) => (
  <div className="ach">{ACH.map(a => <div key={a[0]} className={ids.includes(a[0]) ? '' : 'off'}><span style={{ fontSize: 26, display: 'block' }}>{a[1]}</span>{t('a_' + a[0])}</div>)}</div>)

export default function Insights({ db, t, lang, ach, onStart }) {
  const [on, setOn] = useState(false)
  useEffect(() => { const x = setTimeout(() => setOn(true), 60); return () => clearTimeout(x) }, [])
  const st = stats(db)
  if (!st) return (
    <div className="wrap"><div className="flow-in fade" style={{ textAlign: 'center', paddingTop: 80 }}>
      <div style={{ fontSize: 60 }}>🌤️</div><h2>{t('emptyT')}</h2><p className="lead" style={{ margin: '0 auto' }}>{t('emptyD')}</p>
      <div className="row" style={{ justifyContent: 'center' }}><button className="btn" onClick={onStart}>{t('cta')}</button></div></div></div>)
  const mxW = Math.max(1, ...st.week.map(w => w.n)), mxB = Math.max(1, ...st.ba), mxM = Math.max(1, ...Object.values(st.moods))
  const dl = st.en.length ? st.en.reduce((a, x) => a + (x.eAfter - x.eBefore), 0) / st.en.length : null
  const S = ({ v, l }) => <div className="card"><b>{v}</b><span>{l}</span></div>
  return (
    <div className="wrap"><div className="flow-in fade" style={{ maxWidth: 900 }}>
      <h2>{t('insT')}</h2>
      <div className="stats" style={{ margin: '22px 0' }}>
        <S v={st.n} l={t('tot')} /><S v={`${st.min} ${t('min')}`} l={t('totMin')} /><S v={`${st.cur} ${t('d')}`} l={t('cur')} /><S v={`${st.best} ${t('d')}`} l={t('bestS')} />
        <S v={`${st.avg} ${t('min')}`} l={t('avg')} /><S v={st.mood ? ml(t, st.mood) : '—'} l={t('topM')} /><S v={<span style={{ fontSize: 18 }}>{st.topAct}</span>} l={t('topA')} /><S v={st.nActs} l={t('varT')} /></div>
      <div className="two">
        <div className="card"><h3>{t('weekT')}</h3><div className="wk">{st.week.map(w => <div key={w.d}><i style={{ height: on ? `${(w.n / mxW) * 90}px` : 0 }} />{w.n || ''}<br />{new Date(w.d).toLocaleDateString(lang, { weekday: 'short' })}</div>)}</div></div>
        <div className="card"><h3>{t('baT')}</h3>{st.ba.map((v, i) => <div className="mb" key={i}><span style={{ width: 100 }}>{t('fe' + (i - 1))}</span><i style={{ width: on ? `${(v / mxB) * 55}%` : 0 }} /><b>{v}</b></div>)}</div>
        <div className="card"><h3>{t('effT')}</h3>{st.effective.length ? st.effective.map(e => <div className="hist" key={e[0]}><b>{e[0]}</b><span className="a">({e[2]}×)</span></div>) : <p style={{ color: 'var(--mut)' }}>{t('need')}</p>}</div>
        <div className="card"><h3>{t('enT')}</h3>{dl != null ? <><p style={{ margin: '0 0 8px', fontWeight: 600 }}>{t('enAvg', { n: (dl > 0 ? '+' : '') + dl.toFixed(1) })}</p>{st.en.slice(-6).map(x => <div className="hist" key={x.t}>{x.eBefore} → {x.eAfter} <span className="a">· {x.actName}</span></div>)}</> : <p style={{ color: 'var(--mut)' }}>{t('need')}</p>}</div>
        <div className="card"><h3>{t('topM')}</h3>{Object.entries(st.moods).map(([k, v]) => <div className="mb" key={k}><span style={{ width: 120 }}>{ml(t, k)}</span><i style={{ width: on ? `${(v / mxM) * 50}%` : 0 }} /><b>{v}</b></div>)}{!st.nMoods && <p style={{ color: 'var(--mut)' }}>{t('need')}</p>}</div>
        <div className="card"><h3>{t('varT')}</h3><p style={{ margin: 0 }}>{t('nActs', { n: st.nActs })}</p></div></div>
      <h3 style={{ marginTop: 28 }}>{t('achT')}</h3><Ach ids={ach} t={t} />
      <h3 style={{ marginTop: 28 }}>{t('hist')}</h3>
      <div className="card">{db.sessions.slice().reverse().slice(0, 8).map(x => <div className="hist" key={x.t}><span>{x.mood ? ml(t, x.mood) : '⚡'}</span><span className="a">→</span><span>{x.actName}</span><span className="a">→</span><span>{x.feel != null ? ['😖', '😐', '🙂', '😄'][x.feel + 1] : x.helped === 'yes' ? '🙂' : '😐'}</span></div>)}</div>
      <div className="row"><button className="btn" onClick={onStart}>{t('cta')}</button></div>
    </div></div>)
}
