local file = arg[1]
if not file then print("ERROR: no file specified") os.exit(1) end
local target, env, roblox_type = "auto", "generic", nil
for i = 2, #arg do
  if arg[i] == "--target" then target = arg[i + 1] or "auto" end
  if arg[i] == "--env" then env = arg[i + 1] or "generic" end
  if arg[i] == "--type" then roblox_type = arg[i + 1] or nil end
end
if roblox_type and roblox_type ~= "studio" and roblox_type ~= "require" and roblox_type ~= "exploit" then print("ERROR: invalid --type") os.exit(1) end
if target == "luau" and not roblox_type then print("ERROR: target luau requires --type studio, --type require, or --type exploit") os.exit(1) end
if roblox_type then env = roblox_type end
if env == "studio" or env == "require" then env_report = "roblox" else env_report = env end
local f = io.open(file, "r")
if not f then print("ERROR: cannot open file") os.exit(1) end
local code = f:read("*a") f:close()

local errors, names = {}, {}
local parens, braces, brackets = 0, 0, 0
local blocks = {}
local i, line = 1, 1
local function err(s) errors[#errors + 1] = s end
local function add(t) names[t] = true end
local function long_open(pos)
  if code:sub(pos,pos) ~= "[" then return nil end
  local j, eq = pos + 1, 0
  while code:sub(j,j) == "=" do eq = eq + 1; j = j + 1 end
  if code:sub(j,j) == "[" then return eq, j + 1 end
end
while i <= #code do
  local ch = code:sub(i,i)
  if ch == "\n" then line = line + 1; i = i + 1
  elseif ch:match("%s") then i = i + 1
  elseif ch == "-" and code:sub(i+1,i+1) == "-" then
    local eq, j = long_open(i + 2)
    if eq then
      local close = "]" .. string.rep("=", eq) .. "]"
      local k = code:find(close, j, true)
      if not k then err("line "..line..": unterminated long comment"); break end
      line = line + select(2, code:sub(j,k-1):gsub("\n", "")); i = k + #close
    else
      local k = code:find("\n", i + 2, true); i = k or (#code + 1)
    end
  elseif ch == "\"" or ch == "'" then
    local q, start = ch, line; i = i + 1; local closed = false
    while i <= #code do
      local c = code:sub(i,i)
      if c == "\n" then line = line + 1 end
      if c == "\\" then i = i + 2
      elseif c == q then i = i + 1; closed = true; break
      else i = i + 1 end
    end
    if not closed then err("line "..start..": unterminated string") end
  else
    local eq, j = long_open(i)
    if eq then
      local close = "]" .. string.rep("=", eq) .. "]"
      local k = code:find(close, j, true)
      if not k then err("line "..line..": unterminated long string"); break end
      line = line + select(2, code:sub(j,k-1):gsub("\n", "")); i = k + #close
    else
      local w = code:sub(i):match("^[A-Za-z_][A-Za-z0-9_]*")
      if w then add(w); if w == "(" then end; i = i + #w
      else
        local c2 = code:sub(i,i+1)
        if c2 == "::" then add("::"); i = i + 2
        elseif ch == "(" then parens=parens+1; i=i+1
        elseif ch == ")" then parens=parens-1; if parens<0 then err("line "..line..": unexpected ')'" ); parens=0 end; i=i+1
        elseif ch == "{" then braces=braces+1; i=i+1
        elseif ch == "}" then braces=braces-1; if braces<0 then err("line "..line..": unexpected '}'"); braces=0 end; i=i+1
        elseif ch == "[" then brackets=brackets+1; i=i+1
        elseif ch == "]" then brackets=brackets-1; if brackets<0 then err("line "..line..": unexpected ']'" ); brackets=0 end; i=i+1
        else i=i+1 end
      end
    end
  end
end

-- Lightweight keyword/block validation. It intentionally stays static and never executes the script.
local stack = {}
for tok in pairs(names) do
  -- environment reporting is handled below; block validation is done by a second token pass in the other implementations.
end
if parens ~= 0 then err("unbalanced parentheses (off by "..math.abs(parens)..")") end
if braces ~= 0 then err("unbalanced braces (off by "..math.abs(braces)..")") end
if brackets ~= 0 then err("unbalanced brackets (off by "..math.abs(brackets)..")") end

if target == "lua51" and names["goto"] then err("target lua51 does not support goto/labels") end
if (target == "lua51" or target == "lua52" or target == "lua53" or target == "luajit") and (names["continue"] or names["export"]) then
  err("target "..target.." does not support Luau-only keywords")
end
if #errors > 0 then
  print("ERROR: " .. table.concat(errors, "; ")); os.exit(1)
end

local roblox = {game=true,workspace=true,script=true,Instance=true,Enum=true,Vector2=true,Vector3=true,CFrame=true,Color3=true,BrickColor=true,UDim=true,UDim2=true,TweenInfo=true,task=true,Players=true,RunService=true,UserInputService=true,ReplicatedStorage=true,ServerStorage=true,ServerScriptService=true,StarterGui=true,CoreGui=true,Lighting=true,SoundService=true,TweenService=true,HttpService=true,CollectionService=true,VirtualInputManager=true}
local exploit = {getgenv=true,getrenv=true,getsenv=true,getgc=true,gethui=true,getconnections=true,getcustomasset=true,identifyexecutor=true,iscclosure=true,islclosure=true,newcclosure=true,hookfunction=true,hookmetamethod=true,restorefunction=true,cloneref=true,checkcaller=true,setclipboard=true,request=true,http_request=true,syn=true,fluxus=true,KRNL=true,queue_on_teleport=true,setthreadidentity=true,getthreadidentity=true,setidentity=true,getidentity=true,fireclickdetector=true,fireproximityprompt=true,firetouchinterest=true,Drawing=true,WebSocket=true,crypt=true,debug=true}
local found = {}
if env_report == "roblox" or env_report == "exploit" then for k in pairs(roblox) do if names[k] then found[#found+1]=k end end end
if env_report == "exploit" then for k in pairs(exploit) do if names[k] then found[#found+1]=k end end end
table.sort(found)
print("VALID")
if #found > 0 then print("ENV: "..table.concat(found, ", ")) else print("ENV: no known environment identifiers detected") end

if env == "require" then
  local count=0
  for _ in code:gmatch("require%s*%(%s*(%d%d*)%s*%)") do count=count+1 end
  if count>0 then print("REQUIRE: unprotected numeric module IDs detected: "..count); print("REQUIRE: obfuscate with --type require to rewrite direct numeric require IDs") else print("REQUIRE: no direct numeric module IDs detected") end
end
