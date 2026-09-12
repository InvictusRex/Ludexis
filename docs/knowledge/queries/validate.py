"""Validate the knowledge graph and knowledge docs against the source code.

Usage:
  python docs/knowledge/queries/validate.py              grouped summary, 5 samples per check
  python docs/knowledge/queries/validate.py --verbose    list every issue
  python docs/knowledge/queries/validate.py --stats-json entity/relationship counts as JSON

Exit code 0 when there is no ERROR, 1 otherwise. WARN never fails the run.
"""
import argparse
import ast
import json
import re
import subprocess
import sys
import warnings
from collections import Counter, defaultdict
from pathlib import Path

warnings.filterwarnings("ignore", category=SyntaxWarning)  # invalid escapes in parsed sources
ROOT = Path(__file__).resolve().parents[3]
KN = ROOT / "docs/knowledge"
BE = ROOT / "backend"
APP = BE / "app"
FE = ROOT / "frontend"

PREFIX = {
    "Router": "router", "APIRoute": "api", "Service": "service", "Repository": "repo",
    "Model": "model", "Schema": "schema", "Provider": "provider", "Task": "task",
    "DBTable": "table", "DBEnum": "dbenum", "Domain": "domain", "Layer": "layer",
    "ExternalProvider": "extprov", "TestFile": "test", "Module": "module",
    "Migration": "migration", "Class": "class", "Page": "page", "Layout": "layout",
    "Component": "comp", "Hook": "hook", "Context": "ctx", "ApiModule": "apimod",
    "ApiFunction": "apifn", "LibUtil": "lib", "TypeModule": "typemod", "Type": "type",
}
REL_TYPES = set(
    "EXPOSES CALLS DEPENDS_ON EXTENDS ACCESSES READS WRITES DISPATCHES CONSUMES PROVIDES "
    "USES_PROVIDER BELONGS_TO FLOWS_TO TESTS DEFINES MAPS_TO NESTS USES_ENUM MANY_TO_MANY "
    "MANY_TO_ONE ONE_TO_MANY ASSOCIATED_THROUGH ACCEPTS RETURNS IMPORTS CREATES RENDERS "
    "USES_HOOK USES_CONTEXT CALLS_API CALLS_ENDPOINT USES_CLIENT MIRRORS CONTAINS".split())
ENT_FIELDS = ("id", "type", "name", "source_file", "source_line_start", "discovered_at",
              "last_verified_at", "commit_hash", "properties")
REL_FIELDS = ("source_id", "target_id", "type", "source_file", "source_line", "confidence", "inferred")
NON_CODE = {"Domain", "Layer", "ExternalProvider", "TestFile"}
DOMAIN_REQUIRED = {"APIRoute", "Page", "Component", "Hook", "Context", "ApiModule", "ApiFunction", "TypeModule"}
CLASS_DIRS = {"services": "service", "repositories": "repo", "models": "model",
              "schemas": "schema", "providers": "provider"}
HTTP = ("get", "post", "put", "patch", "delete")
TEST_RE = re.compile(r"\.(test|spec)\.tsx?$")

issues = defaultdict(list)


def err(check, msg):
    issues[check].append(("ERROR", msg))


def warn(check, msg):
    issues[check].append(("WARN", msg))


def rel(p):
    return p.relative_to(ROOT).as_posix()


def read(p):
    return p.read_text(encoding="utf-8", errors="replace")


def mod_of(p):
    return ".".join(p.relative_to(BE).with_suffix("").parts)


def fpath(p):
    return p.relative_to(FE).with_suffix("").as_posix()


def props(e):
    return e.get("properties") or {}


def near(line, cands, tol=2):
    return isinstance(line, int) and any(abs(line - c) <= tol for c in cands)


def load(sub):
    out = []
    for f in sorted((KN / "graph" / sub).glob("*.jsonl")):
        for i, line in enumerate(read(f).splitlines(), 1):
            if not line.strip():
                continue
            try:
                r = json.loads(line)
                assert isinstance(r, dict)
            except (ValueError, AssertionError) as e:
                err("integrity", f"{f.name}:{i} invalid JSON record: {e}")
                continue
            r["_where"] = f"{f.name}:{i}"
            out.append(r)
    return out


ENTS = load("entities")
RELS = load("relationships")
BYID = {e.get("id"): e for e in ENTS}


def ids_with(*prefixes):
    return {i for i in BYID if isinstance(i, str) and i.split(":", 1)[0] in prefixes}


