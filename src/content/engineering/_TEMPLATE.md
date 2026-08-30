---
# Copy this file, rename it to <your-slug>.md, and fill in the frontmatter.
# Files whose name starts with "_" are ignored by the loader
# (src/lib/engineering-content.ts), which validates the rest at build time.

title: "" # required - human title (English)
title_it: "" # optional - Italian title (shown on the IT site; the body stays English)
type: note # required - note | experiment | project
area: backend # required - backend | cloud-infrastructure | data
topics: [] # tags, e.g. ["mongodb", "indexes", "query-planner"]
description: "" # required - one-line summary (English)
description_it: "" # optional - Italian summary
date: 2024-01-01 # required - ISO date, YYYY-MM-DD
status: draft # draft (hidden) | published | archived
featured: false # true = surface first within its section
slug: "" # optional - defaults to the filename
url: "" # optional - external link (repo, gist, ...)
related: [] # optional - slugs of related content items
---

Markdown body goes here. It is rendered at /engineering/<slug>.
```
type "note": technical writing focused on a specific concept, problem or insight
type "experiment": hands-on investigations, benchmarks or technical experiments
type "project": practical implementations that demonstrate one or more areas
```
