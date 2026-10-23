import React,{useEffect,useMemo,useRef,useState}from'react';
import{ArrowRight,Check,Users,Eye,RotateCcw,Copy,MonitorUp,Smartphone,Wifi,WifiOff}from'lucide-react';
import{supabase,configured}from'./supabase.js';

const PERSPECTIVES=['Clinical','Operations','Design','Engineering','Digital / IT','Facilities','Executive'];
const CAPABILITIES=[
 ['CONTINUOUS MONITORING','Sense changes and connect them to a clinical response.'],
 ['VIRTUAL CARE','Bring patients, families and care teams together across locations.'],
 ['INTELLIGENT COMMUNICATION','Route the right request to the right role.'],
 ['ADAPTABLE CARE','Support changing patient needs, equipment and care models.'],
 ['AUTOMATED SUPPORT','Move supplies, equipment and tasks through care delivery.'],
 ['LEARNING ENVIRONMENT','Measure, learn and adapt care and space over time.']
];
const FUTURES={
 'CONTINUOUS MONITORING':['Monitor something different','Respond differently','Extend monitoring beyond the room'],
 'VIRTUAL CARE':['Change who joins care','Change how the connection works','Extend care to more settings'],
 'INTELLIGENT COMMUNICATION':['Change who receives the request','Change how requests are routed','Add a new communication channel'],
 'ADAPTABLE CARE':['Care for different patient needs','Change the room setup','Change the unit-care model'],
 'AUTOMATED SUPPORT':['Change the equipment','Change the workflow','Expand the service'],
 'LEARNING ENVIRONMENT':['Measure something new','Use a new source of information','Change care based on what is learned']
};
const TRANSLATION={
 'CONTINUOUS MONITORING':[
  ['Sightlines, sensing zones and service access','Power/data, network coverage and resilience','Sensors, analytics and thresholds','Provide accessible sensing zones and pathways not tied to one device.'],
  ['Response visibility and team locations','Event routing, role context and downtime support','Escalation logic and team workflow','Separate response logic from one opening-day device model.'],
  ['Transition touchpoints and patient access','Enterprise identity and cross-setting exchange','Home devices and follow-up model','Support monitoring across hospital, home and ambulatory settings.']],
 'VIRTUAL CARE':[
  ['Privacy, lighting, sightlines and participant zones','Accessible AV, power/data and resilient connectivity','Cameras, displays and participant roles','Support multiple remote-participant configurations.'],
  ['Replaceable mounting and accessible interfaces','AV pathways, interoperability and network capacity','Platform, vendor and devices','Provide accessible AV pathways and replaceable interfaces.'],
  ['Private connection spaces and transition touchpoints','Enterprise identity and cross-setting connectivity','Care location and device mix','Define connectivity across hospital, ambulatory and home settings.']],
 'INTELLIGENT COMMUNICATION':[
  ['Private communication, controls and charging','Role directories, location context and nurse-call integration','Roles, coverage rules and endpoints','Separate role routing from people, devices and staffing assignments.'],
  ['Communication surfaces and escalation visibility','Messaging integration and acknowledgement logic','Routing and escalation rules','Define interoperable routing and acknowledgement requirements.'],
  ['Charging, private use and consistent controls','Wireless, telephony and shared directories','Endpoints, channels and policy','Require new channels to use shared routing and governance.']],
 'ADAPTABLE CARE':[
  ['Flexible clearances and bedside access','Power/data capacity and accessible services','Equipment, mounting and workflow','Test geometry against future patient and equipment scenarios.'],
  ['Modular mounting and reconfigurable work zones','Flexible connections and service access','Equipment layout and team positions','Support multiple room configurations.'],
  ['Team spaces, workflow zones and swing capacity','Communication coverage and support capacity','Assignments and staffing model','Evaluate units against multiple care-team models.']],
 'AUTOMATED SUPPORT':[
  ['Turning, doors, elevators and staging','Charging, connectivity and service capacity','Equipment model and orchestration','Validate future equipment envelopes, not only opening day.'],
  ['Staging, handoff zones and service flow','Controls, task status and fallback support','Handoffs and task sequence','Map staging and fallback workflows as explicit design inputs.'],
  ['Routes, elevators and distributed staging','Charging, network and controls capacity','Fleet and task volume','Test routes and infrastructure against a scaled scenario.']],
 'LEARNING ENVIRONMENT':[
  ['Observation zones and sensing locations','Data pathways, integration and asset information','Measures, sensors and study design','Provide accessible measurement zones for future questions.'],
  ['Service access and sensing zones','Governed exchange and shared definitions','Sources, sensors and definitions','Require governed integration for new data sources.'],
  ['Flexible room use and feedback into standards','Performance data and analytics access','Workflow, standards and priorities','Define an accountable path from evidence to design change.']]
};
const makeCode=()=>`ACHE-${Math.floor(100+Math.random()*900)}`;

