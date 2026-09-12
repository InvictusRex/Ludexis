"""Query the knowledge graph instead of re-exploring the repo.

Usage:
  python docs/knowledge/queries/kg.py find <text>              entities whose id/name/source_file contains text
  python docs/knowledge/queries/kg.py show <id>                entity plus incoming/outgoing edges
  python docs/knowledge/queries/kg.py files <domain>           source files of a domain, grouped by layer
  python docs/knowledge/queries/kg.py trace <id> [--depth N]   follow calls/dependencies downstream
  python docs/knowledge/queries/kg.py impact <id> [--depth N]  who depends on this, plus covering tests

<id> may be a full id or any unique substring of one.
"""
import argparse
import json
import sys
from collections import defaultdict
from pathlib import Path

GRAPH = Path(__file__).resolve().parents[1] / "graph"
FLOW = {"CALLS_API", "CALLS_ENDPOINT", "CALLS", "DEPENDS_ON", "CONSUMES", "DISPATCHES", "READS", "WRITES", "ACCESSES"}


def load(sub):
    out = []
    for f in sorted((GRAPH / sub).glob("*.jsonl")):
        for line in f.read_text(encoding="utf-8", errors="replace").splitlines():
            try:
                out.append(json.loads(line))
            except ValueError:
                pass  # validate.py reports broken lines
    return [r for r in out if isinstance(r, dict)]


ENTS = {e.get("id"): e for e in load("entities")}
RELS = load("relationships")
OUT, IN = defaultdict(list), defaultdict(list)
for r in RELS:
    OUT[r.get("source_id")].append(r)
    IN[r.get("target_id")].append(r)


def loc(i):
    e = ENTS.get(i)
    if not e:
        return "(not in graph)"
    return f"{e.get('source_file')}:{e.get('source_line_start', '')}".rstrip(":")


def label(i):
    return f"{i} [{ENTS.get(i, {}).get('type', '?')}]"


def resolve(text):
    if text in ENTS or text in OUT or text in IN:
        return text
    hits = sorted(i for i in ENTS if text.lower() in str(i).lower())
    exact = [i for i in hits if str(i).lower().endswith(text.lower())]
    if len(hits) == 1 or len(exact) == 1:
        return (exact or hits)[0]
    print(f"'{text}' matches {len(hits)} ids" + (":" if hits else ""))
    for i in hits[:30]:
        print(" ", i)
    sys.exit(1)


def find(text):
    t = text.lower()
    hits = [e for e in ENTS.values() if any(t in str(e.get(k, "")).lower() for k in ("id", "name", "source_file"))]
    for e in sorted(hits, key=lambda e: str(e.get("id"))):
        print(f"{e.get('id')}  {e.get('type')}  {loc(e.get('id'))}")
    print(f"{len(hits)} match(es)")


def show(i):
    e = ENTS.get(i, {})
    print(f"{i}\n  type: {e.get('type')}\n  name: {e.get('name')}\n  at:   {loc(i)}")
    for k, v in (e.get("properties") or {}).items():
        print(f"  {k}: {json.dumps(v) if isinstance(v, (list, dict)) else v}")
    for title, edges, end in (("outgoing", OUT[i], "target_id"), ("incoming", IN[i], "source_id")):
        groups = defaultdict(list)
        for r in edges:
            groups[r.get("type")].append(r.get(end))
        print(f"\n{title} ({len(edges)}):")
        for t in sorted(groups):
            print(f"  {t}:")
            for x in sorted(groups[t]):
                print(f"    {label(x)}")


def files(domain):
    d = domain if domain.startswith("domain:") else f"domain:{domain}"
    if d not in ENTS:
        sys.exit(f"unknown domain {d}; known: {', '.join(sorted(i for i in ENTS if str(i).startswith('domain:')))}")
    by_layer = defaultdict(set)
    for r in IN[d]:
        if r.get("type") != "BELONGS_TO":
            continue
        src = r.get("source_id")
        layers = [x.get("target_id") for x in OUT[src] if x.get("type") == "BELONGS_TO"
                  and str(x.get("target_id")).startswith("layer:")] or ["(no layer)"]
        sf = ENTS.get(src, {}).get("source_file")
        if sf:
            for layer in layers:
                by_layer[layer].add(sf)
    for layer in sorted(by_layer):
        print(f"{layer}:")
        for f in sorted(by_layer[layer]):
            print(f"  {f}")


def walk(root, depth, forward):
    """Breadth-first over FLOW edges; returns children map of the BFS tree."""
    seen, frontier, tree = {root}, [root], defaultdict(list)
    for _ in range(depth):
        nxt = []
        for n in frontier:
            for r in (OUT[n] if forward else IN[n]):
                if r.get("type") not in FLOW:
                    continue
                m = r.get("target_id") if forward else r.get("source_id")
                tree[n].append((r.get("type"), m, m in seen))
                if m not in seen:
                    seen.add(m)
                    nxt.append(m)
        frontier = nxt
    return tree, seen


def print_tree(tree, n, arrow, indent=1, printed=None):
    printed = printed if printed is not None else {n}
    for t, m, _ in sorted(tree.get(n, []), key=lambda x: (x[0], str(x[1]))):
        again = m in printed
        print(f"{'  ' * indent}{arrow.format(t)} {label(m)}{'  (see above)' if again else ''}")
        if not again:
            printed.add(m)
            print_tree(tree, m, arrow, indent + 1, printed)


def trace(i, depth):
    print(f"{label(i)}  {loc(i)}")
    tree, _ = walk(i, depth, True)
    print_tree(tree, i, "-{}->")


def impact(i, depth):
    print(f"{label(i)}  {loc(i)}")
    tree, seen = walk(i, depth, False)
    print_tree(tree, i, "<-{}-")
    tests = sorted({(r.get("source_id"), n) for n in seen for r in IN[n] if r.get("type") == "TESTS"})
    print(f"\ntests covering this chain ({len(tests)}):")
    for t, n in tests:
        print(f"  {t} -> {n}")


def main():
    ap = argparse.ArgumentParser(description="Query the knowledge graph.")
    ap.add_argument("command", choices=["find", "show", "files", "trace", "impact"])
    ap.add_argument("arg")
    ap.add_argument("--depth", type=int, default=6, help="max depth for trace/impact (default 6)")
    a = ap.parse_args()
    if a.command == "find":
        find(a.arg)
    elif a.command == "files":
        files(a.arg)
    else:
        i = resolve(a.arg)
        {"show": show, "trace": lambda x: trace(x, a.depth), "impact": lambda x: impact(x, a.depth)}[a.command](i)


if __name__ == "__main__":
    main()