def compare(check, truth, prefixes, exempt=()):
    """truth: id -> (source_file, [line candidates] or None). Reports missing, stale and drift."""
    for i, (f, lines) in sorted(truth.items()):
        e = BYID.get(i)
        if not e:
            err(check, f"missing entity {i} ({f})")
        elif e.get("source_file") != f:
            err(check, f"{i} source_file {e.get('source_file')} != {f}")
        elif lines and not near(e.get("source_line_start"), lines):
            err(check, f"{i} source_line_start {e.get('source_line_start')} not within 2 of {lines}")
    for i in sorted(ids_with(*prefixes) - set(truth) - set(exempt)):
        err(check, f"stale entity {i} (not found in code)")


# ---------------------------------------------------------------- integrity
def check_integrity():
    c = "integrity"
    for i, n in Counter(e.get("id") for e in ENTS).items():
        if n > 1:
            err(c, f"duplicate entity id {i} (x{n})")
    for e in ENTS:
        i, t = e.get("id"), e.get("type")
        miss = [k for k in ENT_FIELDS if k not in e]
        if miss:
            err(c, f"{e['_where']} {i} missing fields {miss}")
        if t not in PREFIX:
            err(c, f"{e['_where']} {i} unknown entity type {t}")
        elif not str(i).startswith(PREFIX[t] + ":"):
            err(c, f"{e['_where']} {i} id prefix does not match type {t} (want {PREFIX[t]}:)")
        if e.get("source_file") and not (ROOT / e["source_file"]).exists():
            err(c, f"{i} source_file does not exist: {e['source_file']}")
    for k, n in Counter((r.get("source_id"), r.get("target_id"), r.get("type")) for r in RELS).items():
        if n > 1:
            err(c, f"duplicate edge {k} (x{n})")
    for r in RELS:
        w = r["_where"]
        miss = [k for k in REL_FIELDS if k not in r]
        if miss:
            err(c, f"{w} missing fields {miss}")
        if r.get("type") not in REL_TYPES:
            err(c, f"{w} unknown relationship type {r.get('type')}")
        for k in ("source_id", "target_id"):
            if r.get(k) not in BYID:
                err(c, f"{w} dangling {k} {r.get(k)}")
        if r.get("source_file") and not (ROOT / r["source_file"]).exists():
            err(c, f"{w} source_file does not exist: {r['source_file']}")


BAD_CHARS = {"\u2014": "em dash", "\u2013": "en dash", "\ufffd": "replacement char"}
MOJIBAKE = re.compile("\u00e2\u20ac|\u00c3[\u0080-\u00bf]|\u00c2[\u0080-\u00bf]")


def check_text():
    for f in sorted(KN.rglob("*")):
        if not f.is_file() or f.suffix not in (".md", ".jsonl", ".py"):
            continue
        raw = read(f)
        texts = [raw]
        if f.suffix == ".jsonl":
            dec = []
            for line in raw.splitlines():
                try:
                    dec.append(json.dumps(json.loads(line), ensure_ascii=False))
                except ValueError:
                    pass
            texts.append("\n".join(dec))
        hits = Counter()
        for t in texts:
            found = Counter({name: t.count(ch) for ch, name in BAD_CHARS.items() if ch in t})
            found["mojibake"] = len(MOJIBAKE.findall(t))
            hits |= found
        if +hits:
            err("text", f"{rel(f)}: {dict(+hits)}")


# ---------------------------------------------------------------- backend
def check_classes():
    c = "classes"
    truth, nodes = {}, {}
    for sub, pre in CLASS_DIRS.items():
        for f in sorted((APP / sub).glob("*.py")):
            for n in ast.parse(read(f)).body:
                if isinstance(n, ast.ClassDef):
                    dotted = f"{mod_of(f)}.{n.name}"
                    nodes[dotted] = (pre, f, n)
    graph = defaultdict(list)
    for i in ids_with(*CLASS_DIRS.values(), "class"):
        graph[i.split(":", 1)[1]].append(BYID[i])
    for dotted, (pre, f, n) in sorted(nodes.items()):
        if dotted not in graph:
            err(c, f"missing entity for class {dotted} ({rel(f)}:{n.lineno})")
            continue
        for e in graph[dotted]:
            truth[e["id"]] = (rel(f), [n.lineno])
            if e["id"].split(":")[0] not in (pre, "class"):
                err(c, f"{e['id']} has wrong prefix for {rel(f)} (want {pre}: or class:)")
            methods = sorted(m.name for m in n.body if isinstance(m, (ast.FunctionDef, ast.AsyncFunctionDef))
                             and not m.name.startswith("_"))
            pm = props(e).get("public_methods")
            if pm is None:
                if methods and e.get("type") in ("Service", "Repository", "Provider"):
                    err(c, f"{e['id']} has no public_methods (code: {methods})")
                continue
            got = sorted(str(m).rsplit(".", 1)[-1] for m in pm)
            if got != methods:
                err(c, f"{e['id']} public_methods missing={sorted(set(methods) - set(got))} "
                       f"stale={sorted(set(got) - set(methods))}")
    compare(c, truth, list(CLASS_DIRS.values()) + ["class"])


