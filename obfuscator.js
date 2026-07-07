const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const OBFUSCATOR_HEADER =
  '--!nocheck \n--[[\n$$\\                                    $$\\     $$$$$$$$\\                                      $$\\\n\\__|                                   $$ |    $$  _____|                                     $$ |\n$$\\ $$$$$$\\$$$$\\  $$$$$$$\\   $$$$$$\\ $$$$$$\\   $$ |   $$\\   $$\\  $$$$$$$\\  $$$$$$$\\ $$$$$$\\ $$$$$$\\    $$$$$$\\   $$$$$$\\\n$$ |$$  _$$  _$$\\ $$  __$$\\ $$  __$$\\\\_$$  _|  $$$$$\\ $$ |  $$ |$$  _____|$$  _____|\\____$$\\\\_$$  _|  $$  __$$\\ $$  __$$\\\n$$ |$$ / $$ / $$ |$$ |  $$ |$$ /  $$ | $$ |    $$  __|$$ |  $$ |\\$$$$$$\\  $$ /      $$$$$$$ | $$ |    $$ /  $$ |$$ |  \\__|\n$$ |$$ | $$ | $$ |$$ |  $$ |$$ |  $$ | $$ |$$\\ $$ |   $$ |  $$ | \\____$$\\ $$ |     $$  __$$ | $$ |$$\\ $$ |  $$ |$$ |\n$$ |$$ | $$ | $$ |$$ |  $$ |\\$$$$$$  | \\$$$$  |$$ |   \\$$$$$$  |$$$$$$$  |\\$$$$$$$\\\\$$$$$$$ | \\$$$$  |\\$$$$$$  |$$ |\n\\__|\\__| \\__| \\__|\\__|  \\__| \\______/   \\____/ \\__|    \\______/ \\_______/  \\_______|\\_______|  \\____/  \\______/ \\__|\n\n\n                                                                                                                          Fully made by imnotexploi4 (A.K.A the_baconthecheat)\n]]';

const MASTER_TPL = 'local @VN@,@GSV@=(function() local @D@={@ENC@};local @O@="";local @GS@=0;for @I1@=1,#@D@ do @GS@=(@GS@*31+@D@[@I1@])%2147483647 end;@GS@=@GS@%256;for @I2@=1,#@D@ do local @BV@=@D@[@I2@];local @UR@=((@BV@*(2^(8-@ROT@)))%256)+math.floor(@BV@/(2^@ROT@));local @KX@=(@SEED@+@I2@*@MULT@)%256;local @RV@=0;local @VV@=1;local @AV@=@UR@;local @KV@=@KX@;for _=1,8 do if @AV@%2~=@KV@%2 then @RV@=@RV@+@VV@ end;@AV@=math.floor(@AV@/2);@KV@=math.floor(@KV@/2);@VV@=@VV@*2 end;@O@=@O@..string.char(@RV@) end;return @O@,@GS@ end)()';
const NORMAL_TPL = 'local @VN@=(function():string local @D@={@ENC@};local @O@="";for @I2@=1,#@D@ do local @BV@=@D@[@I2@];local @UR@=((@BV@*(2^(8-@ROT@)))%256)+math.floor(@BV@/(2^@ROT@));local @KX@=(@SEED@+@GSVAR@+@I2@*@MULT@)%256;local @RV@=0;local @VV@=1;local @AV@=@UR@;local @KV@=@KX@;for _=1,8 do if @AV@%2~=@KV@%2 then @RV@=@RV@+@VV@ end;@AV@=math.floor(@AV@/2);@KV@=math.floor(@KV@/2);@VV@=@VV@*2 end;@O@=@O@..string.char(@RV@) end;return @O@ end)()';

