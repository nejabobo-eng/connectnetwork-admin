'use client'
import {useState} from 'react'
const roles=['Customer','Supplier','Entrepreneur','Developer','Investor','Government or municipality','Business partner','Researcher']
export default function Testing(){
 const [records,setRecords]=useState<{role:string;reference:string}[]>([])
 const [role,setRole]=useState(roles[0])
 return <main style={{maxWidth:800,margin:'40px auto',padding:24}}>
 <h1>Isolated reporting test</h1><p>Synthetic records only. No production database, personal information, payments or email dispatch. Records reset on reload.</p>
 <label>Test module <select value={role} onChange={e=>setRole(e.target.value)}>{roles.map(r=><option key={r}>{r}</option>)}</select></label>
 <button onClick={()=>setRecords(old=>[...old,{role,reference:'TEST-'+(old.length+1)}])}>Create synthetic test submission</button>
 <button onClick={()=>setRecords([])}>Clear test records</button>
 <h2>Test reporting</h2><p>Total synthetic submissions: {records.length}</p>
 <ul>{roles.map(r=><li key={r}>{r}: {records.filter(x=>x.role===r).length}</li>)}</ul>
 <h2>Test references</h2><ul>{records.map(r=><li key={r.reference}>{r.reference}: {r.role}</li>)}</ul>
 </main>
}