def api_prefix():
    m = re.search(r'API_PREFIX\s*:\s*str\s*=\s*"([^"]*)"', read(APP / "core/config.py"))
    return m.group(1) if m else "/api"


def route_truth():
    """List of route dicts from router decorators, backend/main.py and the metrics endpoint."""
    pre_api, out = api_prefix(), []
    for f in sorted((APP / "api").glob("*.py")) + [BE / "main.py"]:
        src = read(f)
        tree, lines = ast.parse(src), src.splitlines()
        is_main = f.parent == BE
        prefix = ""
        for n in ast.walk(tree):
            if isinstance(n, ast.Call) and getattr(n.func, "id", "") == "APIRouter":
                for kw in n.keywords:
                    if kw.arg == "prefix" and isinstance(kw.value, ast.Constant):
                        prefix = kw.value.value
        funcs = {n.name: n for n in tree.body if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef))}

        def perms(name, seen):
            # permissions referenced in the handler plus module-level helpers it uses (transitively)
            n = funcs[name]
            start = min([d.lineno for d in n.decorator_list] + [n.lineno])
            seg = "\n".join(lines[start - 1:n.end_lineno])
            found = set(re.findall(r"_permission\(\s*(?:\w+\s*,\s*)?PermissionName\.(\w+)", seg))
            for other in funcs:
                if other not in seen and re.search(rf"\b{other}\b", seg):
                    seen.add(other)
                    found |= perms(other, seen)
            return found

        router = "router:main" if is_main else f"router:{mod_of(f)}"
        for n in funcs.values():
            for d in n.decorator_list:
                if (isinstance(d, ast.Call) and isinstance(d.func, ast.Attribute) and d.func.attr in HTTP
                        and d.args and isinstance(d.args[0], ast.Constant)):
                    path = d.args[0].value if is_main else prefix + d.args[0].value
                    out.append(dict(method=d.func.attr.upper(), path=path, full=path if is_main else pre_api + path,
                                    name=n.name, file=rel(f), lines=[d.lineno, n.lineno], router=router,
                                    perms=sorted(perms(n.name, {n.name}))))
        if is_main:
            for m in re.finditer(r'endpoint\s*=\s*"([^"]+)"', src):
                line = src[:m.start()].count("\n") + 1
                out.append(dict(method="GET", path=None, full=m.group(1), name=None, file=rel(f),
                                lines=[line], router=None, perms=[]))
    return out


ROUTES = []


def check_routes():
    c = "routes"
    ROUTES.extend(route_truth())
    by_full = {(props(e).get("method"), props(e).get("full_path")): e for e in ENTS if e.get("type") == "APIRoute"}
    seen = set()
    for t in ROUTES:
        e = by_full.get((t["method"], t["full"])) or (t["path"] and BYID.get(f"api:{t['method']}:{t['path']}"))
        label = f"{t['method']} {t['full']} ({t['file']}:{t['lines'][0]})"
        if not e:
            err(c, f"missing APIRoute for {label}")
            continue
        seen.add(e["id"])
        p, i = props(e), e["id"]
        if p.get("method") != t["method"]:
            err(c, f"{i} method {p.get('method')} != {t['method']}")
        if p.get("full_path") != t["full"]:
            err(c, f"{i} full_path {p.get('full_path')} != {t['full']}")
        if t["path"] is not None:
            if p.get("path") != t["path"]:
                err(c, f"{i} path {p.get('path')} != {t['path']}")
            if i != f"api:{t['method']}:{t['path']}":
                err(c, f"{i} id should be api:{t['method']}:{t['path']}")
        if t["name"] and e.get("name") != t["name"]:
            err(c, f"{i} name {e.get('name')} != {t['name']}")
        got = sorted(str(x).rsplit(".", 1)[-1] for x in p.get("required_permissions") or [])
        if got != t["perms"]:
            err(c, f"{i} required_permissions {got} != code {t['perms']}")
        if e.get("source_file") != t["file"] or not near(e.get("source_line_start"), t["lines"]):
            err(c, f"{i} location {e.get('source_file')}:{e.get('source_line_start')} != {t['file']}:{t['lines']}")
    for e in ENTS:
        if e.get("type") == "APIRoute" and e.get("id") not in seen:
            err(c, f"stale APIRoute {e.get('id')} (no such route in code)")
    routers = {t["router"]: (t["file"], None) for t in ROUTES if t["router"]}
    compare(c, routers, ["router"])