function Shell({children,session,role,connected}){return <div className="app"><header><b>ACHE · AI + TECHNOLOGY</b><span>xPLAYER REALTIME 0.4.1</span><aside>{connected?<Wifi/>:<WifiOff/>}{session&&<i>{session.code}</i>}{role&&<em>{role}</em>}</aside></header><main>{children}</main><footer>Realtime MVP · Private voting · Facilitator-controlled reveal</footer></div>}

export default function App(){
 const[user,setUser]=useState(null),[connected,setConnected]=useState(false),[role,setRole]=useState(),[name,setName]=useState(''),[perspective,setPerspective]=useState('Clinical'),[code,setCode]=useState(''),[session,setSession]=useState(null),[participants,setParticipants]=useState([]),[responses,setResponses]=useState([]),[myParticipant,setMyParticipant]=useState(null),[selected,setSelected]=useState([]),[draftShared,setDraftShared]=useState([]),[draftConsensus,setDraftConsensus]=useState({}),[status,setStatus]=useState('');
 const channelRef=useRef(null);

 useEffect(()=>{if(!configured)return;supabase.auth.getSession().then(async({data})=>{let u=data.session?.user;if(!u){const r=await supabase.auth.signInAnonymously();u=r.data.user}setUser(u||null)})},[]);

 const refreshCollections=async sid=>{const[{data:p},{data:r}]=await Promise.all([supabase.from('xp_participants').select('*').eq('session_id',sid).order('created_at'),supabase.from('xp_responses').select('*').eq('session_id',sid)]);setParticipants(p||[]);setResponses(r||[])};

 useEffect(()=>{if(!session?.id||!user||!configured)return;const ch=supabase.channel('xplayer:'+session.id,{config:{presence:{key:user.id}}})
  .on('presence',{event:'sync'},()=>setConnected(true))
  .on('postgres_changes',{event:'UPDATE',schema:'public',table:'xp_sessions',filter:`id=eq.${session.id}`},payload=>payload.new&&setSession(current=>({...current,...payload.new})))
  .on('postgres_changes',{event:'*',schema:'public',table:'xp_participants',filter:`session_id=eq.${session.id}`},()=>refreshCollections(session.id))
  .on('postgres_changes',{event:'*',schema:'public',table:'xp_responses',filter:`session_id=eq.${session.id}`},()=>refreshCollections(session.id))
  .subscribe(async st=>{if(st==='SUBSCRIBED'){setConnected(true);await ch.track({userId:user.id,role,perspective,onlineAt:new Date().toISOString()})}});
  channelRef.current=ch;refreshCollections(session.id);return()=>supabase.removeChannel(ch)
 },[session?.id,user?.id,role,perspective]);

 useEffect(()=>{setSelected([]);setStatus('')},[session?.round_key]);

 const createSession=async()=>{if(!configured||!user)return;const c=makeCode();const{data,error}=await supabase.from('xp_sessions').insert({code:c,facilitator_id:user.id,phase:'lobby'}).select().single();if(error)return setStatus(error.message);setRole('facilitator');setCode(c);setSession(data)};
 const join=async()=>{if(!configured||!user||!name.trim())return;const{data:s,error}=await supabase.from('xp_sessions').select('*').eq('code',code.trim().toUpperCase()).single();if(error)return setStatus('Session not found. Check the code.');const{data:p,error:pe}=await supabase.from('xp_participants').upsert({session_id:s.id,user_id:user.id,display_name:name.trim(),perspective},{onConflict:'session_id,user_id'}).select().single();if(pe)return setStatus(pe.message);setRole('participant');setSession(s);setMyParticipant(p)};
 const updateSession=async patch=>{setSession(current=>({...current,...patch}));const{data,error}=await supabase.from('xp_sessions').update(patch).eq('id',session.id).select().single();if(error){setStatus(error.message);return false}if(data)setSession(data);return true};
 const submit=async()=>{if(!myParticipant)return;const{error}=await supabase.from('xp_responses').upsert({session_id:session.id,participant_id:myParticipant.id,round_key:session.round_key,selections:selected},{onConflict:'session_id,participant_id,round_key'});if(error)return setStatus(error.message);setStatus('Vote submitted. Waiting for the facilitator.')};

 const roundResponses=responses.filter(r=>r.round_key===session?.round_key);
 const counts=useMemo(()=>{const c={};roundResponses.forEach(r=>(r.selections||[]).forEach(x=>c[x]=(c[x]||0)+1));return c},[responses,session?.round_key]);
 const submitted=new Set(roundResponses.map(r=>r.participant_id)).size;

 if(!configured)return <Shell connected={false}><div className="setup"><h1>Connect Supabase to start xPlayer.</h1><p>Add the Vite environment variables from <code>.env.example</code>.</p></div></Shell>;
 if(!session)return <Shell connected={Boolean(user)}><div className="eyebrow">DESIGNING FOR WHAT COMES NEXT</div><h1>Future readiness is a shared decision.</h1><div className="entry"><section><Smartphone/><h2>I'm participating</h2><input placeholder="SESSION CODE" value={code} onChange={e=>setCode(e.target.value.toUpperCase())}/><input placeholder="NAME / INITIALS" value={name} onChange={e=>setName(e.target.value)}/><select value={perspective} onChange={e=>setPerspective(e.target.value)}>{PERSPECTIVES.map(x=><option key={x}>{x}</option>)}</select><button disabled={!user||!name||!code} onClick={join}>Join session</button></section><section><MonitorUp/><h2>I'm facilitating</h2><p>Create a live session. Participants join with a code and vote privately.</p><button disabled={!user} onClick={createSession}>Create session</button></section></div>{status&&<p className="error">{status}</p>}</Shell>;
 if(session.phase==='lobby')return <Shell session={session} role={role} connected={connected}><h1>{role==='facilitator'?'Your session is ready.':'You joined the session.'}</h1><div className="roster"><div><Users/><b>{participants.length}</b><span>participants connected or joined</span></div>{participants.map(p=><article key={p.id}><i>{p.display_name.slice(0,2).toUpperCase()}</i><span>{p.display_name}</span><small>{p.perspective}</small><Check/></article>)}</div>{role==='facilitator'?<button onClick={()=>updateSession({phase:'capability',round_key:'capability',voting_open:true,revealed:false})}>Open Round 1 <ArrowRight/></button>:<p className="waiting">Waiting for facilitator to open voting.</p>}</Shell>;

 if(session.phase==='brief')return <BriefScreen session={session} role={role} connected={connected}/>;

 const capabilityRound=session.phase==='capability';
 const futureIndex=capabilityRound?0:Number((session.round_key||'future:0').split(':')[1]||0);
 const sharedCaps=session.shared_capabilities||[];
 const activeCapability=sharedCaps[Math.min(futureIndex,Math.max(0,sharedCaps.length-1))];
 const options=capabilityRound?CAPABILITIES.map(x=>x[0]):FUTURES[activeCapability]||[];

 return <Shell session={session} role={role} connected={connected}><div className="eyebrow">{capabilityRound?'ROUND 1 · CAPABILITIES':`ROUND 2 · FUTURE CARE · ${futureIndex+1} OF ${sharedCaps.length}`}</div><h1>{capabilityRound?'What should the patient room enable?':activeCapability}</h1>{role==='participant'?<ParticipantRound options={options} capabilityRound={capabilityRound} selected={selected} setSelected={setSelected} session={session} submit={submit} status={status}/>:<FacilitatorRound capabilityRound={capabilityRound} options={options} participants={participants} responses={roundResponses} counts={counts} submitted={submitted} session={session} updateSession={updateSession} draftShared={draftShared} setDraftShared={setDraftShared} activeCapability={activeCapability} futureIndex={futureIndex} draftConsensus={draftConsensus} setDraftConsensus={setDraftConsensus}/>}</Shell>
}

