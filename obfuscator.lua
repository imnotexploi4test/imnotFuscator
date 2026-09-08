local input_file, output_file = arg[1], arg[2]
local target, seed, roblox_type = "auto", nil, nil
for i = 3, #arg do
  if arg[i] == "--target" then target = arg[i + 1] or "auto" end
  if arg[i] == "--seed" then seed = tonumber(arg[i + 1]) end
  if arg[i] == "--type" then roblox_type = arg[i + 1] or nil end
end
local targets = {auto=true,lua51=true,lua52=true,lua53=true,lua54=true,lua55=true,luajit=true,luau=true}
if not input_file or not output_file then
  print("Usage: lua obfuscator.lua <input> <output> [--target <auto|lua51|lua52|lua53|lua54|lua55|luajit|luau>] [--type <studio|require|exploit>] [--seed <number>]")
  os.exit(1)
end
if not targets[target] then print("ERROR: invalid target") os.exit(1) end
if roblox_type and roblox_type ~= "studio" and roblox_type ~= "require" and roblox_type ~= "exploit" then print("ERROR: invalid --type") os.exit(1) end
if target == "luau" and not roblox_type then print("ERROR: target luau requires --type studio, --type require, or --type exploit") os.exit(1) end
local f = io.open(input_file, "r")
if not f then print("ERROR: Cannot open input file") os.exit(1) end
local source = f:read("*a"); f:close()

local HEADER = [====[--!nocheck
--[[
$$\                                    $$\     $$$$$$$$\                                      $$\
\__|                                   $$ |    $$  _____|                                     $$ |
$$\ $$$$$$\$$$$\  $$$$$$$\   $$$$$$\ $$$$$$\   $$ |   $$\   $$\  $$$$$$$\  $$$$$$$\ $$$$$$\ $$$$$$\    $$$$$$\   $$$$$$\
$$ |$$  _$$  _$$\ $$  __$$\ $$  __$$\\_$$  _|  $$$$$\ $$ |  $$ |$$  _____|$$  _____|\____$$\\_$$  _|  $$  __$$\ $$  __$$\
$$ |$$ / $$ / $$ |$$ |  $$ |$$ /  $$ | $$ |    $$  __|$$ |  $$ |\$$$$$$\  $$ /      $$$$$$$ | $$ |    $$ /  $$ |$$ |  \__|
$$ |$$ | $$ | $$ |$$ |  $$ |$$ |  $$ | $$ |$$\ $$ |   $$ |  $$ | \____$$\ $$ |     $$  __$$ | $$ |$$\ $$ |  $$ |$$ |
$$ |$$ | $$ | $$ |$$ |  $$ |\$$$$$$  | \$$$$  |$$ |   \$$$$$$  |$$$$$$$  |\$$$$$$$\\$$$$$$$ | \$$$$  |\$$$$$$  |$$ |
\__|\__| \__| \__|\__|  \__| \______/   \____/ \__|    \______/ \_______/  \_______|\_______|  \____/  \______/ \__|


                                                                                                                          Fully made by imnotexploi4 (A.K.A the_baconthecheat)
]]]====]

local function trim_seed(v)
  v = tonumber(v or 0) or 0
  v = v % 2147483646
  if v < 0 then v = v + 2147483646 end
  return v + 1
end
local rng_state = trim_seed(seed or ((os.time() * 1103515245 + math.floor((os.clock() or 0) * 1000000)) % 2147483646))
local function rng_next()
  rng_state = (rng_state * 48271) % 2147483647
  return rng_state
end
local function rnd(lo, hi)
  return lo + (rng_next() % (hi - lo + 1))
end
local function shuffle(t)
  for i = #t, 2, -1 do
    local j = rnd(1, i)
    t[i], t[j] = t[j], t[i]
  end
  return t
end

local ic, decoders = 0, {}
local gseed_name, gseed_value = nil, 0
local function ni() ic = ic + 1; return "imnot" .. ic end
local function xor8(a,b)
  local r, bit = 0, 1
  for _ = 1, 8 do if a % 2 ~= b % 2 then r = r + bit end; a=math.floor(a/2); b=math.floor(b/2); bit=bit*2 end
  return r
end
local function rol8(v,r)
  r=r%8; if r==0 then return v end
  return ((v*(2^r))%256)+math.floor(v/(2^(8-r)))
