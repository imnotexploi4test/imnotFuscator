#!/usr/bin/env node
const fs = require('fs');

const HEADER = "--!nocheck\n--[[\n$$\\                                    $$\\     $$$$$$$$\\                                      $$\\\n\\__|                                   $$ |    $$  _____|                                     $$ |\n$$\\ $$$$$$\\$$$$\\  $$$$$$$\\   $$$$$$\\ $$$$$$\\   $$ |   $$\\   $$\\  $$$$$$$\\  $$$$$$$\\ $$$$$$\\ $$$$$$\\    $$$$$$\\   $$$$$$\\\n$$ |$$  _$$  _$$\\ $$  __$$\\ $$  __$$\\\\_$$  _|  $$$$$\\ $$ |  $$ |$$  _____|$$  _____|\\____$$\\\\_$$  _|  $$  __$$\\ $$  __$$\\\n$$ |$$ / $$ / $$ |$$ |  $$ |$$ /  $$ | $$ |    $$  __|$$ |  $$ |\\$$$$$$\\  $$ /      $$$$$$$ | $$ |    $$ /  $$ |$$ |  \\__|\n$$ |$$ | $$ | $$ |$$ |  $$ |$$ |  $$ | $$ |$$\\ $$ |   $$ |  $$ | \\____$$\\ $$ |     $$  __$$ | $$ |$$\\ $$ |  $$ |$$ |\n$$ |$$ | $$ | $$ |$$ |  $$ |\\$$$$$$  | \\$$$$  |$$ |   \\$$$$$$  |$$$$$$$  |\\$$$$$$$\\\\$$$$$$$ | \\$$$$  |\\$$$$$$  |$$ |\n\\__|\\__| \\__| \\__|\\__|  \\__| \\______/   \\____/ \\__|    \\______/ \\_______/  \\_______|\\_______|  \\____/  \\______/ \\__|\n\n\n                                                                                                                          Fully made by imnotexploi4 (A.K.A the_baconthecheat)\n]]";

const TARGETS = new Set(['auto','lua51','lua52','lua53','lua54','lua55','luajit','luau']);
const ROBLOX_TYPES = new Set(['studio','require','exploit']);
const RESERVED = new Set([
  'and','break','do','else','elseif','end','false','for','function','goto','if','in','local','nil','not','or','repeat','return','then','true','until','while',
  'continue','type','export','typeof','print','warn','pairs','ipairs','next','select','unpack','rawget','rawset','rawequal','rawlen','tonumber','tostring','pcall','xpcall','error','assert',
  'setmetatable','getmetatable','require','table','string','math','coroutine','os','io','debug','bit32','utf8','task','wait','spawn','delay','tick','time','elapsedTime','game','workspace','script',
  'Instance','Vector3','Vector2','CFrame','Color3','BrickColor','UDim','UDim2','Enum','Ray','Region3','TweenInfo','NumberRange','NumberSequence','ColorSequence','Rect','Font','Axes','Faces',
  'Players','RunService','UserInputService','ReplicatedStorage','ServerStorage','ServerScriptService','StarterGui','StarterPack','StarterPlayer','CoreGui','Lighting','Debris','HttpService',
  'MarketplaceService','DataStoreService','PathfindingService','PhysicsService','SoundService','TextService','Chat','Teams','TestService','CollectionService','VirtualInputManager',
  '_G','_VERSION','shared','self','new','New','clone','Clone','Destroy','destroy','FindFirstChild','WaitForChild','GetChildren','GetDescendants','IsA','GetService','Connect','Fire','Invoke',
  'insert','remove','sort','concat','find','sub','len','rep','reverse','upper','lower','byte','char','format','match','gmatch','gsub','abs','ceil','floor','max','min','sqrt','random','randomseed','sin','cos','tan','huge','pi','clamp','lerp',
  'getfenv','setfenv','loadstring','load','dofile','collectgarbage'
]);
const ANTI = [
  'LOOL imagine you use the 25ms and Threaded to skid this thing lel',
  'holy skid',
  'nice try skid, but this aint gonna work for you lmaooo',
  'integrity check failed successfully. this script has been modified.',
  'execute script error'
];

