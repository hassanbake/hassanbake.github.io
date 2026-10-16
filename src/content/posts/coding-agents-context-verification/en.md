---
title: "Working with a coding agent: what it can see, and how you know it worked"
description: Two habits that matter more than clever prompts when an AI agent writes code for you. Manage what sits in its context, and give it a check it can run before it says "done".
teaser: Manage what the agent can see, and give it a way to check its own work.
date: 2026-10-16
category: AI-assisted code
tags: [ai, coding-agents, software-engineering]
draft: false
---

A coding agent is a program that reads your files, runs commands, edits code and
loops until it decides it is finished. These are notes on two things that, in my
experience, decide whether that loop helps or hurts: **what the agent can see**
(its context) and **how anyone knows the work is right** (verification). It is
a set of working habits, not research. Where I lean on someone else's writing or
data, I link to it and say which part is theirs.

## The loop, in one paragraph

An agent reads some files, forms a plan, changes code, runs something, reads
the output and goes again. Everything it reads and every command output lands
in one shared space, the **context window**, and the model only ever works from
what is in that space. That gives us two questions to ask on any task. *Did the
right things get in there?* And *when it stopped, what did it check?*

## Context is a budget, not a bucket

Anthropic's engineering team wrote this up well in
[*Effective context engineering for AI agents*](https://anthropic.com/engineering/effective-context-engineering-for-ai-agents)
(September 2025). Their framing: the question is no longer only how to word a
prompt, but which information, including tools, files and message history,
should be in the window at each step. They put it bluntly:

> Context, therefore, must be treated as a finite resource with diminishing marginal returns.

They also describe *context rot*: as the window fills, the model's ability to
recall what is in it declines. The Claude Code documentation
([*Best practices*](https://code.claude.com/docs/en/best-practices)) builds most
of its advice on the same constraint: the window fills up fast, and performance
degrades as it fills.

For me this turns into a handful of habits:

1. **One task per session.** When the next job is unrelated, start clean
   instead of carrying along a thousand lines of irrelevant output.
2. **After two failed corrections, restart.** A long thread of "no, not that"
   is context full of the wrong approach. A fresh session with a sharper prompt
   usually beats it. The Claude Code guide gives the same advice.
3. **Point instead of describe.** "Look at how `HomePage` is built and follow
   that pattern" beats three paragraphs of my memory of it. Name the file, the
   constraint and the example to follow.
4. **Keep the standing instructions short.** Most tools read a project file
   (`CLAUDE.md` in Claude Code) at the start of every session. A line belongs
   there only if removing it would make the agent err. If it can learn it by
   reading the code, leave it out.
5. **Send reading to a helper.** Exploring a codebase eats context. A sub-agent
   can read twenty files in its own window and hand back a paragraph. This is
   one of the patterns in the Anthropic post, along with writing notes to a
   file the agent can reload later.

None of this is exotic. It is closer to housekeeping, and it is where I see
most of my bad sessions come from.

## "Looks done" is not a signal

Here is the sentence from the Claude Code guide that changed how I work:

> Claude stops when the work looks done. Without a check it can run, "looks done" is the only signal available, and you become the verification loop.

If the only check is you reading a diff, every mistake waits for your
attention. So the second habit is to **hand the agent something that returns
pass or fail** before it starts. A test suite, a build exit code, a linter, a
script that diffs output against a fixture, a screenshot to compare.

A small example. Compare these two requests:

```text
Write a function that parses durations like "1h30m".
```

```text
Write parseDuration(input) that returns seconds. "1h30m" is 5400, "45s" is 45,
"2h" is 7200, "" and "1x" throw. Put these as assertions in the same file and
run it.
```

The second one costs a minute to write, and it does two things. It removes
guessing about what "parses" means, and it gives the agent a loop it can close
on its own. I tried this one on Node 22 with a plain regex and `node:assert`;
the five assertions pass:

```js title="duration.mjs"
import assert from "node:assert/strict";

export function parseDuration(input) {
  const m = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(input.trim());
  if (!input.trim() || !m) throw new Error(`bad duration: ${input}`);
  const [, h = 0, mi = 0, s = 0] = m;
  return Number(h) * 3600 + Number(mi) * 60 + Number(s);
}

assert.equal(parseDuration("1h30m"), 5400);
assert.equal(parseDuration("45s"), 45);
assert.equal(parseDuration("2h"), 7200);
assert.throws(() => parseDuration(""));
assert.throws(() => parseDuration("1x"));
```

Three things I've added on top:

- **Ask for evidence, not a verdict.** "It works" is a claim. The command that
  was run and its output is evidence, and it is faster to read than to redo.
- **Review in a fresh context.** The agent that wrote the code is biased toward
  it. A second session or sub-agent that sees only the diff and the
  requirements judges it on its own terms. The same guide adds a warning I've
  found true: a reviewer told to find gaps will find some even when the work is
  sound, so ask it to report only what affects correctness or the stated
  requirements.
- **If I can't verify it, I don't ship it.** The guide says this too. Some
  things, like a visual change or a data migration, need a human look. That is
  fine as long as it is a decision I made, not a gap I didn't notice.

## Why I don't trust my feeling of speed

In 2025 METR published
[a randomized study](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/)
of 16 experienced open-source developers working on 246 real issues in their
own repositories, each issue randomly assigned to allow AI tools or not. With
AI allowed, the developers took 19% longer. Before starting they had predicted
a 24% speed-up, and afterwards they still believed AI had sped them up by 20%.

The authors are careful about what this does and doesn't show. It is a snapshot
of early-2025 tools in one setting, with a small group of developers on
codebases they knew well, and their page now says newer data is available. I
don't read it as "AI slows you down." I read it as a warning about
self-reports: how fast something *feels* and how long it *takes* can come
apart. Ideas like a fixed check and a short feedback loop are partly a way to
keep myself honest.

<div class="callout">

**What to take away.** An agent is only as good as what it can see and what it
can check. Keep the window small and relevant, define "done" as something that
runs, and measure the result instead of trusting the feeling.

</div>

## A checklist before I start a task

1. What is the *one* thing this session is for?
2. Which files and examples should it read first? Did I name them?
3. What command returns pass or fail for this change?
4. Is the standing instruction file short enough that every line earns its place?
5. When it says "done", what evidence will I ask for?

## Sources

- Rajasekaran, Dixon, Ryan, Hadfield and others, Anthropic.
  [*Effective context engineering for AI agents*](https://anthropic.com/engineering/effective-context-engineering-for-ai-agents).
  Anthropic Engineering, 29 September 2025.
- Anthropic.
  [*Best practices for Claude Code*](https://code.claude.com/docs/en/best-practices).
  Claude Code documentation (read on 16 October 2026; it changes over time).
- METR.
  [*Measuring the Impact of Early-2025 AI on Experienced Open-Source Developer Productivity*](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/).
  10 July 2025.
