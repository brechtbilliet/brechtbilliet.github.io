---
layout: post
title: Why angular
published: false
author: brechtbilliet
comments: true
---
## What I look for in a javascript-framework

The search for a great javascript-framework can be a difficult task. There are so many javascript-libraries and javascript-frameworks out there which makes the task even more difficult.

The first question you might want to ask yourself is: **"Do I need a framework or do I need a library"** Are you planning on building a large-scale application or would a limited application suffice? You don't really need a framework per se if you want to build a large-scalle application but it would certainly help you in structuring your code and not having to do everything yourself.

That being said, I'm going to share what I look for in a framework. Though my requirements might seem opiniated, try to keep an open mind. After all, it's only what I look for and it might not share your requirements in finding your ideal framework.

### The embrace of Typescript
Typescript is a great language, and above all: it's just javascript. It's a superset of javascript that gives you the advantage of making your code type-safe. I've worked with typescript for a few years now and it made my life a lot easier.

### The embrace of reactive programming
When grasping the principles of reactive programming, writing complex code becomes a breeze. Libraries like RXJS makes you write a bunch of complex functionality in only a few lines of code. Though you can use RXJS everywhere it would certainly help if the framework embraces it. Think about subscribing and unsubscribing automatically. Extracting observables from parts of the framework.

### The embrace of immutability and unidirectional dataflows

### A CLI tool
We live in a certain age that sometimes, it takes more time setting up a project and maintaing the config than actually writing code. A CLI that scaffolds the project will save you a lot of time.

### Lazy-loading
As we don't want to load a huge application in one time, it would be awesome if our framework could lazy-load modules to make the initial page load faster. Sure you could do this yourself but it won't be easy and... config config config...

### A community
This might be one of the most important ones. The success of a framework is partially based on the size and effort of its community. When there is lack of a descent community it will result in:

- Less bugfixes
- Less new features
- Less input of the people
- Less stability
- **It will be a lot harder to find great developers with that framework knowledge**


### Opinitated
I like a framework that is somewhat opiniated but because it pushes your entire team into the same direction. Consistency in software is important, which doesn't mean you have to blindly take all opinions that they like you to follow.

### IDE integration
webstorm, codelyzer

### Depencency injection
Call me old-fashioned but I love dependency injection. It might be because I hava a .NET background but you can make your code much cleaner.
todo:

## Angular
For me there is but one solution so far, and that's angular (2+). I actually wrote this post to get feedback on other frameworks as well, because I too, want to keep an open mind and learn new things.

## Downsides of angular
filesize, breaking changes in the RC's of 2, AOT not ready
