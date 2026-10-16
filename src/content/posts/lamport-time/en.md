---
title: "What time is it? Ordering events in a distributed system"
description: Notes on Lamport's 1978 paper. Why wall clocks can't order events across machines, how logical clocks do it with a counter, and what that means when we design real systems.
date: 2026-10-16
category: System design
tags: [system-design, distributed-systems]
author: Hassan
draft: false
---

These are my notes on one of the papers I keep coming back to: Leslie Lamport's
[*Time, Clocks, and the Ordering of Events in a Distributed System*](https://doi.org/10.1145/359545.359563)
(1978). The ideas, examples and results below are his; the explanations and any
mistakes are mine. It is
short, and most of what it says still applies to the systems we build today.
I've tried to explain it the way I wish it had been explained to me, with one
small example that runs through the whole post.

## The question

You have two servers, each with its own clock. A user places an order on
server 1, then immediately messages a friend, who places an order on server 2.
How do you make sure that, in the final log, the first order comes before the
second?

Most of us first answer "sync the clocks." The paper is really about the next
two questions: *sync them how well?* And *what if that isn't good enough?*

## Why the wall clock isn't enough

Say S2's clock runs 5 ms behind S1's, which is well within normal NTP error.

| Real time | Event | Recorded timestamp |
|---|---|---|
| 10:00:00.010 | S1 records "order placed" and sends a message to S2 | 10:00:00.010 (S1) |
| 10:00:00.012 | S2 receives it and reacts: "risk reserved" | 10:00:00.007 (S2) |

Sort the log by timestamp and "risk reserved" shows up *before* "order placed".
The effect comes before its cause, and no one can trust that log for an audit
or a replay.

It isn't only that clocks are imprecise. Even with 1 ms of error, any two
events closer together than that error can come out reversed. Later we'll see
exactly how much error is acceptable.

Lamport's move is to stop asking the clocks for the "true" order and to ask
instead: *what can the system actually know?* A system only knows about its
own events: running steps, sending messages and receiving them. So order
should be defined from those events, and not from a clock.

By the way, "distributed" here has nothing to do with distance. A system is
distributed when the time a message takes is not negligible compared with the
time between events in one process. Two cores on one CPU count, and so do two
services in the same rack.

## Happened-before: order from causality

The model is simple:

- A **process** is a sequence of events in a known order.
- An **event** is whatever we pick as a unit: a step, a send, a receive.
- A **message** is the only way one process can affect another.

We write `a → b` ("a happened before b") for the smallest relation where:

1. **Same process:** if `a` comes before `b` in the same process, then `a → b`.
2. **Messages:** if `a` sends a message and `b` receives it, then `a → b`.
3. **Chains:** if `a → b` and `b → c`, then `a → c`.

"Smallest" matters. Two events are ordered only if these three rules say so.
If neither `a → b` nor `b → a`, the two events are **concurrent**.

### A running example

Three processes, A, B and C:

| Process | Events in order |
|---|---|
| A | a1: local → a2: send m1 to B → a3: local |
| B | b1: local → b2: receive m1 → b3: send m2 to C |
| C | c1: local → c2: receive m2 → c3: local |

From the rules:

- `a1 → a2 → a3` (same process)
- `a2 → b2` (m1)
- `a1 → c3` through the chain `a1 → a2 → b2 → b3 → c2 → c3`
- `b1` and `a1` are concurrent. So are `a3` and `b2`, and `a3` and `b3`.

### Three common misreadings

- **"Concurrent means at the same time."** It doesn't. It means neither event
  could have affected the other. One could be ten seconds earlier on the wall
  clock and they would still be concurrent if no message connects them.
- **"`a → b` means a caused b."** It means a *could have* caused b, because
  information could have flowed from a to b. The system can't know real
  causality.
- **"Concurrent means the order doesn't matter."** The system can't tell their
  order. But if we want every replica to end up with the same log, we still
  have to *agree* on one. More on that below.

The order of events in a distributed system is only **partial**. Drawn out, it
is a directed acyclic graph of events, process steps and messages. That graph
is the one thing that's actually true about the system. Any total order we
build on top of it is a convention.

## Logical clocks: a counter that respects causality

A logical clock gives every event a number. It needs no physical time at all;
an integer counter is enough. The one condition we want is:

```text
Clock Condition:   a → b   ⟹   C(a) < C(b)
```

Every cause gets a smaller number than its effect. Two rules are enough to get
there:

- **IR1:** each process increments its counter between any two of its events.
- **IR2:** every message carries the sender's counter. On receipt, the
  receiver sets its counter above both its own value and the message's.

In code it fits in three lines:

```text
on local event:   C = C + 1
on send(m):       C = C + 1;  m.T = C;  send(m)
on receive(m):    C = max(C, m.T) + 1
```

Think of it as page numbers in a notebook. If you read someone's note numbered
40, your next note can't be numbered lower than 41. The more you've seen, the
further your clock has moved.

### Tracing the example

All counters start at 0:

| Event | Rule | Calculation | C |
|---|---|---|---|
| a1 (local) | IR1 | 0 → 1 | 1 |
| b1 (local) | IR1 | 0 → 1 | 1 |
| c1 (local) | IR1 | 0 → 1 | 1 |
| a2 (send m1) | IR1, IR2 | 1 → 2, m1.T = 2 | 2 |
| a3 (local) | IR1 | 2 → 3 | 3 |
| b2 (receive m1) | IR2 | max(1, 2) + 1 | 3 |
| b3 (send m2) | IR1, IR2 | 3 → 4, m2.T = 4 | 4 |
| c2 (receive m2) | IR2 | max(1, 4) + 1 | 5 |
| c3 (local) | IR1 | 5 → 6 | 6 |

The causal chain `a1(1) → a2(2) → b2(3) → b3(4) → c2(5) → c3(6)` is strictly
increasing, as promised.

Two things to notice:

- **The condition only goes one way.** `C(a3) = 3 < C(b3) = 4`, yet a3 and b3
  are concurrent. Looking at two Lamport timestamps, you can't tell whether
  one event caused the other or they were independent. (Vector clocks, which
  came about ten years later, were built to answer exactly that, at the cost
  of one counter per process on every message.)
- **Ties happen only between concurrent events.** a1, b1 and c1 all got 1.
  If `C(a) = C(b)`, neither can have happened before the other.

## From a partial order to a total order

To get one order that every node can agree on, sort by clock and break ties
with a fixed order on process ids (here A ≺ B ≺ C):

```text
a ⇒ b   ⟺   C(a) < C(b)   or   ( C(a) = C(b)  and  process(a) ≺ process(b) )
```

For our example:

```text
a1(1) ⇒ b1(1) ⇒ c1(1) ⇒ a2(2) ⇒ a3(3) ⇒ b2(3) ⇒ b3(4) ⇒ c2(5) ⇒ c3(6)
```

Every causal pair keeps its order. Concurrent events get an order too, but that
part is arbitrary.

This order isn't unique. Start A's counter at 10 instead of 0 and you get:

```text
b1(1) ⇒ c1(1) ⇒ a1(11) ⇒ a2(12) ⇒ a3(13) ⇒ b2(13) ⇒ b3(14) ⇒ c2(15) ⇒ c3(16)
```

Now b1 and c1 come first. The causal pairs are still in the same order, though.
I think this is the most useful shift in thinking in the whole paper: **the
total order is an agreement, not the truth.** It's an order every node can
compute on its own, reach the same answer, and stay consistent with causality.
For a replicated log, conflict resolution or last-writer-wins, that is exactly
what we need.

## Using it: mutual exclusion with no coordinator

Three processes, P0, P1 and P2, share one resource that only one of them can
use at a time. There's no central server, only messages. We want:

1. **Safety:** one holder at a time.
2. **Causal fairness:** if request A happened before request B (in the `→`
   sense), A is served first.
3. **No starvation:** if every holder eventually releases, every request is
   eventually served.

### Why a central "secretary" fails

The obvious design is to make P0 a secretary that grants requests in the order
they arrive. Lamport shows how this breaks:

1. P1 sends request R1 to P0 over a slow path.
2. P1 then tells P2 "I've requested," and that message arrives quickly.
3. P2 sends its own request R2 to P0.
4. R2 reaches P0 before R1, and P0 grants R2 first.

But R1 happened before R2. **The order in which messages reach one node is not
the causal order.** So we build the order from logical clocks instead.

### Building the algorithm

- **Everyone keeps their own copy of the queue.** Each request is stored as
  `(T, Pi)`: its logical timestamp and who sent it.
- **Everyone sorts the same way:** by T, then by process id. That's the `⇒`
  order from above. Any two processes that have seen the same requests have
  identical queues, so the head of the queue is the same everywhere. It works
  like a virtual secretary that lives on every machine.
- **Being at the head of my own queue isn't enough.** My queue only holds the
  requests that have reached me so far. An older request could still be in
  flight.
- **The trick:** clocks only move forward, and channels are FIFO. So if I've
  received *any* message from P1 with a timestamp larger than my request's,
  everything P1 sent before it, including any older request, has already
  arrived. Once I've heard such a message from everyone, I know nothing older
  than my request is still on its way. The acknowledgement exists to make
  sure a quiet process still sends something.
- **Release when done,** so everyone removes your request from their queue.

The final rules:

```text
state: C (clock), queue sorted by (T, id), seen[j] = largest timestamp received from j

request():          C++; T = C; queue.add(T, me); send REQ(T) to all
on REQ(T) from j:   C = max(C, T) + 1; seen[j] = T; queue.add(T, j); send ACK(C) to j
on ACK(T) from j:   C = max(C, T) + 1; seen[j] = T
release():          C++; queue.remove(me); send REL(C) to all
on REL(T) from j:   C = max(C, T) + 1; seen[j] = T; queue.remove(j)

enter when:  queue.head == (myT, me)   and   seen[j] > myT for every j ≠ me
```

Both conditions are checked locally, with no extra round trip.

### The race that matters

Here's the case where the second condition saves us. The clocks start at 1, P0
holds the resource, and every queue contains `(0, P0)`.

1. P1 requests at T = 2. Its request to P2 is slow.
2. P0 receives it, acknowledges, finishes its work and sends a release, REL(4).
3. REL(4) reaches P2 *before* P1's request does. P2's queue is now empty, and
   P2 doesn't know P1 is waiting.
4. P2 requests at T = 6. It's alone at the head of its queue, so condition 1
   holds. But it has heard only 4 from P0 and nothing from P1, so condition 2
   fails. **Without that second check, P2 would enter here and break causal
   fairness.**
5. P1's old request (T = 2) finally reaches P2. Because 2 < 6, it sorts ahead
   of P2's own request. The logical clock has rebuilt the causal order, even
   though the messages arrived out of order.
6. P1 hears from everyone, enters, and releases. Then P2 enters.

The final order is P1 then P2, which matches the causal chain
`P1 requests → P0 sees it → P0 releases → P2 sees the release → P2 requests`.
All three processes got there with no coordinator.

### Cost and limits

Each entry costs `3(N−1)` messages (request, ack, release), and the latency is
set by the slowest node, because you have to hear from everyone. That's also the
big limitation: **if one process crashes, the whole system stops.**

The paper makes a point here that I find very deep. Without physical time, you
can't tell a crashed process from one that is just slow between two events.
"Failure" only means something once you add a timeout. That idea later became
failure detectors and the FLP impossibility result.

What we built is more general than a lock. If every node runs the same
deterministic commands in the same order, every node reaches the same state.
That's **state machine replication**, the idea under Paxos, Raft, ZooKeeper and
event-sourced systems. Modern protocols swap "hear from everyone" for a
majority and a leader, so one dead node doesn't stop everything.

## When the system's order surprises the user

Someone submits request A on computer A, then phones a friend in another city,
who submits request B on computer B. The people involved know A came first.
The system never saw a message between them, so to it they are concurrent. If
B's logical clock happens to be lower, B gets the smaller timestamp and sorts
first.

The paper is precise about this. Causality that travels through channels the
system can't see (a phone call, a file, a person) is invisible to any algorithm
that only looks at the system's own events. That isn't a weakness of a
particular algorithm; nothing can solve it from inside. There are two ways
out:

1. **Carry the order explicitly.** The first user gets a timestamp back and
   passes it on, and the second request must be later than that. Today we do
   this with session or causal tokens: a version, an LSN or a vector the
   client sends with its next request (read-your-writes, causal consistency).
2. **Use physical clocks that are good enough.** That leads to the last part
   of the paper.

## Physical clocks: how good is good enough?

Two conditions on real clocks:

```text
PC1:  | dCi(t)/dt − 1 | < κ     each clock runs at roughly the right rate
PC2:  | Ci(t) − Cj(t) | < ε     any two clocks roughly agree at every moment
```

Let μ be the shortest time it takes for one event to affect another process:
the fastest message, or the fastest phone call. If `a` happens at time t, any
effect happens no earlier than t + μ. For the effect to get a larger timestamp,
the receiving clock must advance at least `(1−κ)μ` in that window, starting
from no less than `C(t) − ε`. That gives:

```text
ε / (1 − κ)  ≤  μ
```

In plain words: **clock sync error has to be smaller than the shortest time it
takes one event to influence another.**

For example, two servers 3,000 km apart can't influence each other faster than
light: μ ≥ 3,000 km ÷ 300,000 km/s = 10 ms. If your clock sync is only good to
20 ms, timestamps alone can't guarantee their order.

### Keeping clocks in sync

The physical version of IR2: each message carries the sender's clock. The
receiver assumes the message took at least the known minimum delay `μm`, and
moves its clock to `max(own, T + μm)`. **A clock never moves backward.** If it
did, events inside one process could get out of order. This is why operating
systems keep a monotonic clock separate from wall time, and why NTP usually
slews a clock gradually instead of jumping it back.

With a network of diameter d, a message on every link every τ seconds, and
unpredictable delay below ξ, Lamport proves the clocks stay within roughly:

```text
ε  ≲  d · (2κτ + ξ)
```

- **d:** error adds up at every hop, so flatter topologies help.
- **2κτ:** between syncs, one clock may run fast and the other slow. With
  κ = 1 ppm and τ = 1 s, that's only 2 µs.
- **ξ:** network jitter. With frequent syncs, this term usually dominates.

A worked example: d = 2, κ = 5 ppm, τ = 30 s, ξ = 3 ms gives
ε = 2 × (0.0003 + 0.003) ≈ 6.6 ms. That's fine for two data centers with a
12 ms minimum delay. If jitter grows to 10 ms, ε ≈ 20.6 ms and the guarantee is
gone.

Google Spanner's TrueTime is this same inequality, engineered. It returns an
uncertainty interval instead of a single time, and waits out that uncertainty
before committing so the order of transactions matches real time.

## What I'd want you to keep

1. **Order in a distributed system is partial.** Concurrent doesn't mean
   simultaneous. It means neither event could have affected the other.
2. **The clock condition goes one way.** `a → b ⟹ C(a) < C(b)`, not the
   reverse. Lamport timestamps can't detect concurrency.
3. **A total order is an agreement, not the truth.** Clock plus a tie-break on
   process id gives an order every node computes independently, and that's
   enough to replicate a state machine.
4. **The system can't see causality that travels outside it.** Either carry
   that order in the request, or use physical clocks whose error is below the
   shortest delay.
5. **"Hear from everyone" doesn't survive failures,** and "failure" only exists
   once you bring physical time back in.

When I design anything that merges logs from several sources, I now ask
myself two questions. First, what carries causality here: an id, a sequence
number, or only a timestamp? Second, if it's a timestamp, is my clock error
really smaller than the shortest delay between those sources? In most cases
the honest answer pushes me toward the ids.

## Reference

Leslie Lamport. "Time, Clocks, and the Ordering of Events in a Distributed
System." *Communications of the ACM* 21, no. 7 (July 1978): 558–565.
[doi:10.1145/359545.359563](https://doi.org/10.1145/359545.359563)
