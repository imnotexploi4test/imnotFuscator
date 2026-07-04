const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const OBFUSCATOR_HEADER =
  '--[[\n$$\\                                    $$\\     $$$$$$$$\\                                      $$\\\n\\__|                                   $$ |    $$  _____|                                     $$ |\n$$\\ $$$$$$\\$$$$\\  $$$$$$$\\   $$$$$$\\ $$$$$$\\   $$ |   $$\\   $$\\  $$$$$$$\\  $$$$$$$\\ $$$$$$\\ $$$$$$\\    $$$$$$\\   $$$$$$\\\n$$ |$$  _$$  _$$\\ $$  __$$\\ $$  __$$\\\\_$$  _|  $$$$$\\ $$ |  $$ |$$  _____|$$  _____|\\____$$\\\\_$$  _|  $$  __$$\\ $$  __$$\\\n$$ |$$ / $$ / $$ |$$ |  $$ |$$ /  $$ | $$ |    $$  __|$$ |  $$ |\\$$$$$$\\  $$ /      $$$$$$$ | $$ |    $$ /  $$ |$$ |  \\__|\n$$ |$$ | $$ | $$ |$$ |  $$ |$$ |  $$ | $$ |$$\\ $$ |   $$ |  $$ | \\____$$\\ $$ |     $$  __$$ | $$ |$$\\ $$ |  $$ |$$ |\n$$ |$$ | $$ | $$ |$$ |  $$ |\\$$$$$$  | \\$$$$  |$$ |   \\$$$$$$  |$$$$$$$  |\\$$$$$$$\\\\$$$$$$$ | \\$$$$  |\\$$$$$$  |$$ |\n\\__|\\__| \\__| \\__|\\__|  \\__| \\______/   \\____/ \\__|    \\______/ \\_______/  \\_______|\\_______|  \\____/  \\______/ \\__|\n\n\n                                                                                                                          Fully made by imnotexploi4 (A.K.A the_baconthecheat)\n]]';