def check_tasks():
    truth = {}
    for f in sorted((APP / "tasks").glob("*.py")):
        for n in ast.parse(read(f)).body:
            if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef)) and any(
                    "task" in ast.unparse(d) for d in n.decorator_list):
                truth[f"task:{mod_of(f)}.{n.name}"] = (rel(f), [n.lineno] + [d.lineno for d in n.decorator_list])
    compare("tasks", truth, ["task"])


def col_name(node, default):
    if node.args and isinstance(node.args[0], ast.Constant) and isinstance(node.args[0].value, str):
        return node.args[0].value
    return default


def is_col(v):
    return isinstance(v, ast.Call) and ast.unparse(v.func).split(".")[-1] in ("mapped_column", "Column")


def check_tables():
    c = "tables"
    truth, cols = {}, {}
    for f in sorted((APP / "models").glob("*.py")):
        for n in ast.parse(read(f)).body:
            if isinstance(n, ast.ClassDef):
                name, found = None, set()
                for s in n.body:
                    tgt = s.targets[0] if isinstance(s, ast.Assign) else getattr(s, "target", None)
                    if not isinstance(tgt, ast.Name):
                        continue
                    if tgt.id == "__tablename__" and isinstance(s.value, ast.Constant):
                        name = s.value.value
                    elif is_col(s.value):
                        found.add(col_name(s.value, tgt.id))
                if name:
                    truth[f"table:{name}"], cols[name] = (rel(f), [n.lineno, n.lineno + 1]), found
            elif isinstance(n, ast.Assign) and isinstance(n.value, ast.Call) and ast.unparse(n.value.func).endswith("Table"):
                name = col_name(n.value, None)
                if name:
                    truth[f"table:{name}"] = (rel(f), [n.lineno])
                    cols[name] = {col_name(a, None) for a in n.value.args if is_col(a)} - {None}
    compare(c, truth, ["table"])
    for name, found in cols.items():
        e = BYID.get(f"table:{name}")
        if e:
            got = {str(x).removeprefix("col:").rsplit(".", 1)[-1] for x in props(e).get("columns") or []}
            if got != found:
                err(c, f"table:{name} columns missing={sorted(found - got)} stale={sorted(got - found)}")


def check_enums():
    c = "enums"
    enums = {n.name: {t.value.value for t in n.body if isinstance(t, ast.Assign) and isinstance(t.value, ast.Constant)}
             for n in ast.parse(read(APP / "utils/enums.py")).body if isinstance(n, ast.ClassDef)}
    models = "\n".join(read(f) for f in (APP / "models").glob("*.py"))
    graph = {props(e).get("python_class"): e for e in ENTS if e.get("type") == "DBEnum"}
    for name, vals in enums.items():
        if name not in graph:
            if re.search(rf"\b{name}\b", models):
                err(c, f"missing DBEnum for {name} (used in models)")
        elif set(props(graph[name]).get("values") or []) != vals:
            err(c, f"{graph[name]['id']} values {props(graph[name]).get('values')} != code {sorted(vals)}")
    for name, e in graph.items():
        if name not in enums:
            err(c, f"stale DBEnum {e.get('id')} (python_class {name} not in enums.py)")


def check_modules():
    c = "modules"
    files = [f for d in ("core", "utils", "db") for f in sorted((APP / d).glob("*.py"))]
    files += [f for f in (BE / "main.py", BE / "seed_rbac.py", BE / "scripts/seed_demo.py",
                          BE / "alembic/env.py", BE / "tests/conftest.py") if f.exists()]
    files += [f for f in sorted((BE / "tests").rglob("test_*.py")) if not count_tests(f)]  # helpers named test_*
    truth = {f"module:{mod_of(f)}": (rel(f), None) for f in files}
    compare(c, truth, ["module"])
    for f in files:
        e = BYID.get(f"module:{mod_of(f)}")
        if not e:
            continue
        body = ast.parse(read(f)).body
        code = {"public_functions": {n.name for n in body if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef))},
                "public_classes": {n.name for n in body if isinstance(n, ast.ClassDef)}}
        for key, names in code.items():
            names = {n for n in names if not n.startswith("_")}
            got = props(e).get(key)
            if got is not None and set(got) != names:
                err(c, f"{e['id']} {key} missing={sorted(names - set(got))} stale={sorted(set(got) - names)}")


