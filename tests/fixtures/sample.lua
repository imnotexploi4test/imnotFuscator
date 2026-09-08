local foo = 1234
local message = "hello\\nworld"
local unicode = "héllo 🌍"
local tbl = {foo = 10, value = 99}
local x = {
  [123] = message,
  method = function(self, value)
    local inner = value + 42
    return inner .. "!"
  end
}
-- comment [[ not a long comment
print(message, unicode, tbl.value)
print([=[long [==[nested-ish]==] value]=])