end
local function inv8(a)
  a=a%256
  for x=1,255,2 do if (a*x)%256==1 then return x end end
  error("bad affine multiplier")
end
local function seq_hash(values)
  local h=0
  for i=1,#values do h=(h*131+values[i])%2147483647 end
  return h
end
local function key_for(seed0,offset,pos,prev,state,mult,add,mix,salt,mode,state_mix)
  if mode==1 then return (seed0+offset+pos*mult+prev*mix+state*state_mix)%256 end
  if mode==2 then return (seed0+offset+pos*mult+prev*mix+add+state*state_mix)%256 end
  if mode==3 then return (seed0+offset+pos*mix+prev*mult+salt+state*state_mix)%256 end
  return (seed0+offset+(pos+prev)*mult+add+prev*mix+state*state_mix)%256
end
local function ror8(v,r)
  r=r%8;if r==0 then return v%256 end
  return (math.floor(v/(2^r)) + (v%(2^r))*(2^(8-r)))%256
end
local function decoder_code(vn, stored, order, seed0, mult, add, mix, salt, rot, affine, inv_affine, mode, state_seed, state_mul, state_add, state_mix, layout_affine, layout_inv, layout_salt, layout_mode, gvar, tag, master, gsv)
  local d,o,p,st,idx,z,tmp,keyv,bytev,hv = ni(),ni(),ni(),ni(),ni(),ni(),ni(),ni(),ni(),ni()
  local off = master and "0" or gvar
  local out = {}
  out[#out+1] = "local "..vn
  if master then out[#out+1] = ","..gsv end
  out[#out+1] = "=(function()"
  out[#out+1] = "local "..d.."={"..table.concat(stored,",").."};local "..o.."={};local "..p.."="..seed0..";local "..st.."=("..seed0.."*17+"..state_seed..")%256;local "..hv.."=0;local imnot_map={"..table.concat(order,",").."};"
  out[#out+1] = "for "..idx.."=1,#"..d.." do "..hv.."=("..hv.."*131+"..d.."["..idx.."])%2147483647 end;for "..idx.."=1,#imnot_map do "..hv.."=("..hv.."*131+imnot_map["..idx.."])%2147483647 end;"
  for _,v in ipairs({seed0,mult,add,mix,salt,rot,affine,mode,state_seed,state_mul,state_add,state_mix,layout_affine,layout_salt,layout_mode}) do out[#out+1]=hv.."=("..hv.."*131+"..v..")%2147483647;" end
  out[#out+1] = "if "..hv.."%65536~="..tag.." then error() end;"
  if layout_mode==1 then
    out[#out+1] = "for "..idx.."=1,#"..d.." do local "..z.."=(("..d.."[imnot_map["..idx.."]]-"..layout_salt..")*"..layout_inv..")%256;local "..tmp.."=("..z.."-"..p.."-"..add.."-"..st..")%256;"
  elseif layout_mode==2 then
    out[#out+1] = "for "..idx.."=1,#"..d.." do local "..z.."=(("..d.."[imnot_map["..idx.."]]+"..((256-layout_salt)%256)..")*"..layout_inv..")%256;local "..tmp.."=("..z.."-"..p.."-"..add.."-"..st..")%256;"
  else
    out[#out+1] = "for "..idx.."=1,#"..d.." do local "..z.."=(("..d.."[imnot_map["..idx.."]]*"..layout_inv..")-(("..layout_salt.."*"..layout_inv..")%256))%256;local "..tmp.."=("..z.."-"..p.."-"..add.."-"..st..")%256;"
  end
  out[#out+1] = tmp.."=(("..tmp.."-"..salt..")*"..inv_affine..")%256;"
  out[#out+1] = tmp.."=(("..tmp.."%"..(2^rot)..")*"..(2^(8-rot))..")+math.floor("..tmp.."/"..(2^rot)..");"
  if mode==1 then out[#out+1] = "local "..keyv.."=("..seed0.."+"..off.."+"..idx.."*"..mult.."+"..p.."*"..mix.."+"..st.."*"..state_mix..")%256;"
  elseif mode==2 then out[#out+1] = "local "..keyv.."=("..seed0.."+"..off.."+"..idx.."*"..mult.."+"..p.."*"..mix.."+"..add.."+"..st.."*"..state_mix..")%256;"
  elseif mode==3 then out[#out+1] = "local "..keyv.."=("..seed0.."+"..off.."+"..idx.."*"..mix.."+"..p.."*"..mult.."+"..salt.."+"..st.."*"..state_mix..")%256;"
  else out[#out+1] = "local "..keyv.."=("..seed0.."+"..off.."+("..idx.."+"..p..")*"..mult.."+"..add.."+"..p.."*"..mix.."+"..st.."*"..state_mix..")%256;" end
  out[#out+1] = tmp.."=("..tmp.."-"..idx.."*"..add.."-"..p.."*"..mix.."-"..st.."*"..state_mix.."-"..salt..")%256;"
  out[#out+1] = "local imnot_bv=1;local imnot_av="..tmp..";local imnot_kv="..keyv..";local imnot_x=0;for imnot_bit=1,8 do if imnot_av%2~=imnot_kv%2 then imnot_x=imnot_x+imnot_bv end;imnot_av=math.floor(imnot_av/2);imnot_kv=math.floor(imnot_kv/2);imnot_bv=imnot_bv*2 end;"..bytev.."=imnot_x;"
  out[#out+1] = o.."["..idx.."]=".."string.char("..bytev..");"..st.."=("..z.."*"..state_mul.."+"..idx.."*"..state_add.."+"..seed0..")%256;"..p.."="..z..";end;"
  if master then
    out[#out+1] = "local "..hv.."=0;for "..idx.."=1,#"..d.." do local imnot_layout_z=(("..d.."[imnot_map["..idx.."]]-"..layout_salt..")*"..layout_inv..")%256;"..hv.."=("..hv.."*131+imnot_layout_z)%2147483647 end;"..hv.."="..hv.."%256;return table.concat("..o.."),"..hv..";end)()"
  else
    out[#out+1] = "return table.concat("..o..");end)()"
  end
  return table.concat(out)
end

local function bs(str)
  local master=(gseed_name==nil);local vn=ni()
  local seed0,mult,add,mix,salt,rot,affine,mode=rnd(0,255),rnd(1,255),rnd(1,255),rnd(1,255),rnd(1,255),rnd(1,7),rnd(1,255),rnd(1,4)
  if affine%2==0 then affine=affine+1 end;if affine>255 then affine=255 end
  local inv_affine=inv8(affine)
  local state_seed,state_mul,state_add,state_mix=rnd(0,255),rnd(1,255),rnd(1,255),rnd(1,255)
  if state_mul%2==0 then state_mul=state_mul+1 end;if state_mul>255 then state_mul=255 end
  local layout_affine=rnd(1,255);if layout_affine%2==0 then layout_affine=layout_affine+1 end;if layout_affine>255 then layout_affine=255 end
  local layout_inv=inv8(layout_affine);local layout_salt,layout_mode=rnd(1,255),rnd(1,3)
  local offset=master and 0 or gseed_value;local enc,prev={},seed0;local state=(seed0*17+state_seed)%256
  for i=1,#str do
    local b=string.byte(str,i);local k=key_for(seed0,offset,i,prev,state,mult,add,mix,salt,mode,state_mix)
    local x=xor8(b,k);x=(x+i*add+prev*mix+state*state_mix+salt)%256;x=rol8(x,rot);x=(x*affine+salt)%256
    local z=(x+prev+add+state)%256;enc[#enc+1]=z;state=(z*state_mul+i*state_add+seed0)%256;prev=z
  end
  local order={};for i=1,#enc do order[i]=i end;shuffle(order)
  local stored={};for i=1,#enc do stored[i]=0 end;for logical=1,#enc do local physical=order[logical];stored[physical]=(enc[logical]*layout_affine+layout_salt)%256 end
  local vals={};for i=1,#stored do vals[#vals+1]=stored[i] end;for i=1,#order do vals[#vals+1]=order[i] end;for _,v in ipairs({seed0,mult,add,mix,salt,rot,affine,mode,state_seed,state_mul,state_add,state_mix,layout_affine,layout_salt,layout_mode}) do vals[#vals+1]=v end
  local tag=seq_hash(vals)%65536
  if master then local gsv=ni();decoders[#decoders+1]=decoder_code(vn,stored,order,seed0,mult,add,mix,salt,rot,affine,inv_affine,mode,state_seed,state_mul,state_add,state_mix,layout_affine,layout_inv,layout_salt,layout_mode,nil,tag,true,gsv);gseed_name=gsv;gseed_value=seq_hash(enc)%256 else decoders[#decoders+1]=decoder_code(vn,stored,order,seed0,mult,add,mix,salt,rot,affine,inv_affine,mode,state_seed,state_mul,state_add,state_mix,layout_affine,layout_inv,layout_salt,layout_mode,gseed_name,tag,false,nil) end
  return vn
end

local function long_open(code,pos)
  if code:sub(pos,pos) ~= "[" then return nil end
  local j,eq=pos+1,0
  while code:sub(j,j)=="=" do eq=eq+1;j=j+1 end
  if code:sub(j,j)=="[" then return eq,j+1 end
end
local function remove_comments(code)
  local out={};local i=1
  while i<=#code do
    local ch=code:sub(i,i)
    if ch=="'" or ch=='"' then
      local q=ch;out[#out+1]=q;i=i+1
      while i<=#code do local c=code:sub(i,i);out[#out+1]=c;i=i+1;if c=="\\" and i<=#code then out[#out+1]=code:sub(i,i);i=i+1 elseif c==q then break end end
    elseif ch=="[" then
      local eq,j=long_open(code,i)
      if eq then local close="]"..string.rep("=",eq).."]";local k=code:find(close,j,true);if k then out[#out+1]=code:sub(i,k+#close-1);i=k+#close else out[#out+1]=ch;i=i+1 end else out[#out+1]=ch;i=i+1 end
    elseif ch=="-" and code:sub(i+1,i+1)=="-" then
      local eq,j=long_open(code,i+2)
      if eq then local close="]"..string.rep("=",eq).."]";local k=code:find(close,j,true);if not k then error("unterminated long comment") end;i=k+#close
      else while i<=#code and code:sub(i,i)~="\n" do i=i+1 end end
    else out[#out+1]=ch;i=i+1 end
  end
  return table.concat(out)
end

local function unescape(raw)
  local out={};local i=1
  local map={a="\a",b="\b",f="\f",n="\n",r="\r",t="\t",v="\v",["\\"]="\\",["\""]="\"",["'"]="'"}
  while i<=#raw do local c=raw:sub(i,i);if c~="\\" then out[#out+1]=c;i=i+1 else i=i+1;if i>#raw then break end;c=raw:sub(i,i);if map[c] then out[#out+1]=map[c];i=i+1 elseif c=="z" then i=i+1;while i<=#raw and raw:sub(i,i):match("%s") do i=i+1 end elseif c=="x" and raw:sub(i+1,i+2):match("^[0-9A-Fa-f][0-9A-Fa-f]$") then out[#out+1]=string.char(tonumber(raw:sub(i+1,i+2),16));i=i+3 elseif c:match("%d") then local j=i;while j<=#raw and j<i+3 and raw:sub(j,j):match("%d") do j=j+1 end;out[#out+1]=string.char(tonumber(raw:sub(i,j-1))%256);i=j else out[#out+1]=c;i=i+1 end end end
  return table.concat(out)
end
local function extract_strings(code)
  local strings,res={},{};local i=1
  while i<=#code do local ch=code:sub(i,i)
    if ch=="'" or ch=='"' then local q=ch;i=i+1;local raw={};while i<=#code and code:sub(i,i)~=q do local c=code:sub(i,i);raw[#raw+1]=c;i=i+1;if c=="\\" and i<=#code then raw[#raw+1]=code:sub(i,i);i=i+1 end end;if i>#code then error("unterminated string") end;i=i+1;strings[#strings+1]=unescape(table.concat(raw));res[#res+1]="__STR_"..(#strings-1).."__"
    else local eq,j=long_open(code,i);if eq then local close="]"..string.rep("=",eq).."]";local k=code:find(close,j,true);if not k then error("unterminated long string") end;strings[#strings+1]=code:sub(j,k-1);res[#res+1]="__STR_"..(#strings-1).."__";i=k+#close else res[#res+1]=ch;i=i+1 end end
  end
  return table.concat(res),strings
end

local reserved={}
for _,w in ipairs({'and','break','do','else','elseif','end','false','for','function','goto','if','in','local','nil','not','or','repeat','return','then','true','until','while','continue','type','export','typeof','print','warn','pairs','ipairs','next','select','unpack','rawget','rawset','rawequal','rawlen','tonumber','tostring','pcall','xpcall','error','assert','setmetatable','getmetatable','require','table','string','math','coroutine','os','io','debug','bit32','utf8','task','wait','spawn','delay','tick','time','game','workspace','script','Instance','Vector3','Vector2','CFrame','Color3','BrickColor','UDim','UDim2','Enum','Ray','Region3','TweenInfo','NumberRange','NumberSequence','ColorSequence','Rect','Font','Axes','Faces','Players','RunService','UserInputService','ReplicatedStorage','ServerStorage','ServerScriptService','StarterGui','StarterPack','StarterPlayer','CoreGui','Lighting','Debris','HttpService','MarketplaceService','DataStoreService','PathfindingService','PhysicsService','SoundService','TextService','Chat','Teams','TestService','CollectionService','VirtualInputManager','_G','_VERSION','shared','self','new','New','clone','Clone','Destroy','destroy','FindFirstChild','WaitForChild','GetChildren','GetDescendants','IsA','GetService','Connect','Fire','Invoke','insert','remove','sort','concat','find','sub','len','rep','reverse','upper','lower','byte','char','format','match','gmatch','gsub','abs','ceil','floor','max','min','sqrt','random','randomseed','sin','cos','tan','huge','pi','clamp','lerp','getfenv','setfenv','loadstring','load','dofile','collectgarbage'}) do reserved[w]=true end
local function lex_for_rename(code)
  local t={};local i=1
  while i<=#code do
    local c=code:sub(i,i)
    if c:match("%s") then local j=i+1;while j<=#code and code:sub(j,j):match("%s") do j=j+1 end;t[#t+1]={"ws",code:sub(i,j-1)};i=j
    elseif c:match("[A-Za-z_]") then local w=code:sub(i):match("^[A-Za-z_][A-Za-z0-9_]*");t[#t+1]={"id",w};i=i+#w
    else
      local two=code:sub(i,i+1);if two=="::" or two=="==" or two=="~=" or two=="<=" or two==">=" or two==".." then t[#t+1]={"sym",two};i=i+2 else t[#t+1]={"sym",c};i=i+1 end
    end
  end
  return t
end
local function rename_vars(code)
  local toks=lex_for_rename(code);local sig={}
  for i=1,#toks do if toks[i][1]~="ws" then sig[#sig+1]=i end end
  local vm={};local order={}
  local function add(name)
    if name:sub(1,7)=="__STR_" or reserved[name] then return end
    if not vm[name] then vm[name]=ni();order[#order+1]=name end
  end
  local i=1
  while i<=#sig do
    local idx=sig[i];local v=toks[idx][2]
    if v=="local" then
      local j=i+1
      if j<=#sig and toks[sig[j]][2]=="function" then
        j=j+1;if j<=#sig and toks[sig[j]][1]=="id" then add(toks[sig[j]][2]) end
      else
        while j<=#sig do local q=toks[sig[j]][2];if q=="=" or q=="function" then break end;if toks[sig[j]][1]=="id" then add(q) end;j=j+1 end
      end
    elseif v=="for" then
      local j=i+1
      while j<=#sig do local q=toks[sig[j]][2];if q=="=" or q=="in" or q=="do" then break end;if toks[sig[j]][1]=="id" then add(q) end;j=j+1 end
    elseif v=="function" then
      local j=i+1
      while j<=#sig and toks[sig[j]][2]~="(" do j=j+1 end
      if j<=#sig then
        j=j+1;local depth=1
        while j<=#sig and depth>0 do
          local q=toks[sig[j]][2]
          if q=="(" then depth=depth+1 elseif q==")" then depth=depth-1 elseif depth==1 and toks[sig[j]][1]=="id" then
            local prev=toks[sig[j-1]][2] or "";local nxt=(j<#sig and toks[sig[j+1]][2]) or ""
            if prev~="." and prev~=":" and prev~="<" and nxt~=":" then add(q) end
          end
          j=j+1
        end
      end
    end
    i=i+1
  end
  local out={};local sigpos=0;local brace=0
  for ti=1,#toks do
    local kind,val=toks[ti][1],toks[ti][2]
    if kind=="ws" then out[#out+1]=val
    else
      sigpos=sigpos+1;local prev=(sigpos>1 and toks[sig[sigpos-1]][2]) or "";local nxt=(sigpos<#sig and toks[sig[sigpos+1]][2]) or "";local nv=val
      if kind=="id" and vm[val] and val:sub(1,7)~="__STR_" then
        if prev~="." and prev~=":" and prev~="::" and nxt~="::" and not (nxt=="=" and (prev=="{" or prev==",")) then nv=vm[val] end
      end
      out[#out+1]=nv
      if val=="{" then brace=brace+1 elseif val=="}" then brace=math.max(0,brace-1) end
    end
  end
  return table.concat(out)
end
local function protect_require_ids(code)
  if roblox_type ~= "require" then return code end
  local function repl(n)
    local v=tonumber(n); if not v or v<1 then return n end
    local base=rnd(97,997); local parts={}; local rem=v
    while rem>0 do local q=rem%base; parts[#parts+1]=q; rem=math.floor(rem/base) end
    local acc=tostring(parts[#parts])
    for i=#parts-1,1,-1 do acc="(("..acc.."*"..base..")+"..parts[i]..")" end
    local noise=rnd(7,91)
    return "(function() local imnot_reqbase="..base.."; local imnot_reqx="..acc.."; local imnot_reqn="..noise.."; return (imnot_reqx+imnot_reqn-imnot_reqn) end)()"
  end
  return (code:gsub("require%s*%(%s*(%d%d*)%s*%)",repl))
end

local function obfuscate_numbers(code)
  return (code:gsub("([^%w_])(%d%d+)([^%w_])",function(a,n,b)local v=tonumber(n);if not v or v<10 or v>1000000 then return a..n..b end;local x=rnd(2,math.max(2,math.min(97,math.floor(v/2))));local y=math.floor(v/x);local r=v-x*y;if r==0 then return a.."("..x.."*"..y..")"..b end;return a.."(("..x.."*"..y..")+"..r..")"..b end))
end
local function garbage(count)
  local out={}
  for _=1,count do local v=ni();local r=rnd(1,6)
    if r==1 then out[#out+1]="local "..v.."=("..rnd(10,9999).."+"..rnd(10,9999)..")"
    elseif r==2 then out[#out+1]="local "..v.."=(function()local imnot_x="..rnd(1,999)..";return imnot_x end)()"
    elseif r==3 then local a={};for _=1,rnd(2,5) do a[#a+1]=rnd(1,255) end;out[#out+1]="local "..v.."={"..table.concat(a,",").."}"
    elseif r==4 then out[#out+1]="local "..v.."=(("..rnd(11,999)..">"..rnd(1,10)..") and 1 or 0)"
    elseif r==5 then out[#out+1]="local "..v.."=#\""..string.rep("x",rnd(1,8)).."\""
    else out[#out+1]="local "..v.."=(("..rnd(2,50).."*"..rnd(2,50)..")%"..rnd(51,251)..")" end
  end
  return table.concat(out,";")
end

local function split_literal(str)
  if #str<12 then return {str} end
  local count=rnd(2,4);local cuts={};local seen={}
  while #cuts<count-1 do
    local c=rnd(1,#str-1);local nextb=string.byte(str,c+1) or 0
    if nextb<128 or nextb>=192 then if not seen[c] then seen[c]=true;cuts[#cuts+1]=c end end
  end
  table.sort(cuts);local parts={};local last=1
  for _,c in ipairs(cuts) do parts[#parts+1]=str:sub(last,c);last=c+1 end
  parts[#parts+1]=str:sub(last);return parts
end

local function obfuscate(src)
  ic=0;decoders={};gseed_name=nil;gseed_value=0
  local clean=remove_comments(src);local skeleton,strings=extract_strings(clean);local body=obfuscate_numbers(rename_vars(skeleton))
  body=protect_require_ids(body)
  for i=1,#strings do local pieces=split_literal(strings[i]);local refs={};for j=1,#pieces do refs[#refs+1]=bs(pieces[j]) end;local ref=refs[1];if #refs>1 then ref="("..table.concat(refs,"..")..")" end;body=body:gsub("__STR_"..(i-1).."__",function()return ref end,1) end
  local bce,bcp,bcts,bcty=bs("error"),bs("pcall"),bs("tostring"),bs("type")
  local bcni,bcix,bcdb,bcgi,bcco,bcc=bs("__newindex"),bs("__index"),bs("debug"),bs("getinfo"),bs("coroutine"),bs("C")
  local tm,tm2,tm3,im,eem=bs('LOOL imagine you use the 25ms and Threaded to skid this thing lel'),bs('holy skid'),bs('nice try skid, but this aint gonna work for you lmaooo'),bs('integrity check failed successfully. this script has been modified.'),bs('execute script error')
  local env,fn,ok,err,prot,pr,wr,er,pc,ty=ni(),ni(),ni(),ni(),ni(),ni(),ni(),ni(),ni(),ni()
  local a={ni(),ni(),ni(),ni(),ni(),ni(),ni()};local hashv,mirror,checker,state=ni(),ni(),ni(),ni()
  local hash=seq_hash({string.byte(body,1,#body)})
  local checks={
    "local "..a[1].."=(function()local imnot_ok,imnot_t="..pc.."(function()return "..ty.."("..er..")==\"function\"end);if not imnot_ok or not imnot_t then "..er.."("..tm..")end;return true end)()",
    "local "..a[2].."=(function()local imnot_checks={"..bce..","..bcp..","..bcts..","..bcty.."};for imnot_ci=1,#imnot_checks do local imnot_fn="..env.."[imnot_checks[imnot_ci]];if "..ty.."(imnot_fn)~=\"function\"then "..er.."("..tm2..")end end;return true end)()",
    "local "..a[3].."=(function()local imnot_dok,imnot_dlib="..pc.."(function()return "..env.."["..bcdb.."]end);if imnot_dok and imnot_dlib then local imnot_ghok,imnot_gh="..pc.."(function()return imnot_dlib["..bcgi.."]end);if imnot_ghok and imnot_gh then local imnot_info=imnot_gh(1);if imnot_info and imnot_info.what=="..bcc.." then "..er.."("..tm3..")end end end;return true end)()",
    "local "..a[4].."=setmetatable("..prot..",{["..bcni.."]=function()"..er.."("..tm..")end,["..bcix.."]=function(_,imnot_key)if imnot_key=="..hashv.." then return true end;return nil end})",
    "local "..a[5].."=(function()local imnot_cok,imnot_clib="..pc.."(function()return "..env.."["..bcco.."]end);if imnot_cok and imnot_clib and imnot_clib.running then imnot_clib.running()end;return true end)()",
    "local "..a[6].."=(function()local imnot_c1ok,imnot_c1="..pc.."(function()return os.clock()end);if not imnot_c1ok or type(imnot_c1)~=\"number\"then return true end;local imnot_acc=0;for imnot_ti=1,20000 do imnot_acc=imnot_acc+imnot_ti end;local imnot_c2ok,imnot_c2="..pc.."(function()return os.clock()end);if imnot_c2ok and type(imnot_c2)==\"number\" and (imnot_c2-imnot_c1)>2 then "..er.."("..tm3..")end;return true end)()",
    "local "..a[7].."=(function()local imnot_rwok,imnot_rwr="..pc.."(function()return rawequal(1,1)end);if not imnot_rwok or imnot_rwr~=true then "..er.."("..tm2..")end;return true end)()"
  }
  shuffle(checks);local names=shuffle({a[1],a[2],a[3],a[5],a[6],a[7]});local cond="not "..table.concat(names," or not ")
  local raw={table.concat(decoders,";"),"local "..env.."=_G","local "..pr.."=print","local "..wr.."=warn","local "..er.."=error","local "..pc.."=pcall","local "..ty.."=typeof or type",garbage(12),"local "..prot.."={}","local "..hashv.."="..hash,table.concat(checks,";"),garbage(16),"local "..mirror.."="..hash,"local "..checker.."=function()if "..mirror.."~="..hashv.." then "..er.."("..im..")end end",checker.."()","local "..fn.."=function()"..checker.."();"..body.." end",garbage(10),"local "..state.."=(function()if "..cond.." then "..er.."("..tm..")end;return true end)()","local "..ok..","..err.."="..pc.."("..fn..")","if not "..ok.." then local imnot_handler="..wr.." or "..pr.." or function(...)end;imnot_handler("..eem..")end"}
  return HEADER.."\n"..table.concat(raw,";")
end

local result
local ok, e = pcall(function() result = obfuscate(source) end)
if not ok then print("ERROR: "..tostring(e)); os.exit(1) end
local out=io.open(output_file,"w")
if not out then print("ERROR: Cannot open output file");os.exit(1) end
out:write(result);out:close();print("OK")
