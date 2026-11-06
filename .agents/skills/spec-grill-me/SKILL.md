---
name: spec-grill-me
description: >-
  Clarifies a spec by asking the user batches of questions, then writing
  detailed requirements back into the spec file. Use when the user says
  "grill me", @-mentions this skill, or explicitly asks to grill or clarify a spec.
argument-hint: "path to a spec, e.g. specs/<id>/spec.md"
disable-model-invocation: true
---

# Spec grill-me

Turn a draft spec into an implementable spec by questioning the user, then updating that spec file in place.

Do not implement the spec. Do not create `plan.md` or `task.md`.

If anything is unclear, please ask me instead of guessing.

You may add additional details to the spec if needed but try to keep it concise without losing essential details.

## Communication

- Reply in the language I write in.
- Start each reply with one sentence: what you are doing and what you need from me.
- End with one line: **Next step:** what happens after I answer.

### How to ask a question (important)

Write every question in this shape:

1. **Number and title** in plain words, e.g. `1. Wat moet er gebeuren als je op een dag klikt?`
2. **Why you ask**, one short sentence: what this decides in the app.
3. **Options**, each on its own line, as `A`, `B`, `C` (max 3, or 4 if really needed). For each option write in plain words **what the user will see or what will happen** and, if useful, a tiny concrete example. Never use an option label alone.
4. **Recommended:** name one option and give one short reason.
5. Always offer the last option: `? Ik snap dit niet, leg het simpeler uit` (in my language). If I pick it, explain again with a different, more concrete example. Do not repeat the same wording.

Rules:
- One decision per question. Never combine two questions in one.
- No jargon. If a technical word is unavoidable, explain it in half a sentence the first time.
- Be literal and concrete. No "it depends", "maybe", idioms or hints. Say exactly what you mean.
- Prefer an example from the app ("in de Week-weergave zie je dan ...") over abstract descriptions.
- I can answer with just a letter. Accept "ok" as the recommended option.
- If I answer something unexpected, check back in one short sentence what you understood before continuing.

## When invoked

1. Identify the spec (`@` mention, path, or `specs/<id>/spec.md`). If none is clear, ask which spec to grill.
2. Read the spec, `AGENTS.md` (including any design principles it lists, such as **ADHD & autism design principles**), and the code/conventions it depends on.
3. Split content into: already decided, implied by the repo, and would force an implementer to guess.

## Question rounds

Ask **3–6 questions per round** (prefer 3–4), then wait for answers. Prefer the AskQuestion tool when options are few; otherwise ask conversationally. Either way, follow **How to ask a question**, so every option has a plain-words explanation.

Ask only decisions that change **scope, files, API, UX, constraints, or acceptance**. Do not ask:

- What the spec already states
- What the repo already decides (fold those facts into the spec)
- Pure implementation trivia (library internals, exact class strings unless the spec cares)

After each round of answers:

1. Update the spec **in place**.
2. Summarize what you added or tightened (a few bullets).
3. Start another round if remaining gaps would still force guessing.

Stop when **Requirements** and **Out of scope** are specific enough to implement without guessing, or when the user says stop.

## Design lens (ADHD & autism)

If `AGENTS.md` has a section **ADHD & autism design principles** (or similar audience/accessibility principles), apply this lens. If it has none, skip this whole section and do not add an ADHD/autism check.

For any spec that changes UI or behavior, check it against those principles and ask only where the spec leaves a real gap. Typical gaps:

- What is the smallest first action, and what is prefilled or defaulted?
- What does the user see when empty, behind, or overwhelmed (no guilt wording)?
- Does anything happen automatically or unexpectedly (auto-navigation, auto-moving data, popups, sound, animation)?
- Can every destructive action be undone or confirmed? Is data ever lost silently?
- Is the wording literal and concrete (no idioms, no vague labels)?
- Does the layout stay still when the user acts (no jumping, no reflow)?

## Writing the spec

Keep the draft's existing headings and fill them in. Expected sections:

- **Context** — current state and constraints (facts, not wishes)
- **Goals** — what this spec delivers
- **Requirements** — detailed, implementable rules (use subsections)
- **Out of scope** — explicit exclusions

For UI specs, when the design lens applies, add a `### ADHD/autism check` subsection under **Requirements**: 3–6 concrete, checkable rules specific to this spec (not a copy of the generic principles).

Preserve extra headings the draft already has. Keep the user's title. Fix incomplete sentences and typos while updating.

Fold in matching `AGENTS.md` / codebase conventions. If the spec would contradict them, ask before choosing a side.

Match the specificity of `specs/001-component-structure/spec.md` if it exists (files, APIs, behaviors, exclusions); otherwise match the other specs in `specs/`. Do not copy that file's heading layout.

Keep the spec concise. Prefer bullets over prose. Do not add rationale, alternatives considered, or implementation steps unless the user asked for them.