def check_migrations():
    c = "migrations"
    truth, downs = {}, {}
    for f in sorted((BE / "alembic/versions").glob("*.py")):
        src = read(f)
        rev = re.search(r"^revision\s*(?::[^=]+)?=\s*['\"](\w+)['\"]", src, re.M)
        down = re.search(r"^down_revision\s*(?::[^=]+)?=\s*['\"]?(\w+)", src, re.M)
        if rev:
            truth[f"migration:{rev.group(1)}"] = (rel(f), None)
            downs[f"migration:{rev.group(1)}"] = None if not down or down.group(1) == "None" else down.group(1)
    if not truth:
        err(c, "no alembic migrations found in backend/alembic/versions")
    compare(c, truth, ["migration"])
    for i, d in downs.items():
        if i in BYID and props(BYID[i]).get("down_revision") != d:
            err(c, f"{i} down_revision {props(BYID[i]).get('down_revision')} != {d}")


def count_tests(f):
    if f.suffix == ".py":
        return len(re.findall(r"^\s*(?:async\s+)?def test_", read(f), re.M))
    return len(re.findall(r"^\s*(?:it|test)(?:\.(?:only|skip|each))?(?:<[^\n]*?>)?\s*\(", read(f), re.M))


def check_tests():
    c = "tests"
    files = [f for f in sorted((BE / "tests").rglob("test_*.py")) if count_tests(f)]
    files += [f for d in ("app", "components", "hooks", "contexts", "lib") if (FE / d).exists()
              for f in sorted((FE / d).rglob("*")) if re.search(r"\.test\.tsx?$", f.name)]
    files += sorted((FE / "e2e").glob("*.spec.ts"))
    truth = {f"test:{rel(f)}": (rel(f), None) for f in files}
    compare(c, truth, ["test"])
    for f in files:
        e = BYID.get(f"test:{rel(f)}")
        if e and props(e).get("test_count") != count_tests(f):
            err(c, f"{e['id']} test_count {props(e).get('test_count')} != {count_tests(f)}")


# ---------------------------------------------------------------- frontend
def fe_sources(d):
    base = FE / d
    return sorted(p for p in base.rglob("*") if p.suffix in (".ts", ".tsx") and not TEST_RE.search(p.name)
                  and "node_modules" not in p.parts) if base.exists() else []


def route_of(p):
    parts = [x for x in p.parent.relative_to(FE / "app").parts if not x.startswith("(")]
    return "/" + "/".join(parts)


def check_fe_files():
    """Every page/layout/component/hook/context/lib file has exactly the entity kinds the contract allows."""
    c = "fe_files"
    accept = {}
    for p in fe_sources("app"):
        if p.stem in ("page", "layout"):
            accept[p] = [f"{p.stem}:{route_of(p)}"]
    for p in fe_sources("components"):
        accept[p] = [f"comp:{fpath(p)}", f"hook:{fpath(p)}"]
    for p in fe_sources("hooks"):
        accept[p] = [f"hook:{fpath(p)}"]
    for p in fe_sources("contexts"):
        accept[p] = [f"ctx:{fpath(p)}"]
    for p in fe_sources("lib"):
        k = fpath(p)
        if k == "lib/api/index":
            accept[p] = [f"lib:{k}"]
        elif k.startswith("lib/api/"):
            accept[p] = [f"apimod:{k}"]
        elif k == "lib/types/index":
            accept[p] = [f"typemod:{k}", f"lib:{k}"]
        elif k.startswith("lib/types/"):
            accept[p] = [f"typemod:{k}"]
        else:
            accept[p] = [f"lib:{k}"]
    for p, ids in accept.items():
        hit = [i for i in ids if i in BYID]
        if not hit:
            err(c, f"missing entity for {rel(p)} (want {' or '.join(ids)})")
        elif BYID[hit[0]].get("source_file") != rel(p):
            err(c, f"{hit[0]} source_file {BYID[hit[0]].get('source_file')} != {rel(p)}")
    allowed = {i for ids in accept.values() for i in ids}
    for i in sorted(ids_with("page", "layout", "comp", "hook", "ctx", "apimod", "lib", "typemod") - allowed):
        err(c, f"stale entity {i} (no matching file)")


