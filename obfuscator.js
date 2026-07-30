const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const OBFUSCATOR_HEADER =
  '--!nocheck \n--[[\n$$\\                                    $$\\     $$$$$$$$\\                                      $$\\\n\\__|                                   $$ |    $$  _____|                                     $$ |\n$$\\ $$$$$$\\$$$$\\  $$$$$$$\\   $$$$$$\\ $$$$$$\\   $$ |   $$\\   $$\\  $$$$$$$\\  $$$$$$$\\ $$$$$$\\ $$$$$$\\    $$$$$$\\   $$$$$$\\\n$$ |$$  _$$  _$$\\ $$  __$$\\ $$  __$$\\\\_$$  _|  $$$$$\\ $$ |  $$ |$$  _____|$$  _____|\\____$$\\\\_$$  _|  $$  __$$\\ $$  __$$\\\n$$ |$$ / $$ / $$ |$$ |  $$ |$$ /  $$ | $$ |    $$  __|$$ |  $$ |\\$$$$$$\\  $$ /      $$$$$$$ | $$ |    $$ /  $$ |$$ |  \\__|\n$$ |$$ | $$ | $$ |$$ |  $$ |$$ |  $$ | $$ |$$\\ $$ |   $$ |  $$ | \\____$$\\ $$ |     $$  __$$ | $$ |$$\\ $$ |  $$ |$$ |\n$$ |$$ | $$ | $$ |$$ |  $$ |\\$$$$$$  | \\$$$$  |$$ |   \\$$$$$$  |$$$$$$$  |\\$$$$$$$\\\\$$$$$$$ | \\$$$$  |\\$$$$$$  |$$ |\n\\__|\\__| \\__| \\__|\\__|  \\__| \\______/   \\____/ \\__|    \\______/ \\_______/  \\_______|\\_______|  \\____/  \\______/ \\__|\n\n\n                                                                                                                          Fully made by imnotexploi4 - V3 UPGRADED\\n]] -- imnotFuscator V3.0';

const FNV_INIT = 2166136261;
const FNV_PRIME = 16777619;
const MOD_HASH = 2147483647;

const MASTER_TPL = 'local @VN@,@GSV@=(function() local @D@={@ENC@};local @O@="";local @GS@=@FNV_INIT@;for @I1@=1,#@D@ do @GS@=(@GS@*@FNV_PRIME@+@D@[@I1@])%2147483647 end;@GS@=@GS@%256;for @I2@=1,#@D@ do local @BV@=@D@[@I2@];local @UR@=((@BV@*(2^(8-@ROT@)))%256)+math.floor(@BV@/(2^@ROT@));local @KX@=(@SEED@+@I2@*@MULT@+@I2@*@I2@*@PRIME@)%256;local @SB@=(@UR@-@ADD@+256)%256;local @RV@=0;local @VV@=1;local @AV@=@SB@;local @KV@=@KX@;for _=1,8 do if @AV@%2~=@KV@%2 then @RV@=@RV@+@VV@ end;@AV@=math.floor(@AV@/2);@KV@=math.floor(@KV@/2);@VV@=@VV@*2 end;@O@=@O@..string.char(@RV@) end;return @O@,@GS@ end)()';
const NORMAL_TPL = 'local @VN@=(function():string local @D@={@ENC@};local @O@="";for @I2@=1,#@D@ do local @BV@=@D@[@I2@];local @UR@=((@BV@*(2^(8-@ROT@)))%256)+math.floor(@BV@/(2^@ROT@));local @KX@=(@SEED@+@GSVAR@+@I2@*@MULT@+@I2@*@I2@*@PRIME@)%256;local @SB@=(@UR@-@ADD@+256)%256;local @RV@=0;local @VV@=1;local @AV@=@SB@;local @KV@=@KX@;for _=1,8 do if @AV@%2~=@KV@%2 then @RV@=@RV@+@VV@ end;@AV@=math.floor(@AV@/2);@KV@=math.floor(@KV@/2);@VV@=@VV@*2 end;@O@=@O@..string.char(@RV@) end;return @O@ end)()';