class LuaObfuscator {
  constructor() {
    this.ic = 0;
    this.varMap = new Map();
    this.bd = [];
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
      "getfenv","setfenv","loadstring","load"
    ]);
  }

  ni() {
    this.ic++;
    return `imnot${this.ic}`;
  }

  bs(str) {
    const vn = this.ni();
    const bytes = [];
    for (let i = 0; i < str.length; i++) bytes.push(str.charCodeAt(i));
    const key = Math.floor(Math.random() * 200) + 20;
    const xored = bytes.map((b) => b ^ key);
    const d = this.ni();
    const o = this.ni();
    const x = this.ni();
    const b = this.ni();
    const r = this.ni();
    const v = this.ni();
    const a = this.ni();
    const k = this.ni();
    this.bd.push(
      `local ${vn}=(function():string local ${d}={${xored.join(
        ","
      )}};local ${o}="";for ${x}=1,#${d} do local ${b}=${d}[${x}];local ${r}=0;local ${v}=1;local ${a}=${b};local ${k}=${key};for _=1,8 do if ${a}%2~=${k}%2 then ${r}=${r}+${v} end;${a}=math.floor(${a}/2);${k}=math.floor(${k}/2);${v}=${v}*2 end;${o}=${o}..string.char(${r})end;return ${o} end)()`
    );
    return vn;
  }

  obfuscate(src) {
    this.ic = 0;
    this.varMap = new Map();
    this.bd = [];
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

  build(body) {
    const bcError = this.bs("error");
    const bcPcall = this.bs("pcall");
    const bcTostring = this.bs("tostring");
    const bcType = this.bs("type");
    const bcWarn = this.bs("warn");
    const bcPrint = this.bs("print");
    const bcSetmetatable = this.bs("setmetatable");
    const bcNewindex = this.bs("__newindex");
    const bcIndex = this.bs("__index");
    const bcDebug = this.bs("debug");
    const bcGetinfo = this.bs("getinfo");
    const bcCoroutine = this.bs("coroutine");
    const bcFunction = this.bs("function");
    const bcC = this.bs("C");
    const tamperMsg = this.bs(
      "LOOL imagine you use the 25ms and 333ms to skid this thing lel"
    );
    const tamperMsg2 = this.bs(
      "Anti-tamper triggered. This script is protected."
    );
    const tamperMsg3 = this.bs(
      "Nice try skid, but this aint gonna work for you lmaooo"
    );
    const integrityMsg = this.bs(
      "Integrity check failed. Script has been modified."
    );
    const execErrMsg = this.bs("Script execution error");

    const envVar = this.ni();
    const funcVar = this.ni();
    const statusVar = this.ni();
    const errVar = this.ni();
    const protVar = this.ni();
    let checksum = 0;
    for (let i = 0; i < body.length; i++)
      checksum =
        ((checksum * 31) + body.charCodeAt(i)) & 0x7fffffff;
    const checksumVar = this.ni();
    const safePrint = this.ni();
    const safeWarn = this.ni();
    const safeError = this.ni();
    const safePcall = this.ni();
    const safeType = this.ni();
    const at1 = this.ni();
    const at2 = this.ni();
    const at3 = this.ni();
    const at4 = this.ni();
    const at5 = this.ni();
    const intData = this.ni();
    const intFunc = this.ni();
    const selfCheck = this.ni();
    const ga = this.garbage(6);
    const gb = this.garbage(8);
    const gc = this.garbage(5);
    const bodyMin = body
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
      .join(" ");
    const allDecls = this.bd.join(";");

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
      `local ${at1}=(function():boolean local imnot_ok:boolean,imnot_t:any=${safePcall}(function()return ${safeType}(${safeError})=="function"end);if not imnot_ok or not imnot_t then ${safeError}(${tamperMsg})end;return true end)()`,
      `local ${at2}=(function():boolean local imnot_checks={${bcError},${bcPcall},${bcTostring},${bcType}};for imnot_ci=1,#imnot_checks do local imnot_fn:any=${envVar}[imnot_checks[imnot_ci]];if ${safeType}(imnot_fn)~="function"then ${safeError}(${tamperMsg2})end end;return true end)()`,
      `local ${at3}=(function():boolean local imnot_dok:boolean,imnot_dlib:any=${safePcall}(function()return ${envVar}[${bcDebug}]end);if imnot_dok and imnot_dlib then local imnot_ghok:boolean,imnot_gh:any=${safePcall}(function()return imnot_dlib[${bcGetinfo}]end);if imnot_ghok and imnot_gh then local imnot_info:any=(imnot_gh::any)(1);if imnot_info and imnot_info.what==${bcC} then ${safeError}(${tamperMsg3})end end end;return true end)()`,
      `local ${at4}=setmetatable(${protVar},{[${bcNewindex}]=function()${safeError}(${tamperMsg})end,[${bcIndex}]=function(_imnot_self:any,imnot_key:any):any if imnot_key==${checksumVar} then return true end;return nil end})`,
      `local ${at5}=(function():boolean local imnot_cok:boolean,imnot_clib:any=${safePcall}(function()return ${envVar}[${bcCoroutine}]end);if imnot_cok and imnot_clib then local imnot_running:any=imnot_clib.running;if imnot_running then(imnot_running::any)()end end;return true end)()`,
      gb,
      `local ${intData}=${checksum}`,
      `local ${intFunc}=function()if ${intData}~=${checksumVar} then ${safeError}(${integrityMsg})end end`,
      `${intFunc}()`,
      `local ${funcVar}=function()${intFunc}();${bodyMin} end`,
      gc,
      `local ${selfCheck}=(function():boolean if not ${at1} or not ${at2} or not ${at3} or not ${at5} then ${safeError}(${tamperMsg})end;return true end)()`,
      `local ${statusVar}:boolean,${errVar}:any=${safePcall}(${funcVar})`,
      `if not ${statusVar} then local imnot_handler:any=${safeWarn} or ${safePrint} or function(...)end;(imnot_handler::any)(${execErrMsg})end`
    ];

    return OBFUSCATOR_HEADER + "\n" + raw.join(";");
  }

  garbage(count) {
    const parts = [];
    for (let i = 0; i < count; i++) {
      const vn = this.ni();
      const m = Math.floor(Math.random() * 5);
      switch (m) {
        case 0:
          parts.push(
            `local ${vn}=${Math.floor(Math.random() * 999999)}`
          );
          break;
        case 1:
          parts.push(
            `local ${vn}=(function()return ${Math.floor(
              Math.random() * 99999
            )} end)()`
          );
          break;
        case 2:
          parts.push(
            `local ${vn}={${Array.from(
              {
                length: Math.floor(Math.random() * 4) + 2
              },
              () => Math.floor(Math.random() * 999)
            ).join(",")}}`
          );
          break;
        case 3:
          parts.push(
            `local ${vn}=${Math.floor(
              Math.random() * 255
            )}+${Math.floor(Math.random() * 255)}`
          );
          break;
        case 4:
          parts.push(
            `local ${vn}=(${Math.floor(
              Math.random() * 500
            )}*${Math.floor(
              Math.random() * 500
            )})-${Math.floor(Math.random() * 9999)}`
          );
          break;
      }
    }
    return parts.join(";");
  }

  esc(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
      try {
        fs.unlinkSync(i);
      } catch (e) {}
      try {
        fs.unlinkSync(o);
      } catch (e) {}
      return r;
    }
  } catch (e) {
    try {
      fs.unlinkSync(i);
    } catch (e2) {}
    try {
      fs.unlinkSync(o);
    } catch (e2) {}
  }
  return null;
}

function obfuscateWithPython(src) {
  const i = path.join(__dirname, `temp_in_${Date.now()}.lua`);
  const o = path.join(__dirname, `temp_out_${Date.now()}.lua`);
  try {
    fs.writeFileSync(i, src, "utf-8");
    execSync(`python obfuscator.py "${i}" "${o}"`, {
      timeout: 30000
    });
    if (fs.existsSync(o)) {
      const r = fs.readFileSync(o, "utf-8");
      try {
        fs.unlinkSync(i);
      } catch (e) {}
      try {
        fs.unlinkSync(o);
      } catch (e) {}
      return r;
    }
  } catch (e) {
    try {
      fs.unlinkSync(i);
    } catch (e2) {}
    try {
      fs.unlinkSync(o);
    } catch (e2) {}
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
