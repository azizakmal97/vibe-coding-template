"""Scoped graphify rebuild.

WHY THIS EXISTS: the `graphify` CLI has no `generate` command, and the library
helper graphify.watch._rebuild_code() (via collect_files) only skips
dot-prefixed paths -- so it scans node_modules/ (tens of thousands of files)
and dist/ minified bundles, pinning a CPU for ~13 minutes. This wrapper
restricts extraction to real source files, so a rebuild finishes in seconds.

    python scripts/graphify-rebuild.py

Outputs into graphify-out/:
    GRAPH_REPORT.md   the structural map agents read before exploring
    graph.json        the raw graph
    obsidian/         one note per symbol, wikilinked -- open as an Obsidian vault

WINDOWS / MULTIPROCESSING GUARD (do not remove):
graphify.extract runs files through a ProcessPoolExecutor. On Windows the pool
uses the *spawn* start method, which RE-IMPORTS this script as __main__ inside
every worker subprocess. Without an `if __name__ == "__main__":` guard, each
worker re-runs the whole rebuild (and spawns its own pool, recursively) until
workers are "terminated abruptly" -- producing a silently PARTIAL graph. With a
warm cache (< 20 uncached files) graphify takes the sequential path and the bug
stays hidden, which is why only cold-cache rebuilds broke.
"""
from pathlib import Path

from graphify.extract import collect_files, extract
from graphify.build import build_from_json
from graphify.cluster import cluster, score_all
from graphify.analyze import god_nodes, surprising_connections, suggest_questions
from graphify.report import generate
from graphify.export import to_json
from graphify.detect import count_words

try:
    from graphify.wiki import to_wiki
except ImportError:
    to_wiki = None

EXCLUDE_DIRS = {
    "node_modules", "dist", "build", "out", "target", "graphify-out",
    "__pycache__", "venv", ".venv", "vendor", "coverage", ".next",
    "Pods", ".dart_tool", "Carthage",
}


def main() -> None:
    root = Path(".")
    files = [
        f for f in collect_files(root)
        if not any(part in EXCLUDE_DIRS for part in f.parts)
    ]
    print(f"[rebuild] scoped source files: {len(files)}")
    if not files:
        print("[rebuild] no source files found; nothing to do.")
        return

    total_words = sum(count_words(f) for f in files)
    result = extract(files)
    detection = {
        "files": {"code": [str(f) for f in files], "document": [], "paper": [], "image": []},
        "total_files": len(files),
        "total_words": total_words,
    }

    G = build_from_json(result)
    communities = cluster(G)
    cohesion = score_all(G, communities)
    gods = god_nodes(G)
    surprises = surprising_connections(G, communities)
    labels = {cid: "Community " + str(cid) for cid in communities}
    questions = suggest_questions(G, communities, labels)

    out = root / "graphify-out"
    out.mkdir(exist_ok=True)
    report = generate(G, communities, cohesion, labels, gods, surprises, detection,
                      {"input": 0, "output": 0}, str(root), suggested_questions=questions)
    (out / "GRAPH_REPORT.md").write_text(report, encoding="utf-8")
    to_json(G, communities, str(out / "graph.json"))

    notes = 0
    if to_wiki is not None:
        try:
            notes = to_wiki(G, communities, out / "obsidian", community_labels=labels,
                            cohesion=cohesion, god_nodes_data=gods) or 0
        except Exception as exc:
            print(f"[rebuild] obsidian vault export skipped: {exc}")

    print(f"[rebuild] {G.number_of_nodes()} nodes, {G.number_of_edges()} edges, "
          f"{len(communities)} communities -> graphify-out/")
    if notes:
        print(f"[rebuild] obsidian vault: {notes} notes -> graphify-out/obsidian/")


if __name__ == "__main__":
    main()