const SERVICE_LIST = [
  "Players","ReplicatedStorage","Workspace","Lighting","StarterGui","StarterPack",
  "StarterPlayer","Teams","SoundService","Chat","ReplicatedFirst","HttpService",
  "RunService","UserInputService","TweenService","MarketplaceService","DataStoreService",
  "PathfindingService","CollectionService","Debris","TextService"
];
const INSTANCE_LIST = ["Part","Script","LocalScript","RemoteEvent","RemoteFunction","Folder","Model","ScreenGui","Frame","TextLabel"];
const OPAQUE_TRUE = [
  '((10*10)==100)','((math.sqrt(16)==4))','(#{1,2,3}==3)','(string.len("imnot")==5)','((5%2)==1)',
  '(math.floor(7.9)==7)','(math.ceil(2.1)==3)','(not false)','((true or false)==true)','((false==false))',
  '((math.abs(-5)==5))','((2^3)==8)','(string.sub("abc",1,1)=="a")','(type({})=="table")','(type("")=="string")',
  '((bit32 and bit32.bxor(1,1)==0) or (1==1))','((1+1)==2)'
];
const OPAQUE_FALSE = [
  '((10*10)==99)','((math.sqrt(16)==5))','(#{1,2,3}==4)','(string.len("imnot")==6)','((5%2)==0)',
  '(false and true)','((true==false))','((1+1)==3)','(nil~=nil)','((math.abs(-5)==6))'
];

class LuaObfuscator {
  constructor(options = {}) {
    this.ic = 0;
    this.varMap = new Map();
    this.bd = [];
    this.gseed_name = null;
    this.gseed_value = 0;
    this.options = Object.assign({
      renameVars: true,
      encodeStrings: true,
      encodeNumbers: true,
      encodeBooleans: true,
      addGarbage: true,
      garbageAmount: 6,
      addAntiTamper: true,
      controlFlow: true,
      minify: true,
    }, options);
    this.rw = new Set([
      "and","break","do","else","elseif","end","false","for","function",
      "goto","if","in","local","nil","not","or","repeat","return","then",
      "true","until","while","continue","type","export","typeof","print",
      "pairs","ipairs","next","select","unpack","rawget","rawset",
      "rawequal","rawlen","tonumber","tostring","pcall","xpcall","error",
      "warn","assert","setmetatable","getmetatable","require","table",
      "string","math","coroutine","os","io","debug","bit32","utf8",
      "task","wait","spawn","delay","tick","time","elapsedTime","game",
      "workspace","script","Instance","Vector3","Vector2","CFrame",
      "Color3","BrickColor","UDim","UDim2","Enum","Ray","Region3",
      "TweenInfo","NumberRange","NumberSequence","ColorSequence","Rect",
      "Font","Axes","Faces","TweenService","RunService",
      "UserInputService","Players","ReplicatedStorage","ServerStorage",
      "ServerScriptService","StarterGui","StarterPack","StarterPlayer",
      "Lighting","Debris","HttpService","MarketplaceService",
      "DataStoreService","PathfindingService","PhysicsService",
      "SoundService","TextService","Chat","Teams","TestService","_G",
      "_VERSION","shared","self","new","New","clone","Clone","Destroy",
      "destroy","FindFirstChild","WaitForChild","GetChildren",
      "GetDescendants","IsA","GetService","Connect","Fire","Invoke",
      "insert","remove","sort","concat","find","sub","len","rep",
      "reverse","upper","lower","byte","char","format","match","gmatch",
      "gsub","abs","ceil","floor","max","min","sqrt","random",
      "randomseed","sin","cos","tan","huge","pi","clamp","lerp",
      "getfenv","setfenv","loadstring","load", "dofile", "collectgarbage",
      "bit32","utf8","string","math","table","os","coroutine","task"
    ]);
  }

  // Secure random helper
  sr(min, max) {
    min = Math.ceil(min); max = Math.floor(max);
    try {
      if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        const arr = new Uint32Array(1);
        crypto.getRandomValues(arr);
        return min + (arr[0] % (max - min + 1));
      }
    } catch(e) {}
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  ni() {
    this.ic++;
    // generate confusing suffix: random mix of Il_ + random letter
    const conf = ['l','I','i','_','L'];
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let suffix = '';
    const len = this.sr(1,3);
    for (let i=0;i<len;i++) {
      if (Math.random() < 0.6) suffix += conf[this.sr(0,conf.length-1)];
      else suffix += letters[this.sr(0,letters.length-1)];
    }
    // ensure first char of suffix is letter to keep valid when appended after digit? digit already before suffix, but suffix starting with _ is valid after digit? identifier can contain _ after prefix imnot<number>_<chars> actually we do imnot+ic+suffix . If suffix starts with digit would be invalid? but we restrict to letters/_.
    // Remove any leading digit risk
    return `imnot${this.ic}${suffix}`;
  }

