-- imnotFuscator V3 Validator (Lua) - upgraded
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

local function validate_lua(code)
  local errors = {}
  local parens, braces, brackets = 0,0,0
  local in_string = false
  local str_char = ''
  local in_long_string = nil
  local in_long_comment = nil
  local line_no = 1

  local i = 1
  while i <= #code do
    local ch = code:sub(i,i)
    if ch == '\n' then line_no = line_no + 1 end

    if in_long_comment then
      local close = in_long_comment.close
      local s = code:find(close, i, true)
      if s then
        -- count newlines inside
        local seg = code:sub(i, s-1)
        for _ in seg:gmatch("\n") do line_no = line_no + 1 end
        i = s + #close
        in_long_comment = nil
      else
        break
      end
    elseif in_long_string then
      local close = in_long_string.close
      local s = code:find(close, i, true)
      if s then
        local seg = code:sub(i, s-1)
        for _ in seg:gmatch("\n") do line_no = line_no + 1 end
        i = s + #close
        in_long_string = nil
      else
        table.insert(errors, "unclosed long string starting at line "..in_long_string.lineStart)
        break
      end
    elseif in_string then
      if ch == '\\' then
        i = i + 2
      else
        if ch == str_char then in_string = false end
        i = i + 1
      end
    else
      if ch == '-' and i+1 <= #code and code:sub(i+1,i+1) == '-' then
        -- check long comment --[=*[ 
        local k = i+2
        if k <= #code and code:sub(k,k) == '[' then
          local eq = 0
          k = k+1
          while k <= #code and code:sub(k,k) == '=' do eq=eq+1; k=k+1 end
          if k <= #code and code:sub(k,k) == '[' then
            local close = ']'..string.rep('=',eq)..']'
            in_long_comment = {close=close, lineStart=line_no}
            i = k+1
          else
            -- line comment, skip to newline
            local nl = code:find("\n", i+2, true)
            if nl then i = nl else break end
          end
        else
          local nl = code:find("\n", i+2, true)
          if nl then i = nl else break end
        end
      elseif ch == '[' then
        local j = i+1
        local eq = 0
        while j <= #code and code:sub(j,j) == '=' do eq=eq+1; j=j+1 end
        if j <= #code and code:sub(j,j) == '[' then
          local close = ']'..string.rep('=',eq)..']'
          in_long_string = {close=close, lineStart=line_no}
          i = j+1
        else
          if ch == '(' then parens=parens+1
          elseif ch == ')' then parens=parens-1
          elseif ch == '{' then braces=braces+1
          elseif ch == '}' then braces=braces-1
          end
          if ch == '[' then brackets=brackets+1 end
          i=i+1
        end
      else
        if ch == '"' or ch == "'" then
          in_string = true
          str_char = ch
          i=i+1
        else
          if ch == '(' then parens=parens+1
          elseif ch == ')' then
            parens=parens-1
            if parens <0 then table.insert(errors, "line "..line_no..": unexpected ')'") end
          elseif ch == '{' then braces=braces+1
          elseif ch == '}' then
            braces=braces-1
            if braces <0 then table.insert(errors, "line "..line_no..": unexpected '}'") end
          elseif ch == '[' then brackets=brackets+1
          elseif ch == ']' then
            brackets=brackets-1
            if brackets<0 then brackets=0 end
          end
          i=i+1
        end
      end
    end
  end

  if in_string then table.insert(errors, "unclosed string starting with "..str_char) end
  if in_long_comment and not in_long_string then
    -- already counted? but add
    if in_long_comment then table.insert(errors, "unclosed long comment starting at line "..in_long_comment.lineStart) end
  end
  if parens ~=0 then table.insert(errors, "unbalanced parentheses (off by "..math.abs(parens)..")") end
  if braces ~=0 then table.insert(errors, "unbalanced braces (off by "..math.abs(braces)..")") end
  if brackets ~=0 then table.insert(errors, "unbalanced brackets (off by "..math.abs(brackets)..")") end
  return errors
end

local errs = validate_lua(code)
if #errs>0 then
  print("ERROR: "..table.concat(errs, "; "))
  os.exit(1)
else
  print("VALID")
end
