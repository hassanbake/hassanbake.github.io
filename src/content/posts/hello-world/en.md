---
title: Hello, world
description: A sample post that shows how posts are written. It is a draft, so it never appears on the live site.
date: 2026-10-16
tags: [meta]
draft: true
---

This is a **draft** post that only shows up in `npm run dev`. Copy this folder
to start a new post, then set `draft: false` (or remove the line) to publish it.

The title comes from the front matter, so start the body with `##` headings.

## Code

```solidity
pragma solidity ^0.8.19;

contract Counter {
    uint public count;
    function inc() public { count++; }
}
```

> A quote, for good measure.
