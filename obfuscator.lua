local input_file = arg[1]
local output_file = arg[2]
if not input_file or not output_file then
  print("Usage: lua obfuscator.lua <input> <output>")
  os.exit(1)
end
local f = io.open(input_file, "r")
if not f then
  print("ERROR: Cannot open input file")
  os.exit(1)
end
local source = f:read("*a")
f:close()
math.randomseed(os.time() + math.random(1,100000))

local HEADER = [==[--!nocheck
--[[
$$\                                    $$\     $$$$$$$$\                                      $$\
\__|                                   $$ |    $$  _____|                                     $$ |
$$\ $$$$$$\$$$$\  $$$$$$$\   $$$$$$\ $$$$$$\   $$ |   $$\   $$\  $$$$$$$\  $$$$$$$\ $$$$$$\ $$$$$$\    $$$$$$\   $$$$$$\
$$ |$$  _$$  _$$\ $$  __$$\ $$  __$$\\_$$  _|  $$$$$\ $$ |  $$ |$$  _____|$$  _____|\____$$\\_$$  _|  $$  __$$\ $$  __$$\
$$ |$$ / $$ / $$ |$$ |  $$ |$$ /  $$ | $$ |    $$  __|$$ |  $$ |\$$$$$$\  $$ /      $$$$$$$ | $$ |    $$ /  $$ |$$ |  \__|
$$ |$$ | $$ | $$ |$$ |  $$ |$$ |  $$ | $$ |$$\ $$ |   $$ |  $$ | \____$$\ $$ |     $$  __$$ | $$ |$$\ $$ |  $$ |$$ |
$$ |$$ | $$ | $$ |$$ |  $$ |\$$$$$$  | \$$$$  |$$ |   \$$$$$$  |$$$$$$$  |\$$$$$$$\\$$$$$$$ | \$$$$  |\$$$$$$  |$$ |
\__|\__| \__| \__|\__|  \__| \______/   \____/ \__|    \______/ \_______/  \_______|\_______|  \____/  \______/ \__|

                                                                                                                          Fully made by imnotexploi4 - V3 UPGRADED
]] -- imnotFuscator V3.0]==]

local FNV_INIT = 2166136261
local FNV_PRIME = 16777619
local MOD_HASH = 2147483647

local ic = 0
local bd = {}

local function sr(a,b) return math.random(a,b) end

