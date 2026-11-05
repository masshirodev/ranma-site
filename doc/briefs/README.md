# Briefs

Design briefs for Claude Design, one `UPPERCASE.md` file per screen or flow.
A plan that adds a screen, or reshapes one, waits for a design before it is
approved: a layout is cheap to argue over on a canvas and expensive in a diff.

Each brief opens with this repository's link and the files the designer
should read, so the design starts from the real code. Open it with this
paragraph, in the owner's voice, then the reading list:

```
Repository: https://github.com/masshirodev/ranma-site (public). It's my repository and my
GitHub account is connected to claude.ai, so attach it to this session
yourself with read-only access (you never need to write to it), then make a
shallow clone and read the code. A plain `git clone` or `gh` has no
credentials here, so don't start there. If attaching is refused, ask me once
to approve it rather than designing from this brief alone, and ask me for the
files only if that fails too.
```

The wording matters. The owner pastes the brief into Claude Design, whose
safety check on attaching a repository treats an instruction it finds in
pasted text more warily than one from the person it is working for. A brief
that only said "clone or pull it" was refused on the first attempt every
time, and the attach went through only when the designer asked again for
read-only access, after the owner had approved it. Saying in the owner's
voice that the repository is theirs, and asking for read-only access up
front, lets the first attempt succeed. Even a private repository is one the
designer can open, and a design drawn from the brief's summary alone misses
what the code already does.

It ends by asking the designer to append ` [finished]` to the design's title
and close it with `Status: finished`, since nothing else says a design is
done. `hajime check` holds these three things.

By default a brief whose handoff has been implemented moves to `done/`. A
repository whose code or docs cite briefs by path keeps them where they are
instead, and says so here.
