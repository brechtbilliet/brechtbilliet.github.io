---
layout: post
title: RxJS interview questions for catching senior talent 
description:  
published: false
author: brechtbilliet
comments: true
date: 2022-08-17
subclass: 'post'
disqus: true
---

This is the second article in a series of multiple interview related articles. The first one was
called [Angular interview questions for catching senior talent](https://blog.brecht.io/angular-interview-questions-for-seniors/) and was focussed
on the Angular part rather than on the RxJS part. RxJS is the only real dependency on Angular except of zone.js. 
Angular exposes observables in a lot of different places so learning Angular and not RxJS might not be the best fit.
Just like the previous article I will not dive into syntax too much but it will be a bit more technical than the Angular post.

### 1: Explain the observable api, which callback functions are there?

### 2: What are higher order observables and can you name a few higher order operators and the difference between them

### 3: How do you unsubscribe from an observable and why?

### 4: Explain to me what the difference is between hot and cold observables

### bonus question: Is an observable hot or cold by default?

### 5: What is a subject?

### 6: What kind of subjects are given to us by the RxJS library?

### 7: How do you unittest observables?

### 8: Are observables serializable?

### 9: What happens if an observable throws an error and do you see any issues with that?

### 10: What is the difference between `combineLatest`  and `merge` ?

### 11: Why should you avoid subscribing to an observable in another subscription?
No async pipe, hard to unsubscribe, memoryleaks

### 12: Why did they move from patched operators to pipeable operators?

### 13: If you create your own observable, where would you implement the teardown logic?

### 14: If you subscribe to a cold observable twice, what would happen? Code snippet:
What would be the output of this code snippet?
```typescript
const foo$ = interval(1000);
foo$.subscribe(v => console.log('first', v))
setTimeout(() => {
    foo$.subscribe(v => console.log('second', v))
}, 5000);

```
### 15: Explain multicasting in RxJS, which operators can you come up with and when would you use them?

### 16: In Angular, how would you prevent memory leaks with observable subscriptions?

### 17: How would you create a stream of clicks?

### 18: Why is the Behaviorsubject the only observable that has a value property?