function ParticipantRound({options,capabilityRound,selected,setSelected,session,submit,status}){const toggle=o=>setSelected(v=>capabilityRound?(v.includes(o)?v.filter(x=>x!==o):v.length<3?[...v,o]:v):(v.includes(o)?[]:[o]));return <><div className="voteGrid">{options.map(o=><button className={selected.includes(o)?'selected':''} key={o} onClick={()=>toggle(o)}>{o}</button>)}</div><button disabled={!session.voting_open||(capabilityRound?selected.length!==3:selected.length!==1)} onClick={submit}>Submit vote</button><p>{status||(!session.voting_open?'Voting is closed.':'Your vote stays private until reveal.')}</p></>}

function FacilitatorRound({capabilityRound,options,participants,responses,counts,submitted,session,updateSession,draftShared,setDraftShared,activeCapability,futureIndex,draftConsensus,setDraftConsensus}){return <><div className="facStatus"><b>{submitted} of {participants.length} submitted</b><span>{session.voting_open?'Voting open':'Voting closed'}</span><button onClick={()=>updateSession({voting_open:!session.voting_open})}>{session.voting_open?'Close voting':'Reopen voting'}</button><button disabled={session.voting_open} onClick={()=>updateSession({revealed:true})}><Eye/>Reveal</button></div>{session.revealed&&<div className="bars">{options.map(o=><div key={o}><b>{o}</b><span><i style={{width:`${submitted?((counts[o]||0)/submitted)*100:0}%`}}/></span><strong>{counts[o]||0}</strong></div>)}</div>}{session.revealed&&<Perspective participants={participants} responses={responses}/>} {capabilityRound&&session.revealed?<SharedSelector options={options} selected={draftShared} setSelected={setDraftShared} update={updateSession}/>:!capabilityRound&&session.revealed?<Consensus options={options} cap={activeCapability} futureIndex={futureIndex} total={(session.shared_capabilities||[]).length} session={session} choice={draftConsensus[activeCapability]} setChoice={value=>setDraftConsensus(v=>({...v,[activeCapability]:value}))} update={updateSession}/>:null}</>}