class PRNG {
  constructor(seed) {
    const MOD = 2147483647;
    if (seed === undefined || seed === null) seed = Date.now() ^ Number(process.hrtime.bigint() & 0xffffffffn);
    let s = Number(seed) % (MOD - 1);
    if (s < 0) s += (MOD - 1);
    this.state = s + 1;
  }
  next() { this.state = (this.state * 48271) % 2147483647; return this.state; }
  int(lo, hi) { return lo + (this.next() % (hi - lo + 1)); }
  shuffle(a) { const out=a.slice(); for(let i=out.length-1;i>0;i--){ const j=this.int(0,i); [out[i],out[j]]=[out[j],out[i]]; } return out; }
}

function modInv256(a){ a%=256; for(let x=1;x<256;x+=2) if((a*x)%256===1) return x; throw new Error('odd multiplier has no inverse'); }
function xor8(a,b){ let out=0,bit=1; for(let i=0;i<8;i++){ if((a&1)!==(b&1)) out+=bit; a=Math.floor(a/2); b=Math.floor(b/2); bit*=2; } return out; }
function rol8(v,r){ r%=8; if(!r)return v&255; return (((v*Math.pow(2,r))%256)+Math.floor(v/Math.pow(2,8-r)))&255; }
function seqHash(values){ let h=0; for(const v of values) h=((h*131)+v)%2147483647; return h; }
function readLong(code,pos){ if(code[pos]!=='[')return null; let j=pos+1,eq=0; while(j<code.length&&code[j]==='='){eq++;j++;} if(code[j]==='[') return {eq,start:j+1}; return null; }

