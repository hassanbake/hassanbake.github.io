---
title: Gradient Descent Basics
author: روزبه ماهرالنقش
role: نویسنده
date: 1404-10-16
image: /assets/images/authors/roozbeh-maheronnaghsh-01.png
---

# مبانی گرادیان نزولی

گرادیان نزولی یکی از معروف‌ترین الگوریتم‌های بهینه‌سازی در یادگیری ماشین است. این الگوریتم به ما کمک می‌کند تا با حرکت گام‌به‌گام به سمت کمینه یک تابع حرکت کنیم.

## مثال در پایتون

````python
def gradient_descent(x_start, learning_rate, iterations):
    x = x_start
    for _ in range(iterations):
        gradient = 2 * x
        x = x - learning_rate * gradient
    return x

minimum = gradient_descent(10, 0.1, 100)
print(minimum)

### مثال JavaScript

```js
function greet(name) {
  return `Hello ${name}`;
}
````

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
