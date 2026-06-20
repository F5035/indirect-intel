'use client'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const C = { cyan:'#00d4ff', violet:'#7b61ff', green:'#00ff94', yellow:'#ffd60a', orange:'#ff6b35', red:'#ff4444' }
function slugify(n) { return n.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') }

const TRENDS_MAP = {
  'ai-infrastructure': { name:'AI Infrastructure', icon:'🤖', color:C.cyan, description:'Data centers, GPUs, networking and power infrastructure enabling artificial intelligence at scale.', companies:['NVIDIA','TSMC','AMD','Super Micro Computer','Vertiv Holdings','Equinix','Arista Networks','Broadcom','Arm Holdings','Corning'] },
  'space-economy': { name:'Space Economy', icon:'🚀', color:C.violet, description:'Commercial space launch, satellite broadband, space defense and in-space manufacturing.', companies:['Lockheed Martin','Northrop Grumman','RTX','Celestica','Amphenol'] },
  'defense-tech': { name:'Defense Tech', icon:'🛡️', color:C.orange, description:'Next-generation defense systems, AI-enabled surveillance and C4ISR.', companies:['Palantir','Lockheed Martin','Northrop Grumman','RTX','Broadcom'] },
  'semiconductors': { name:'Semiconductors', icon:'💾', color:C.yellow, description:'Chip design, fabrication, EDA tools and semiconductor equipment.', companies:['NVIDIA','TSMC','AMD','ASML','Lam Research','Applied Materials','Qualcomm','Arm Holdings','Cadence Design Systems','Synopsys'] },
  'data-centers': { name:'Data Centers', icon:'🏢', color:C.green, description:'Hyperscale and colocation data centers, power, cooling and infrastructure.', companies:['Equinix','Digital Realty','Iron Mountain','Vertiv Holdings','Eaton Corporation','Arista Networks'] },
  'nuclear-energy': { name:'Nuclear Energy', icon:'⚛️', color:C.cyan, description:'Nuclear power plants, SMRs and nuclear fuel for AI data center power demand.', companies:['Constellation Energy','Vistra Energy','Oklo','NuScale Power','GE Vernova'] },
}

export default function TrendPage() {
  const { slug } = useParams()
  const router = useRouter()
  const trend = TRENDS_MAP[slug]

  if (!trend) return (
    <div style={{minHeight:'100vh',background:'#060b14',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16}}>
      <div style={{fontSize:48}}>🔍</div>
      <div style={{fontSize:18,color:'#f0f6ff',fontWeight:700}}>Trend not found</div>
      <button onClick={()=>router.push('/')} style={{padding:'10px 24px',borderRadius:10,border:'none',background:`linear-gradient(90deg,${C.cyan},${C.violet})`,color:'#060b14',fontSize:13,fontWeight:700,cursor:'pointer'}}>← Back</button>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'#060b14'}}>
      <nav style={{background:'#060b14',borderBottom:'1px solid #0d1421',padding:'0 24px',height:52,display:'flex',alignItems:'center',gap:12}}>
        <button onClick={()=>router.push('/')} style={{padding:'5px 12px',borderRadius:7,border:'1px solid #1a2840',background:'transparent',color:'#4a5f80',fontSize:12,cursor:'pointer'}}>← Supply Alpha</button>
        <span style={{color:'#1a2840'}}>/</span>
        <span style={{fontSize:13,color:'#f0f6ff',fontWeight:600}}>{trend.icon} {trend.name}</span>
      </nav>
      <main style={{maxWidth:1200,margin:'0 auto',padding:'32px 24px'}}>
        <div style={{marginBottom:32}}>
          <div style={{fontSize:48,marginBottom:12}}>{trend.icon}</div>
          <h1 style={{fontSize:32,fontWeight:900,color:'#f0f6ff',marginBottom:8}}>{trend.name}</h1>
          <p style={{fontSize:15,color:'#8899bb',maxWidth:600,lineHeight:1.6}}>{trend.description}</p>
        </div>
        <div style={{marginBottom:20}}>
          <h2 style={{fontSize:14,fontWeight:700,color:'#f0f6ff',marginBottom:12}}>Companies in this ecosystem</h2>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
            {trend.companies.map(name => (
              <div key={name} onClick={()=>router.push(`/company/${slugify(name)}`)}
                style={{background:'#0d1421',border:'1px solid #1a2840',borderRadius:10,padding:14,cursor:'pointer',transition:'all .2s'}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=trend.color+'55'}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='#1a2840'}}>
                <div style={{width:36,height:36,borderRadius:9,background:trend.color+'18',border:`1px solid ${trend.color}44`,color:trend.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800,marginBottom:8}}>{name.substring(0,2).toUpperCase()}</div>
                <div style={{fontSize:13,fontWeight:600,color:'#f0f6ff'}}>{name}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{padding:'10px 14px',background:'#0a0f1a',border:'1px solid #1a2840',borderRadius:8,fontSize:10,color:'#4a5f80'}}>
          ⚠️ Not financial advice. For research purposes only.
        </div>
      </main>
    </div>
  )
}
