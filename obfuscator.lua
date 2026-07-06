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
math.randomseed(os.time())

local HEADER = [==[--[[
$$\                                    $$\     $$$$$$$$\                                      $$\
\__|                                   $$ |    $$  _____|                                     $$ |
$$\ $$$$$$\$$$$\  $$$$$$$\   $$$$$$\ $$$$$$\   $$ |   $$\   $$\  $$$$$$$\  $$$$$$$\ $$$$$$\ $$$$$$\    $$$$$$\   $$$$$$\
$$ |$$  _$$  _$$\ $$  __$$\ $$  __$$\\_$$  _|  $$$$$\ $$ |  $$ |$$  _____|$$  _____|\____$$\\_$$  _|  $$  __$$\ $$  __$$\
$$ |$$ / $$ / $$ |$$ |  $$ |$$ /  $$ | $$ |    $$  __|$$ |  $$ |\$$$$$$\  $$ /      $$$$$$$ | $$ |    $$ /  $$ |$$ |  \__|
$$ |$$ | $$ | $$ |$$ |  $$ |$$ |  $$ | $$ |$$\ $$ |   $$ |  $$ | \____$$\ $$ |     $$  __$$ | $$ |$$\ $$ |  $$ |$$ |
$$ |$$ | $$ | $$ |$$ |  $$ |\$$$$$$  | \$$$$  |$$ |   \$$$$$$  |$$$$$$$  |\$$$$$$$\\$$$$$$$ | \$$$$  |\$$$$$$  |$$ |
\__|\__| \__| \__|\__|  \__| \______/   \____/ \__|    \______/ \_______/  \_______|\_______|  \____/  \______/ \__|


                                                                                                                          Fully made by imnotexploi4 (A.K.A the_baconthecheat)
]]]==]

local ic = 0
local bd = {}

local function ni()
  ic = ic + 1
  return "imnot" .. ic
end

local function mx(a, b)
  local r, bv = 0, 1
  for _ = 1, 8 do
    if a % 2 ~= b % 2 then r = r + bv end
    a = math.floor(a / 2)
    b = math.floor(b / 2)
    bv = bv * 2
  end
  return r
end

local function rl(v, r)
  if r == 0 then return v end
  local result = ((v * (2 ^ r)) % 256) + math.floor(v / (2 ^ (8 - r)))
  return math.tointeger(result) or result
end

local function fill(template, subs)
  local s = template
  for k, v in pairs(subs) do
    s = s:gsub("@" .. k .. "@", tostring(v), 1000)
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

--[[
  String encryption, v2:
    enc[i] = rotl( xor(byte[i], key_i), rot )
    key_i  = (seed + gseed + i*mult) % 256

  - "seed", "mult", "rot" are randomized per-string constants.
  - "gseed" is NOT a baked literal. It is recomputed at *runtime* from the
    raw encoded byte table of the very first string this run encrypts (the
    "master" string). Every other string's key depends on it, so patching
    any byte of the master table silently corrupts every other decoded
    string instead of just printing a cosmetic warning.
  This replaces the previous single static XOR key (trivially brute-forced
  byte-by-byte) with a positional keystream plus a bit-rotation layer, and
  gives the existing "integrity" messaging something real to fail against.
]]
local gseed_name = nil
local gseed_value = 0