class LuaObfuscator {
  constructor() {
    this.ic = 0;
    this.varMap = new Map();
    this.bd = [];
    this.gseed_name = null;
    this.gseed_value = 0;
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
      "getfenv","setfenv","loadstring","load", "dofile", "collectgarbage"
    ]);
  }

  ni() {
    this.ic++;
    return `imnot${this.ic}`;
  }

  rl(v, r) {
    if (r === 0) return v;
    return (((v * Math.pow(2, r)) % 256) + Math.floor(v / Math.pow(2, 8 - r))) | 0;
  }

  mx(a, b) {
    let r = 0, bv = 1;
    for (let i = 0; i < 8; i++) {
      if (a % 2 !== b % 2) r += bv;
      a = Math.floor(a / 2);
      b = Math.floor(b / 2);
      bv *= 2;
    }
    return r;
  }

  fill(template, subs) {
    let s = template;
    for (const [k, v] of Object.entries(subs)) {
      s = s.split(`@${k}@`).join(v);
    }
    return s;
  }

  bs(str) {
    const isMaster = this.gseed_name === null;
    const vn = this.ni();
    const bts = [];
    for (let i = 0; i < str.length; i++) bts.push(str.charCodeAt(i));
    
    const seed = Math.floor(Math.random() * 256);
    const mult = Math.floor(Math.random() * 255) + 1;
    const rot = Math.floor(Math.random() * 7) + 1;
    const offset = isMaster ? 0 : this.gseed_value;
    
    const xored = [];
    for (let i = 0; i < bts.length; i++) {
      const key = (seed + offset + (i + 1) * mult) % 256;
      xored.push(this.rl(this.mx(bts[i], key), rot));
    }

    if (isMaster) {
      const gsv = this.ni();
      const subs = {
        "VN": vn, "GSV": gsv, "D": this.ni(), "ENC": xored.join(","),
        "O": this.ni(), "GS": gsv, "I1": this.ni(), "I2": this.ni(), "BV": this.ni(),
        "UR": this.ni(), "KX": this.ni(), "RV": this.ni(), "VV": this.ni(),
        "AV": this.ni(), "KV": this.ni(), "ROT": rot, "SEED": seed, "MULT": mult
      };
      this.bd.push(this.fill(MASTER_TPL, subs));
      this.gseed_name = gsv;
      this.gseed_value = 0;
      for (const val of xored) {
        this.gseed_value = ((this.gseed_value * 31) + val) % 2147483647;
      }
      this.gseed_value %= 256;
    } else {
      const subs = {
        "VN": vn, "D": this.ni(), "ENC": xored.join(","),
        "O": this.ni(), "I2": this.ni(), "BV": this.ni(), "UR": this.ni(),
        "KX": this.ni(), "RV": this.ni(), "VV": this.ni(), "AV": this.ni(),
        "KV": this.ni(), "ROT": rot, "SEED": seed, "MULT": mult, "GSVAR": this.gseed_name
      };
      this.bd.push(this.fill(NORMAL_TPL, subs));
    }
    return vn;
  }

  obfuscate(src) {
    this.ic = 0;
    this.varMap = new Map();
    this.bd = [];
    this.gseed_name = null;
    this.gseed_value = 0;

    let code = this.removeComments(src);
    const { code: cp, strings: es } = this.extractStrings(code);
    const rc = this.renameVars(cp);
    const we = this.restoreStrings(rc, es);
    return this.build(we);
  }

  removeComments(code) {
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
          } else if (
            ch === "-" &&
            i + 1 < line.length &&
            line[i + 1] === "-"
          )
            break;
          else cl += ch;
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
      if (
        code[i] === "[" &&
        i + 1 < code.length &&
        code[i + 1] === "["
      ) {
        const end = code.indexOf("]]", i + 2);
        if (end !== -1) {
          strings.push(code.substring(i + 2, end));
          result += `__STR_${strings.length - 1}__`;
          i = end + 2;
          continue;
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
    const fp = /\bfunction\s*[a-zA-Z0-9_.]*\s*\(([^)]*)\)/g;
    while ((match = fp.exec(code)) !== null) {
      match[1]
        .split(",")
        .map((p) => p.trim().replace(/\s*:.*$/, "").trim())
        .filter((p) => p.length > 0)
        .forEach((p) => {
          if (!this.rw.has(p) && !this.varMap.has(p))
            this.varMap.set(p, this.ni());
        });
    }
    const forp = /\bfor\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*[=,]/g;
    while ((match = forp.exec(code)) !== null) {
      const v = match[1];
      if (!this.rw.has(v) && !this.varMap.has(v))
        this.varMap.set(v, this.ni());
    }
    let result = code;
    const sorted = Array.from(this.varMap.entries()).sort(
      (a, b) => b[0].length - a[0].length
    );
    for (const [orig, renamed] of sorted) {
      const rx = new RegExp(`\\b${this.esc(orig)}\\b`, "g");
      result = result.replace(rx, (m, off, s) => {
        if (
          s.substring(Math.max(0, off - 6), off).includes("__STR_")
        )
          return m;
        if (off > 0 && (s[off - 1] === "." || s[off - 1] === ":"))
          return m;
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
      result = result.split(`__STR_${i}__`).join(varRef);
    }
    return result;
  }

  garbage(count) {
    const parts = [];
    for (let i = 0; i < count; i++) {
      const vn = this.ni();
      const r = Math.floor(Math.random() * 8) + 1;
      if (r === 1) {
        parts.push(`local ${vn}=${Math.floor(Math.random() * 999999)}`);
      } else if (r === 2) {
        parts.push(`local ${vn}=(function()return ${Math.floor(Math.random() * 99999)} end)()`);
      } else if (r === 3) {
        const nums = Array.from({ length: Math.floor(Math.random() * 3) + 2 }, () => Math.floor(Math.random() * 999));
        parts.push(`local ${vn}={${nums.join(",")}}`);
      } else if (r === 4) {
        parts.push(`local ${vn}=${Math.floor(Math.random() * 255)}+${Math.floor(Math.random() * 255)}`);
      } else if (r === 5) {
        parts.push(`local ${vn}=(${Math.floor(Math.random() * 500)}*${Math.floor(Math.random() * 500)})-${Math.floor(Math.random() * 9999)}`);
      } else if (r === 6) {
        const sq = Math.floor(Math.random() * 49) + 2;
        parts.push(`if((${sq}*${sq})>=0)then local ${vn}=${Math.floor(Math.random() * 999)} end`);
      } else if (r === 7) {
        parts.push(`local ${vn}=#("x"):rep(${Math.floor(Math.random() * 20) + 1})`);
      } else {
        parts.push(`local ${vn}=(function() if math.random()>=0 then return ${Math.floor(Math.random() * 100) + 1} else return ${Math.floor(Math.random() * 100) + 1} end end)()`);
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
    
    const tamperMsg = this.bs("LOOL imagine you use the 25ms and Threaded to skid this thing lel");
    const tamperMsg2 = this.bs("holy skid");
    const tamperMsg3 = this.bs("nice try skid, but this aint gonna work for you lmaooo");
    const integrityMsg = this.bs("integrity check failed successfully. this script has been modified.");
    const execErrMsg = this.bs("execute script error");

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
    
    let checksum = 0;
    for (let i = 0; i < body.length; i++) {
      checksum = ((checksum * 31) + body.charCodeAt(i)) & 0x7fffffff;
    }
    const checksumVar = this.ni();
    
    const at1 = this.ni();
    const at2 = this.ni();
    const at3 = this.ni();
    const at4 = this.ni();
    const at5 = this.ni();
    const at6 = this.ni();
    const at7 = this.ni();
    const intData = this.ni();
    const intFunc = this.ni();
    const selfCheck = this.ni();
    
    const ga = this.garbage(6);
    const gb = this.garbage(8);
    const gc = this.garbage(5);
    const bodyMin = body.split("\n").map((l) => l.trim()).filter((l) => l.length > 0).join(" ");
    const allDecls = this.bd.join(";");

    const checks = [
      `local ${at1}=(function():boolean local imnot_ok:boolean,imnot_t:any=${safePcall}(function()return ${safeType}(${safeError})=="function"end);if not imnot_ok or not imnot_t then ${safeError}(${tamperMsg})end;return true end)()`,
      `local ${at2}=(function():boolean local imnot_checks={${bcError},${bcPcall},${bcTostring},${bcType}};for imnot_ci=1,#imnot_checks do local imnot_fn:any=${envVar}[imnot_checks[imnot_ci]];if ${safeType}(imnot_fn)~="function"then ${safeError}(${tamperMsg2})end end;return true end)()`,
      `local ${at3}=(function():boolean local imnot_dok:boolean,imnot_dlib:any=${safePcall}(function()return ${envVar}[${bcDebug}]end);if imnot_dok and imnot_dlib then local imnot_ghok:boolean,imnot_gh:any=${safePcall}(function()return imnot_dlib[${bcGetinfo}]end);if imnot_ghok and imnot_gh then local imnot_info:any=(imnot_gh::any)(1);if imnot_info and imnot_info.what==${bcC} then ${safeError}(${tamperMsg3})end end end;return true end)()`,
      `local ${at4}=setmetatable(${protVar},{[${bcNewindex}]=function()${safeError}(${tamperMsg})end,[${bcIndex}]=function(_imnot_self:any,imnot_key:any):any if imnot_key==${checksumVar} then return true end;return nil end})`,
      `local ${at5}=(function():boolean local imnot_cok:boolean,imnot_clib:any=${safePcall}(function()return ${envVar}[${bcCoroutine}]end);if imnot_cok and imnot_clib then local imnot_running:any=imnot_clib.running;if imnot_running then(imnot_running::any)()end end;return true end)()`,
      `local ${at6}=(function():boolean local imnot_c1ok:boolean,imnot_c1:any=${safePcall}(function()return os.clock()end);if not imnot_c1ok or type(imnot_c1)~="number"then return true end;local imnot_acc=0;for imnot_ti=1,200000 do imnot_acc=imnot_acc+imnot_ti end;local imnot_c2ok:boolean,imnot_c2:any=${safePcall}(function()return os.clock()end);if imnot_c2ok and type(imnot_c2)=="number"then if(imnot_c2-imnot_c1)>0.35 then ${safeError}(${tamperMsg3})end end;return true end)()`,
      `local ${at7}=(function():boolean local imnot_rwok:boolean,imnot_rwr:any=${safePcall}(function()return rawequal(1,1)end);if not imnot_rwok or imnot_rwr~=true then ${safeError}(${tamperMsg2})end;local imnot_rgok:boolean,imnot_rgr:any=${safePcall}(function()local imnot_rt={};rawset(imnot_rt,1,1);return rawget(imnot_rt,1)end);if not imnot_rgok or imnot_rgr~=1 then ${safeError}(${tamperMsg2})end;return true end)()`
    ];
    checks.sort(() => Math.random() - 0.5);
    const checksBlock = checks.join(";");

    const checkNames = [at1, at2, at3, at5, at6, at7];
    checkNames.sort(() => Math.random() - 0.5);
    const scCond = "not " + checkNames.join(" or not ");

    const raw = [
      allDecls,
      `local ${envVar}:any=_G`,
      `local ${safePrint}=print`,
      `local ${safeWarn}=warn`,
      `local ${safeError}=error`,
      `local ${safePcall}=pcall`,
      `local ${safeType}=typeof or type`,
      ga,
      `local ${protVar}={}`,
      `local ${checksumVar}=${checksum}`,
      checksBlock,
      gb,
      `local ${intData}=${checksum}`,
      `local ${intFunc}=function()if ${intData}~=${checksumVar} then ${safeError}(${integrityMsg})end end`,
      `${intFunc}()`,
      `local ${funcVar}=function()${intFunc}();${bodyMin} end`,
      gc,
      `local ${selfCheck}=(function():boolean if ${scCond} then ${safeError}(${tamperMsg})end;return true end)()`,
      `local ${statusVar}:boolean,${errVar}:any=${safePcall}(${funcVar})`,
      `if not ${statusVar} then local imnot_handler:any=${safeWarn} or ${safePrint} or function(...)end;(imnot_handler::any)(${execErrMsg})end`
    ];

    return OBFUSCATOR_HEADER + "\n" + raw.join(";");
  }
}

function obfuscateWithLua(src) {
  const i = path.join(__dirname, `temp_in_${Date.now()}.lua`);
  const o = path.join(__dirname, `temp_out_${Date.now()}.lua`);
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

function obfuscateWithPython(src) {
  const i = path.join(__dirname, `temp_in_${Date.now()}.lua`);
  const o = path.join(__dirname, `temp_out_${Date.now()}.lua`);
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

module.exports = {
  obfuscate(src) {
    let r = obfuscateWithLua(src);
    if (r && r.trim().length > 0) return r;
    r = obfuscateWithPython(src);
    if (r && r.trim().length > 0) return r;
    return new LuaObfuscator().obfuscate(src);
  }
};
