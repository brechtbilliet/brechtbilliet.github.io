---		
layout: post		
title: A scalable angular architecture (part 2)
published: false
author: brechtbilliet
description: 
comments: true
---

# The sandbox pattern

## Introduction

A while ago I released a blogpost called "A scalable angular 2 architecture" which was all about creating large scale enterprise applications.
I have introduced that specific architecture in a lot companies and projects, and I found it to be quite successful. Nowadays, I know quite a lot of people using that architecture in their projects, and it can not only be used in angular environments but in other SPA's as well.
Often, I ask developers about how they feel about that specific angular architecture and the feedback is mostly this:
They like the fact that it's a clear and opiniated way to structure their code, and they find it easy to find their way into the codebase.

A big part of that article was about explaining so called "sandboxes", a personal terminology for a very specific kind of facade.
Since writing that article raised a bunch of questions about these "sandboxes", it seemed like a good fit for a followup article.

In this article we will cover what sandboxes are really about and why I introduced them in my webapplications.
We will cover all the interesting questions that were asked to me and I will throw in a bunch of real-life examples as well.

**Note: This architecture is one way of doing things and the statements being made in this article are completely personal and very opiniated.
The statements being treated as the ultimate right or wrong are purely written to explain this particular architecture, which is not the only way to achieve things**

## Why I introduced sandboxes

One of the most challenging parts of creating big clientside javascript applications is encapsulation and dividing responsibilities. Having a decent encapsulated structure where every component, service, class has a clear vision of what it should do, makes it easy for us as developers to maintain the code and develop new features. 

### Challenge 1: how to structure components

Since this topic is covered in the previous article, we won't dive to deeply in that subject.
We use the smart/dumb component approach to structure our components. The dumb components mostly have presentational purposes and the smart components interact with 
the rest of the application. As simple as that

### Challenge 2: how to handle statemanagement

Another topic covered by the previous article is how handle our statemanagement. In short: we use @ngrx/store, a redux implementation that embraces reactive programming. 

### There are a few problems that remain:

The first two challenges are met: we have a clear and structured presentational layer and because of the fact that we use @ngrx/store (or any statemanagement tool for that matter) we have a clear way of managing state, we
can optimise performance with immutable data and we have a clear unidirectional dataflow.

Hower, there are still a few pieces of the puzzle missing, and that might raise the following questions:

#### How do we separate the presentation-layers from the rest of the application?

If we inject whatever we want in our smart components, their constructors might get huge in no-time. Do those smart components really need to know about everything in the application? Do they need to know where everything lives and what service it should call from what module that lives somewhere in the application? Wouldn't it be easier if they had an interface they could talk to, that just handles things for them?
It would certainly help to decouple angular modules from each other, and keep the responsibility of those smart components clear and compact. **Let's call that specific element a sandbox**

### Do our components need to know about redux?

Redux is an awesome library/principle that helps us ace statemanagement, but it's a really heavy dependency if you don't manage it carefully. What if your **very specific** redux actions would be everywhere in your components and services? In that case your codebase would be completely infected by it and it would be very hard to use another statemanagement tool in the future.
it would be a huge depencency... What if you like to switch to firebase for instance, or mobx, or even write your own statemanagement tool. You would need to refactor your whole application. The sole principle of redux is to manage state, and I prefer to use it that way. That is also why I don't really use effects, thunk or saga.
For me this means: **Use redux only to alter state, not to trigger backend actions etc**
One could argue that the redux code should be in only one place in your application. **Let's call that place the sandbox again**

#### Do our HTTP services need to know about a redux implementation?

Well, as the name already reveals. An HTTP service is all about doing HTTP calls and returning an asynchronous object to the components. An HTTP service should have no notion about redux at all nor any other statemanagement tool. It's sole purpose is fetching data and returning it. Let's take the following example for instance. We fetch an array of wines from the backend and we want to persist that in a redux store. This is an example of an HTTP service that is being abused to achieve that:

```typescript
class WineService {
	// bad
	fetchWines(): void {
		this.api.get('url')
			.map(resp => resp.json())
			.subscribe(wines => this.store.dispatch({type: 'SET_WINES', payload: {wines}});
	}
}
```

This code doesn't belong here, it's not the responsibility of that service. The question is where does it belong?
Does it belong in the component? They would get dirty and reduxy in no-time...
Let me spoil it for you, **in this specific architecture it belongs in the sandbox**.


#### On what place do we dispatch actions to the store?

Err..., the sandbox =)

#### Where do we handle optimistic updates

Again, that would be the sandbox

#### How to NOT make your whole application smell like REDUX

Components and services should not know about redux, so the store interaction should be in a very specific place as well.

I bet you saw it coming, but YES! That's what a sandbox is all about! It's about seperation of concerns and having a very specific interface to handle very specific things.

## What does a sandbox do?

A sandbox has a very specific responsibility:

- It let's your module communicate with other modules without that module having to know about the rest of the application
- It send Redux actions
- It exposes streams of data (coming from Redux, Firebase or other technologies)
- It handles optimistic updates
- It keeps the containers stupid enough

## What's very specific on a sandbox?

- They handle stuff for the container, without the container having to know how...
- They interact between modules
- They handle a lot of redux (or similar tech) logic
- The functions mostly have a void return-type
- They expose observables/streams
- It mostly contains redundant code (it's all about KISS instead of DRY)
- Mostly every module has a sandbox, unless it contains a huge amount of logic (in that case we would implement a sandbox for every container)
- It mostly doesn't contain if-statements
- It gives you an overview of what a module can do in the application.

## What doesn't a sandbox do?

- It doesn't contain business logic. It contains sandbox logic, which is very specific.
- It doesn't contain presentation logicn, like routing etc.
- It doesn't do HTTP calls, it delegates them.
- It doesn't let your components do whatever they want =)

## FAQ