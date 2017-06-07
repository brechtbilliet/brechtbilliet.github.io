---
layout: post
title: Scalable react architecture
published: false
author: brechtbilliet
comments: true
---

## Introduction
Most of the people that know me, might consider me an "angular-guy". It's a fact that I'm pretty much in love with the framework (since Angular 2), so people might be surprised that this arcticle is actually about React. Anyway, I consider myself an application-developer and would encourage everyone to keep an open mind.

One of the things that I like most about angular is the fact that it gives us an all-in-one solution to create large-scale applications in a very opiniated way.
The angular-CLI is a great way to avoid a huge project-setup and the angular module-principles make code-decoupling a breeze. On the other hand, when using angular, we are bound to a framework and it's harder to draw outside of the lines.


At the time of writing, I'm freelancing for a company called Showpad. Showpad is a success-story of a scale-up that made its way across the globe. At the time of writing, Showpad is using Angular +4 in various projects. 
For these applications, Showpad uses an [architecture written by me](http://blog.brecht.io/A-scalable-angular2-architecture/) that I already introduced in a bunch of companies.

That being said, I believe that teams should have some freedom in choosing their technology-stack. This is important when a company works with autonomous teams (see the spotify engineering culture).

A few weeks ago, there was a team that asked if they could use react in a new project. Since React its goal is only to provide the presentation layer, there was need for a decent architecture. After some research it became clear that there are multiple solutions, and that there are a lot of opinions on how to do things. It became clear that I wasn't going to find one single opiniated architecture.

In this post we will learn about how that specific "React" Architecture was born.

## The requirements of our architecture

One of the first steps in designing an architecture are the requirements. For the application we were writing the following requirements made sense:

- The application would **grow huge** and therefore needed a system to divide work between different teams
- It would have to have a **small bundle-size** and be pretty performant
- The application would contain a bunch of **Realtime** stuff and therefore we decided to make it **Reactive** 
- To ensure performance in bundle-size to do **code-splitting** and **Lazy load those bundles**
- **Hot module reloading** seemed a very nice approach in pragmatic development.
- Since the application would have a lot of classes,services,helpers that wouldn't have anything to do with the presentation layer (React), **dependency-injection** seemed like a must
- **State sharing** was also an important aspect
- Because styles need to scale along with the components in a SOA, **CSS encapsulation** was an important aspect as well
- We needed a module system to decouple specific domains

## Choosing the perfect technology-stack
 
Based on the previous requirements, the following technology-stack was chosen.

- React (component, routing)
- Redux (Statemanagement)
- RxJS (reactive programming library)
- Webpack (module bundling)
- Typescript (type safe javascript-library)


## Doing the React part, the React-way
Some of the basic building-blocks of React are:

- Dumb and smart components (containers)
- Immutable data structure to ensure pure components
- Unidirectional dataflow
- Having a separate state-management-tool (like redux)


## Reactive applications