OBJ_RE = re.compile(r"^export const (\w+)\s*=\s*\{", re.M)
METH_RE = re.compile(r"^  (?:async\s+)?(\w+)\s*(?:\(|:\s*(?:async\s*)?(?:<[^>]*>\s*)?\()", re.M)
CALL_RE = re.compile(r"\bapiClient\.(get|getList|post|put|patch|delete)\b|\bmultipartRequest\b")


def http_calls(chunk):
    """[(METHOD, path)] for every apiClient / multipartRequest call in a function body."""
    out = []
    for m in CALL_RE.finditer(chunk):
        rest = chunk[m.end():]
        if m.group(1):
            method = "GET" if m.group(1) == "getList" else m.group(1).upper()
        else:
            close = rest.find(");")
            method = "PATCH" if re.search(r"[\"']PATCH[\"']", rest[:close]) else "POST"
        s = re.search(r"([`\"'])(/[^`\"']*)\1", rest)
        out.append((method, s.group(2) if s else None))
    return out


def api_function_truth():
    """apifn id -> direct HTTP calls, wrapped api functions and resolved calls (through wrappers)."""
    out = {}
    for p in sorted((FE / "lib/api").glob("*.ts")):
        if TEST_RE.search(p.name) or p.stem == "index":
            continue
        src = read(p)
        for m in OBJ_RE.finditer(src):
            end = src.find("\n};", m.end())
            body = src[m.end():end if end > 0 else len(src)]
            starts = list(METH_RE.finditer(body))
            for k, mm in enumerate(starts):
                chunk = body[mm.start():starts[k + 1].start() if k + 1 < len(starts) else len(body)]
                out[f"apifn:{fpath(p)}.{m.group(1)}.{mm.group(1)}"] = dict(
                    calls=http_calls(chunk), file=rel(p), client=p.stem == "client",
                    wraps=re.findall(r"\b(\w+Api\.\w+)\s*\(", chunk))
    by_obj = {".".join(i.rsplit(".", 2)[-2:]): i for i in out}

    def resolve(i, seen):
        calls = list(out[i]["calls"])
        for w in out[i]["wraps"]:
            if by_obj.get(w) and by_obj[w] not in seen:
                seen.add(by_obj[w])
                calls += resolve(by_obj[w], seen)
        return calls

    for i, t in out.items():
        t["resolved"] = resolve(i, {i})
    return out


APIFNS = {}


def npath(p):
    return re.sub(r"\$?\{[^}]*\}", "{}", p.split("?")[0]) if p else p


def path_candidates(p):
    c = npath(p or "").rstrip("/")
    return {c, re.sub(r"\{\}$", "", c).rstrip("/")}  # a trailing var may be a query string


def rpath(p):
    return re.sub(r"\{[^}]*\}", "{}", p or "").rstrip("/")


def check_api_functions():
    c = "api_functions"
    APIFNS.update(api_function_truth())
    client = {i for i, t in APIFNS.items() if t["client"]}
    compare(c, {i: (t["file"], None) for i, t in APIFNS.items() if not t["client"]}, ["apifn"], exempt=client)
    routes = {(t["method"], rpath(t["path"] or t["full"])) for t in ROUTES}
    edges = defaultdict(list)
    for r in RELS:
        if r.get("type") == "CALLS_ENDPOINT":
            edges[r.get("source_id")].append(r.get("target_id"))
    for i, t in APIFNS.items():
        if t["client"]:
            continue
        e, direct, resolved = BYID.get(i), t["calls"], t["resolved"]
        if e:
            # direct callers must record their first call; wrappers may record nothing or any wrapped call
            p = props(e)
            allowed = direct[:1] or [(None, None)] + resolved
            if not any(p.get("http_method") == m and path_candidates(p.get("client_path")) & path_candidates(pa)
                       or p.get("http_method") is m is None for m, pa in allowed):
                err(c, f"{i} http_method/client_path {p.get('http_method')} {p.get('client_path')} != code {allowed}")
        for m, pa in direct:
            if not any((m, x) in routes for x in path_candidates(pa)):
                warn(c, f"{i} calls {m} {pa} which matches no backend route")
        for tgt in edges.get(i, []):
            r = props(BYID.get(tgt, {}))
            if not any(r.get("method") == m and rpath(r.get("path")) in path_candidates(pa) for m, pa in resolved):
                err(c, f"{i} CALLS_ENDPOINT {tgt} matches no call in code {resolved or '(no HTTP call)'}")
        if e and not edges.get(i) and any((m, x) in routes for m, pa in direct for x in path_candidates(pa)):
            err(c, f"{i} has no CALLS_ENDPOINT edge (code calls {direct})")



