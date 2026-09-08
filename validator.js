const fs = require('fs');

const ROBLOX = new Set(['game','workspace','script','Instance','Enum','Vector2','Vector3','CFrame','Color3','BrickColor','UDim','UDim2','TweenInfo','RaycastParams','OverlapParams','NumberRange','NumberSequence','ColorSequence','PhysicalProperties','Region3','task','tick','wait','spawn','delay','Players','RunService','UserInputService','ReplicatedStorage','ServerStorage','ServerScriptService','StarterGui','CoreGui','Lighting','SoundService','TweenService','HttpService','CollectionService','VirtualInputManager']);
const EXPLOIT = new Set(['getgenv','getrenv','getsenv','getgc','gethui','getconnections','getcustomasset','identifyexecutor','iscclosure','islclosure','newcclosure','hookfunction','hookmetamethod','restorefunction','cloneref','checkcaller','setclipboard','request','http_request','syn','fluxus','KRNL','queue_on_teleport','setthreadidentity','getthreadidentity','setidentity','getidentity','fireclickdetector','fireproximityprompt','firetouchinterest','Drawing','WebSocket','crypt','debug']);

function longOpen(code, pos) {
  if (code[pos] !== '[') return null;
  let j = pos + 1, eq = 0;
  while (j < code.length && code[j] === '=') { eq++; j++; }
  return code[j] === '[' ? [eq, j + 1] : null;
}