local MASTER_TPL = [[local @VN@,@GSV@=(function() local @D@={@ENC@};local @O@="";local @GS@=0;for @I1@=1,#@D@ do @GS@=(@GS@*31+@D@[@I1@])%2147483647 end;@GS@=@GS@%256;for @I2@=1,#@D@ do local @BV@=@D@[@I2@];local @UR@=((@BV@*(2^(8-@ROT@)))%256)+math.floor(@BV@/(2^@ROT@));local @KX@=(@SEED@+@I2@*@MULT@)%256;local @RV@=0;local @VV@=1;local @AV@=@UR@;local @KV@=@KX@;for _=1,8 do if @AV@%2~=@KV@%2 then @RV@=@RV@+@VV@ end;@AV@=math.floor(@AV@/2);@KV@=math.floor(@KV@/2);@VV@=@VV@*2 end;@O@=@O@..string.char(@RV@) end;return @O@,@GS@ end)()]]

local NORMAL_TPL = [[local @VN@=(function():string local @D@={@ENC@};local @O@="";for @I2@=1,#@D@ do local @BV@=@D@[@I2@];local @UR@=((@BV@*(2^(8-@ROT@)))%256)+math.floor(@BV@/(2^@ROT@));local @KX@=(@SEED@+@GSVAR@+@I2@*@MULT@)%256;local @RV@=0;local @VV@=1;local @AV@=@UR@;local @KV@=@KX@;for _=1,8 do if @AV@%2~=@KV@%2 then @RV@=@RV@+@VV@ end;@AV@=math.floor(@AV@/2);@KV@=math.floor(@KV@/2);@VV@=@VV@*2 end;@O@=@O@..string.char(@RV@) end;return @O@ end)()]]

local function bs(str)
  local is_master = (gseed_name == nil)
  local vn = ni()
  local bytes = {}
  for c = 1, #str do
    table.insert(bytes, string.byte(str, c))
  end
  local seed = math.random(0, 255)
  local mult = math.random(1, 255)
  local rot = math.random(1, 7)
  local offset = is_master and 0 or gseed_value
  local xored = {}
  for i, b in ipairs(bytes) do
    local key = (seed + offset + i * mult) % 256
    table.insert(xored, rl(mx(b, key), rot))
  end

  if is_master then
    local gsv = ni()
    local stmt = fill(MASTER_TPL, {
      VN = vn, GSV = gsv, D = ni(), ENC = table.concat(xored, ","),
      O = ni(), GS = gsv, I1 = ni(), I2 = ni(), BV = ni(), UR = ni(),
      KX = ni(), RV = ni(), VV = ni(), AV = ni(), KV = ni(),
      ROT = rot, SEED = seed, MULT = mult
    })
    table.insert(bd, stmt)
    gseed_name = gsv
    gseed_value = 0
    for _, val in ipairs(xored) do
      gseed_value = (gseed_value * 31 + val) % 2147483647
    end
    gseed_value = gseed_value % 256
  else
    local stmt = fill(NORMAL_TPL, {
      VN = vn, D = ni(), ENC = table.concat(xored, ","),
      O = ni(), I2 = ni(), BV = ni(), UR = ni(),
      KX = ni(), RV = ni(), VV = ni(), AV = ni(), KV = ni(),
      ROT = rot, SEED = seed, MULT = mult, GSVAR = gseed_name
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
    if ch == '[' and i + 1 <= #code and code:sub(i+1,i+1) == '[' then
      local ep = code:find("%]%]", i + 2)
      if ep then
        table.insert(strings, code:sub(i + 2, ep - 1))
        result = result .. "__STR_" .. (#strings - 1) .. "__"
        i = ep + 2
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
  for vn in code:gmatch("for%s+([a-zA-Z_][a-zA-Z0-9_]*)%s*[=,]") do
    if not reserved[vn] and not vm[vn] then vm[vn] = ni() end
  end
  for params in code:gmatch("function%s*[a-zA-Z0-9_.]*%s*%(([^)]*)%)") do
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

local function gg(count)
  local parts = {}
  for _ = 1, count do
    local v = ni()
    local r = math.random(1, 8)
    if r == 1 then
      table.insert(parts, "local " .. v .. "=" .. math.random(0, 999999))
    elseif r == 2 then
      table.insert(parts, "local " .. v .. "=(function()return " .. math.random(0, 99999) .. " end)()")
    elseif r == 3 then
      local nums = {}
      for _ = 1, math.random(2, 4) do
        table.insert(nums, math.random(0, 999))
      end
      table.insert(parts, "local " .. v .. "={" .. table.concat(nums, ",") .. "}")
    elseif r == 4 then
      table.insert(parts, "local " .. v .. "=" .. math.random(0, 255) .. "+" .. math.random(0, 255))
    elseif r == 5 then
      table.insert(parts, "local " .. v .. "=(" .. math.random(1, 500) .. "*" .. math.random(1, 500) .. ")-" .. math.random(0, 9999))
    elseif r == 6 then
      local sq = math.random(2, 50)
      table.insert(parts, "if((" .. sq .. "*" .. sq .. ")>=0)then local " .. v .. "=" .. math.random(0, 999) .. " end")
    elseif r == 7 then
      table.insert(parts, "local " .. v .. "=#(\"x\"):rep(" .. math.random(1, 20) .. ")")
    else
      table.insert(parts, "local " .. v .. "=(function() if math.random()>=0 then return " .. math.random(1, 100) .. " else return " .. math.random(1, 100) .. " end end)()")
    end
  end
  return table.concat(parts, ";")
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

  local checksum = 0
  for c = 1, #ws do
    checksum = ((checksum * 31) + string.byte(ws, c)) % 2147483647
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
  local bcfn = bs("function")
  local bcc = bs("C")
  local tm = bs("LOOL imagine you use the 25ms and Threaded to skid this thing lel")
  local tm2 = bs("holy skid")
  local tm3 = bs("nice try skid, but this aint gonna work for you lmaooo")
  local im = bs("integrity check failed successfully. this script has been modified.")
  local eem = bs("execute script error")

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
  local a1 = ni()
  local a2 = ni()
  local a3 = ni()
  local a4 = ni()
  local a5 = ni()
  local a6 = ni()
  local a7 = ni()
  local id = ni()
  local ifn = ni()
  local sc = ni()

  local ga = gg(6)
  local gb = gg(8)
  local gc = gg(5)
  local bm = minify(ws)
  local all_decls = table.concat(bd, ";")

  local checks = {
    "local " .. a1 .. '=(function():boolean local imnot_ok:boolean,imnot_t:any=' .. spc .. '(function()return ' .. sty .. '(' .. se .. ')==\"function\"end);if not imnot_ok or not imnot_t then ' .. se .. '(' .. tm .. ')end;return true end)()',
    "local " .. a2 .. "=(function():boolean local imnot_checks={" .. bce .. "," .. bcp .. "," .. bcts .. "," .. bcty .. "};for imnot_ci=1,#imnot_checks do local imnot_fn:any=" .. ev .. '[imnot_checks[imnot_ci]];if ' .. sty .. '(imnot_fn)~=\"function\"then ' .. se .. "(" .. tm2 .. ")end end;return true end)()",
    "local " .. a3 .. "=(function():boolean local imnot_dok:boolean,imnot_dlib:any=" .. spc .. "(function()return " .. ev .. "[" .. bcdb .. "]end);if imnot_dok and imnot_dlib then local imnot_ghok:boolean,imnot_gh:any=" .. spc .. "(function()return imnot_dlib[" .. bcgi .. "]end);if imnot_ghok and imnot_gh then local imnot_info:any=(imnot_gh::any)(1);if imnot_info and imnot_info.what==" .. bcc .. " then " .. se .. "(" .. tm3 .. ")end end end;return true end)()",
    "local " .. a4 .. "=setmetatable(" .. pv .. ",{[" .. bcni .. "]=function()" .. se .. "(" .. tm .. ")end,[" .. bcix .. "]=function(_imnot_self:any,imnot_key:any):any if imnot_key==" .. cv .. " then return true end;return nil end})",
    "local " .. a5 .. "=(function():boolean local imnot_cok:boolean,imnot_clib:any=" .. spc .. "(function()return " .. ev .. "[" .. bcco .. "]end);if imnot_cok and imnot_clib then local imnot_running:any=imnot_clib.running;if imnot_running then(imnot_running::any)()end end;return true end)()",
    "local " .. a6 .. "=(function():boolean local imnot_c1ok:boolean,imnot_c1:any=" .. spc .. "(function()return os.clock()end);if not imnot_c1ok or type(imnot_c1)~=\"number\"then return true end;local imnot_acc=0;for imnot_ti=1,200000 do imnot_acc=imnot_acc+imnot_ti end;local imnot_c2ok:boolean,imnot_c2:any=" .. spc .. "(function()return os.clock()end);if imnot_c2ok and type(imnot_c2)==\"number\"then if(imnot_c2-imnot_c1)>0.35 then " .. se .. "(" .. tm3 .. ")end end;return true end)()",
    "local " .. a7 .. "=(function():boolean local imnot_rwok:boolean,imnot_rwr:any=" .. spc .. "(function()return rawequal(1,1)end);if not imnot_rwok or imnot_rwr~=true then " .. se .. "(" .. tm2 .. ")end;local imnot_rgok:boolean,imnot_rgr:any=" .. spc .. "(function()local imnot_rt={};rawset(imnot_rt,1,1);return rawget(imnot_rt,1)end);if not imnot_rgok or imnot_rgr~=1 then " .. se .. "(" .. tm2 .. ")end;return true end)()"
  }
  shuffle(checks)
  local checks_block = table.concat(checks, ";")

  local check_names = shuffle({ a1, a2, a3, a5, a6, a7 })
  local sc_cond = "not " .. table.concat(check_names, " or not ")

  local raw = {
    all_decls,
    "local " .. ev .. ":any=_G",
    "local " .. sp .. "=print",
    "local " .. sw .. "=warn",
    "local " .. se .. "=error",
    "local " .. spc .. "=pcall",
    "local " .. sty .. "=typeof or type",
    ga,
    "local " .. pv .. "={}",
    "local " .. cv .. "=" .. checksum,
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