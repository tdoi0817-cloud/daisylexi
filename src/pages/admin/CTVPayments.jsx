// src/pages/admin/CTVPayments.jsx
// Manage contributor applications + payment tracking
import { useState, useEffect } from 'react'
import { collection, getDocs, updateDoc, doc, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import AdminGuard from '../../components/admin/AdminGuard'

const AFFILIATE_RATE = 6
const PUBLISHER_RATE = 8

function fmt(n) {
  if (!n) return '0'
  if (n>=1000000) return (n/1000000).toFixed(1)+'M'
  if (n>=1000)    return (n/1000).toFixed(0)+'K'
  return String(n)
}
function fmtVnd(n) { return (n||0).toLocaleString('vi-VN')+'đ' }
function timeAgo(ts) {
  if (!ts) return '—'
  const d = ts?.toDate?ts.toDate():new Date(ts)
  const s = Math.floor((Date.now()-d)/1000)
  if (s<3600) return Math.floor(s/60)+'m ago'
  if (s<86400) return Math.floor(s/3600)+'h ago'
  return Math.floor(s/86400)+'d ago'
}

// ── Payment modal ─────────────────────────────────────────────────
function PayModal({ ctv, onClose, onPaid }) {
  const [amount,  setAmount]  = useState(ctv.pendingPay||0)
  const [method,  setMethod]  = useState('bank')
  const [note,    setNote]    = useState('')
  const [paying,  setPaying]  = useState(false)

  const pay = async () => {
    setPaying(true)
    try {
      await addDoc(collection(db,'payments'), {
        ctvId:   ctv.id,
        ctvName: ctv.name,
        amount, method, note,
        status: 'paid',
        paidAt: serverTimestamp(),
      })
      await updateDoc(doc(db,'ctvApplications',ctv.id), {
        totalPaid:   (ctv.totalPaid||0)+amount,
        pendingPay:  0,
        lastPaidAt:  serverTimestamp(),
      })
      onPaid()
      onClose()
    } finally { setPaying(false) }
  }

  const IS = { width:'100%', padding:'8px 12px', border:'1.5px solid #e2e8f0', borderRadius:9, fontSize:13, outline:'none', fontFamily:'inherit', boxSizing:'border-box' }
  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:16 }}>
      <div style={{ background:'#fff',borderRadius:18,width:'100%',maxWidth:440,padding:24,boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:20 }}>
          <div style={{ flex:1 }}>
            <h3 style={{ margin:0,fontSize:16,fontWeight:800 }}>💸 Pay {ctv.name}</h3>
            <p style={{ margin:0,fontSize:12,color:'#9ca3af' }}>Pending: {fmtVnd(ctv.pendingPay||0)}</p>
          </div>
          <button onClick={onClose} style={{ background:'none',border:'none',fontSize:20,color:'#9ca3af',cursor:'pointer' }}>×</button>
        </div>
        <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
          <div>
            <label style={{ fontSize:11,fontWeight:700,color:'#374151',display:'block',marginBottom:4 }}>Amount (đ)</label>
            <input type="number" value={amount} onChange={e=>setAmount(+e.target.value)} min={0} style={IS} />
            <div style={{ display:'flex',gap:6,marginTop:6,flexWrap:'wrap' }}>
              {[50000,100000,200000,500000].map(n=>(
                <button key={n} onClick={()=>setAmount(n)}
                  style={{ padding:'4px 10px',background:'#f1f5f9',border:'1px solid #e2e8f0',borderRadius:6,fontSize:11,fontWeight:600,cursor:'pointer' }}>
                  {n>=1000?n/1000+'K':n}đ
                </button>
              ))}
              <button onClick={()=>setAmount(ctv.pendingPay||0)}
                style={{ padding:'4px 10px',background:'#dcfce7',border:'1px solid #bbf7d0',borderRadius:6,fontSize:11,fontWeight:700,color:'#166534',cursor:'pointer' }}>
                Full ({fmtVnd(ctv.pendingPay||0)})
              </button>
            </div>
          </div>
          <div>
            <label style={{ fontSize:11,fontWeight:700,color:'#374151',display:'block',marginBottom:4 }}>Payment Method</label>
            <select value={method} onChange={e=>setMethod(e.target.value)} style={IS}>
              <option value="bank">🏦 Bank Transfer</option>
              <option value="momo">📱 MoMo</option>
              <option value="zalopay">💚 ZaloPay</option>
              <option value="cash">💵 Cash</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize:11,fontWeight:700,color:'#374151',display:'block',marginBottom:4 }}>Note</label>
            <input value={note} onChange={e=>setNote(e.target.value)} placeholder="Payment note..." style={IS} />
          </div>
          <button onClick={pay} disabled={paying||amount<=0}
            style={{ padding:'11px',background:'linear-gradient(135deg,#059669,#10b981)',color:'#fff',border:'none',borderRadius:10,fontWeight:800,fontSize:14,cursor:'pointer',opacity:paying||amount<=0?0.6:1 }}>
            {paying?'Processing...':'✅ Confirm Payment'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
export default function CTVPayments() {
  const [tab, setTab]     = useState('applications')
  const [apps, setApps]   = useState([])
  const [pays, setPays]   = useState([])
  const [loading, setLoad]= useState(true)
  const [payModal, setPay]= useState(null)
  const [toast, setToast] = useState('')

  const showToast = (m,ms=3000) => { setToast(m); setTimeout(()=>setToast(''),ms) }

  const load = async () => {
    setLoad(true)
    const [a,p] = await Promise.all([
      getDocs(query(collection(db,'ctvApplications'),orderBy('createdAt','desc'))).catch(()=>({docs:[]})),
      getDocs(query(collection(db,'payments'),orderBy('paidAt','desc'))).catch(()=>({docs:[]})),
    ])
    setApps(a.docs.map(d=>({id:d.id,...d.data()})))
    setPays(p.docs.map(d=>({id:d.id,...d.data()})))
    setLoad(false)
  }

  useEffect(()=>{load()},[])

  const approve = async (id, role) => {
    await updateDoc(doc(db,'ctvApplications',id),{ status:'approved', approvedAt:serverTimestamp() })
    // Also set user role in users collection if userId exists
    const app = apps.find(a=>a.id===id)
    if (app?.userId) {
      await updateDoc(doc(db,'users',app.userId),{ role: role==='publisher'?'ctv':'reader', status:'approved' }).catch(()=>{})
    }
    await load(); showToast('✅ Application approved!')
  }

  const reject = async (id) => {
    await updateDoc(doc(db,'ctvApplications',id),{ status:'rejected' })
    await load(); showToast('❌ Application rejected.')
  }

  const pending  = apps.filter(a=>a.status==='pending')
  const approved = apps.filter(a=>a.status==='approved')
  const totalPending = approved.reduce((s,a)=>s+(a.pendingPay||0),0)
  const totalPaid    = pays.reduce((s,p)=>s+(p.amount||0),0)

  const StatusBadge = ({status}) => {
    const cfg={pending:{bg:'#fef9ec',c:'#92400e',l:'⏳ Pending'},approved:{bg:'#dcfce7',c:'#166534',l:'✅ Approved'},rejected:{bg:'#fef2f2',c:'#ef4444',l:'❌ Rejected'}}
    const v=cfg[status]||cfg.pending
    return <span style={{fontSize:10,fontWeight:700,padding:'2px 9px',borderRadius:20,background:v.bg,color:v.c,whiteSpace:'nowrap'}}>{v.l}</span>
  }

  return (
    <AdminGuard require="admin">
      <div style={{ maxWidth:900 }}>
        {toast && <div style={{ position:'fixed',bottom:24,left:'50%',transform:'translateX(-50%)',background:'#1e293b',color:'#fff',padding:'10px 22px',borderRadius:30,fontSize:13,fontWeight:700,zIndex:9999 }}>{toast}</div>}

        <h2 style={{ margin:'0 0 4px',fontSize:20,fontWeight:800 }}>💸 CTV Management & Payments</h2>
        <p style={{ margin:'0 0 18px',fontSize:13,color:'#6b7280' }}>Manage contributor applications and payment tracking</p>

        {/* KPIs */}
        <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:20 }}>
          {[
            { l:'Total CTVs',    v:approved.length,         i:'✍️', bg:'#ede9fe', c:'#6d28d9' },
            { l:'Pending Review',v:pending.length,           i:'⏳', bg:'#fef9ec', c:'#92400e', alert:pending.length>0 },
            { l:'Unpaid Amount', v:fmtVnd(totalPending),     i:'💰', bg:'#fef2f2', c:'#ef4444' },
            { l:'Total Paid',    v:fmtVnd(totalPaid),        i:'✅', bg:'#dcfce7', c:'#166534' },
          ].map(s=>(
            <div key={s.l} style={{ background:s.bg,borderRadius:12,padding:'14px 12px',border:s.alert?`2px solid ${s.c}30`:'2px solid transparent' }}>
              <div style={{ fontSize:20,marginBottom:4 }}>{s.i}</div>
              <div style={{ fontSize:s.l==='Unpaid Amount'||s.l==='Total Paid'?13:22,fontWeight:800,color:s.c }}>{s.v}</div>
              <div style={{ fontSize:11,color:s.c,opacity:0.8 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Pending alert */}
        {pending.length>0 && (
          <div style={{ background:'#fef9ec',border:'1.5px solid #fde68a',borderRadius:12,padding:'12px 16px',marginBottom:16,display:'flex',alignItems:'center',gap:12 }}>
            <span style={{ fontSize:20 }}>⏳</span>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:800,fontSize:13,color:'#92400e' }}>{pending.length} application{pending.length>1?'s':''} waiting for review</div>
              <div style={{ fontSize:12,color:'#a16207' }}>New signups from the Contributors page</div>
            </div>
            <button onClick={()=>setTab('applications')}
              style={{ background:'#f59e0b',color:'#fff',border:'none',borderRadius:8,padding:'7px 14px',fontWeight:800,fontSize:12,cursor:'pointer' }}>
              Review →
            </button>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display:'flex',background:'#f1f5f9',borderRadius:12,padding:3,marginBottom:18 }}>
          {[['applications',`📋 Applications (${apps.length})`],['payments',`💸 Payments (${pays.length})`],['approved',`✅ Active CTVs (${approved.length})`]].map(([k,l])=>(
            <button key={k} onClick={()=>setTab(k)}
              style={{ flex:1,padding:'9px 6px',border:'none',borderRadius:10,cursor:'pointer',fontWeight:800,fontSize:12,whiteSpace:'nowrap',background:tab===k?'#fff':'transparent',color:tab===k?'#6366f1':'#6b7280',boxShadow:tab===k?'0 1px 4px rgba(0,0,0,0.1)':'none' }}>
              {l}
            </button>
          ))}
        </div>

        {/* ── APPLICATIONS ── */}
        {tab==='applications' && (
          <div style={{ background:'#fff',borderRadius:14,border:'1px solid #e8eaf0',overflow:'hidden' }}>
            <div style={{ background:'#f8fafc',padding:'10px 16px',borderBottom:'1px solid #f1f5f9',display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr 140px',fontSize:10,fontWeight:700,color:'#9ca3af',letterSpacing:0.5 }}>
              {['Applicant','Role','Status','Applied','Actions'].map(h=><div key={h}>{h}</div>)}
            </div>
            {loading ? <div style={{ textAlign:'center',padding:40,color:'#9ca3af' }}>Loading...</div>
            : apps.length===0 ? <div style={{ textAlign:'center',padding:'32px',color:'#9ca3af',fontSize:13 }}>No applications yet. Share the /ctv page!</div>
            : apps.map(a=>(
              <div key={a.id} style={{ display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr 140px',padding:'12px 16px',borderBottom:'1px solid #f8fafc',alignItems:'center' }}>
                <div>
                  <div style={{ fontWeight:700,fontSize:13 }}>{a.name||'—'}</div>
                  <div style={{ fontSize:11,color:'#9ca3af' }}>{a.email}</div>
                  {a.channel&&<div style={{ fontSize:11,color:'#6366f1',marginTop:2 }}>{a.channel}</div>}
                  {a.note&&<div style={{ fontSize:11,color:'#6b7280',marginTop:2,fontStyle:'italic' }}>"{a.note.slice(0,60)}{a.note.length>60?'...':''}"</div>}
                </div>
                <div><span style={{ fontSize:12,fontWeight:700,padding:'3px 10px',borderRadius:20,background:a.role==='publisher'?'#ede9fe':'#dcfce7',color:a.role==='publisher'?'#6d28d9':'#166534' }}>{a.role||'—'}</span></div>
                <div><StatusBadge status={a.status} /></div>
                <div style={{ fontSize:11,color:'#9ca3af' }}>{timeAgo(a.createdAt)}</div>
                <div style={{ display:'flex',gap:5 }}>
                  {a.status==='pending' && <>
                    <button onClick={()=>approve(a.id,a.role)}
                      style={{ padding:'5px 10px',background:'#dcfce7',border:'none',borderRadius:7,fontSize:11,fontWeight:700,color:'#166534',cursor:'pointer' }}>✅ Approve</button>
                    <button onClick={()=>reject(a.id)}
                      style={{ padding:'5px 8px',background:'#fef2f2',border:'none',borderRadius:7,fontSize:11,color:'#ef4444',cursor:'pointer' }}>❌</button>
                  </>}
                  {a.status==='approved' && (
                    <button onClick={()=>setPay(a)}
                      style={{ padding:'5px 10px',background:'linear-gradient(135deg,#059669,#10b981)',border:'none',borderRadius:7,fontSize:11,fontWeight:700,color:'#fff',cursor:'pointer' }}>💸 Pay</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── PAYMENT HISTORY ── */}
        {tab==='payments' && (
          <div style={{ background:'#fff',borderRadius:14,border:'1px solid #e8eaf0',overflow:'hidden' }}>
            <div style={{ background:'#f8fafc',padding:'10px 16px',borderBottom:'1px solid #f1f5f9',display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr',fontSize:10,fontWeight:700,color:'#9ca3af' }}>
              {['CTV','Amount','Method','Date'].map(h=><div key={h}>{h}</div>)}
            </div>
            {pays.length===0 ? <div style={{ textAlign:'center',padding:'32px',color:'#9ca3af',fontSize:13 }}>No payments recorded yet.</div>
            : pays.map(p=>(
              <div key={p.id} style={{ display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr',padding:'11px 16px',borderBottom:'1px solid #f8fafc',alignItems:'center' }}>
                <div style={{ fontWeight:600,fontSize:13 }}>{p.ctvName}</div>
                <div style={{ fontWeight:800,color:'#16a34a',fontSize:14 }}>{fmtVnd(p.amount)}</div>
                <div style={{ fontSize:12,color:'#6b7280',textTransform:'capitalize' }}>{p.method}</div>
                <div style={{ fontSize:11,color:'#9ca3af' }}>{timeAgo(p.paidAt)}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── ACTIVE CTVs ── */}
        {tab==='approved' && (
          <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
            {approved.length===0 ? <div style={{ textAlign:'center',padding:'32px',color:'#9ca3af',background:'#f8fafc',borderRadius:12,fontSize:13 }}>No approved CTVs yet.</div>
            : approved.map(a=>(
              <div key={a.id} style={{ background:'#fff',border:'1px solid #e8eaf0',borderRadius:12,padding:'14px 16px',display:'flex',alignItems:'center',gap:14 }}>
                <div style={{ width:44,height:44,borderRadius:'50%',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:800,fontSize:16,flexShrink:0 }}>
                  {a.name?.[0]||'?'}
                </div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontWeight:700,fontSize:14 }}>{a.name}</div>
                  <div style={{ fontSize:12,color:'#9ca3af' }}>{a.email} · {a.role}</div>
                </div>
                <div style={{ textAlign:'right',flexShrink:0 }}>
                  <div style={{ fontSize:12,color:'#9ca3af' }}>Total paid</div>
                  <div style={{ fontWeight:800,color:'#166534' }}>{fmtVnd(a.totalPaid||0)}</div>
                </div>
                <div style={{ textAlign:'right',flexShrink:0 }}>
                  <div style={{ fontSize:12,color:'#9ca3af' }}>Pending</div>
                  <div style={{ fontWeight:800,color:'#ef4444' }}>{fmtVnd(a.pendingPay||0)}</div>
                </div>
                <button onClick={()=>setPay(a)}
                  style={{ padding:'8px 16px',background:'linear-gradient(135deg,#059669,#10b981)',border:'none',borderRadius:9,fontWeight:800,fontSize:12,color:'#fff',cursor:'pointer' }}>
                  💸 Pay
                </button>
              </div>
            ))}
          </div>
        )}

        {payModal && <PayModal ctv={payModal} onClose={()=>setPay(null)} onPaid={()=>{load();showToast('✅ Payment recorded!')}} />}
      </div>
    </AdminGuard>
  )
}
