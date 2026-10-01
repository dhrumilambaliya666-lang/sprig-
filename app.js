const $=s=>document.querySelector(s);
const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const STAGES=[["Empathize","Understand people"],["Define","Frame the problem"],["Ideate","Generate options"],["Prototype","Make it real"],["Test","Learn from users"]];
const COLS=[["says","Says","var(--y)"],["thinks","Thinks","var(--s)"],["does","Does","var(--m)"],["feels","Feels","var(--p)"]];
const FID=["Paper sketch","Clickable mock","Role-play","Spreadsheet fake"];
const TAGS=[["worked","It worked"],["confused","Confused them"],["wanted","They wanted more"]];
const TWISTS=["Substitute: what could you replace with something simpler?","Combine: which two ideas become one stronger one?","Adapt: how does a totally different industry solve this?","Eliminate: what if you removed the hardest step?","Reverse: what if the user did the reverse of what you expect?","Magnify: what would a 10x version look like?"];
let S,cur=0,twistI=0;
function fresh(){S={ch:"",notes:{says:[],thinks:[],does:[],feels:[]},pov:{u:"",n:"",i:""},ideas:[],fid:0,scope:"",asms:[],tests:[],tag:"worked",seen:new Set([0])}}
fresh();
const ch=()=>S.ch||"this challenge";

function drawSteps(){
  $("#steps").innerHTML=STAGES.map((s,i)=>`<button role="tab" aria-selected="${i===cur}" class="${S.seen.has(i)&&i!==cur?'done':''}" data-i="${i}">${s[0]}<span>${s[1]}</span></button>`).join("");
}
function go(i){
  cur=Math.max(0,Math.min(4,i));S.seen.add(cur);
  document.querySelectorAll(".panel").forEach((p,k)=>p.classList.toggle("on",k===cur));
  $("#prev").style.visibility=cur?"visible":"hidden";
  $("#next").style.display=cur===4?"none":"";
  drawSteps();coach();
}
$("#steps").onclick=e=>{const b=e.target.closest("button");if(b)go(+b.dataset.i)};
$("#prev").onclick=()=>go(cur-1);
$("#next").onclick=()=>go(cur+1);
$("#start").onsubmit=e=>{e.preventDefault();S.ch=$("#challenge").value.trim();go(0);drawAll();$("#journey").scrollIntoView()};
$("#reset").onclick=()=>{fresh();$("#challenge").value="";["pu","pn","pi","scope","tt","ideaIn","asm"].forEach(id=>$("#"+id).value="");cur=0;go(0);drawAll();window.scrollTo(0,0)};

/* Empathize */
function drawQuad(){
  $("#quad").innerHTML=COLS.map(([k,l,c])=>`<div class="col"><h3>${l}</h3>
  <form class="row" data-k="${k}"><input aria-label="Add to ${l}" placeholder="Add a note" maxlength="80"><button class="sm">Add</button></form>
  ${S.notes[k].map((t,i)=>`<div class="stick" style="background:${c}"><span>${esc(t)}</span><button data-k="${k}" data-i="${i}" aria-label="Remove note">×</button></div>`).join("")}</div>`).join("");
}
$("#quad").onsubmit=e=>{e.preventDefault();const f=e.target,v=f.querySelector("input").value.trim();if(v){S.notes[f.dataset.k].push(v);drawQuad();coach()}};
$("#quad").onclick=e=>{const b=e.target.closest(".stick button");if(b){S.notes[b.dataset.k].splice(+b.dataset.i,1);drawQuad();coach()}};

/* Define */
function drawPov(){
  const {u,n,i}=S.pov,el=$("#pov");
  if(!u||!n){el.className="out empty";el.textContent="Your problem statement appears here.";$("#alts").innerHTML="";return}
  el.className="out";
  el.textContent=`${cap(u)} needs ${n}${i?` because ${i}`:""}.`;
  $("#alts").innerHTML=[`How might we help ${u} get ${n.replace(/^to /,"")}?`,`How might we make it easy for ${u} ${n.startsWith("to ")?n:"to get "+n}?`,`How might we remove what stops ${u} from ${n.startsWith("to ")?n.slice(3):n}?`].map(x=>`<li>${esc(x)}</li>`).join("");
}
const cap=t=>t.charAt(0).toUpperCase()+t.slice(1);
["pu","pn","pi"].forEach((id,k)=>$("#"+id).oninput=e=>{S.pov["uni"[k]]=e.target.value.trim();drawPov();coach()});

/* Ideate */
function drawIdeas(){
  const sorted=[...S.ideas].sort((a,b)=>b.v-a.v);
  $("#ideas").innerHTML=sorted.length?sorted.map(x=>`<div class="idea"><b>${esc(x.t)}</b><button class="ghost sm" data-id="${x.id}" aria-label="Vote for ${esc(x.t)}">Vote</button><span class="v">${x.v}</span></div>`).join(""):`<div class="out empty">No ideas yet. Aim for ten before you judge any of them.</div>`;
}
$("#ideaForm").onsubmit=e=>{e.preventDefault();const v=$("#ideaIn").value.trim();if(v){S.ideas.push({id:Date.now()+Math.random(),t:v,v:0});$("#ideaIn").value="";drawIdeas();coach()}};
$("#ideas").onclick=e=>{const b=e.target.closest("button");if(!b)return;const x=S.ideas.find(i=>String(i.id)===b.dataset.id);if(x){x.v++;drawIdeas();coach()}};
$("#twist").onclick=()=>{twistI++;coach()};