class Obfuscator {
  constructor(target='auto', seed=null, robloxType=null){ if(!TARGETS.has(target)) throw new Error(`unknown target: ${target}`); if(robloxType!==null&&!ROBLOX_TYPES.has(robloxType)) throw new Error(`unknown --type: ${robloxType}`); if(target==='luau'&&robloxType===null) throw new Error('target luau requires --type studio, --type require, or --type exploit'); this.target=target; this.robloxType=robloxType; this.rng=new PRNG(seed); this.ic=0; this.map=new Map(); this.decoders=[]; this.gseedName=null; this.gseedValue=0; }
  ni(){ return `imnot${++this.ic}`; }
  key(seed,offset,pos,prev,state,mult,add,mix,salt,mode,stateMix){
    if(mode===1)return (seed+offset+pos*mult+prev*mix+state*stateMix)%256;
    if(mode===2)return (seed+offset+pos*mult+prev*mix+add+state*stateMix)%256;
    if(mode===3)return (seed+offset+pos*mix+prev*mult+salt+state*stateMix)%256;
    return (seed+offset+(pos+prev)*mult+add+prev*mix+state*stateMix)%256;
  }
  ror8(v,r){r%=8;if(!r)return v&255;return ((v>>r)|((v<<(8-r))&255))&255;}
  keyLine(mode,key,seed,off,idx,mult,add,mix,salt,state,stateMix,prev){
    let e;
    if(mode===1)e=`(${seed}+${off}+${idx}*${mult}+${prev}*${mix}+${state}*${stateMix})%256`;
    else if(mode===2)e=`(${seed}+${off}+${idx}*${mult}+${prev}*${mix}+${add}+${state}*${stateMix})%256`;
    else if(mode===3)e=`(${seed}+${off}+${idx}*${mix}+${prev}*${mult}+${salt}+${state}*${stateMix})%256`;
    else e=`(${seed}+${off}+(${idx}+${prev})*${mult}+${add}+${prev}*${mix}+${state}*${stateMix})%256`;
    return `local ${key}=${e};`;
  }
  encodeString(value){
    const master=this.gseedName===null, vn=this.ni();
    const data=Buffer.from(value,'utf8');
    const seed=this.rng.int(0,255), mult=this.rng.int(1,255), add=this.rng.int(1,255), mix=this.rng.int(1,255), salt=this.rng.int(1,255), rot=this.rng.int(1,7), affine=this.rng.int(1,255)|1, inv=modInv256(affine), mode=this.rng.int(1,4), stateSeed=this.rng.int(0,255), stateMul=this.rng.int(1,255)|1, stateAdd=this.rng.int(1,255), stateMix=this.rng.int(1,255);
    const layoutAffine=this.rng.int(1,255)|1, layoutInv=modInv256(layoutAffine), layoutSalt=this.rng.int(1,255), layoutMode=this.rng.int(1,3);
    const offset=master?0:this.gseedValue; let prev=seed, state=(seed*17+stateSeed)%256, encoded=[];
    for(let pos=1;pos<=data.length;pos++){
      const k=this.key(seed,offset,pos,prev,state,mult,add,mix,salt,mode,stateMix);
      let x=xor8(data[pos-1],k); x=(x+pos*add+prev*mix+state*stateMix+salt)%256; x=rol8(x,rot); x=(x*affine+salt)%256; const z=(x+prev+add+state)%256; encoded.push(z); state=(z*stateMul+pos*stateAdd+seed)%256; prev=z;
    }
    const logical=Array.from({length:encoded.length},(_,i)=>i), order=this.rng.shuffle(logical).map(x=>x+1), stored=Array(encoded.length);
    for(let i=0;i<encoded.length;i++)stored[order[i]-1]=(encoded[i]*layoutAffine+layoutSalt)%256;
    const tag=seqHash([...stored,...order,seed,mult,add,mix,salt,rot,affine,mode,stateSeed,stateMul,stateAdd,stateMix,layoutAffine,layoutSalt,layoutMode])%65536;
    const d=this.ni(),out=this.ni(),p=this.ni(),st=this.ni(),idx=this.ni(),z=this.ni(),tmp=this.ni(),keyv=this.ni(),bytev=this.ni(),hv=this.ni();
    const off=master?'0':this.gseedName, p2=Math.pow(2,rot), rp=Math.pow(2,8-rot);
    const masterG=master?this.ni():null;
    let recovered;
    if(layoutMode===1) recovered=`local ${z}=(((${d}[imnot_map[${idx}]]-${layoutSalt})*${layoutInv})%256);`;
    else if(layoutMode===2) recovered=`local ${z}=(((${d}[imnot_map[${idx}]]+${(256-layoutSalt)%256})*${layoutInv})%256);`;
    else recovered=`local ${z}=(((${d}[imnot_map[${idx}]]*${layoutInv})-((${layoutSalt}*${layoutInv})%256))%256);`;
    const lines=[`local ${vn}${master?`, ${masterG}`:''}=(function()`,
      `local ${d}={${stored.join(',')}};local ${out}={};local ${p}=${seed};local ${st}=(${seed}*17+${stateSeed})%256;local ${hv}=0;local imnot_map={${order.join(',')}};`,
      `for ${idx}=1,#${d} do ${hv}=(${hv}*131+${d}[${idx}])%2147483647 end;for ${idx}=1,#imnot_map do ${hv}=(${hv}*131+imnot_map[${idx}])%2147483647 end;`,
      `${hv}=(${hv}*131+${seed})%2147483647;${hv}=(${hv}*131+${mult})%2147483647;${hv}=(${hv}*131+${add})%2147483647;${hv}=(${hv}*131+${mix})%2147483647;${hv}=(${hv}*131+${salt})%2147483647;${hv}=(${hv}*131+${rot})%2147483647;${hv}=(${hv}*131+${affine})%2147483647;${hv}=(${hv}*131+${mode})%2147483647;${hv}=(${hv}*131+${stateSeed})%2147483647;${hv}=(${hv}*131+${stateMul})%2147483647;${hv}=(${hv}*131+${stateAdd})%2147483647;${hv}=(${hv}*131+${stateMix})%2147483647;${hv}=(${hv}*131+${layoutAffine})%2147483647;${hv}=(${hv}*131+${layoutSalt})%2147483647;${hv}=(${hv}*131+${layoutMode})%2147483647;`,
      `if ${hv}%65536~=${tag} then error() end;`,
      `for ${idx}=1,#${d} do ${recovered}local ${tmp}=(${z}-${p}-${add}-${st})%256;${tmp}=((${tmp}-${salt})*${inv})%256;${tmp}=(((${tmp}%${p2})*${rp})+math.floor(${tmp}/${p2}));`,
      this.keyLine(mode,keyv,seed,off,idx,mult,add,mix,salt,st,stateMix,p),
      `${tmp}=(${tmp}-${idx}*${add}-${p}*${mix}-${st}*${stateMix}-${salt})%256;local ${bytev}=0;local imnot_bv=1;local imnot_av=${tmp};local imnot_kv=${keyv};for imnot_bit=1,8 do if imnot_av%2~=imnot_kv%2 then ${bytev}=${bytev}+imnot_bv end;imnot_av=math.floor(imnot_av/2);imnot_kv=math.floor(imnot_kv/2);imnot_bv=imnot_bv*2 end;${out}[${idx}]=string.char(${bytev});${st}=(${z}*${stateMul}+${idx}*${stateAdd}+${seed})%256;${p}=${z};end;`
    ];
    if(master){const gv=masterG;lines.push(`local ${hv}=0;for ${idx}=1,#${d} do local imnot_layout_z=(((${d}[imnot_map[${idx}]]-${layoutSalt})*${layoutInv})%256);${hv}=(${hv}*131+imnot_layout_z)%2147483647 end;${hv}=${hv}%256;return table.concat(${out}),${hv};end)()`);this.gseedName=gv;let h=0;for(const v of encoded)h=(h*131+v)%2147483647;this.gseedValue=h%256;}else lines.push(`return table.concat(${out});end)()`);
    const decoder=lines.join('');this.decoders.push(decoder);return vn;
  }
  xorLoop(tmp,keyv){ return `local imnot_bv=1;local imnot_av=${tmp};local imnot_kv=${keyv};local ${tmp}b=0;for imnot_bit=1,8 do if imnot_av%2~=imnot_kv%2 then ${tmp}b=${tmp}b+imnot_bv end;imnot_av=math.floor(imnot_av/2);imnot_kv=math.floor(imnot_kv/2);imnot_bv=imnot_bv*2 end;` + `${keyv}=${tmp}b;`; }
  removeComments(code){
    let out='',i=0; while(i<code.length){
      if(code[i]==='"'||code[i]==="'"){ const q=code[i]; out+=q; i++; while(i<code.length){const ch=code[i];out+=ch;i++;if(ch==='\\'&&i<code.length){out+=code[i];i++;}else if(ch===q)break;} continue; }
      const lo=readLong(code,i); if(lo){ const close=']'+'='.repeat(lo.eq)+']', end=code.indexOf(close,lo.start); if(end>=0){out+=code.slice(i,end+close.length);i=end+close.length;continue;} }
      if(code.startsWith('--',i)){ const clo=readLong(code,i+2); if(clo){const close=']'+'='.repeat(clo.eq)+']',end=code.indexOf(close,clo.start); if(end<0)throw new Error('unterminated long comment'); i=end+close.length;continue;} while(i<code.length&&code[i]!='\n')i++; if(i<code.length){out+='\n';i++;} continue; }
      out+=code[i++];
    } return out;
  }
  unescape(raw){ let o=''; for(let i=0;i<raw.length;){ if(raw[i]!=='\\'){o+=raw[i++];continue;} i++; if(i>=raw.length)break; const c=raw[i]; const map={a:'\a',b:'\b',f:'\f',n:'\n',r:'\r',t:'\t',v:'\v','\\':'\\','"':'"',"'":"'"}; if(map[c]!=null){o+=map[c];i++;} else if(c==='z'){i++;while(i<raw.length&&/\s/.test(raw[i]))i++;} else if(c==='x'&&/^[0-9A-Fa-f]{2}$/.test(raw.slice(i+1,i+3))){o+=String.fromCharCode(parseInt(raw.slice(i+1,i+3),16));i+=3;} else if(/[0-9]/.test(c)){let j=i;while(j<raw.length&&j<i+3&&/[0-9]/.test(raw[j]))j++;o+=String.fromCharCode(parseInt(raw.slice(i,j),10)&255);i=j;} else {o+=c;i++;} } return o; }
  extractStrings(code){ let out='',strings=[],i=0; while(i<code.length){ if(code[i]==='"'||code[i]==="'"){const q=code[i++];let raw='';while(i<code.length&&code[i]!==q){if(code[i]==='\\'){raw+=code[i++];if(i<code.length)raw+=code[i++];}else raw+=code[i++];}if(i>=code.length)throw new Error('unterminated string');i++;strings.push(this.unescape(raw));out+=`__STR_${strings.length-1}__`;continue;} const lo=readLong(code,i);if(lo){const close=']'+'='.repeat(lo.eq)+']',end=code.indexOf(close,lo.start);if(end<0)throw new Error('unterminated long string');strings.push(code.slice(lo.start,end));out+=`__STR_${strings.length-1}__`;i=end+close.length;continue;}out+=code[i++];}return {code:out,strings}; }
  lex(code){ const t=[];let i=0; while(i<code.length){const c=code[i];if(/\s/.test(c)){let j=i+1;while(j<code.length&&/\s/.test(code[j]))j++;t.push(['ws',code.slice(i,j)]);i=j;continue;}if(/[A-Za-z_]/.test(c)){let j=i+1;while(j<code.length&&/[A-Za-z0-9_]/.test(code[j]))j++;t.push(['id',code.slice(i,j)]);i=j;continue;}if(/[0-9]/.test(c)){let j=i+1;while(j<code.length&&/[A-Za-z0-9._]/.test(code[j]))j++;t.push(['num',code.slice(i,j)]);i=j;continue;}let hit=null;for(const op of ['...','::','//=','<<=','>>=','..=','==','~=','<=','>=','..','//','<<','>>','+=','-=','*=','/=','%=','^='])if(code.startsWith(op,i)){hit=op;break;}if(hit){t.push(['sym',hit]);i+=hit.length;}else{t.push(['sym',c]);i++;}}return t; }
  sig(t){return t.filter(x=>x[0]!=='ws');}
  collect(t){const s=this.sig(t),m=new Map(),add=(n)=>{if(n.startsWith('__STR_')||RESERVED.has(n))return;if(!m.has(n))m.set(n,this.ni());};for(let i=0;i<s.length;i++){const v=s[i][1];if(v==='local'){let j=i+1;if(s[j]?.[1]==='function'){j++;if(s[j]?.[0]==='id')add(s[j][1]);}else{while(j<s.length&&!['=','function'].includes(s[j][1])){if(s[j][0]==='id')add(s[j][1]);j++;}}}else if(v==='for'){let j=i+1;while(j<s.length&&!['=','in','do'].includes(s[j][1])){if(s[j][0]==='id')add(s[j][1]);j++;}}else if(v==='function'){let j=i+1;while(j<s.length&&s[j][1]!=='(')j++;if(j<s.length){j++;let d=1;while(j<s.length&&d){if(s[j][1]==='(')d++;else if(s[j][1]===')')d--;else if(d===1&&s[j][0]==='id'){const pv=s[j-1]?.[1]||'',nv=s[j+1]?.[1]||'';if(pv!==':'&&pv!=='.'&&nv!==':')add(s[j][1]);}j++;}}}}return m;}
  transform(t){const m=this.collect(t),arr=this.sig(t),positions=[];t.forEach((x,i)=>{if(x[0]!=='ws')positions.push(i)});let sp=0,brace=0,out=[];for(let i=0;i<t.length;i++){const [kind,val]=t[i];if(kind==='ws'){out.push(val);continue;}const prev=sp>0?t[positions[sp-1]][1]:'';const next=sp+1<arr.length?arr[sp+1][1]:'';let nv=val;if(kind==='id'&&m.has(val)&&!val.startsWith('__STR_')){if(!['.',':','::'].includes(prev)&&prev!=='::'&&next!=='::'&&!(next==='='&&brace>0&&(prev==='{'||prev===',')))nv=m.get(val);}else if(kind==='num'&&/^\d{2,7}$/.test(val)){const n=Number(val);if(n>=10&&n<=1000000){const a=this.rng.int(2,Math.max(2,Math.min(97,Math.floor(n/2))));const b=Math.floor(n/a);const r=n-a*b;nv=r===0?`(${a}*${b})`:`((${a}*${b})+${r})`;}}out.push(nv);if(val==='{')brace++;else if(val==='}')brace=Math.max(0,brace-1);sp++;}return out.join('');}
  protectRequireIds(code){
    if(this.robloxType!=='require') return code;
    const re=/\brequire\s*\(\s*(\d{1,18})\s*\)/g;
    return code.replace(re,(_,digits)=>{
      const n=BigInt(digits);
      const base=BigInt(this.rng.int(97,997));
      let rem=n, parts=[];
      while(rem>0n){parts.push(rem%base);rem/=base;}
      if(!parts.length) parts=[0n];
      let acc=String(parts[parts.length-1]);
      for(let i=parts.length-2;i>=0;i--) acc=`((${acc}*${base})+${parts[i]})`;
      const noise=this.rng.int(7,91);
      return `(function() local imnot_reqbase=${base}; local imnot_reqx=${acc}; local imnot_reqn=${noise}; return (imnot_reqx+imnot_reqn-imnot_reqn) end)()`;
    });
  }
  splitLiteral(value){const chars=Array.from(value);if(chars.length<12)return [value];const count=this.rng.int(2,4);const cuts=new Set();while(cuts.size<count-1)cuts.add(this.rng.int(1,chars.length-1));const ordered=[...cuts].sort((a,b)=>a-b);const bounds=[0,...ordered,chars.length],parts=[];for(let i=0;i<bounds.length-1;i++)parts.push(chars.slice(bounds[i],bounds[i+1]).join(''));return parts;}
  protect(body,strings){let out=body;for(let i=0;i<strings.length;i++){const pieces=this.splitLiteral(strings[i]);const refs=pieces.map(x=>this.encodeString(x));const ref=refs.length===1?refs[0]:'('+refs.join('..')+')';out=out.replace(`__STR_${i}__`,ref);}return out;}
  garbage(count){const o=[];for(let i=0;i<count;i++){const v=this.ni(),r=this.rng.int(1,6);if(r===1)o.push(`local ${v}=(${this.rng.int(10,9999)}+${this.rng.int(10,9999)})`);else if(r===2)o.push(`local ${v}=(function()local imnot_x=${this.rng.int(1,999)};return imnot_x end)()`);else if(r===3){const vals=Array.from({length:this.rng.int(2,5)},()=>this.rng.int(1,255));o.push(`local ${v}={${vals.join(',')}}`);}else if(r===4)o.push(`local ${v}=(((${this.rng.int(11,999)})>${this.rng.int(1,10)}) and 1 or 0)`);else if(r===5)o.push(`local ${v}=#"${'x'.repeat(this.rng.int(1,8))}"`);else o.push(`local ${v}=(((${this.rng.int(2,50)})*${this.rng.int(2,50)})%${this.rng.int(51,251)})`);}return o.join(';');}
  build(body){
    const bce=this.encodeString('error'),bcp=this.encodeString('pcall'),bcts=this.encodeString('tostring'),bcty=this.encodeString('type'),bcni=this.encodeString('__newindex'),bcix=this.encodeString('__index'),bcdb=this.encodeString('debug'),bcgi=this.encodeString('getinfo'),bcco=this.encodeString('coroutine'),bcc=this.encodeString('C');
    const tm=this.encodeString(ANTI[0]),tm2=this.encodeString(ANTI[1]),tm3=this.encodeString(ANTI[2]),im=this.encodeString(ANTI[3]),eem=this.encodeString(ANTI[4]);
    const env=this.ni(),fn=this.ni(),ok=this.ni(),err=this.ni(),prot=this.ni(),pr=this.ni(),wr=this.ni(),er=this.ni(),pc=this.ni(),ty=this.ni();
    const a=[this.ni(),this.ni(),this.ni(),this.ni(),this.ni(),this.ni(),this.ni()], hashv=this.ni(),mirror=this.ni(),checker=this.ni(),state=this.ni();
    let h=seqHash([...Buffer.from(body,'utf8')]);
    const checks=[
      `local ${a[0]}=(function()local imnot_ok,imnot_t=${pc}(function()return ${ty}(${er})=="function"end);if not imnot_ok or not imnot_t then ${er}(${tm})end;return true end)()`,
      `local ${a[1]}=(function()local imnot_checks={${bce},${bcp},${bcts},${bcty}};for imnot_ci=1,#imnot_checks do local imnot_fn=${env}[imnot_checks[imnot_ci]];if ${ty}(imnot_fn)~="function"then ${er}(${tm2})end end;return true end)()`,
      `local ${a[2]}=(function()local imnot_dok,imnot_dlib=${pc}(function()return ${env}[${bcdb}]end);if imnot_dok and imnot_dlib then local imnot_ghok,imnot_gh=${pc}(function()return imnot_dlib[${bcgi}]end);if imnot_ghok and imnot_gh then local imnot_info=imnot_gh(1);if imnot_info and imnot_info.what==${bcc} then ${er}(${tm3})end end end;return true end)()`,
      `local ${a[3]}=setmetatable(${prot},{[${bcni}]=function()${er}(${tm})end,[${bcix}]=function(_,imnot_key)if imnot_key==${hashv} then return true end;return nil end})`,
      `local ${a[4]}=(function()local imnot_cok,imnot_clib=${pc}(function()return ${env}[${bcco}]end);if imnot_cok and imnot_clib and imnot_clib.running then imnot_clib.running()end;return true end)()`,
      `local ${a[5]}=(function()local imnot_c1ok,imnot_c1=${pc}(function()return os.clock()end);if not imnot_c1ok or type(imnot_c1)~="number"then return true end;local imnot_acc=0;for imnot_ti=1,20000 do imnot_acc=imnot_acc+imnot_ti end;local imnot_c2ok,imnot_c2=${pc}(function()return os.clock()end);if imnot_c2ok and type(imnot_c2)=="number" and (imnot_c2-imnot_c1)>2 then ${er}(${tm3})end;return true end)()`,
      `local ${a[6]}=(function()local imnot_rwok,imnot_rwr=${pc}(function()return rawequal(1,1)end);if not imnot_rwok or imnot_rwr~=true then ${er}(${tm2})end;return true end)()`
    ];
    const c1=this.rng.shuffle(checks), cn=this.rng.shuffle([a[0],a[1],a[2],a[4],a[5],a[6]]), sc='not '+cn.join(' or not ');
    const raw=[this.decoders.join(';'),`local ${env}=_G`,`local ${pr}=print`,`local ${wr}=warn`,`local ${er}=error`,`local ${pc}=pcall`,`local ${ty}=typeof or type`,this.garbage(12),`local ${prot}={}`,`local ${hashv}=${h}`,c1.join(';'),this.garbage(16),`local ${mirror}=${h}`,`local ${checker}=function()if ${mirror}~=${hashv} then ${er}(${im})end end`,`${checker}()`, `local ${fn}=function()${checker}();${body} end`,this.garbage(10),`local ${state}=(function()if ${sc} then ${er}(${tm})end;return true end)()`,`local ${ok},${err}=${pc}(${fn})`,`if not ${ok} then local imnot_handler=${wr} or ${pr} or function(...)end;imnot_handler(${eem})end`];
    return HEADER+'\n'+raw.join(';');
  }
  obfuscate(source){this.ic=0;this.map=new Map();this.decoders=[];this.gseedName=null;this.gseedValue=0;const clean=this.removeComments(source),ex=this.extractStrings(clean);let skeleton=ex.code;if(this.robloxType==='require')skeleton=this.protectRequireIds(skeleton);const tok=this.lex(skeleton),body=this.transform(tok);return this.build(this.protect(body,ex.strings));}
}

function obfuscate(src,opts={}){ return new Obfuscator(opts.target||'auto',opts.seed,opts.type||null).obfuscate(src); }
function main(){
  const args=process.argv.slice(2); if(args.length<2){console.error('Usage: node obfuscator.js <input> <output> [--target <target>] [--type <studio|require|exploit>] [--seed <number>]');process.exit(1);}
  let target='auto',seed=null,type=null;for(let i=2;i<args.length;i++){if(args[i]==='--target')target=args[++i]||'auto';else if(args[i]==='--type')type=args[++i]||null;else if(args[i]==='--seed')seed=Number(args[++i]);}
  try{const source=fs.readFileSync(args[0],'utf8');fs.writeFileSync(args[1],obfuscate(source,{target,seed,type}),'utf8');console.log('OK');}catch(e){console.error('ERROR: '+e.message);process.exit(1);}
}
if(require.main===module) main();
module.exports={obfuscate,Obfuscator};
