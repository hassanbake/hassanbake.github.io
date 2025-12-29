---
title: Gradient Descent Basics
author: Roozbeh Maheronnaghsh
role: Author
date: 2025-12-28
image: /assets/images/authors/roozbeh-maheronnaghsh-01.png
---

# Understanding Gradient Descent

Gradient descent is one of the most fundamental optimization algorithms
in machine learning.

## Why it matters

It allows us to train models efficiently by minimizing loss functions.

### مثال Python

```python
import torch

x = torch.tensor([1.0, 2.0])
print(x.mean())
```

### مثال JavaScript

```js
function greet(name) {
  return `Hello ${name}`;
}
```

### مثال Solidity (خیلی مهم برای تو 😉)

```solidity
pragma solidity ^0.8.19;

contract Counter {
    uint public count;
    function inc() public {
        count++;
    }
}
```

> `highlight.js` زبان Solidity رو هم تشخیص می‌ده.

---

## 4️⃣ بهبود CSS مخصوص کد (وبلاگی‌تر)

اضافه کن به `article.css` یا `style.css`:

```css
.prose pre {
  background: #f6f8fa;
  padding: 1rem;
  border-radius: 8px;
  overflow-x: auto;
  font-size: 0.9rem;
  line-height: 1.6;
}

.prose code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}

.prose pre code {
  background: none;
  padding: 0;
}
```