local function ni()
  ic = ic + 1
  local conf = {'l','I','i','_','L'}
  local letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
  local suffix = ''
  local l = sr(1,3)
  for _=1,l do
    if math.random() < 0.6 then suffix = suffix .. conf[sr(1,#conf)]
    else
      local idx = sr(1,#letters)
      suffix = suffix .. letters:sub(idx,idx)
    end
  end
  return "imnot" .. ic .. suffix
end

local function mx(a, b)
  local r, bv = 0, 1
  for _ = 1, 8 do
    if a % 2 ~= b % 2 then r = r + bv end
    a = math.floor(a / 2)
    b = math.floor(b / 2)
    bv = bv * 2
  end
  return r % 256
end

local function rl(v, r)
  if r == 0 then return v % 256 end
  local result = ((v * (2 ^ r)) % 256) + math.floor(v / (2 ^ (8 - r)))
  return math.tointeger(result) or math.floor(result)
end

local function fill(template, subs)
  local s = template
  for k, v in pairs(subs) do
    s = s:gsub("@" .. k .. "@", tostring(v))
  end
  return s
end

local function shuffle(t)
  for i = #t, 2, -1 do
    local j = math.random(1, i)
    t[i], t[j] = t[j], t[i]
  end
  return t
end

local gseed_name = nil
local gseed_value = 0

local SERVICE_LIST = {"Players","ReplicatedStorage","Workspace","Lighting","StarterGui","Teams","SoundService","Chat","HttpService","RunService","UserInputService","TweenService"}
local INSTANCE_LIST = {"Part","Script","LocalScript","RemoteEvent","RemoteFunction","Folder","Model","ScreenGui"}
local OPAQUE_TRUE = {'((10*10)==100)','((math.sqrt(16)==4))','(#{1,2,3}==3)','(string.len("imnot")==5)','((5%2)==1)','(math.floor(7.9)==7)','(not false)','((false==false))','((2^3)==8)'}
local OPAQUE_FALSE = {'((10*10)==99)','((math.sqrt(16)==5))','(#{1,2,3}==4)','((5%2)==0)','((true==false))','((1+1)==3)'}

local MASTER_TPL = [[local @VN@,@GSV@=(function() local @D@={@ENC@};local @O@="";local @GS@=@FNV_INIT@;for @I1@=1,#@D@ do @GS@=(@GS@*@FNV_PRIME@+@D@[@I1@])%2147483647 end;@GS@=@GS@%256;for @I2@=1,#@D@ do local @BV@=@D@[@I2@];local @UR@=((@BV@*(2^(8-@ROT@)))%256)+math.floor(@BV@/(2^@ROT@));local @KX@=(@SEED@+@I2@*@MULT@+@I2@*@I2@*@PRIME@)%256;local @SB@=(@UR@-@ADD@+256)%256;local @RV@=0;local @VV@=1;local @AV@=@SB@;local @KV@=@KX@;for _=1,8 do if @AV@%2~=@KV@%2 then @RV@=@RV@+@VV@ end;@AV@=math.floor(@AV@/2);@KV@=math.floor(@KV@/2);@VV@=@VV@*2 end;@O@=@O@..string.char(@RV@) end;return @O@,@GS@ end)()]]

local NORMAL_TPL = [[local @VN@=(function():string local @D@={@ENC@};local @O@="";for @I2@=1,#@D@ do local @BV@=@D@[@I2@];local @UR@=((@BV@*(2^(8-@ROT@)))%256)+math.floor(@BV@/(2^@ROT@));local @KX@=(@SEED@+@GSVAR@+@I2@*@MULT@+@I2@*@I2@*@PRIME@)%256;local @SB@=(@UR@-@ADD@+256)%256;local @RV@=0;local @VV@=1;local @AV@=@SB@;local @KV@=@KX@;for _=1,8 do if @AV@%2~=@KV@%2 then @RV@=@RV@+@VV@ end;@AV@=math.floor(@AV@/2);@KV@=math.floor(@KV@/2);@VV@=@VV@*2 end;@O@=@O@..string.char(@RV@) end;return @O@ end)()]]

local function bs(str)
  local is_master = (gseed_name == nil)
  local vn = ni()
  local bytes = {}
  for c = 1, #str do
    table.insert(bytes, string.byte(str, c) % 256)
  end
  local seed = sr(0,255)
  local mult = sr(1,255)
  if mult % 2 == 0 then mult = mult + 1 end
  if mult >255 then mult= mult-1 end
  local rot = sr(1,7)
  local add = sr(0,255)
  local primes = {3,5,7,11,13,17,19,31,53,97}
  local prime = primes[sr(1,#primes)]
  local offset = is_master and 0 or gseed_value
  local xored = {}
  for i, b in ipairs(bytes) do
    local key = (seed + offset + i * mult + i*i*prime) % 256
    local x = mx(b, key)
    local tmp = (x + add) % 256
    table.insert(xored, rl(tmp, rot))
  end

  if is_master then
    local gsv = ni()
    local hash = FNV_INIT
    for _, val in ipairs(xored) do
      hash = (hash * FNV_PRIME + val) % MOD_HASH
    end
    local gval = hash % 256
    local stmt = fill(MASTER_TPL, {
      VN = vn, GSV = gsv, D = ni(), ENC = table.concat(xored, ","),
      O = ni(), GS = gsv, I1 = ni(), I2 = ni(), BV = ni(), UR = ni(),
      KX = ni(), SB = ni(), RV = ni(), VV = ni(), AV = ni(), KV = ni(),
      ROT = rot, SEED = seed, MULT = mult, ADD = add, PRIME = prime,
      FNV_INIT = FNV_INIT, FNV_PRIME = FNV_PRIME
    })
    table.insert(bd, stmt)
    gseed_name = gsv
    gseed_value = gval
  else
    local stmt = fill(NORMAL_TPL, {
      VN = vn, D = ni(), ENC = table.concat(xored, ","),
      O = ni(), I2 = ni(), BV = ni(), UR = ni(),
      KX = ni(), SB = ni(), RV = ni(), VV = ni(), AV = ni(), KV = ni(),
      ROT = rot, SEED = seed, MULT = mult, ADD = add, PRIME = prime, GSVAR = gseed_name
    })
    table.insert(bd, stmt)
  end
  return vn
end

local reserved = {}
for _, w in ipairs({
  "and","break","do","else","elseif","end","false","for","function",
  "goto","if","in","local","nil","not","or","repeat","return","then",
  "true","until","while","continue","type","export","typeof","print",
  "pairs","ipairs","next","select","unpack","rawget","rawset",
  "rawequal","rawlen","tonumber","tostring","pcall","xpcall","error",
  "warn","assert","setmetatable","getmetatable","require","table",
  "string","math","coroutine","os","io","debug","bit32","utf8",
  "task","wait","spawn","delay","tick","time","game","workspace",
  "script","Instance","Vector3","Vector2","CFrame","Color3",
  "BrickColor","UDim","UDim2","Enum","Ray","Region3","TweenInfo",
  "NumberRange","NumberSequence","ColorSequence","Rect","_G",
  "_VERSION","shared","self","new","Clone","Destroy",
  "FindFirstChild","WaitForChild","GetChildren","GetDescendants",
  "IsA","GetService","Connect","Fire","Invoke","insert","remove",
  "sort","concat","find","sub","len","rep","reverse","upper","lower",
  "byte","char","format","match","gmatch","gsub","abs","ceil",
  "floor","max","min","sqrt","random","randomseed","sin","cos","tan",
  "huge","pi","clamp","lerp","getfenv","setfenv","loadstring","load",
  "dofile","collectgarbage"
}) do
  reserved[w] = true
end

local function remove_comments(code)
  code = code:gsub("%-%-%[=*%[.-%]=*%]", "")
  code = code:gsub("%-%-%[%[(.-)%]%]", "")
  local lines = {}
  for line in code:gmatch("([^\n]*)\n?") do
    local result, in_string, str_char = "", false, ""
    local i = 1
    while i <= #line do
      local ch = line:sub(i, i)
      if in_string then
        result = result .. ch
        if ch == "\\" then
          i = i + 1
          if i <= #line then result = result .. line:sub(i, i) end
        elseif ch == str_char then
          in_string = false
        end
      else
        if ch == '"' or ch == "'" then
          in_string = true
          str_char = ch
          result = result .. ch
        elseif ch == '-' and i + 1 <= #line and line:sub(i+1,i+1) == '-' then
          break
        else
          result = result .. ch
        end
      end
      i = i + 1
    end
    table.insert(lines, result)
  end
  return table.concat(lines, "\n")
end

local function extract_strings(code)
  local strings, result, i = {}, "", 1
  while i <= #code do
    local ch = code:sub(i, i)
    if ch == '[' then
      local j = i+1
      local eq = 0
      while j <= #code and code:sub(j,j) == '=' do eq=eq+1; j=j+1 end
      if j <= #code and code:sub(j,j) == '[' then
        local close = ']' .. string.rep('=', eq) .. ']'
        local ep = code:find(close, j+1, true)
        if ep then
          table.insert(strings, code:sub(j+1, ep-1))
          result = result .. "__STR_" .. (#strings - 1) .. "__"
          i = ep + #close
        else
          result = result .. ch
          i = i + 1
        end
      else
        result = result .. ch
        i = i + 1
      end
    elseif ch == '"' or ch == "'" then
      local quote, str = ch, ""
      i = i + 1
      while i <= #code and code:sub(i, i) ~= quote do
        if code:sub(i, i) == '\\' then
          str = str .. code:sub(i, i)
          i = i + 1
          if i <= #code then
            str = str .. code:sub(i, i)
            i = i + 1
          end
        else
          str = str .. code:sub(i, i)
          i = i + 1
        end
      end
      if i <= #code then i = i + 1 end
      table.insert(strings, str)
      result = result .. "__STR_" .. (#strings - 1) .. "__"
    else
      result = result .. ch
      i = i + 1
    end
  end
  return result, strings
end

local function pe(str)
  return str:gsub("\\n", "\n"):gsub("\\t", "\t"):gsub("\\r", "\r")
    :gsub("\\\\", "\\"):gsub('\\"', '"'):gsub("\\'", "'")
end

local function rename_variables(code)
  local vm = {}
  for vn in code:gmatch("local%s+([a-zA-Z_][a-zA-Z0-9_]*)") do
    if not reserved[vn] and not vm[vn] then vm[vn] = ni() end
  end
  for vn in code:gmatch("local%s+function%s+([a-zA-Z_][a-zA-Z0-9_]*)") do
    if not reserved[vn] and not vm[vn] then vm[vn] = ni() end
  end
  for vn in code:gmatch("for%s+([a-zA-Z_][a-zA-Z0-9_]*)%s*[=,]") do
    if not reserved[vn] and not vm[vn] then vm[vn] = ni() end
  end
  for params in code:gmatch("function%s*[a-zA-Z0-9_.:]*%s*%(([^)]*)%)") do
    for param in params:gmatch("([a-zA-Z_][a-zA-Z0-9_]*)") do
      local clean = param:match("^([a-zA-Z_][a-zA-Z0-9_]*)") or param
      if not reserved[clean] and not vm[clean] then
        vm[clean] = ni()
      end
    end
  end
  local sorted = {}
  for orig, renamed in pairs(vm) do
    table.insert(sorted, { o = orig, r = renamed })
  end
  table.sort(sorted, function(a, b) return #a.o > #b.o end)
  local result = code
  for _, e in ipairs(sorted) do
    local escaped = e.o:gsub("([%(%)%.%%%+%-%*%?%[%]%^%$])", "%%%1")
    local pattern = "([^a-zA-Z0-9_.])" .. escaped .. "([^a-zA-Z0-9_])"
    for _ = 1, 3 do
      result = result:gsub(pattern, "%1" .. e.r .. "%2")
    end
    result = result:gsub(
      "^" .. escaped .. "([^a-zA-Z0-9_])", e.r .. "%1"
    )
    result = result:gsub(
      "([^a-zA-Z0-9_.])" .. escaped .. "$", "%1" .. e.r
    )
  end
  return result
end

local function encode_number(n)
  local r = sr(1,5)
  if r==1 then
    local a = sr(10,500)
    local b = sr(10,500)
    local c = a + b - n
    return string.format("(%d+%d-%d)", a,b,c)
  elseif r==2 then
    local a = sr(10,200)
    local b = n + a
    return string.format("(%d-%d)", b,a)
  elseif r==3 then
    local a = sr(2,20)
    local b = n * a
    return string.format("(math.floor(%d/%d))", b,a)
  elseif r==4 then
    if n < 256 then
      local x = sr(0,255)
      local y = mx(n % 256, x)
      return string.format("((function(a,b)local r=0;local v=1;for _=1,8 do if a%%2~=b%%2 then r=r+v end;a=math.floor(a/2);b=math.floor(b/2);v=v*2 end;return r end)(%d,%d))", x,y)
    else
      local a = sr(100,1000)
      return string.format("(%d+%d)", a, n-a)
    end
  else
    local a = sr(1,100)
    local b = sr(1,100)
    local c = sr(1,50)
    local target = a + b*c
    local diff = target - n
    return string.format("(%d+%d*%d-%d)", a,b,c,diff)
  end
end

local function obfuscate_numbers(code)
  code = code:gsub("([%s%(=+%-%*%%/;])%s*(%d+)%s*([^%w_%.])", function(pre, num, post)
    local n = tonumber(num)
    if not n or n>1000000 then return pre..num..post end
    if math.random() < 0.12 then return pre..num..post end
    return pre..encode_number(n)..post
  end)
  return code
end

local function obfuscate_booleans(code)
  local true_pool = {'(1==1)','(not false)','(#{1}==1)','(not nil)'}
  local false_pool = {'(1~=1)','(not true)','(nil==true)'}
  code = code:gsub("%f[%a]true%f[^%a]", function() return true_pool[sr(1,#true_pool)] end)
  code = code:gsub("%f[%a]false%f[^%a]", function() return false_pool[sr(1,#false_pool)] end)
  return code
end

local function gg(count, simple)
  local parts = {}
  for _ = 1, count do
    local v = ni()
    local r = simple and sr(1,5) or sr(1,12)
    if r == 1 then
      table.insert(parts, "local " .. v .. "=" .. sr(0, 999999))
    elseif r == 2 then
      table.insert(parts, "local " .. v .. "=(function()return " .. sr(0, 99999) .. " end)()")
    elseif r == 3 then
      local nums = {}
      for _ = 1, sr(2, 4) do table.insert(nums, sr(0, 999)) end
      table.insert(parts, "local " .. v .. "={" .. table.concat(nums, ",") .. "}")
    elseif r == 4 then
      table.insert(parts, "local " .. v .. "=" .. sr(0, 255) .. "+" .. sr(0, 255) .. "*" .. sr(1,5))
    elseif r == 5 then
      table.insert(parts, "local " .. v .. "=(function() if math.random()>=0 then return " .. sr(1, 100) .. " else return " .. sr(1, 100) .. " end end)()")
    elseif r == 6 then
      local svc = SERVICE_LIST[sr(1,#SERVICE_LIST)]
      table.insert(parts, 'local ' .. v .. '=(game and game.GetService and (function() local ok,res=pcall(function() return game:GetService("' .. svc .. '") end) return ok and res or nil end)() or nil)')
    elseif r == 7 then
      local inst = INSTANCE_LIST[sr(1,#INSTANCE_LIST)]
      table.insert(parts, 'local ' .. v .. '=(Instance and Instance.new and (function() local ok,res=pcall(function() return Instance.new("' .. inst .. '") end) return ok and res or nil end)() or nil)')
    elseif r == 8 then
      table.insert(parts, "local " .. v .. "=(Vector3 and Vector3.new and Vector3.new(" .. sr(0,100) .. "," .. sr(0,100) .. "," .. sr(0,100) .. ") or nil)")
    elseif r == 9 then
      local sq = sr(2, 50)
      table.insert(parts, "if((" .. sq .. "*" .. sq .. ")>=0)then local " .. v .. "=" .. sr(0, 999) .. " end")
    elseif r == 10 then
      local cond = OPAQUE_TRUE[sr(1,#OPAQUE_TRUE)]
      table.insert(parts, "local " .. v .. "=" .. cond .. " and " .. sr(0,500) .. " or " .. sr(0,500))
    elseif r == 11 then
      table.insert(parts, "local " .. v .. "=(CFrame and CFrame.new and CFrame.new(" .. sr(0,50) .. "," .. sr(0,50) .. "," .. sr(0,50) .. ") or nil)")
    else
      table.insert(parts, 'local ' .. v .. '=(workspace and workspace.FindFirstChild and (function() local ok,res=pcall(function() return workspace:FindFirstChild("' .. ni() .. '") end) return ok and res or nil end)() or nil)')
    end
  end
  return table.concat(parts, ";")
end

local function apply_control_flow(code)
  local stmts = {}
  for s in code:gmatch("([^;]+)") do
    local orig = s
    s = s:match("^%s*(.-)%s*$")
    if s and #s>0 then
      local is_local = s:match("^local%s")
      if not is_local and math.random() < 0.35 then
        local cond = OPAQUE_TRUE[sr(1,#OPAQUE_TRUE)]
        s = "if " .. cond .. " then " .. s .. " end"
      end
      table.insert(stmts, s)
      if math.random() < 0.18 then
        local condF = OPAQUE_FALSE[sr(1,#OPAQUE_FALSE)]
        table.insert(stmts, "if " .. condF .. " then " .. gg(1,true) .. " end")
      end
    end
  end
  return table.concat(stmts, ";")
end

local function minify(code)
  local lines = {}
  for line in code:gmatch("([^\n]+)") do
    local trimmed = line:match("^%s*(.-)%s*$")
    if trimmed and #trimmed > 0 then
      table.insert(lines, trimmed)
    end
  end
  return table.concat(lines, " ")
end

local function obfuscate(src)
  ic = 0
  bd = {}
  gseed_name = nil
  gseed_value = 0

  local code = remove_comments(src)
  local cns, strings = extract_strings(code)
  local renamed = rename_variables(cns)
  local ws = renamed
  for i = 0, #strings - 1 do
    local ph = "__STR_" .. i .. "__"
    local processed = pe(strings[i + 1])
    local vr = bs(processed)
    ws = ws:gsub(ph, function() return vr end)
  end

  ws = obfuscate_numbers(ws)
  ws = obfuscate_booleans(ws)
  ws = apply_control_flow(ws)

  local checksum = 0
  for c = 1, #ws do
    checksum = ((checksum * FNV_PRIME) + string.byte(ws, c)) % MOD_HASH
  end

  local bce = bs("error")
  local bcp = bs("pcall")
  local bcts = bs("tostring")
  local bcty = bs("type")
  local bcw = bs("warn")
  local bcpr = bs("print")
  local bcni = bs("__newindex")
  local bcix = bs("__index")
  local bcdb = bs("debug")
  local bcgi = bs("getinfo")
  local bcco = bs("coroutine")
  local bcc = bs("C")
  local bcstr = bs("string")
  local bcdump = bs("dump")
  local bcg = bs("_G")
  local bcls = bs("loadstring")
  local bctask = bs("task")
  local bcwait = bs("wait")
  local tm = bs("LOOL imagine you use the 25ms and Threaded to skid this thing lel")
  local tm2 = bs("holy skid")
  local tm3 = bs("nice try skid, but this aint gonna work for you lmaooo")
  local im = bs("integrity check failed successfully. this script has been modified.")
  local eem = bs("execute script error")
  local envPol = bs("environment polluted")

  local ev = ni()
  local fv = ni()
  local sv = ni()
  local erv = ni()
  local pv = ni()
  local cv = ni()
  local sp = ni()
  local sw = ni()
  local se = ni()
  local spc = ni()
  local sty = ni()
  local sg = ni()
  local a1 = ni()
  local a2 = ni()
  local a3 = ni()
  local a4 = ni()
  local a5 = ni()
  local a6 = ni()
  local a7 = ni()
  local a8 = ni()
  local a9 = ni()
  local a10 = ni()
  local a11 = ni()
  local id = ni()
  local ifn = ni()
  local sc = ni()
  local jv = ni()

  local ga = gg(6)
  local gb = gg(8)
  local gc = gg(5)
  local bm = minify(ws)
  local all_decls = table.concat(bd, ";")

  local checks = {
    "local " .. a1 .. '=(function():boolean local imnot_ok:boolean,imnot_t:any=' .. spc .. '(function()return ' .. sty .. '(' .. se .. ')=="function"end);if not imnot_ok or not imnot_t then ' .. se .. '(' .. tm .. ')end;return true end)()',
    "local " .. a2 .. "=(function():boolean local imnot_checks={" .. bce .. "," .. bcp .. "," .. bcts .. "," .. bcty .. "};for imnot_ci=1,#imnot_checks do local imnot_fn:any=" .. ev .. '[imnot_checks[imnot_ci]];if ' .. sty .. '(imnot_fn)~="function"then ' .. se .. "(" .. tm2 .. ")end end;return true end)()",
    "local " .. a3 .. "=(function():boolean local imnot_dok:boolean,imnot_dlib:any=" .. spc .. "(function()return " .. ev .. "[" .. bcdb .. "]end);if imnot_dok and imnot_dlib then local imnot_ghok:boolean,imnot_gh:any=" .. spc .. "(function()return imnot_dlib[" .. bcgi .. "]end);if imnot_ghok and imnot_gh then local imnot_info:any=(imnot_gh::any)(1);if imnot_info and imnot_info.what==" .. bcc .. " then " .. se .. "(" .. tm3 .. ")end end end;return true end)()",
    "local " .. a4 .. "=setmetatable(" .. pv .. ",{[" .. bcni .. "]=function()" .. se .. "(" .. tm .. ")end,[" .. bcix .. "]=function(_imnot_self:any,imnot_key:any):any if imnot_key==" .. cv .. " then return true end;return nil end})",
    "local " .. a5 .. "=(function():boolean local imnot_cok:boolean,imnot_clib:any=" .. spc .. "(function()return " .. ev .. "[" .. bcco .. "]end);if imnot_cok and imnot_clib then local imnot_running:any=imnot_clib.running;if imnot_running then(imnot_running::any)()end end;return true end)()",
    "local " .. a6 .. "=(function():boolean local imnot_c1ok:boolean,imnot_c1:any=" .. spc .. "(function()return os.clock()end);if not imnot_c1ok or type(imnot_c1)~=\"number\"then return true end;local imnot_acc=0;for imnot_ti=1,200000 do imnot_acc=imnot_acc+imnot_ti end;local imnot_c2ok:boolean,imnot_c2:any=" .. spc .. "(function()return os.clock()end);if imnot_c2ok and type(imnot_c2)==\"number\"then if(imnot_c2-imnot_c1)>0.35 then " .. se .. "(" .. tm3 .. ")end end;return true end)()",
    "local " .. a7 .. "=(function():boolean local imnot_rwok:boolean,imnot_rwr:any=" .. spc .. "(function()return rawequal(1,1)end);if not imnot_rwok or imnot_rwr~=true then " .. se .. "(" .. tm2 .. ")end;local imnot_rgok:boolean,imnot_rgr:any=" .. spc .. "(function()local imnot_rt={};rawset(imnot_rt,1,1);return rawget(imnot_rt,1)end);if not imnot_rgok or imnot_rgr~=1 then " .. se .. "(" .. tm2 .. ")end;return true end)()",
    "local " .. a8 .. "=(function():boolean local imnot_mt_ok,imnot_mt_val=" .. spc .. "(function()return getmetatable(_G)end);if imnot_mt_ok and imnot_mt_val~=nil then " .. se .. "(" .. envPol .. ") end;return true end)()",
    "local " .. a9 .. "=(function():boolean local imnot_sok:boolean,imnot_slib:any=" .. spc .. "(function()return " .. ev .. "[" .. bcstr .. "]end);if imnot_sok and imnot_slib then local imnot_dok:boolean,imnot_dump:any=" .. spc .. "(function()return imnot_slib[" .. bcdump .. "]end);if imnot_dok and imnot_dump then local imnot_dtest:any=" .. spc .. "(function()return imnot_dump(function()end)end) end end;return true end)()",
    "local " .. a10 .. "=(function():boolean local imnot_tok:boolean,imnot_tlib:any=" .. spc .. "(function()return " .. ev .. "[" .. bctask .. "]end);if imnot_tok and imnot_tlib then if " .. sty .. "(imnot_tlib[" .. bcwait .. '])~="function" then ' .. se .. "(" .. tm2 .. ") end end;return true end)()",
    "local " .. a11 .. "=(function():boolean local imnot_lsok:boolean,imnot_ls:any=" .. spc .. "(function()return " .. ev .. "[" .. bcls .. "] or " .. ev .. ".load end);if imnot_lsok and imnot_ls then if " .. sty .. "(imnot_ls)~=\"function\" then " .. se .. "(" .. tm .. ") end end;return true end)()"
  }
  shuffle(checks)
  local checks_block = table.concat(checks, ";")

  local check_names = shuffle({ a1, a2, a3, a5, a6, a7, a8, a9, a10, a11 })
  local sc_cond = "not " .. table.concat(check_names, " or not ")

  local raw = {
    all_decls,
    "local " .. ev .. ":any=_G",
    "local " .. sp .. "=print",
    "local " .. sw .. "=warn",
    "local " .. se .. "=error",
    "local " .. spc .. "=pcall",
    "local " .. sty .. "=typeof or type",
    "local " .. sg .. "=getmetatable",
    ga,
    "local " .. pv .. "={}",
    "local " .. cv .. "=" .. checksum,
    "local " .. jv .. "=math.random(1,999999)",
    checks_block,
    gb,
    "local " .. id .. "=" .. checksum,
    "local " .. ifn .. "=function()if " .. id .. "~=" .. cv .. " then " .. se .. "(" .. im .. ")end end",
    ifn .. "()",
    "local " .. fv .. "=function()" .. ifn .. "();" .. bm .. " end",
    gc,
    "local " .. sc .. "=(function():boolean if " .. sc_cond .. " then " .. se .. "(" .. tm .. ")end;return true end)()",
    "local " .. sv .. ":boolean," .. erv .. ":any=" .. spc .. "(" .. fv .. ")",
    "if not " .. sv .. " then local imnot_handler:any=" .. sw .. " or " .. sp .. " or function(...)end;(imnot_handler::any)(" .. eem .. ")end"
  }

  return HEADER .. "\n" .. table.concat(raw, ";")
end

local result = obfuscate(source)
local out = io.open(output_file, "w")
if not out then
  print("ERROR: Cannot open output file")
  os.exit(1)
end
out:write(result)
out:close()
print("OK")
