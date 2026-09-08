#!/usr/bin/env python3
import argparse
import re
import sys
import time

HEADER = r"""--!nocheck
--[[
$$\                                    $$\     $$$$$$$$\                                      $$\
\__|                                   $$ |    $$  _____|                                     $$ |
$$\ $$$$$$\$$$$\  $$$$$$$\   $$$$$$\ $$$$$$\   $$ |   $$\   $$\  $$$$$$$\  $$$$$$$\ $$$$$$\ $$$$$$\    $$$$$$\   $$$$$$\
$$ |$$  _$$  _$$\ $$  __$$\ $$  __$$\\_$$  _|  $$$$$\ $$ |  $$ |$$  _____|$$  _____|\____$$\\_$$  _|  $$  __$$\ $$  __$$\
$$ |$$ / $$ / $$ |$$ |  $$ |$$ /  $$ | $$ |    $$  __|$$ |  $$ |\$$$$$$\  $$ /      $$$$$$$ | $$ |    $$ /  $$ |$$ |  \__|
$$ |$$ | $$ | $$ |$$ |  $$ |$$ |  $$ | $$ |$$\ $$ |   $$ |  $$ | \____$$\ $$ |     $$  __$$ | $$ |$$\ $$ |  $$ |$$ |
$$ |$$ | $$ | $$ |$$ |  $$ |\$$$$$$  | \$$$$  |$$ |   \$$$$$$  |$$$$$$$  |\$$$$$$$\\$$$$$$$ | \$$$$  |\$$$$$$  |$$ |
\__|\__| \__| \__|\__|  \__| \______/   \____/ \__|    \______/ \_______/  \_______|\_______|  \____/  \______/ \__|


                                                                                                                          Fully made by imnotexploi4 (A.K.A the_baconthecheat)
]]"""

TARGETS = {"auto", "lua51", "lua52", "lua53", "lua54", "lua55", "luajit", "luau"}
ROBLOX_TYPES = {"studio", "require", "exploit"}
RESERVED = {
    'and','break','do','else','elseif','end','false','for','function','goto','if','in','local','nil','not','or','repeat','return','then','true','until','while',
    'continue','type','export','typeof','print','warn','pairs','ipairs','next','select','unpack','rawget','rawset','rawequal','rawlen','tonumber','tostring','pcall','xpcall','error','assert',
    'setmetatable','getmetatable','require','table','string','math','coroutine','os','io','debug','bit32','utf8','task','wait','spawn','delay','tick','time','elapsedTime','game','workspace','script',
    'Instance','Vector3','Vector2','CFrame','Color3','BrickColor','UDim','UDim2','Enum','Ray','Region3','TweenInfo','NumberRange','NumberSequence','ColorSequence','Rect','Font','Axes','Faces',
    'Players','RunService','UserInputService','ReplicatedStorage','ServerStorage','ServerScriptService','StarterGui','StarterPack','StarterPlayer','CoreGui','Lighting','Debris','HttpService',
    'MarketplaceService','DataStoreService','PathfindingService','PhysicsService','SoundService','TextService','Chat','Teams','TestService','CollectionService','VirtualInputManager',
    '_G','_VERSION','shared','self','new','New','clone','Clone','Destroy','destroy','FindFirstChild','WaitForChild','GetChildren','GetDescendants','IsA','GetService','Connect','Fire','Invoke',
    'insert','remove','sort','concat','find','sub','len','rep','reverse','upper','lower','byte','char','format','match','gmatch','gsub','abs','ceil','floor','max','min','sqrt','random','randomseed','sin','cos','tan','huge','pi','clamp','lerp',
    'getfenv','setfenv','loadstring','load','dofile','collectgarbage'
}

ANTI_TAMPER_MESSAGES = (
    'LOOL imagine you use the 25ms and Threaded to skid this thing lel',
    'holy skid',
    'nice try skid, but this aint gonna work for you lmaooo',
    'integrity check failed successfully. this script has been modified.',
    'execute script error',
)