  rl(v, r) {
    if (r === 0) return v & 255;
    return (((v * Math.pow(2, r)) % 256) + Math.floor(v / Math.pow(2, 8 - r))) | 0;
  }
  rr(v, r) {
    if (r===0) return v & 255;
    return (((v * Math.pow(2, 8 - r)) % 256) + Math.floor(v / Math.pow(2, r))) | 0;
  }
  mx(a, b) {
    let r = 0, bv = 1;
    for (let i = 0; i < 8; i++) {
      if (a % 2 !== b % 2) r += bv;
      a = Math.floor(a / 2);
      b = Math.floor(b / 2);
      bv *= 2;
    }
    return r & 255;
  }

  fill(template, subs) {
    let s = template;
    for (const [k, v] of Object.entries(subs)) {
      s = s.split(`@${k}@`).join(v);
    }
    return s;
  }

  bs(str) {
    if (!this.options.encodeStrings) {
      // Fallback to simple lua string literal escaping if encoding disabled
      const vn = this.ni();
      const esc = str.replace(/\\/g,'\\\\').replace(/"/g,'\\"').replace(/\n/g,'\\n');
      this.bd.push(`local ${vn}="${esc}"`);
      return vn;
    }
    const isMaster = this.gseed_name === null;
    const vn = this.ni();
    const bts = [];
    for (let i = 0; i < str.length; i++) bts.push(str.charCodeAt(i) & 255);
    
    const seed = this.sr(0, 255);
    const mult = (this.sr(1, 255) | 1); // odd
    const rot = this.sr(1, 7);
    const add = this.sr(0, 255);
    const primes = [3,5,7,11,13,17,19,31,53,97];
    const prime = primes[this.sr(0, primes.length-1)];
    const offset = isMaster ? 0 : this.gseed_value;
    
    const xored = [];
    for (let i = 0; i < bts.length; i++) {
      const ii = i+1;
      const key = (seed + offset + ii*mult + ii*ii*prime) % 256;
      const x = this.mx(bts[i], key);
      const tmp = (x + add) % 256;
      xored.push(this.rl(tmp, rot));
    }

    if (isMaster) {
      const gsv = this.ni();
      let hash = FNV_INIT;
      for (const val of xored) {
        hash = (hash * FNV_PRIME + val) % MOD_HASH;
      }
      const gval = hash % 256;
      const subs = {
        "VN": vn, "GSV": gsv, "D": this.ni(), "ENC": xored.join(","),
        "O": this.ni(), "GS": gsv, "I1": this.ni(), "I2": this.ni(), "BV": this.ni(),
        "UR": this.ni(), "KX": this.ni(), "SB": this.ni(), "RV": this.ni(), "VV": this.ni(),
        "AV": this.ni(), "KV": this.ni(), "ROT": rot, "SEED": seed, "MULT": mult,
        "ADD": add, "PRIME": prime, "FNV_INIT": FNV_INIT, "FNV_PRIME": FNV_PRIME
      };
      this.bd.push(this.fill(MASTER_TPL, subs));
      this.gseed_name = gsv;
      this.gseed_value = gval;
    } else {
      const subs = {
        "VN": vn, "D": this.ni(), "ENC": xored.join(","),
        "O": this.ni(), "I2": this.ni(), "BV": this.ni(), "UR": this.ni(),
        "KX": this.ni(), "SB": this.ni(), "RV": this.ni(), "VV": this.ni(),
        "AV": this.ni(), "KV": this.ni(), "ROT": rot, "SEED": seed, "MULT": mult,
        "ADD": add, "PRIME": prime, "GSVAR": this.gseed_name
      };
      this.bd.push(this.fill(NORMAL_TPL, subs));
    }
    return vn;
  }

  obfuscate(src, opts) {
    if (opts) this.options = Object.assign(this.options, opts);
    this.ic = 0;
    this.varMap = new Map();
    this.bd = [];
    this.gseed_name = null;
    this.gseed_value = 0;

    let code = this.removeComments(src);
    const { code: cp, strings: es } = this.extractStrings(code);
    let rc = cp;
    if (this.options.renameVars) rc = this.renameVars(cp);
    const we = this.restoreStrings(rc, es);

    let processed = we;
    if (this.options.encodeNumbers) processed = this.obfuscateNumbers(processed);
    if (this.options.encodeBooleans) processed = this.obfuscateBooleans(processed);
    if (this.options.controlFlow) processed = this.applyControlFlow(processed);

    return this.build(processed);
  }

  removeComments(code) {
    // Remove long comments --[=[ ... ]=]
    code = code.replace(/--\[=+\[[\s\S]*?\]=+\]/g, "");
    // Remove short long comments --[[ ... ]]
    code = code.replace(/--\[\[[\s\S]*?\]\]/g, "");
    const lines = code.split("\n");
    const result = [];
    for (const line of lines) {
      let inStr = false;
      let sc = "";
      let cl = "";
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (inStr) {
          cl += ch;
          if (ch === "\\") {
            i++;
            if (i < line.length) cl += line[i];
            continue;
          }
          if (ch === sc) inStr = false;
        } else {
          if (ch === '"' || ch === "'") {
            inStr = true;
            sc = ch;
            cl += ch;
          } else if (ch === "-" && i + 1 < line.length && line[i + 1] === "-") {
            break;
          } else cl += ch;
        }
      }
      result.push(cl);
    }
    return result.join("\n");
  }

