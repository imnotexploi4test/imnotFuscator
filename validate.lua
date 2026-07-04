local file = arg[1]
if not file then
  print("ERROR: no file specified")
  os.exit(1)
end
local f = io.open(file, "r")
if not f then
  print("ERROR: cannot open file")
  os.exit(1)
end
local code = f:read("*a")
f:close()
local fn, err = load(code) or loadstring(code)
if fn then
  print("VALID")
else
  if err then
    err = err:gsub(file, "script")
    err = err:gsub('%[string ".-"%]', "script")
    print("ERROR: " .. err)
  else
    print("VALID")
  end
end
