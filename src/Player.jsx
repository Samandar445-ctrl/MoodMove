import { useState, useEffect, useRef } from 'react'
const REST = 8
const fmt = s => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0')

export default function Player({ ex, name, t, onDone, onQuit }) {
  const [i, setI] = useState(0), [rest, setRest] = useState(false), [left, setLeft] = useState(ex[0].s), [run, setRun] = useState(true)
  const sec = useRef(0), sk = useRef(0), mx = useRef(0)
  const e = ex[i], nx = ex[i + 1]
  const fin = () => onDone({ sec: sec.current, skipped: sk.current, done: Math.min(ex.length, mx.current), total: ex.length })
  const go = n => { if (n >= ex.length) return fin(); if (n < 0) n = 0; mx.current = Math.max(mx.current, n); setI(n); setRest(false); setLeft(ex[n].s); setRun(true) }
  useEffect(() => { if (!run) return; const id = setInterval(() => { sec.current++; setLeft(l => l - 1) }, 1000); return () => clearInterval(id) }, [run])
  useEffect(() => {
    if (left > 0) return
    if (rest) go(i + 1)
    else if (i >= ex.length - 1) { mx.current = ex.length; fin() }
    else { setRest(true); setLeft(REST) }
  }, [left])
  const total = rest ? REST : e.s
  return (
    <div className="wrap"><div className="flow-in" style={{ textAlign: 'center' }}>
      <div className="prog"><span>{t('exN', { a: i + 1, b: ex.length })}</span>
        <div className="bar" role="progressbar" aria-valuenow={Math.round((1 - left / total) * 100)} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${(1 - left / total) * 100}%` }} /></div></div>
      <div className="fade" key={i + '' + rest}>
        <p style={{ color: 'var(--mut)', margin: '20px 0 0' }}>{name}{e.r && !rest ? ' · ' + t('round', { a: e.r, b: e.R }) : ''}</p>
        <h2 style={{ fontSize: 'clamp(30px,6vw,52px)' }}>{rest ? '😮‍💨 ' + t('rest') : e.n}</h2>
        <p style={{ color: 'var(--mut)', minHeight: 24 }}>{rest ? t('nextU', { n: nx.n }) : e.c}</p>
      </div>
      <div className="tm" role="timer">{fmt(Math.max(left, 0))}</div>
      <p style={{ color: 'var(--mut)' }}>{!rest && (nx ? t('nextU', { n: nx.n }) : t('last'))}</p>
      <div className="row" style={{ justifyContent: 'center' }}>
        <button className="btn ghost" disabled={i === 0} onClick={() => go(i - 1)}>← {t('prev')}</button>
        <button className="btn" onClick={() => setRun(!run)}>{run ? t('pause') : t('resume')}</button>
        <button className="btn ghost" onClick={() => { sk.current++; go(i + 1) }}>{t('skip')}</button>
        <button className="btn ghost" onClick={() => go(i + 1)}>{t('next')} →</button>
      </div>
      <div className="row" style={{ justifyContent: 'center' }}>
        <button className="btn sm ghost" onClick={() => { mx.current = Math.max(mx.current, i); fin() }}>{t('finish')}</button>
        <button className="btn sm ghost" onClick={() => window.confirm(t('endC')) && onQuit()}>✕</button>
      </div>
    </div></div>)
}
