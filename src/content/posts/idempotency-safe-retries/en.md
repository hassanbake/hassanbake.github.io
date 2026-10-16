---
title: "Retries are easy, safe retries are not: idempotency in practice"
description: A request times out and you can't tell whether it happened. Why retrying is the only option, why it duplicates work unless the operation is idempotent, and how idempotency keys and polite backoff make it safe.
teaser: A timeout tells you nothing about whether the request happened. Idempotency keys make retrying safe.
date: 2026-10-16
category: System design
tags: [system-design, distributed-systems, apis]
draft: false
---

A client asks a server to charge a card for 20 dollars. Thirty seconds later the
connection times out. Did the charge happen? These notes are about that one
question, and about the habit that answers it: make the operation safe to
repeat, then retry. The ideas come from the sources at the end, mainly Brandur
Leach on idempotency keys at Stripe and Marc Brooker on retries at Amazon. The
small example and its mistakes are mine.

## The timeout nobody can interpret

When the call times out, exactly one of three things is true:

| What happened | Charge made? | What the client saw |
|---|---|---|
| The request never arrived | No | Timeout |
| The server processed it, but the response was lost | Yes | Timeout |
| The server is still working on it | Not yet | Timeout |

From the client's side, the three look identical. This is the same wall as in my
note on [Lamport's clocks](/notes/lamport-time/): without extra information you
cannot tell a failed process from a slow one. A timeout is a guess about
time, not a fact about what happened.

## Retrying is the only option, and it is dangerous

The client has two choices. Give up, and risk that the user's payment silently
never happened. Or try again, and risk charging twice if the second row in the
table was the real one. Most systems pick retrying, because most failures are
transient. Marc Brooker's article on retries puts the condition plainly:

> In general, our view is that APIs with side effects aren't safe to retry unless they provide idempotency.

An operation is **idempotent** if doing it twice has the same effect as doing it
once. Some are by nature:

| Request | Idempotent? |
|---|---|
| "Set the balance to 80" | Yes. Twice still leaves 80. |
| "Delete order 17" | Yes. After the first, the second finds nothing to do. |
| "Subtract 20 from the balance" | No. Twice leaves 60. |
| "Create a new charge" | No. Twice makes two charges. |

Most of the useful operations are in the lower half. We can't always rewrite
them as "set to", so we give them an identity instead.

## Idempotency keys

The client generates a unique id for the *intent* (a random UUID is common) and
sends it with the request. A retry of the same intent reuses the same id. The
server remembers what it did for that id, and the second time it sees the id it
returns the first answer instead of doing the work again. Stripe's engineering
blog, in
[*Designing robust and predictable APIs with idempotency*](https://stripe.com/blog/idempotency),
describes this for payments, where "exactly once" matters most.

Here is the smallest version I could write. It is an in-memory sketch, not
production code, and I ran it locally to check the three outcomes below.

```js title="charge.mjs"
import { createHash } from "node:crypto";

const store = new Map(); // key -> { fingerprint, state, response }
let balance = 100;       // the side effect we must not repeat

const fingerprint = (req) =>
  createHash("sha256").update(JSON.stringify(req)).digest("hex");

export function charge(key, req) {
  const fp = fingerprint(req);
  const saved = store.get(key);

  if (saved) {
    if (saved.fingerprint !== fp) return { status: 422, body: "key reused with a different request" };
    if (saved.state === "running") return { status: 409, body: "still processing, retry later" };
    return saved.response;                      // replay the first answer
  }

  store.set(key, { fingerprint: fp, state: "running" });
  balance -= req.amount;                        // the effect
  const response = { status: 200, body: { balance } };
  store.set(key, { fingerprint: fp, state: "done", response });
  return response;
}
```

Call it with `charge("k1", {amount: 20})`, then again with the same arguments,
then with `charge("k1", {amount: 30})`:

1. The first call does the work. Balance goes from 100 to 80.
2. The retry gets the *same* response. The balance stays 80.
3. The reused key with a different amount is refused with 422, not silently
   treated as a retry.

The three branches matter. **Replay** is the point. **"Running"** covers the
third row of the table, where the client retries while the first attempt is still
in progress. **The fingerprint** catches a bug on the client side: reusing an
id for a different request.

### What the sketch hides

- **The key and the effect must commit together.** If the server saves the key
  but crashes before charging, retries will replay a success that never
  happened. If it charges but crashes before saving the key, a retry charges
  again. With one database, put both in the same transaction and make the key
  unique, so two concurrent attempts can't both pass the check.
- **Not every effect lives in your database.** If a step calls another service,
  you can't put it in your transaction. As I read Stripe's post, the answer is
  to split the request into steps, record which one completed, and resume from
  there on a retry. Read their article for the details instead of taking my
  summary.
- **Keys expire.** Storing them forever is expensive. Keep them at least as long
  as a client could plausibly still be retrying. That window is a choice I'd write
  down, because it decides when "safe" stops being true.

## The other half: retry politely

Idempotency makes one retry safe. It does nothing about a thousand clients
retrying at once against a server that is already struggling. Brooker's article
makes this point with one phrase: retries are "selfish". A retrying client
spends more of the server's capacity to improve its own odds.

Two problems follow, both from his writing:

- **Retries multiply across layers.** If five layers of services each retry
  three times, a failing database at the bottom can see 3⁵ = 243 times the
  normal load. His advice is to retry at one point in the stack, and to use a
  local retry budget (a token bucket) so a client stops retrying when too much
  is failing.
- **Retries synchronize.** Clients that failed together back off together and
  come back together. Adding random **jitter** to the wait spreads them out. In
  Brooker's earlier simulation on the AWS Architecture Blog, with 100 contending
  clients, jitter cut the number of calls by more than half.

A common shape is capped exponential backoff with full jitter:

```text
wait = random(0, min(cap, base * 2^attempt))
```

The fine print: for a real service, the server also helps by returning a
`Retry-After` hint, or by refusing early when it is overloaded, so clients
don't hammer it.

<div class="callout">

**What to take away.** A timeout is a question the client can't answer alone.
Make the operation idempotent so that asking again is safe, and make the asking
polite so a failing server gets room to recover.

</div>

## What I'd want you to keep

1. **A timeout has three possible causes**, and the client can't tell which.
2. **Safe retries need idempotency,** by design ("set to") or by key.
3. **An idempotency key needs a stored result,** a fingerprint of the request,
   an in-progress state and an expiry window.
4. **Write the key and the effect together,** or a crash between them breaks
   the guarantee.
5. **Retry at one layer, with backoff, jitter and a budget.**

When I look at an API now, I ask two things. Which of its operations are not
idempotent? And what does a client do when one of those times out?

## References

- Brandur Leach. [*Designing robust and predictable APIs with idempotency*](https://stripe.com/blog/idempotency).
  Stripe Blog, 22 February 2017.
- Marc Brooker. [*Timeouts, retries, and backoff with jitter*](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter).
  Amazon Builders' Library, 5 December 2019.
- Marc Brooker. [*Exponential Backoff And Jitter*](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/).
  AWS Architecture Blog, 4 March 2015.