class PRNG:
    MOD = 2147483647
    MUL = 48271
    def __init__(self, seed=None):
        if seed is None:
            seed = int(time.time_ns() ^ time.perf_counter_ns())
        seed = int(seed) % (self.MOD - 1) + 1
        self.state = seed
    def next(self):
        self.state = (self.state * self.MUL) % self.MOD
        return self.state
    def randint(self, lo, hi):
        if hi < lo:
            raise ValueError('invalid random range')
        return lo + (self.next() % (hi - lo + 1))
    def shuffle(self, items):
        items = list(items)
        for i in range(len(items) - 1, 0, -1):
            j = self.randint(0, i)
            items[i], items[j] = items[j], items[i]
        return items

class Obfuscator:
    def __init__(self, target='auto', seed=None, roblox_type=None):
        if target not in TARGETS:
            raise ValueError(f'unknown target: {target}')
        if roblox_type is not None and roblox_type not in ROBLOX_TYPES:
            raise ValueError(f'unknown --type: {roblox_type}')
        if target == 'luau' and roblox_type is None:
            raise ValueError('target luau requires --type studio, --type require, or --type exploit')
        self.target = target
        self.roblox_type = roblox_type
        self.rng = PRNG(seed)
        self.ic = 0
        self.rename_map = {}
        self.decoders = []
        self.gseed_name = None
        self.gseed_value = 0

    def ni(self):
        self.ic += 1
        return f'imnot{self.ic}'

    @staticmethod
    def mod_inv_256(a):
        a %= 256
        for x in range(1, 256, 2):
            if (a * x) % 256 == 1:
                return x
        raise ValueError('odd multiplier has no inverse')

    @staticmethod
    def xor8(a, b):
        out, bit = 0, 1
        for _ in range(8):
            if (a & 1) != (b & 1):
                out += bit
            a >>= 1
            b >>= 1
            bit <<= 1
        return out

    @staticmethod
    def rol8(v, r):
        r %= 8
        if r == 0:
            return v & 255
        return (((v << r) & 255) | (v >> (8 - r))) & 255

    def key_for(self, seed, offset, pos, prev, state, mult, add, mix, salt, mode, state_mix):
        if mode == 1:
            return (seed + offset + pos * mult + prev * mix + state * state_mix) % 256
        if mode == 2:
            return (seed + offset + pos * mult + prev * mix + add + state * state_mix) % 256
        if mode == 3:
            return (seed + offset + pos * mix + prev * mult + salt + state * state_mix) % 256
        return (seed + offset + (pos + prev) * mult + add + prev * mix + state * state_mix) % 256

    @staticmethod
    def ror8(v, r):
        r %= 8
        if r == 0:
            return v & 255
        return ((v >> r) | ((v << (8 - r)) & 255)) & 255

    @staticmethod
    def mix8(z, pos, seed, mul, add):
        return (z * mul + pos * add + seed) % 256

    @staticmethod
    def seq_hash(values):
        h = 0
        for v in values:
            h = (h * 131 + int(v)) % 2147483647
        return h

    def encode_string(self, value):
        is_master = self.gseed_name is None
        vn = self.ni()
        data = value.encode('utf-8')
        seed = self.rng.randint(0, 255)
        mult = self.rng.randint(1, 255)
        add = self.rng.randint(1, 255)
        mix = self.rng.randint(1, 255)
        salt = self.rng.randint(1, 255)
        rot = self.rng.randint(1, 7)
        affine = self.rng.randint(1, 255) | 1
        inv_affine = self.mod_inv_256(affine)
        mode = self.rng.randint(1, 4)
        state_seed = self.rng.randint(0, 255)
        state_mul = self.rng.randint(1, 255) | 1
        state_add = self.rng.randint(1, 255)
        state_mix = self.rng.randint(1, 255)
        layout_affine = self.rng.randint(1, 255) | 1
        layout_inv = self.mod_inv_256(layout_affine)
        layout_salt = self.rng.randint(1, 255)
        layout_mode = self.rng.randint(1, 3)
        offset = 0 if is_master else self.gseed_value
        encoded = []
        prev = seed
        state = (seed * 17 + state_seed) % 256
        for pos, byte in enumerate(data, 1):
            key = self.key_for(seed, offset, pos, prev, state, mult, add, mix, salt, mode, state_mix)
            x = self.xor8(byte, key)
            x = (x + pos * add + prev * mix + state * state_mix + salt) % 256
            x = self.rol8(x, rot)
            x = (x * affine + salt) % 256
            z = (x + prev + add + state) % 256
            encoded.append(z)
            state = self.mix8(z, pos, seed, state_mul, state_add)
            prev = z
        order = list(range(len(encoded)))
        order = [x + 1 for x in self.rng.shuffle(order)]
        stored = [0] * len(encoded)
        for logical_pos, physical_pos in enumerate(order):
            stored[physical_pos - 1] = (encoded[logical_pos] * layout_affine + layout_salt) % 256
        tag = self.seq_hash(stored + order + [seed, mult, add, mix, salt, rot, affine, mode, state_seed, state_mul, state_add, state_mix, layout_affine, layout_salt, layout_mode]) % 65536
        if is_master:
            gsv = self.ni()
            tpl = self._decoder_template(vn, stored, order, seed, mult, add, mix, salt, rot, affine, inv_affine, mode, state_seed, state_mul, state_add, state_mix, layout_affine, layout_inv, layout_salt, layout_mode, None, tag, True, gsv)
            self.decoders.append(tpl)
            self.gseed_name = gsv
            self.gseed_value = self.seq_hash(encoded) % 256
        else:
            tpl = self._decoder_template(vn, stored, order, seed, mult, add, mix, salt, rot, affine, inv_affine, mode, state_seed, state_mul, state_add, state_mix, layout_affine, layout_inv, layout_salt, layout_mode, self.gseed_name, tag, False, None)
            self.decoders.append(tpl)
        return vn

    @staticmethod
    def _key_line(mode, key, seed, off, idx, mult, add, mix, salt, state, state_mix, prev):
        if mode == 1:
            expr = f'({seed}+{off}+{idx}*{mult}+{prev}*{mix}+{state}*{state_mix})%256'
        elif mode == 2:
            expr = f'({seed}+{off}+{idx}*{mult}+{prev}*{mix}+{add}+{state}*{state_mix})%256'
        elif mode == 3:
            expr = f'({seed}+{off}+{idx}*{mix}+{prev}*{mult}+{salt}+{state}*{state_mix})%256'
        else:
            expr = f'({seed}+{off}+({idx}+{prev})*{mult}+{add}+{prev}*{mix}+{state}*{state_mix})%256'
        return f'local {key}={expr};'

    def _decoder_template(self, vn, stored, order, seed, mult, add, mix, salt, rot, affine, inv_affine, mode, state_seed, state_mul, state_add, state_mix, layout_affine, layout_inv, layout_salt, layout_mode, gvar, tag, master, gsv):
        d = self.ni(); out = self.ni(); prev = self.ni(); state = self.ni(); idx = self.ni(); z = self.ni(); tmp = self.ni(); key = self.ni(); bytev = self.ni(); hv = self.ni()
        off = '0' if master else gvar
        pow2 = 2 ** rot
        rpow = 2 ** (8 - rot)
        order_lit = ','.join(map(str, order))
        parts = [
            f'local {vn}' + (f', {gsv}' if master else '') + '=(function()',
            f'local {d}={{{",".join(map(str, stored))}}};local {out}={{}};local {prev}={seed};local {state}=({seed}*17+{state_seed})%256;local {hv}=0;local imnot_map={{{order_lit}}};',
            f'for {idx}=1,#{d} do {hv}=({hv}*131+{d}[{idx}])%2147483647 end;for {idx}=1,#imnot_map do {hv}=({hv}*131+imnot_map[{idx}])%2147483647 end;',
            f'{hv}=({hv}*131+{seed})%2147483647;{hv}=({hv}*131+{mult})%2147483647;{hv}=({hv}*131+{add})%2147483647;{hv}=({hv}*131+{mix})%2147483647;{hv}=({hv}*131+{salt})%2147483647;{hv}=({hv}*131+{rot})%2147483647;{hv}=({hv}*131+{affine})%2147483647;{hv}=({hv}*131+{mode})%2147483647;{hv}=({hv}*131+{state_seed})%2147483647;{hv}=({hv}*131+{state_mul})%2147483647;{hv}=({hv}*131+{state_add})%2147483647;{hv}=({hv}*131+{state_mix})%2147483647;{hv}=({hv}*131+{layout_affine})%2147483647;{hv}=({hv}*131+{layout_salt})%2147483647;{hv}=({hv}*131+{layout_mode})%2147483647;',
            f'if {hv}%65536~={tag} then error() end;'
        ]
        if layout_mode == 1:
            recover = f'local {z}=((({d}[imnot_map[{idx}]]-{layout_salt})*{layout_inv})%256);'
        elif layout_mode == 2:
            recover = f'local {z}=((({d}[imnot_map[{idx}]]+{(256-layout_salt)%256})*{layout_inv})%256);'
        else:
            recover = f'local {z}=((({d}[imnot_map[{idx}]]*{layout_inv})-(({layout_salt}*{layout_inv})%256))%256);'
        loop = [
            f'for {idx}=1,#{d} do {recover}',
            f'local {tmp}=({z}-{prev}-{add}-{state})%256;',
            f'{tmp}=(({tmp}-{salt})*{inv_affine})%256;',
            f'{tmp}=(({tmp}%{pow2})*{rpow})+math.floor({tmp}/{pow2});',
            self._key_line(mode, key, seed, off, idx, mult, add, mix, salt, state, state_mix, prev),
            f'{tmp}=({tmp}-{idx}*{add}-{prev}*{mix}-{state}*{state_mix}-{salt})%256;',
            f'local {bytev}=0;local imnot_bv=1;local imnot_av={tmp};local imnot_kv={key};',
            f'for imnot_bit=1,8 do if imnot_av%2~=imnot_kv%2 then {bytev}={bytev}+imnot_bv end;imnot_av=math.floor(imnot_av/2);imnot_kv=math.floor(imnot_kv/2);imnot_bv=imnot_bv*2 end;',
            f'{out}[{idx}]=string.char({bytev});{state}=({z}*{state_mul}+{idx}*{state_add}+{seed})%256;{prev}={z};end;'
        ]
        parts.extend(loop)
        if master:
            parts.append(f'local {hv}=0;for {idx}=1,#{d} do local imnot_layout_z=((({d}[imnot_map[{idx}]]-{layout_salt})*{layout_inv})%256);{hv}=({hv}*131+imnot_layout_z)%2147483647 end;{hv}={hv}%256;return table.concat({out}),{hv};end)()')
        else:
            parts.append(f'return table.concat({out});end)()')
        return ''.join(parts)

    def read_long_bracket(self, code, pos):
        if pos >= len(code) or code[pos] != '[':
            return None
        j = pos + 1
        eq = 0
        while j < len(code) and code[j] == '=':
            eq += 1; j += 1
        if j < len(code) and code[j] == '[':
            return eq, j + 1
        return None

    def remove_comments(self, code):
        out = []; i = 0; n = len(code)
        while i < n:
            if code[i] in "'\"":
                q = code[i]; out.append(q); i += 1
                while i < n:
                    ch = code[i]; out.append(ch); i += 1
                    if ch == '\\' and i < n:
                        out.append(code[i]); i += 1
                    elif ch == q:
                        break
                continue
            if code[i] == '[':
                lo = self.read_long_bracket(code, i)
                if lo:
                    eq, start = lo; close = ']' + '=' * eq + ']'; end = code.find(close, start)
                    if end != -1:
                        out.append(code[i:end+len(close)]); i = end + len(close); continue
            if code[i:i+2] == '--':
                lo = self.read_long_bracket(code, i + 2)
                if lo:
                    eq, start = lo; close = ']' + '=' * eq + ']'; end = code.find(close, start)
                    if end == -1:
                        raise ValueError('unterminated long comment')
                    i = end + len(close); continue
                while i < n and code[i] != '\n': i += 1
                if i < n: out.append('\n'); i += 1
                continue
            out.append(code[i]); i += 1
        return ''.join(out)

    @staticmethod
    def parse_escape(s, i):
        if i >= len(s): return '', i
        ch = s[i]
        simple = {'a':'\a','b':'\b','f':'\f','n':'\n','r':'\r','t':'\t','v':'\v','\\':'\\','"':'"',"'":"'"}
        if ch in simple: return simple[ch], i + 1
        if ch == '\n': return '\n', i + 1
        if ch == 'z':
            i += 1
            while i < len(s) and s[i].isspace(): i += 1
            return '', i
        if ch == 'x' and i + 2 < len(s) and re.match(r'^[0-9A-Fa-f]{2}$', s[i+1:i+3]):
            return chr(int(s[i+1:i+3], 16)), i + 3
        if ch.isdigit():
            j = i
            while j < len(s) and j < i + 3 and s[j].isdigit(): j += 1
            return chr(int(s[i:j]) & 255), j
        return ch, i + 1

    def extract_strings(self, code):
        strings = []; result = []; i = 0; n = len(code)
        while i < n:
            if code[i] in "'\"":
                q = code[i]; i += 1; raw = []
                while i < n and code[i] != q:
                    if code[i] == '\\':
                        raw.append(code[i]);
                        i += 1
                        if i < n:
                            raw.append(code[i]); i += 1
                    else:
                        raw.append(code[i]); i += 1
                if i >= n:
                    raise ValueError('unterminated string')
                i += 1
                raw_s = ''.join(raw); decoded=[]; j=0
                while j < len(raw_s):
                    if raw_s[j] == '\\':
                        val, j = self.parse_escape(raw_s, j + 1); decoded.append(val)
                    else:
                        decoded.append(raw_s[j]); j += 1
                strings.append((''.join(decoded), 'quoted'))
                result.append(f'__STR_{len(strings)-1}__')
                continue
            lo = self.read_long_bracket(code, i)
            if lo:
                eq, start = lo; close = ']' + '=' * eq + ']'; end = code.find(close, start)
                if end == -1:
                    raise ValueError('unterminated long string')
                content = code[start:end]
                strings.append((content, 'long'))
                result.append(f'__STR_{len(strings)-1}__')
                i = end + len(close); continue
            result.append(code[i]); i += 1
        return ''.join(result), strings

    def lex(self, code):
        tokens=[]; i=0; n=len(code)
        while i<n:
            ch=code[i]
            if ch.isspace():
                j=i+1
                while j<n and code[j].isspace(): j+=1
                tokens.append(('ws',code[i:j])); i=j; continue
            if ch.isalpha() or ch=='_':
                j=i+1
                while j<n and (code[j].isalnum() or code[j]=='_'): j+=1
                tokens.append(('id',code[i:j])); i=j; continue
            if ch.isdigit():
                j=i+1
                while j<n and (code[j].isalnum() or code[j] in '._+-'):
                    if code[j] in '+-' and code[j-1].lower() not in 'e': break
                    j+=1
                tokens.append(('num',code[i:j])); i=j; continue
            matched = None
            for op in ('...','::','//=','<<=','>>=','..=','==','~=','<=','>=','..','//','<<','>>','+=','-=','*=','/=','%=','^='):
                if code.startswith(op,i): matched=op; break
            if matched:
                tokens.append(('sym',matched)); i+=len(matched); continue
            tokens.append(('sym',ch)); i+=1
        return tokens

    def significant(self, toks):
        return [t for t in toks if t[0] != 'ws']

    def collect_rename_map(self, toks):
        sig=self.significant(toks)
        mapping={}; order=[]
        def add(name):
            if name.startswith('__STR_') or name in RESERVED: return
            if name not in mapping:
                mapping[name]=self.ni(); order.append(name)
        i=0
        while i<len(sig):
            kind,val=sig[i]
            if val=='local':
                j=i+1
                if j<len(sig) and sig[j][1]=='function':
                    j+=1
                    if j<len(sig) and sig[j][0]=='id': add(sig[j][1])
                else:
                    while j<len(sig):
                        if sig[j][1] in ('=', 'function'): break
                        if sig[j][0]=='id': add(sig[j][1])
                        j+=1
            elif val=='for':
                j=i+1
                while j<len(sig) and sig[j][1] not in ('=', 'in', 'do'):
                    if sig[j][0]=='id': add(sig[j][1])
                    j+=1
            elif val=='function':
                j=i+1
                while j<len(sig) and sig[j][1] not in ('(',): j+=1
                if j<len(sig) and sig[j][1]=='(':
                    j+=1; depth=1
                    while j<len(sig) and depth:
                        v=sig[j][1]
                        if v=='(': depth+=1
                        elif v==')': depth-=1
                        elif depth==1 and sig[j][0]=='id':
                            # parameter names are before a type annotation colon.
                            prev=sig[j-1][1] if j>0 else ''
                            if prev not in (':', '.') and (j+1>=len(sig) or sig[j+1][1] != ':'):
                                add(v)
                        j+=1
            i+=1
        return mapping, order

    def transform_tokens(self, toks):
        mapping, order = self.collect_rename_map(toks)
        out=[]; sig=[idx for idx,t in enumerate(toks) if t[0] != 'ws']; sigpos=0; brace=0
        for idx,(kind,val) in enumerate(toks):
            if kind=='ws': out.append((kind,val)); continue
            prev = toks[sig[sigpos-1]][1] if sigpos>0 else ''
            nextv = toks[sig[sigpos+1]][1] if sigpos+1<len(sig) else ''
            new=val
            if kind=='id' and val in mapping and not val.startswith('__STR_'):
                if prev in ('.', ':') or prev=='::' or nextv=='::':
                    pass
                elif nextv=='=' and brace>0 and prev in ('{', ','):
                    pass
                else:
                    new=mapping[val]
            elif kind=='num' and re.fullmatch(r'\d{2,7}', val or ''):
                n=int(val)
                if 10 <= n <= 1000000:
                    form=self.rng.randint(1,3)
                    if form==1:
                        a=self.rng.randint(2,max(2,min(97,n//2))); b=n//a; r=n-a*b
                        new=f'({a}*{b})' if r==0 else f'(({a}*{b})+{r})'
                    elif form==2:
                        c=self.rng.randint(2,max(2,min(97,n//2))); q=n//c
                        r=n-c*q
                        new=f'({q}*{c}+{r})'
                    else:
                        a=self.rng.randint(2,max(2,min(31,n//2))); b=self.rng.randint(2,31); c=n-a*b
                        new=f'(({a}*{b})+{c})'
            out.append(('text',new))
            if val=='{': brace+=1
            elif val=='}': brace=max(0,brace-1)
            sigpos+=1
        return ''.join(v for _,v in out)

    def protect_require_ids(self, code):
        if self.roblox_type != 'require':
            return code
        pattern = re.compile(r'\brequire\s*\(\s*(\d{1,18})\s*\)')
        def repl(m):
            n = int(m.group(1))
            if n < 1:
                return m.group(0)
            base = self.rng.randint(97, 997)
            parts = []
            rem = n
            while rem:
                parts.append(rem % base)
                rem //= base
            if not parts:
                parts = [0]
            acc = str(parts[-1])
            for part in reversed(parts[:-1]):
                acc = f'(({acc}*{base})+{part})'
            noise = self.rng.randint(7, 91)
            return f'(function() local imnot_reqbase={base}; local imnot_reqx={acc}; local imnot_reqn={noise}; return (imnot_reqx+imnot_reqn-imnot_reqn) end)()'
        return pattern.sub(repl, code)

    def split_literal(self, value):
        # Split on Unicode code-point boundaries so UTF-8 strings can never be cut mid-byte.
        if len(value) < 12:
            return [value]
        count = min(4, max(2, self.rng.randint(2, 4)))
        cuts = sorted({self.rng.randint(1, len(value) - 1) for _ in range(count - 1)})
        bounds = [0] + cuts + [len(value)]
        return [value[a:b] for a, b in zip(bounds, bounds[1:])]

    def protect_strings(self, code, strings):
        result=code
        for idx,(value,kind) in enumerate(strings):
            pieces=self.split_literal(value)
            refs=[self.encode_string(piece) for piece in pieces]
            expr=refs[0] if len(refs)==1 else '('+'..'.join(refs)+')'
            result=result.replace(f'__STR_{idx}__',expr,1)
        return result

    def garbage(self, count):
        parts=[]
        for _ in range(count):
            v=self.ni(); r=self.rng.randint(1,6)
            if r==1: parts.append(f'local {v}=({self.rng.randint(10,9999)}+{self.rng.randint(10,9999)})')
            elif r==2: parts.append(f'local {v}=(function()local imnot_x={self.rng.randint(1,999)};return imnot_x end)()')
            elif r==3:
                vals=','.join(str(self.rng.randint(1,255)) for _ in range(self.rng.randint(2,5)))
                parts.append(f'local {v}={{{vals}}}')
            elif r==4: parts.append(f'local {v}=(({self.rng.randint(11,999)}>{self.rng.randint(1,10)}) and 1 or 0)')
            elif r==5: parts.append(f'local {v}=#"{self.rng.randint(1,8)*"x"}"')
            else: parts.append(f'local {v}=(({self.rng.randint(2,50)}*{self.rng.randint(2,50)})%{self.rng.randint(51,251)})')
        return ';'.join(parts)

    def build(self, body):
        # Preserve the original anti-tamper message text byte-for-byte.
        bce=self.encode_string('error'); bcp=self.encode_string('pcall'); bcts=self.encode_string('tostring'); bcty=self.encode_string('type')
        bcni=self.encode_string('__newindex'); bcix=self.encode_string('__index'); bcdb=self.encode_string('debug'); bcgi=self.encode_string('getinfo'); bcco=self.encode_string('coroutine'); bcc=self.encode_string('C')
        tm=self.encode_string(ANTI_TAMPER_MESSAGES[0]); tm2=self.encode_string(ANTI_TAMPER_MESSAGES[1]); tm3=self.encode_string(ANTI_TAMPER_MESSAGES[2]); im=self.encode_string(ANTI_TAMPER_MESSAGES[3]); eem=self.encode_string(ANTI_TAMPER_MESSAGES[4])
        env=self.ni(); fn=self.ni(); ok=self.ni(); err=self.ni(); prot=self.ni(); pr=self.ni(); wr=self.ni(); er=self.ni(); pc=self.ni(); ty=self.ni()
        a1,a2,a3,a4,a5,a6,a7=[self.ni() for _ in range(7)]
        raw_checksum=self.seq_hash(body.encode('utf-8'))
        hashvar=self.ni(); mirror=self.ni(); checker=self.ni(); state=self.ni()
        ga=self.garbage(12); gb=self.garbage(16); gc=self.garbage(10); declarations=';'.join(self.decoders)
        checks=[
            f'local {a1}=(function()local imnot_ok,imnot_t={pc}(function()return {ty}({er})=="function"end);if not imnot_ok or not imnot_t then {er}({tm})end;return true end)()',
            f'local {a2}=(function()local imnot_checks={{{bce},{bcp},{bcts},{bcty}}};for imnot_ci=1,#imnot_checks do local imnot_fn={env}[imnot_checks[imnot_ci]];if {ty}(imnot_fn)~="function"then {er}({tm2})end end;return true end)()',
            f'local {a3}=(function()local imnot_dok,imnot_dlib={pc}(function()return {env}[{bcdb}]end);if imnot_dok and imnot_dlib then local imnot_ghok,imnot_gh={pc}(function()return imnot_dlib[{bcgi}]end);if imnot_ghok and imnot_gh then local imnot_info=imnot_gh(1);if imnot_info and imnot_info.what=={bcc} then {er}({tm3})end end end;return true end)()',
            f'local {a4}=setmetatable({prot},{{[{bcni}]=function(){er}({tm})end,[{bcix}]=function(_imnot_self,imnot_key)if imnot_key=={hashvar} then return true end;return nil end}})',
            f'local {a5}=(function()local imnot_cok,imnot_clib={pc}(function()return {env}[{bcco}]end);if imnot_cok and imnot_clib then local imnot_running=imnot_clib.running;if imnot_running then imnot_running()end end;return true end)()',
            f'local {a6}=(function()local imnot_c1ok,imnot_c1={pc}(function()return os.clock()end);if not imnot_c1ok or type(imnot_c1)~="number"then return true end;local imnot_acc=0;for imnot_ti=1,20000 do imnot_acc=imnot_acc+imnot_ti end;local imnot_c2ok,imnot_c2={pc}(function()return os.clock()end);if imnot_c2ok and type(imnot_c2)=="number" and (imnot_c2-imnot_c1)>2 then {er}({tm3})end;return true end)()',
            f'local {a7}=(function()local imnot_rwok,imnot_rwr={pc}(function()return rawequal(1,1)end);if not imnot_rwok or imnot_rwr~=true then {er}({tm2})end;return true end)()',
        ]
        checks=self.rng.shuffle(checks); check_names=self.rng.shuffle([a1,a2,a3,a5,a6,a7]); sc_cond='not '+' or not '.join(check_names)
        raw=[declarations,f'local {env}=_G',f'local {pr}=print',f'local {wr}=warn',f'local {er}=error',f'local {pc}=pcall',f'local {ty}=typeof or type',ga,f'local {prot}={{}}',f'local {hashvar}={raw_checksum}',checks and ';'.join(checks) or '',gb,f'local {mirror}={raw_checksum}',f'local {checker}=function()if {mirror}~={hashvar} then {er}({im})end end',f'{checker}()',f'local {fn}=function(){checker}();{body} end',gc,f'local {state}=(function()if {sc_cond} then {er}({tm})end;return true end)()',f'local {ok},{err}={pc}({fn})',f'if not {ok} then local imnot_handler={wr} or {pr} or function(...)end;imnot_handler({eem})end']
        return HEADER+'\n'+';'.join(x for x in raw if x)

    def obfuscate(self, source):
        self.ic=0; self.rename_map={}; self.decoders=[]; self.gseed_name=None; self.gseed_value=0
        cleaned=self.remove_comments(source)
        skeleton, strings=self.extract_strings(cleaned)
        if self.roblox_type == 'require':
            skeleton=self.protect_require_ids(skeleton)
        tokens=self.lex(skeleton)
        body=self.transform_tokens(tokens)
        body=self.protect_strings(body, strings)
        return self.build(body)

def main():
    ap=argparse.ArgumentParser(description='imnotFuscator')
    ap.add_argument('input'); ap.add_argument('output')
    ap.add_argument('--target',choices=sorted(TARGETS),default='auto')
    ap.add_argument('--seed',type=int,default=None)
    ap.add_argument('--type',dest='roblox_type',choices=sorted(ROBLOX_TYPES),default=None)
    args=ap.parse_args()
    try: source=open(args.input,encoding='utf-8').read()
    except Exception as e: print(f'ERROR: {e}'); return 1
    try: result=Obfuscator(args.target,args.seed,args.roblox_type).obfuscate(source)
    except Exception as e: print(f'ERROR: {e}'); return 1
    try: open(args.output,'w',encoding='utf-8').write(result)
    except Exception as e: print(f'ERROR: {e}'); return 1
    print('OK'); return 0
if __name__=='__main__': sys.exit(main())