function scan(code) {
  const errors = [], tokens = [];
  let parens=0, braces=0, brackets=0, line=1, i=0;
  const blocks=[];
  const add=(tok,ln)=>tokens.push([tok,ln]);
  while(i<code.length){
    const ch=code[i];
    if(ch==='\n'){line++;i++;continue;}
    if(/\s/.test(ch)){i++;continue;}
    if(ch==='-'&&code[i+1]==='-'){
      const lo=longOpen(code,i+2);
      if(lo){const [eq,j]=lo,end=']'+'='.repeat(eq)+']',k=code.indexOf(end,j);if(k<0){errors.push(`line ${line}: unterminated long comment`);break;}line+=(code.slice(j,k).match(/\n/g)||[]).length;i=k+end.length;continue;}
      const k=code.indexOf('\n',i+2);i=k<0?code.length:k;continue;
    }
    if(ch==='"'||ch==="'"){
      const q=ch,start=line;i++;let closed=false;
      while(i<code.length){if(code[i]==='\n')line++;if(code[i]==='\\'){i+=2;continue;}if(code[i]===q){i++;closed=true;break;}i++;}
      if(!closed)errors.push(`line ${start}: unterminated string`);add('<string>',start);continue;
    }
    const lo=longOpen(code,i);
    if(lo){const [eq,j]=lo,end=']'+'='.repeat(eq)+']',k=code.indexOf(end,j);if(k<0){errors.push(`line ${line}: unterminated long string`);break;}line+=(code.slice(j,k).match(/\n/g)||[]).length;add('<longstring>',line);i=k+end.length;continue;}
    const id=code.slice(i).match(/^[A-Za-z_][A-Za-z0-9_]*/);
    if(id){add(id[0],line);i+=id[0].length;continue;}
    const num=code.slice(i).match(/^(?:0[xX][0-9A-Fa-f]+|(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?)/);
    if(num){add('<number>',line);i+=num[0].length;continue;}
    const ops=['...','::','//=','<<=','>>=','==','~=','<=','>=','..','//','<<','>>','+=','-=','*=','/=','%=','^=','..='];
    const op=ops.find(x=>code.startsWith(x,i));
    if(op){add(op,line);i+=op.length;continue;}
    add(ch,line);i++;
  }
  for(const [tok,ln] of tokens){
    if(tok==='(')parens++;else if(tok===')'){if(--parens<0){errors.push(`line ${ln}: unexpected ')'`);parens=0;}}
    else if(tok==='{')braces++;else if(tok==='}'){if(--braces<0){errors.push(`line ${ln}: unexpected '}'`);braces=0;}}
    else if(tok==='[')brackets++;else if(tok===']'){if(--brackets<0){errors.push(`line ${ln}: unexpected ']'`);brackets=0;}}
    else if(['function','do','if','repeat'].includes(tok))blocks.push([tok,ln]);
    else if(tok==='for'||tok==='while'){}
    else if(tok==='end'){if(!blocks.length||blocks[blocks.length-1][0]==='repeat')errors.push(`line ${ln}: unexpected end`);else blocks.pop();}
    else if(tok==='until'){if(!blocks.length||blocks[blocks.length-1][0]!=='repeat')errors.push(`line ${ln}: unexpected until`);else blocks.pop();}
  }
  if(parens)errors.push(`unbalanced parentheses (off by ${parens})`);
  if(braces)errors.push(`unbalanced braces (off by ${braces})`);
  if(brackets)errors.push(`unbalanced brackets (off by ${brackets})`);
  if(blocks.length)errors.push(`unclosed block(s): ${blocks.slice(-6).map(x=>x[0]).join(', ')}`);
  return {errors,tokens};
}

const TYPES=new Set(['studio','require','exploit']);
function targetErrors(tokens,target){
  if(target==='auto')return [];
  const set=new Set(tokens.map(x=>x[0])), e=[];
  if(target==='lua51'&&set.has('goto'))e.push('target lua51 does not support goto/labels');
  if(['lua51','lua52','lua53','luajit'].includes(target)&&(set.has('continue')||set.has('export')))e.push(`target ${target} does not support Luau-only keywords`);
  return e;
}
function envReport(tokens,env){
  const names=new Set(tokens.map(x=>x[0])), found=[];
  if(env==='roblox'||env==='exploit')for(const x of ROBLOX)if(names.has(x))found.push(x);
  if(env==='exploit')for(const x of EXPLOIT)if(names.has(x))found.push(x);
  return [...new Set(found)].sort();
}
function main(){
  if(process.argv.length<3){console.error('ERROR: no file specified');process.exit(1);}
  const file=process.argv[2];let code;
  try{code=fs.readFileSync(file,'utf8');}catch(e){console.error(`ERROR: ${e.message}`);process.exit(1);}
  const target=(process.argv.includes('--target')?process.argv[process.argv.indexOf('--target')+1]:'auto');
  const envArg=(process.argv.includes('--env')?process.argv[process.argv.indexOf('--env')+1]:null);
  const type=(process.argv.includes('--type')?process.argv[process.argv.indexOf('--type')+1]:null);
  if(!TYPES.has(type) && type!==null){console.error('ERROR: invalid --type');process.exit(1);}
  if(target==='luau'&&type===null){console.error('ERROR: target luau requires --type studio, --type require, or --type exploit');process.exit(1);}
  const envRaw=type||envArg||'generic';
  const env=(envRaw==='studio'||envRaw==='require')?'roblox':envRaw;
  if(!['auto','lua51','lua52','lua53','lua54','lua55','luajit','luau'].includes(target)){console.error('ERROR: invalid target');process.exit(1);}
  if(!['generic','roblox','exploit'].includes(env)){console.error('ERROR: invalid environment');process.exit(1);}
  const r=scan(code),errors=[...r.errors,...targetErrors(r.tokens,target)];
  if(errors.length){console.error('ERROR: '+[...new Set(errors)].join('; '));process.exit(1);}
  if(envRaw==='require'){const ids=(code.match(/\brequire\s*\(\s*(\d{1,18})\s*\)/g)||[]);if(ids.length){console.log('REQUIRE: unprotected numeric module IDs detected: '+ids.length);console.log('REQUIRE: obfuscate with --type require to rewrite direct numeric require IDs');}else console.log('REQUIRE: no direct numeric module IDs detected');}
  console.log('VALID');
  const found=envReport(r.tokens,env);console.log(found.length?'ENV: '+found.join(', '):'ENV: no known environment identifiers detected');
}
if(require.main===module)main();
module.exports={validateLua:scan};
