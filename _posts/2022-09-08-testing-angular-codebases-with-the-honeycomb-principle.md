---
layout: post
title: Testing Angular codebases with the honeycomb principle
description:  
published: false
author: brechtbilliet
comments: true
date: 2022-09-08
subclass: 'post'
disqus: true
---

Testing Angular codebases can be a tricky thing, and it is worth to have a clear vision on what to test, when and how.
This article is about testing web applications. Whether we use Angular, React, Vue, Svelte or any other technology, the principles
should remain the same. When working in big companies with big code bases we want our teams alligned on how we think
regarding testing. There are 3 approaches on how to tackle testing in an web application codebase.

## Testing pyramid

A long time ago Mike Cohn came up with the concept of a testing pyramid. Which basically tells us it is a good idea to have
only a little bit of E2E tests, A bit more integration tests and a lot of unit tests.

The reason why we should not write too many E2E tests is that they are expensive to write and slow to run on our CI.
Having a lot of unit tests makes sure we get a decent test coverage and it runs blazingly fast.

## Snowcone principle

The principle that contradicts the testing pyramid is called the snowcone principle or the icecream cone principle. 
This is basically the testing pyramid, but the other way around. So in that case we only have a few unittests, a bit more integration tests and a lot of E2E tests.
Both approaches have their advantages and disadvantages, but this article is not about the testing pyramid, nor the snowcone principle.
I've been working in both pyramid and snowcone code bases and I believe neither are perfect.

## Honeycomb principle

I used to be a big believer of the testing pyramid, and I even worked on codebases where we tried to achieve the stupid 100% of
test coverage. A rule that doesn't make sense. There were times we cared more about that percentage, than the quality of our tests. Our build would
fail at 95% coverage and we had these sexy istanbul html pages that showcased how awesome our coverage percentage was.
When writing web applications most of our codebase (at least the frontend) consists out of components. A component mostly resembles a DOM
element that contains some HTML, some javascript and some CSS.

Does it make sense to unit test components? Unit testing components has a few downsides:
- We can't test the HTML, well we can with TestBed, but it's not that straightforward and there is a lot of config needed
- They break as soon as a dependency changes. Adding, removing or even updating a dependency will break the
test since its dependencies are mocked in the test.
- We write more code for the unittests than or the actual unit
- We write tests because we want to be sure everything keeps on working when we change stuff, rather than to see if the logic is correct. 
That is something that a unittest can not guarantee... We are sure a function or a class works, but we don't know if the component works.

I've been in dozens and dozens of code bases where unit tests became a pain. Every new feature, every bug fix, every tiny refactor
resulted in a huge amount of tests that had to be rewritten. After that huge amount of maintenance it still occasionally happened that
a new code change didn't broke tests but broke functionality. That's why we started to shift towards the **Honeycomb principle**.

Honeycomb principle basically means, writing little E2E tests, little unit tests, and a lot of integration tests.
Every component that we test is an integration test. An integration test is a very wide concept. We could write a bunch of detailed
integration tests for a datepicker, where we only test that component in a standalone way. We could also test the products page
of our hypothetical webshop application, by testing a number of components into one group. We basically have a number of different levels
where we could write integration tests.

I have an opinionated way of thinking when it comes to testing a code base of web applications and it looks like this: 
**Note: Bear in mind that this is one way of doing things, we should use what works for us and our teams**

## Honeycomb principle for web applications

### E2E tests in web applications

We should only write E2E tests for happy flows. When we are creating a webshop we should make sure that we can 
log in to the system, go to a product, buy that product... These are happy paths and they make sure that we can deploy
to production without breaking our app entirely.
Bear in mind that E2E tests are slow to run on CI and we don't want them blocking our pipeline too much.

### Unit tests in web applications

Here I would only test complex logic. I would test the stuff that we could write test-driven. Algorithms, calculations, real logic.
Don't unit test orchestration logic, don't unit test components. It's super expensive to write, to maintain and it doesn't add that much value.
When we do write unittests I would go for `Jest` since it's fast and doesn't have to spin up a real browser every time. Oh and definitely check out
[wallaby.js](https://wallabyjs.com) if you haven't already. It will blow your mind.

### Integration tests in web applications

Here comes the interesting part: Integration tests for components. This is how we should test our components, whether we are writing React, Vue or Angular...
How do we do that? We can write integration tests in a very cheap way by using [Storybook](https://storybook.js.org) and [Cypress](https://cypress.io)
They don't break after refactor, and they will actually tell us when we broke something