function Perspective({participants,responses}){if(!responses.length)return null;if(participants.length<=3)return <section className="perspective"><b>PERSPECTIVES</b>{responses.map(r=>{const p=participants.find(x=>x.id===r.participant_id);return <p key={r.id}><strong>{p?.perspective||'Perspective'}:</strong> {(r.selections||[]).join(' · ')}</p>})}</section>;const by={};responses.forEach(r=>{const p=participants.find(x=>x.id===r.participant_id),k=p?.perspective||'Other';(by[k]??=[]).push(...(r.selections||[]))});return <section className="perspective"><b>PERSPECTIVE BREAKDOWN</b>{Object.entries(by).map(([k,v])=><p key={k}><strong>{k}:</strong> {v.join(' · ')}</p>)}</section>}

function SharedSelector({options,selected,setSelected,update}){const toggle=o=>setSelected(v=>v.includes(o)?v.filter(x=>x!==o):v.length<3?[...v,o]:v);return <section className="decision"><h3>Commit the shared portfolio</h3><div>{options.map(o=><button className={selected.includes(o)?'selected':''} onClick={()=>toggle(o)} key={o}>{o}</button>)}</div><button disabled={selected.length!==3} onClick={()=>update({shared_capabilities:selected,shared_priorities:{},phase:'future',round_key:'future:0',voting_open:true,revealed:false})}>Commit 3 shared priorities</button></section>}

function Consensus({options,cap,futureIndex,total,session,choice,setChoice,update}){const t=TRANSLATION[cap]?.[Math.max(0,options.indexOf(choice))];const minority=options.filter(x=>x!==choice);const commit=async()=>{const priorities={...(session.shared_priorities||{}),[cap]:choice};const last=futureIndex>=total-1;await update(last?{shared_priorities:priorities,phase:'brief',round_key:'brief',voting_open:false,revealed:false}:{shared_priorities:priorities,round_key:`future:${futureIndex+1}`,voting_open:true,revealed:false})};return <section className="decision"><h3>Commit a shared future-care priority</h3><div>{options.map(o=><button className={choice===o?'selected':''} onClick={()=>setChoice(o)} key={o}>{o}</button>)}</div>{choice&&<><div className="translation"><article><b>DESIGN</b><p>{t?.[0]}</p></article><article><b>ENGINEERING</b><p>{t?.[1]}</p></article><article><b>KEEP CHANGEABLE</b><p>{t?.[2]}</p></article></div><p><b>PROJECT CRITERION:</b> {t?.[3]}</p><p><b>DON'T LOSE THIS:</b> {minority.join(' · ')}</p></>}<button disabled={!choice} onClick={commit}>{futureIndex>=total-1?'Build shared brief':'Commit & next'}</button></section>}

function BriefScreen({session,role,connected}){const caps=session.shared_capabilities||[],priorities=session.shared_priorities||{};const copy=()=>navigator.clipboard?.writeText(caps.map(c=>`${c}: ${priorities[c]||''}`).join('\n'));return <Shell session={session} role={role} connected={connected}><div className="eyebrow">OUR FUTURE-READY DESIGN BRIEF</div><h1>Our shared decisions</h1><div className="briefGrid">{caps.map(c=>{const choice=priorities[c],i=(FUTURES[c]||[]).indexOf(choice),t=TRANSLATION[c]?.[Math.max(0,i)];return <article key={c}><small>{c}</small><h3>{choice}</h3><b>DESIGN</b><p>{t?.[0]}</p><b>ENGINEERING</b><p>{t?.[1]}</p><b>PROJECT CRITERION</b><p>{t?.[3]}</p></article>})}</div><div className="actions"><button onClick={copy}><Copy/>Copy team brief</button><button className="outline" onClick={()=>location.reload()}><RotateCcw/>Start another session</button></div></Shell>}