/* Prototype */
function drawFid(){
  $("#fid").innerHTML=FID.map((f,i)=>`<button type="button" class="chip" aria-pressed="${S.fid===i}" data-i="${i}">${f}</button>`).join("");
  $("#asms").innerHTML=S.asms.map((a,i)=>`<div class="idea"><b>${esc(a)}</b><button class="ghost sm" data-i="${i}" aria-label="Remove assumption">Remove</button></div>`).join("");
}
$("#fid").onclick=e=>{const b=e.target.closest("button");if(b){S.fid=+b.dataset.i;drawFid();coach()}};
$("#scope").oninput=e=>{S.scope=e.target.value.trim();coach()};
$("#asmForm").onsubmit=e=>{e.preventDefault();const v=$("#asm").value.trim();if(v){S.asms.push(v);$("#asm").value="";drawFid();coach()}};
$("#asms").onclick=e=>{const b=e.target.closest("button");if(b){S.asms.splice(+b.dataset.i,1);drawFid();coach()}};

/* Test */
function drawTest(){
  $("#tags").innerHTML=TAGS.map(([k,l])=>`<button type="button" class="chip" aria-pressed="${S.tag===k}" data-k="${k}">${l}</button>`).join("");
  const c=Object.fromEntries(TAGS.map(([k])=>[k,S.tests.filter(t=>t.tag===k).length])),max=Math.max(1,...Object.values(c));
  $("#bars").innerHTML=TAGS.map(([k,l])=>`<div class="bar"><span>${l}</span><i style="width:${c[k]/max*100}%"></i><b>${c[k]}</b></div>`).join("");
  const v=$("#verdict"),n=S.tests.length;
  if(!n){v.className="out empty";v.textContent="Log at least one reaction to see a recommendation.";return}
  v.className="out";
  v.textContent=c.confused>=c.worked&&c.confused>=c.wanted?"Confusion leads. Go back to Prototype and simplify the step people got stuck on.":c.wanted>c.worked?"People want more. Go back to Ideate and explore what they asked for.":"It's working. Build a slightly bigger version and test with new people.";
}
$("#tags").onclick=e=>{const b=e.target.closest("button");if(b){S.tag=b.dataset.k;drawTest()}};
$("#testForm").onsubmit=e=>{e.preventDefault();const v=$("#tt").value.trim();if(v){S.tests.push({t:v,tag:S.tag});$("#tt").value="";drawTest();coach()}};

/* AI coach (rule-based, on-device) */
function li(a){return a.map(x=>`<li>${esc(x)}</li>`).join("")}
function coach(){
  const n=S.notes,total=Object.values(n).flat().length;
  const c0=[`Ask: "Tell me about the last time you dealt with ${ch()}."`,`Ask: "What did you try, and what got in the way?"`,`Watch what people do. It often differs from what they say.`];
  if(total<4)c0.push("Aim for at least 4 notes across the map before you move on.");
  else if(n.says.length&&n.does.length&&S.notes.says[0]&&n.does[0])c0.push(`Compare "${n.says[0]}" with "${n.does[0]}". Any gap is an insight.`);
  const c1=["Start from a real person, not a group like \"everyone\".","State the need as a verb, such as \"to feel\" or \"to find\".",S.pov.u&&S.pov.n?"Read your statement aloud. If it names a solution, rewrite it.":"Fill the first two blanks to see your statement."];
  if(total)c1.push(`Look back at your notes: "${Object.values(n).flat()[0]}" could be your insight.`);
  const top=[...S.ideas].sort((a,b)=>b.v-a.v)[0];
  const c2=[TWISTS[twistI%TWISTS.length],S.pov.u&&S.pov.n?`Prompt: ${cap(S.pov.u)} needs ${S.pov.n}. What is the silliest way to meet that?`:`Prompt: what is the silliest way to solve ${ch()}?`,S.ideas.length<8?`You have ${S.ideas.length} ideas. Keep going to 10.`:"Nice volume. Vote for the ideas that excite you most."];
  const c3=[top?`Prototype "${top.t}" first. It has the most votes.`:"Vote on ideas in the last stage to choose what to build.",["Sketch three screens on paper. It takes ten minutes.","Link five mock screens together and test the flow.","Act out the service with a teammate playing the system.","Fake the back end by hand in a spreadsheet."][S.fid],S.asms.length?`You have ${S.asms.length} assumption${S.asms.length>1?"s":""} to test. Prioritize the riskiest.`:"List what must be true for your idea to work."];
  const bad=S.tests.filter(t=>t.tag==="confused").length,c4=["Test with five people. Patterns show up quickly.","Don't explain the prototype. Watch where they hesitate.",S.tests.length?(bad?`${bad} confusing moment${bad>1?"s":""}. Fix the most common first.`:"No confusion logged yet. Test with someone new."):"Log your first reaction to get a next-step recommendation."];
  [c0,c1,c2,c3,c4].forEach((c,i)=>$("#c"+i).innerHTML=li(c));
}
function drawAll(){drawQuad();drawPov();drawIdeas();drawFid();drawTest();coach()}
drawAll();go(0);