def check_types():
    c = "types"
    truth, kinds = {}, {}
    for p in sorted((FE / "lib/types").glob("*.ts")):
        for m in re.finditer(r"^export\s+(?:declare\s+)?(?:const\s+)?(interface|type|enum)\s+(\w+)", read(p), re.M):
            i = f"type:{fpath(p)}.{m.group(2)}"
            truth[i], kinds[i] = (rel(p), None), m.group(1)
    compare(c, truth, ["type"])
    for i, k in kinds.items():
        if i in BYID and props(BYID[i]).get("kind") != k:
            err(c, f"{i} kind {props(BYID[i]).get('kind')} != {k}")


# ---------------------------------------------------------------- coverage
def check_coverage():
    c = "coverage"
    layers, domains = defaultdict(list), defaultdict(list)
    for r in RELS:
        if r.get("type") == "BELONGS_TO":
            t = str(r.get("target_id"))
            if t.startswith("layer:"):
                layers[r.get("source_id")].append(t)
            elif t.startswith("domain:"):
                domains[r.get("source_id")].append(t)
    for e in ENTS:
        t, i = e.get("type"), e.get("id")
        if t in NON_CODE or t not in PREFIX:
            continue
        if len(layers[i]) != 1:
            err(c, f"{i} has {len(layers[i])} BELONGS_TO layer edges {layers[i]}")
        ui = str(i).startswith("comp:components/ui/")
        if len(domains[i]) != 1:
            (err if t in DOMAIN_REQUIRED and not ui else warn)(
                c, f"{i} has {len(domains[i])} BELONGS_TO domain edges {domains[i]}")


# ---------------------------------------------------------------- docs
def backend_classes():
    methods, bases = defaultdict(set), defaultdict(set)
    for f in BE.rglob("*.py"):
        if any(x.startswith(".") or x in ("__pycache__", "site-packages") for x in f.relative_to(BE).parts):
            continue
        try:
            tree = ast.parse(read(f))
        except SyntaxError:
            continue
        for n in ast.walk(tree):
            if isinstance(n, ast.ClassDef):
                methods[n.name] |= {m.name for m in n.body if isinstance(m, (ast.FunctionDef, ast.AsyncFunctionDef))}
                methods[n.name] |= {s.target.id for s in n.body if isinstance(s, ast.AnnAssign) and isinstance(s.target, ast.Name)}
                bases[n.name] |= {ast.unparse(b).split("[")[0].split(".")[-1] for b in n.bases}
    return methods, bases


def all_methods(cls, methods, bases, seen=()):
    """(methods incl. inherited, True if every ancestor is defined in the repo)."""
    out, complete = set(methods.get(cls, ())), True
    for b in bases.get(cls, ()):
        if b in ("object", "ABC", "Generic", "Protocol") or b in seen:
            continue
        if b not in methods:
            complete = False
            continue
        m, ok = all_methods(b, methods, bases, seen + (cls,))
        out, complete = out | m, complete and ok
    return out, complete


def nroute(p):
    p = re.sub(r"\$?\{[^}]*\}", "{}", p.split("?")[0]).rstrip(".:")
    if p == "/api" or p.startswith("/api/"):
        p = p[4:]
    return p.rstrip("/") or "/"


