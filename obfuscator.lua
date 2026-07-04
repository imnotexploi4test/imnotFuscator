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

local function bs(str)
  local vn = ni()
  local bytes = {}
  for c = 1, #str do
    table.insert(bytes, string.byte(str, c))
  end
  local key = math.random(20, 220)
  local xored = {}
  for _, b in ipairs(bytes) do
    table.insert(xored, mx(b, key))
  end
  local d, o, x, bv, rv, vv, av, kv =
    ni(), ni(), ni(), ni(), ni(), ni(), ni(), ni()
  table.insert(
    bd,
    string.format(
      "local %s=(function():string local %s={%s};local %s=\"\";for %s=1,#%s do local %s=%s[%s];local %s=0;local %s=1;local %s=%s;local %s=%d;for _=1,8 do if %s%%2~=%s%%2 then %s=%s+%s end;%s=math.floor(%s/2);%s=math.floor(%s/2);%s=%s*2 end;%s=%s..string.char(%s)end;return %s end)()",
      vn, d, table.concat(xored, ","), o, x, d, bv, d, x, rv, vv,
      av, bv, kv, key, av, kv, rv, rv, vv, av, av, kv, kv, vv, vv,
      o, o, rv, o
    )
  )
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
  "huge","pi","clamp","lerp","getfenv","setfenv","loadstring","load"
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
    local r = math.random(1, 5)
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
    else
      table.insert(parts, "local " .. v .. "=(" .. math.random(1, 500) .. "*" .. math.random(1, 500) .. ")-" .. math.random(0, 9999))
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
  local tm = bs("LOOL imagine you use the 25ms and 333ms to skid this thing lel")
  local tm2 = bs("Anti-tamper triggered. This script is protected.")
  local tm3 = bs("Nice try skid, but this aint gonna work for you lmaooo")
  local im = bs("Integrity check failed. Script has been modified.")
  local eem = bs("Script execution error")

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
  local id = ni()
  local ifn = ni()
  local sc = ni()

  local ga = gg(6)
  local gb = gg(8)
  local gc = gg(5)
  local bm = minify(ws)
  local all_decls = table.concat(bd, ";")

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
    "local " .. a1 .. '=(function():boolean local imnot_ok:boolean,imnot_t:any=' .. spc .. '(function()return ' .. sty .. '(' .. se .. ')==\"function\"end);if not imnot_ok or not imnot_t then ' .. se .. '(' .. tm .. ')end;return true end)()',
    "local " .. a2 .. "=(function():boolean local imnot_checks={" .. bce .. "," .. bcp .. "," .. bcts .. "," .. bcty .. "};for imnot_ci=1,#imnot_checks do local imnot_fn:any=" .. ev .. '[imnot_checks[imnot_ci]];if ' .. sty .. '(imnot_fn)~=\"function\"then ' .. se .. "(" .. tm2 .. ")end end;return true end)()",
    "local " .. a3 .. "=(function():boolean local imnot_dok:boolean,imnot_dlib:any=" .. spc .. "(function()return " .. ev .. "[" .. bcdb .. "]end);if imnot_dok and imnot_dlib then local imnot_ghok:boolean,imnot_gh:any=" .. spc .. "(function()return imnot_dlib[" .. bcgi .. "]end);if imnot_ghok and imnot_gh then local imnot_info:any=(imnot_gh::any)(1);if imnot_info and imnot_info.what==" .. bcc .. " then " .. se .. "(" .. tm3 .. ")end end end;return true end)()",
    "local " .. a4 .. "=setmetatable(" .. pv .. ",{[" .. bcni .. "]=function()" .. se .. "(" .. tm .. ")end,[" .. bcix .. "]=function(_imnot_self:any,imnot_key:any):any if imnot_key==" .. cv .. " then return true end;return nil end})",
    "local " .. a5 .. "=(function():boolean local imnot_cok:boolean,imnot_clib:any=" .. spc .. "(function()return " .. ev .. "[" .. bcco .. "]end);if imnot_cok and imnot_clib then local imnot_running:any=imnot_clib.running;if imnot_running then(imnot_running::any)()end end;return true end)()",
    gb,
    "local " .. id .. "=" .. checksum,
    "local " .. ifn .. "=function()if " .. id .. "~=" .. cv .. " then " .. se .. "(" .. im .. ")end end",
    ifn .. "()",
    "local " .. fv .. "=function()" .. ifn .. "();" .. bm .. " end",
    gc,
    "local " .. sc .. "=(function():boolean if not " .. a1 .. " or not " .. a2 .. " or not " .. a3 .. " or not " .. a5 .. " then " .. se .. "(" .. tm .. ")end;return true end)()",
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