  extractStrings(code) {
    const strings = [];
    let result = "";
    let i = 0;
    while (i < code.length) {
      // Check for long string [[ or [=[ etc
      if (code[i] === "[" ) {
        let j = i+1;
        let eq = 0;
        while (j < code.length && code[j] === "=") { eq++; j++; }
        if (j < code.length && code[j] === "[" ) {
          // long string start
          const close = "]" + "=".repeat(eq) + "]";
          const end = code.indexOf(close, j+1);
          if (end !== -1) {
            const content = code.substring(j+1, end);
            strings.push(content);
            result += `__STR_${strings.length - 1}__`;
            i = end + close.length;
            continue;
          }
        }
      }
      if (code[i] === '"' || code[i] === "'") {
        const q = code[i];
        let s = "";
        i++;
        while (i < code.length && code[i] !== q) {
          if (code[i] === "\\") {
            s += code[i];
            i++;
            if (i < code.length) {
              s += code[i];
              i++;
            }
            continue;
          }
          s += code[i];
          i++;
        }
        if (i < code.length) i++;
        strings.push(s);
        result += `__STR_${strings.length - 1}__`;
        continue;
      }
      result += code[i];
      i++;
    }
    return { code: result, strings };
  }

  renameVars(code) {
    let match;
    const lp = /\blocal\s+([a-zA-Z_][a-zA-Z0-9_]*)/g;
    while ((match = lp.exec(code)) !== null) {
      const v = match[1];
      if (!this.rw.has(v) && !this.varMap.has(v))
        this.varMap.set(v, this.ni());
    }
    // local function
    const lfp = /\blocal\s+function\s+([a-zA-Z_][a-zA-Z0-9_]*)/g;
    while ((match = lfp.exec(code)) !== null) {
      const v = match[1];
      if (!this.rw.has(v) && !this.varMap.has(v)) this.varMap.set(v, this.ni());
    }
    const fp = /\bfunction\s*[a-zA-Z0-9_.:]*\s*\(([^)]*)\)/g;
    while ((match = fp.exec(code)) !== null) {
      match[1]
        .split(",")
        .map((p) => p.trim().replace(/\s*:.*$/, "").trim().split("=")[0].trim())
        .filter((p) => p.length > 0 && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(p))
        .forEach((p) => {
          if (!this.rw.has(p) && !this.varMap.has(p))
            this.varMap.set(p, this.ni());
        });
    }
    const forp = /\bfor\s+([a-zA-Z_][a-zA-Z0-9_]*(?:\s*,\s*[a-zA-Z_][a-zA-Z0-9_]*)*)\s+in\b|\bfor\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=/g;
    while ((match = forp.exec(code)) !== null) {
      const g1 = match[1] || match[2];
      if (!g1) continue;
      g1.split(',').map(s=>s.trim()).forEach(v=>{
        if (!this.rw.has(v) && !this.varMap.has(v) && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(v))
          this.varMap.set(v, this.ni());
      });
    }
    let result = code;
    const sorted = Array.from(this.varMap.entries()).sort(
      (a, b) => b[0].length - a[0].length
    );
    for (const [orig, renamed] of sorted) {
      const rx = new RegExp(`\\b${this.esc(orig)}\\b`, "g");
      result = result.replace(rx, (m, off, s) => {
        if (
          s.substring(Math.max(0, off - 12), off).includes("__STR_")
        )
          return m;
        if (off > 0 && (s[off - 1] === "." || s[off - 1] === ":")) return m;
        const after = s.substring(off + m.length, off + m.length + 2);
        // avoid touching placeholder suffix
        if (off > 2 && s.substring(off-2, off) === "__") return m;
        return renamed;
      });
    }
    return result;
  }

  restoreStrings(code, strings) {
    let result = code;
    for (let i = 0; i < strings.length; i++) {
      const processed = strings[i]
        .replace(/\\n/g, "\n")
        .replace(/\\t/g, "\t")
        .replace(/\\r/g, "\r")
        .replace(/\\\\/g, "\\")
        .replace(/\\"/g, '"')
        .replace(/\\'/g, "'");
      const varRef = this.bs(processed);
      // replace only exact placeholder, not substrings
      result = result.split(`__STR_${i}__`).join(varRef);
    }
    return result;
  }

  obfuscateNumbers(code) {
    // obfuscate integers 0-9999, avoid those inside identifiers
    return code.replace(/(?<![a-zA-Z0-9_])(\d+)(?![a-zA-Z0-9_\.])/g, (match) => {
      const n = parseInt(match,10);
      if (isNaN(n) || n>1000000) return match; // skip large or non
      // keep some small numbers like 0,1 for loops? but still obfuscate with option
      if (Math.random() < 0.1) return match; // occasionally leave plain
      return this.encodeNumber(n);
    });
  }

  encodeNumber(n) {
    const r = this.sr(1,6);
    if (r===1) {
      const a = this.sr(10,500);
      const b = this.sr(10,500);
      const c = a + b - n;
      return `(${a}+${b}-${c})`;
    } else if (r===2) {
      const a = this.sr(10,200);
      const b = n + a;
      return `(${b}-${a})`;
    } else if (r===3) {
      if (n>=0 && n<=80) {
        const ch = 'a'.repeat(1); // we'll use string length trick "#"
        // generate string of length n using 'x' repeated - but produce expression "#'xxx'" -> the string literal inside will be plain, but we wrap it.
        // To avoid leaving string, use string.rep
        const len = n;
        return `(string.len("${'x'.repeat(Math.min(len,20))}")${len>20?`+${len-20}`:''})`.replace('""','" "'); // careful empty
      }
      const a = this.sr(2,12);
      const b = n - a;
      return `(${a}+${b})`;
    } else if (r===4) {
      const a = this.sr(2,50);
      const mul = n * a;
      // Use math.floor division to ensure integer
      return `(math.floor(${mul}/${a}))`;
    } else if (r===5) {
      // xor via manual closure to hide
      const x = this.sr(0,255);
      const y = this.mx(n & 255, x); // low byte xor approx, for larger numbers use addition trick
      if (n <256) {
        // return xor closure
        return `((function(a,b)local r=0;local v=1;for _=1,8 do if a%2~=b%2 then r=r+v end;a=math.floor(a/2);b=math.floor(b/2);v=v*2 end;return r end)(${x},${y}))`;
      } else {
        const a = this.sr(100,1000);
        const b = n - a;
        return `(${a}+${b})`;
      }
    } else {
      // Add extra complexity with double math
      const a = this.sr(1,100);
      const b = this.sr(1,100);
      const c = this.sr(1,50);
      const target = a + b * c; // compute something that we can adjust to n
      // we want expression that equals n: (a + b*c - (target - n))
      const diff = target - n;
      return `(${a}+${b}*${c}-${diff})`;
    }
  }

  obfuscateBooleans(code) {
    let out = code;
    out = out.replace(/\btrue\b/g, () => {
      const pool = ['(1==1)','(not false)','(true or false)','(#{1}==1)','(not nil)','(math.random()<2 or true)'];
      return pool[this.sr(0,pool.length-1)];
    });
    out = out.replace(/\bfalse\b/g, () => {
      const pool = ['(1~=1)','(not true)','(false and true)','(#{ }~=0 and false or false)','(not 1)','(nil==true)'];
      return pool[this.sr(0,pool.length-1)];
    });
    return out;
  }

  applyControlFlow(code) {
    const stmts = code.split(';');
    let res = [];
    for (let s of stmts) {
      s = s.trim();
      if (!s) continue;
      // never wrap local declarations - would change scope
      const isLocal = /^\s*local\b/.test(s);
      if (!isLocal && Math.random() < 0.35) {
        const cond = OPAQUE_TRUE[this.sr(0,OPAQUE_TRUE.length-1)];
        s = `if ${cond} then ${s} end`;
      }
      res.push(s);
      if (Math.random() < 0.18) {
        const condF = OPAQUE_FALSE[this.sr(0,OPAQUE_FALSE.length-1)];
        const g = this.garbage(1,true);
        res.push(`if ${condF} then ${g} end`);
      }
    }
    return res.join(';');
  }

  opaqueTrue() { return OPAQUE_TRUE[this.sr(0,OPAQUE_TRUE.length-1)]; }
  opaqueFalse() { return OPAQUE_FALSE[this.sr(0,OPAQUE_FALSE.length-1)]; }

  garbage(count, simple=false) {
    const parts = [];
    for (let i = 0; i < count; i++) {
      const vn = this.ni();
      const r = this.sr(1, simple?5:12);
      if (r === 1) {
        parts.push(`local ${vn}=${this.sr(0, 999999)}`);
      } else if (r === 2) {
        parts.push(`local ${vn}=(function()return ${this.sr(0, 99999)} end)()`);
      } else if (r === 3) {
        const nums = Array.from({ length: this.sr(2,4) }, () => this.sr(0, 999));
        parts.push(`local ${vn}={${nums.join(",")}}`);
      } else if (r === 4) {
        parts.push(`local ${vn}=${this.sr(0,255)}+${this.sr(0,255)}*${this.sr(1,5)}`);
      } else if (r === 5) {
        parts.push(`local ${vn}=(function() if math.random()>=0 then return ${this.sr(1,100)} else return ${this.sr(1,100)} end end)()`);
      } else if (r === 6) {
        const svc = SERVICE_LIST[this.sr(0,SERVICE_LIST.length-1)];
        parts.push(`local ${vn}=(game and game.GetService and (function() local ok,res=pcall(function() return game:GetService("${svc}") end) return ok and res or nil end)() or nil)`);
      } else if (r === 7) {
        const inst = INSTANCE_LIST[this.sr(0,INSTANCE_LIST.length-1)];
        parts.push(`local ${vn}=(Instance and Instance.new and (function() local ok,res=pcall(function() return Instance.new("${inst}") end) return ok and res or nil end)() or nil)`);
      } else if (r === 8) {
        parts.push(`local ${vn}=(Vector3 and Vector3.new and Vector3.new(${this.sr(0,100)},${this.sr(0,100)},${this.sr(0,100)}) or nil)`);
      } else if (r === 9) {
        const sq = this.sr(2,50);
        parts.push(`if((${sq}*${sq})>=0)then local ${vn}=${this.sr(0,999)} end`);
      } else if (r === 10) {
        parts.push(`local ${vn}=${this.opaqueTrue()} and ${this.sr(0,500)} or ${this.sr(0,500)}`);
      } else if (r === 11) {
        parts.push(`local ${vn}=(CFrame and CFrame.new and CFrame.new(${this.sr(0,50)},${this.sr(0,50)},${this.sr(0,50)}) or nil)`);
      } else {
        parts.push(`local ${vn}=(workspace and workspace.FindFirstChild and (function() local ok,res=pcall(function() return workspace:FindFirstChild("${this.ni()}") end) return ok and res or nil end)() or nil)`);
      }
    }
    return parts.join(";");
  }

  esc(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  build(body) {
    const bcError = this.bs("error");
    const bcPcall = this.bs("pcall");
    const bcTostring = this.bs("tostring");
    const bcType = this.bs("type");
    const bcWarn = this.bs("warn");
    const bcPrint = this.bs("print");
    const bcNewindex = this.bs("__newindex");
    const bcIndex = this.bs("__index");
    const bcDebug = this.bs("debug");
    const bcGetinfo = this.bs("getinfo");
    const bcCoroutine = this.bs("coroutine");
    const bcFunction = this.bs("function");
    const bcC = this.bs("C");
    const bcString = this.bs("string");
    const bcDump = this.bs("dump");
    const bcG = this.bs("_G");
    const bcLoadstring = this.bs("loadstring");
    const bcTask = this.bs("task");
    const bcWait = this.bs("wait");
    const bcMetatable = this.bs("getmetatable");
    
    const tamperMsg = this.bs("LOOL imagine you use the 25ms and Threaded to skid this thing lel");
    const tamperMsg2 = this.bs("holy skid");
    const tamperMsg3 = this.bs("nice try skid, but this aint gonna work for you lmaooo");
    const integrityMsg = this.bs("integrity check failed successfully. this script has been modified.");
    const execErrMsg = this.bs("execute script error");
    const envPollutedMsg = this.bs("environment polluted");

    const envVar = this.ni();
    const funcVar = this.ni();
    const statusVar = this.ni();
    const errVar = this.ni();
    const protVar = this.ni();
    const safePrint = this.ni();
    const safeWarn = this.ni();
    const safeError = this.ni();
    const safePcall = this.ni();
    const safeType = this.ni();
    const safeGetMeta = this.ni();
    
    let checksum = 0;
    for (let i = 0; i < body.length; i++) {
      checksum = (checksum * FNV_PRIME + body.charCodeAt(i)) % MOD_HASH;
    }
    const checksumVar = this.ni();
    
    const at = [];
    for (let i=0;i<11;i++) at.push(this.ni());
    const [at1,at2,at3,at4,at5,at6,at7,at8,at9,at10,at11] = at;
    const intData = this.ni();
    const intFunc = this.ni();
    const selfCheck = this.ni();
    const junkVar = this.ni();
    
    const ga = this.options.addGarbage ? this.garbage(this.options.garbageAmount || 6) : "";
    const gb = this.options.addGarbage ? this.garbage((this.options.garbageAmount || 6)+2) : "";
    const gc = this.options.addGarbage ? this.garbage(5) : "";
    const bodyMin = this.options.minify ? body.split("\n").map((l) => l.trim()).filter((l) => l.length > 0).join(" ") : body;
    const allDecls = this.bd.join(";");

    const checks = [];
    if (this.options.addAntiTamper) {
      checks.push(
        `local ${at1}=(function():boolean local imnot_ok:boolean,imnot_t:any=${safePcall}(function()return ${safeType}(${safeError})=="function"end);if not imnot_ok or not imnot_t then ${safeError}(${tamperMsg})end;return true end)()`,
        `local ${at2}=(function():boolean local imnot_checks={${bcError},${bcPcall},${bcTostring},${bcType}};for imnot_ci=1,#imnot_checks do local imnot_fn:any=${envVar}[imnot_checks[imnot_ci]];if ${safeType}(imnot_fn)~="function"then ${safeError}(${tamperMsg2})end end;return true end)()`,
        `local ${at3}=(function():boolean local imnot_dok:boolean,imnot_dlib:any=${safePcall}(function()return ${envVar}[${bcDebug}]end);if imnot_dok and imnot_dlib then local imnot_ghok:boolean,imnot_gh:any=${safePcall}(function()return imnot_dlib[${bcGetinfo}]end);if imnot_ghok and imnot_gh then local imnot_info:any=(imnot_gh::any)(1);if imnot_info and imnot_info.what==${bcC} then ${safeError}(${tamperMsg3})end end end;return true end)()`,
        `local ${at4}=setmetatable(${protVar},{[${bcNewindex}]=function()${safeError}(${tamperMsg})end,[${bcIndex}]=function(_imnot_self:any,imnot_key:any):any if imnot_key==${checksumVar} then return true end;return nil end})`,
        `local ${at5}=(function():boolean local imnot_cok:boolean,imnot_clib:any=${safePcall}(function()return ${envVar}[${bcCoroutine}]end);if imnot_cok and imnot_clib then local imnot_running:any=imnot_clib.running;if imnot_running then(imnot_running::any)()end end;return true end)()`,
        `local ${at6}=(function():boolean local imnot_c1ok:boolean,imnot_c1:any=${safePcall}(function()return os.clock()end);if not imnot_c1ok or type(imnot_c1)~="number"then return true end;local imnot_acc=0;for imnot_ti=1,200000 do imnot_acc=imnot_acc+imnot_ti end;local imnot_c2ok:boolean,imnot_c2:any=${safePcall}(function()return os.clock()end);if imnot_c2ok and type(imnot_c2)=="number"then if(imnot_c2-imnot_c1)>0.35 then ${safeError}(${tamperMsg3})end end;return true end)()`,
        `local ${at7}=(function():boolean local imnot_rwok:boolean,imnot_rwr:any=${safePcall}(function()return rawequal(1,1)end);if not imnot_rwok or imnot_rwr~=true then ${safeError}(${tamperMsg2})end;local imnot_rgok:boolean,imnot_rgr:any=${safePcall}(function()local imnot_rt={};rawset(imnot_rt,1,1);return rawget(imnot_rt,1)end);if not imnot_rgok or imnot_rgr~=1 then ${safeError}(${tamperMsg2})end;return true end)()`,
        `local ${at8}=(function():boolean local imnot_mt:any=${safePcall}(function()return getmetatable(${envVar})end);local imnot_mt_ok,imnot_mt_val=${safePcall}(function()return getmetatable(_G)end);if imnot_mt_ok and imnot_mt_val~=nil then ${safeError}(${envPollutedMsg}) end;return true end)()`,
        `local ${at9}=(function():boolean local imnot_sok:boolean,imnot_slib:any=${safePcall}(function()return ${envVar}[${bcString}]end);if imnot_sok and imnot_slib then local imnot_dok:boolean,imnot_dump:any=${safePcall}(function()return imnot_slib[${bcDump}]end);if imnot_dok and imnot_dump then local imnot_dtest:any=${safePcall}(function()return imnot_dump(function()end)end) end end;return true end)()`,
        `local ${at10}=(function():boolean local imnot_tok:boolean,imnot_tlib:any=${safePcall}(function()return ${envVar}[${bcTask}]end);if imnot_tok and imnot_tlib then if ${safeType}(imnot_tlib[${bcWait}])~="function" then ${safeError}(${tamperMsg2}) end end;return true end)()`,
        `local ${at11}=(function():boolean local imnot_lsok:boolean,imnot_ls:any=${safePcall}(function()return ${envVar}[${bcLoadstring}] or ${envVar}.load end);if imnot_lsok and imnot_ls then if ${safeType}(imnot_ls)~="function" then ${safeError}(${tamperMsg}) end end;return true end)()`
      );
    }
    checks.sort(() => Math.random() - 0.5);
    const checksBlock = checks.join(";");

    const checkNames = at.filter((_,i)=>i!==3); // exclude metatable protection which returns table
    checkNames.sort(() => Math.random() - 0.5);
    const scCond = checkNames.length ? "not " + checkNames.join(" or not ") : "false";

    const raw = [
      allDecls,
      `local ${envVar}:any=_G`,
      `local ${safePrint}=print`,
      `local ${safeWarn}=warn`,
      `local ${safeError}=error`,
      `local ${safePcall}=pcall`,
      `local ${safeType}=typeof or type`,
      `local ${safeGetMeta}=getmetatable`,
      ga,
      `local ${protVar}={}`,
      `local ${checksumVar}=${checksum}`,
      `local ${junkVar}=math.random(1,999999)`,
      checksBlock,
      gb,
      `local ${intData}=${checksum}`,
      `local ${intFunc}=function()if ${intData}~=${checksumVar} then ${safeError}(${integrityMsg})end end`,
      `${intFunc}()`,
      `local ${funcVar}=function()${intFunc}();${bodyMin} end`,
      gc,
      this.options.addAntiTamper ? `local ${selfCheck}=(function():boolean if ${scCond} then ${safeError}(${tamperMsg})end;return true end)()` : "",
      `local ${statusVar}:boolean,${errVar}:any=${safePcall}(${funcVar})`,
      `if not ${statusVar} then local imnot_handler:any=${safeWarn} or ${safePrint} or function(...)end;(imnot_handler::any)(${execErrMsg})end`
    ].filter(Boolean);

    return OBFUSCATOR_HEADER + "\n" + raw.join(";");
  }
}

function obfuscateWithLua(src, opts) {
  const i = path.join(__dirname, `temp_in_${Date.now()}_${Math.floor(Math.random()*10000)}.lua`);
  const o = path.join(__dirname, `temp_out_${Date.now()}_${Math.floor(Math.random()*10000)}.lua`);
  try {
    fs.writeFileSync(i, src, "utf-8");
    execSync(`lua obfuscator.lua "${i}" "${o}"`, { timeout: 30000 });
    if (fs.existsSync(o)) {
      const r = fs.readFileSync(o, "utf-8");
      try { fs.unlinkSync(i); } catch (e) {}
      try { fs.unlinkSync(o); } catch (e) {}
      return r;
    }
  } catch (e) {
    try { fs.unlinkSync(i); } catch (e2) {}
    try { fs.unlinkSync(o); } catch (e2) {}
  }
  return null;
}

function obfuscateWithPython(src, opts) {
  const i = path.join(__dirname, `temp_in_${Date.now()}_${Math.floor(Math.random()*10000)}.lua`);
  const o = path.join(__dirname, `temp_out_${Date.now()}_${Math.floor(Math.random()*10000)}.lua`);
  try {
    fs.writeFileSync(i, src, "utf-8");
    execSync(`python obfuscator.py "${i}" "${o}"`, { timeout: 30000 });
    if (fs.existsSync(o)) {
      const r = fs.readFileSync(o, "utf-8");
      try { fs.unlinkSync(i); } catch (e) {}
      try { fs.unlinkSync(o); } catch (e) {}
      return r;
    }
  } catch (e) {
    try { fs.unlinkSync(i); } catch (e2) {}
    try { fs.unlinkSync(o); } catch (e2) {}
  }
  return null;
}

function tryDirectObfuscate(src, opts) {
  try {
    return new LuaObfuscator(opts).obfuscate(src);
  } catch(e) {
    console.error("Direct obfuscation failed", e);
    return null;
  }
}

module.exports = {
  obfuscate(src, opts) {
    // Try native JS first for upgraded version
    let r = tryDirectObfuscate(src, opts);
    if (r && r.trim().length > 0) return r;
    // fallback to other engines
    r = obfuscateWithLua(src, opts);
    if (r && r.trim().length > 0) return r;
    r = obfuscateWithPython(src, opts);
    if (r && r.trim().length > 0) return r;
    // last resort
    return new LuaObfuscator(opts).obfuscate(src);
  },
  LuaObfuscator
};

// Global for browser
if (typeof window !== 'undefined') {
  window.obfuscate = (src, opts) => new LuaObfuscator(opts).obfuscate(src);
  window.LuaObfuscator = LuaObfuscator;
}