def check_docs():
    c = "docs"
    methods, bases = backend_classes()
    api_objs = defaultdict(set)
    for i in APIFNS:
        obj, meth = i.rsplit(".", 2)[-2:]
        api_objs[obj].add(meth)
    known_routes = {(t["method"], nroute(t["full"])) for t in ROUTES}
    id_re = re.compile(r"`((?:%s):[^`\s]+)`" % "|".join(sorted(set(PREFIX.values()))))
    for f in sorted(KN.rglob("*.md")):
        src, where = read(f), rel(f)
        for i in sorted(set(id_re.findall(src))):
            if not re.search(r"<|\.\.\.|\*", i) and i not in BYID:
                err(c, f"{where}: unknown graph id `{i}`")
        for p in sorted(set(re.findall(r"`((?:backend|frontend|docs)/[^`\s]*)`", src))):
            p = re.sub(r"(:\d+(-\d+)?|#.*)$", "", p).rstrip("/")
            if "<" in p:
                continue
            ok = any(ROOT.glob(p)) if "*" in p else (ROOT / p).exists()
            if not ok:
                err(c, f"{where}: path does not exist `{p}`")
        for cls, meth in sorted(set(re.findall(r"\b([A-Za-z_]\w*)\.([a-z_]\w*)\s*\(", src))):
            if cls in methods:
                have, complete = all_methods(cls, methods, bases)
                if meth not in have and complete:
                    err(c, f"{where}: no method {cls}.{meth}()")
            elif cls in api_objs:
                if meth not in api_objs[cls]:
                    err(c, f"{where}: no api function {cls}.{meth}()")
            elif re.search(r"(Service|Repository|Provider)$", cls):
                err(c, f"{where}: unknown class {cls} (in {cls}.{meth}())")
        for m, p in sorted(set(re.findall(r"\b(GET|POST|PUT|PATCH|DELETE)\s+(/[^\s`|),;]*)", src))):
            if "*" in p:  # wildcard reference such as DELETE /users/*
                rx = re.compile(re.escape(nroute(p)).replace(r"\*", ".*") + "$")
                if not any(km == m and rx.match(kp) for km, kp in known_routes):
                    err(c, f"{where}: no route matches {m} {p}")
            elif "..." not in p and (m, nroute(p)) not in known_routes:
                err(c, f"{where}: no route {m} {p}")


# ---------------------------------------------------------------- staleness / stats
def check_staleness():
    c = "staleness"
    try:
        head = subprocess.run(["git", "log", "-1", "--format=%h", "--", "backend", "frontend"], cwd=ROOT,
                              capture_output=True, text=True, check=True).stdout.strip()
    except (OSError, subprocess.CalledProcessError) as e:
        warn(c, f"could not read git log: {e}")
        return
    recorded = Counter(e.get("commit_hash") for e in ENTS)
    off = {h: n for h, n in recorded.items() if not (h and (h.startswith(head) or head.startswith(h)))}
    if off:
        warn(c, f"latest backend/frontend commit is {head}; {sum(off.values())} entities record other hashes {off}")


def stats():
    return {"entities": dict(sorted(Counter(e.get("type") for e in ENTS).items())),
            "relationships": dict(sorted(Counter(r.get("type") for r in RELS).items())),
            "total_entities": len(ENTS), "total_relationships": len(RELS)}


CHECKS = [check_integrity, check_text, check_classes, check_routes, check_tasks, check_tables, check_enums,
          check_modules, check_migrations, check_tests, check_fe_files, check_api_functions, check_types,
          check_coverage, check_docs, check_staleness]


def main():
    ap = argparse.ArgumentParser(description="Validate the knowledge graph against the code.")
    ap.add_argument("--verbose", action="store_true", help="list every issue")
    ap.add_argument("--stats-json", action="store_true", help="print counts as JSON and exit")
    args = ap.parse_args()
    if args.stats_json:
        print(json.dumps(stats(), indent=2))
        return 0
    for check in CHECKS:
        name = check.__name__.removeprefix("check_")
        try:
            check()
        except Exception as e:  # one broken check must not hide the others
            err(name, f"check crashed: {type(e).__name__}: {e}")
    s = stats()
    print(f"Graph: {s['total_entities']} entities, {s['total_relationships']} relationships")
    print("Entities:", ", ".join(f"{k}={v}" for k, v in s["entities"].items()))
    print("Relationships:", ", ".join(f"{k}={v}" for k, v in s["relationships"].items()))
    print()
    total = Counter()
    for check in [c.__name__.removeprefix("check_") for c in CHECKS]:
        items = sorted(issues.get(check, []), key=lambda x: x[0] != "ERROR")
        n = Counter(level for level, _ in items)
        total += n
        print(f"[{check}] {n['ERROR']} ERROR, {n['WARN']} WARN")
        shown = items if args.verbose else items[:5]
        for level, msg in shown:
            print(f"  {level}: {msg}")
        if len(items) > len(shown):
            print(f"  ... {len(items) - len(shown)} more (use --verbose)")
    print(f"\nTOTAL: {total['ERROR']} ERROR, {total['WARN']} WARN")
    return 1 if total["ERROR"] else 0


if __name__ == "__main__":
    sys.exit(main())
