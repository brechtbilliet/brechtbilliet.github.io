---
layout: post
title: Angular interview questions for catching senior talent 
description:  
published: true
author: brechtbilliet
comments: true
date: 2022-08-12
subclass: 'post'
disqus: true
---

Companies ask me to take care of technical interviews from time to time. Having done quite a lot of these interviews, 
I learned a lot from them. 
By helping out a lot of different clients, I also have been on the other side of the table more than a few times too.
This means I have learned some patterns on how to create a positive impression towards my interviewer, and I know how to estimate
the candidate as well.
I don't like to ask for technical assessments because I value the time of the candidate, and I'd like to think of them as people, not programming machines.
That being said, I do understand technical assessments work for a certain people and companies, it just might be my gut and preference.
This blog article is the beginning of a set of many blog articles that will focus on interview questions.
Every article will contain 20 questions that we can ask as an interviewer + the kind of answer I would be looking for.
Bear in mind, there is no right answer, but I like to bring you in my chain of thought of how I reason in these kind of interviews.
This one is specific to Angular, another might be focussed on architecture, and another one maybe on javascript/typescript or testing and I'm pretty sure
RxJS will also get his own article.
Bear in mind that most of these questions can be hard for junior profiles. But then again, not all questions
have to be answered thoroughly.

I'm not a huge fan of asking a candidate questions like: 
<blockquote>Tell me all the different lifecycle hooks that Angular components offer us, and tell me 
in which order they are being executed.</blockquote> 
Questions like that could make our candidate uncomfortable and stressed out.
I also don't like to ask: 
<blockquote>What's the difference between `markForCheck()` and `detectChanges()`?</blockquote> 
I'd love to hear it in a response of
another question I might ask but we shouldn't focus on api specifics. Maybe sometimes I would ask for api specifics, but then it only means the candidate has answered
most of the other things and he or she is really doing a good job. And let's be honest... Everyone can memorize api's...

Why would we ask people if they could memorize all the api's a framework has to offer? When we can try to understand how they think
and reason about problems and proper solutions? This is the reason we should focus on open questions that can be answered in many ways.
The more open our questions are as to the candidates, the more we learn from the piece of talent we are interviewing.
We only have limited time right?!

Our candidate can give us some nice twists like sidetracking on best-practices and bad-practices.
I love to hear long answers where the candidate can show his or her passion about Angular and the surrounding experience.

For every question I will try to explain on how I personally would answer the question and why, so basically what could make me happy as the hypothetical interviewer.
The concrete answers will not be found here, that is something you have to do on your own.

### 1: Name all the ways you can think about on how components communicate with each other in Angular?

This is a very simple question but can still be used to blow the mind of the interviewer. 
I would start that the easiest way for component communication would definitely be the use of `@Input()` and `@Output()` properties. 
I would mention that data flows from parent components towards child components through `@Input()` properties and we
pass that data into the component with the parenthesis syntax `(foo)="bar"`. The child component can notify the parent components
through the famous `@Output()` properties and for that we use the curved bracket syntax `(change)="onChange($event)"`.
Yes, yes this is also api specific, but let's face it. If they don't know that api they simply haven't used Angular, and I have gotten
my share of candidates who were unable to answer that question.

I would maybe mention that for `@Output()` names we should never use `onChange` or `onClick` but we rather use `change` or `click`.
That is more consistent with the current api of Angular and it's a known best practice.

I could talk about injecting parent components into child components through dependency injection in the constructor. 
I would focus even more on when I would do that and if it is a good idea in general.
I personally consider this to be a bad practice in a lot of cases as it breaks the unidirectional dataflow and makes it quite complex. 
That being said, I can give an example on where I inject a custom form component into an input-wrapper component to see if the form is submitted or not.

I can go on about ViewChildren where one could gain access to child components within parent components.
This also creates a form of communication. Maybe I step it up a notch and explain the difference between ViewChildren and ContentChildren.

Lastly I would talk about how to use services to communicate between different components and that in general I wouldn't do that to communicate between
children and parents. I'd say that it might be a good idea to let siblings communicate with each other. Although in many cases we can use the parent component for that. 
When we want to communicate between a parent and a child, but there is a router-outlet in between it might be a good fit to use a service for that.

#### Bonus question: Can you name a bad way to let components communicate with each other and why?

I would probably say we could use the window object to do that, but that it is not a good idea because we lose all the encapsulation and we should not communicate 
with the window object directly. It would create complexities, dependencies we don't want and we are communicating outside of the framework.

We could also use redux or @ngrx/store to communicate between components. I would also consider this to be a bad practice since we are using a complex
framework for something very simple and we are creating a very hard dependency in every layer of our code. That being said, this is a personal opinion
and I'd love to hear the perspective of the candidate.

### 2: How would you structure components in Angular?

I would talk about smart and dumb components and what their responsibility is and how we keep them dumb components ignorant to the rest of the application but
that they still can have complex logic. I'd probably give an example that a month view of a calendar is stupid, but can be very complex.
I would say that splitting up into more and smaller components is beneficial for:
- Control over change detection when using the `ChangeDetection.OnPush` strategy
- Testability
- Less observable subscriptions
- Single responsibility principle
- Separation of concerns
- Reusability

I'd also keep a separate folder for smart and dumb components so they don't get mixed up.

I could talk about when I would extract code from the component. I could talk about preference of inline templates 
or not and share the advantages and disadvantages for both ways. It's important to show that that I am not biased and
that both solutions could work.

####  Bonus question: Tell me the difference between popes and components

I don't think this question should be answered here since it's a very straightforward question.

### 3: Dependency injection, services, lifecycle of services and use cases. go!

With this question we can really show that we know exactly how Angular works in terms of dependency injection.
I could talk about services and how to make them injectable. I would say that we can provide services in modules and
that they would become singleton for the entire application. After that I'd say that we can also provide them in
lazy loaded modules (by using providedIn:'any') which would result in singleton at that modules level. Then I could explain how we can also
provide them at any component and that the lifecycle would be shared with those components.
A nice addition there is to mention that if we provide them at component level we could also implement `ngOnDestroy()` lifecycle hooks
in the services. Some nice examples on services in components would be very welcome and I would probably say I could use it
to remove redundancy from 2 big fat smart components that share 80% of the same code.
It would be my moment to mention that I prefer composition over inheritance.

A nice addition would be explaining the `providedIn: 'root'` syntax in the `Injectable()` decorator and that this creates an
application wide singleton instance. It would also be worth mentioning that this improvement was there to make treeshaking possible.

This is a great moment to start about the standalone components that Angular 14 brings with it, and I could give my opinion
on Angular modules in general. By mentioning that Angular modules were introduced in angular2@rc5 I could prove my experience.

The reason why I am saying this is not to brag, it's to show how deep you could go with this question.

### 4: What's the difference between guards and interceptors?

I like this question because we ask 2 things at the same time. Guards and interceptors don't have anything to do with each other
but they are important tools within the framework. After explaining what guards are I could come up with examples on either
when to use the `canActivate` guard but also explain the less often used `canDeactivate` guard. A nice example there would be when
the user has filled in a form and we don't want to block him from navigating away.

I would explain that I don't only use interceptors for adding jwt tokens but I could also use them for loading state, error handling and so much more.

### 5: What is the `async` pipe?

Not only could I say we could use the `async` to subscribe on observables, I could start talking about RxJS and that it is the only real dependency Angular has besides zone.js.
I would say that the async pipe, subscribes to the observable, also unsubscribes from the observable when the component gets destroyed and I would talk about
how it runs a `markForCheck()` as well.

I would say I consider using the `async` pipe as a best practice because it does a lot of management for us (subscribing, unsubscribing, mark for check).
Maybe I would even talk about the `*ngIf=foo$|async as foo` syntax where we can keep the value of the observable inside the template
and share it like that. I could mention that it can be dangerous if foo has a falsy value.

### 6: Tell me about RxJS in Angular, what reactive api's are there?

This is a beauty because you can talk about so much here.
It might be a good idea to start talking about my passion in RxJS first and how I fell in love with it.
After that could talk about how the router is reactive and that we can subscribe to events.
The activated route gives us observable params, queryParams and so much more.
We could talk about Reactive forms and how the `valueChanges` property is observable.
ViewChildren and ContentChildren can also be observable.

I would also like to talk about the `HttpClient` returning observables instead of promises and that unsubscribing from
an observable that is performing an XHR call will result in an `xhr.abort()`  behind the scenes.

If I want to blow the interviewer his mind I'd mention that `@Output()` EventEmitters are also observables behind the scenes and that
you can replace the EventEmitters with any kind of observable

### 7: Give me an easy way to create a memory leak in Angular and how to fix it. Eg setInterval()

If the candidate does not understand the question: You have to add a `setInterval(console.log)` statement somewhere in a piece of code 
that will be destroyed and we want to keep seeing numbers logged in the console.

This should help the candidate enough. What will get destroyed and reinstantiated? Components will.
So adding that piece of code in the constructor or `ngOnInit()` of a page that is a component and navigating away from that 
could do the trick. By clearing the interval on `ngOnDestroy()` we could clean up that memory leak.

I would start on how easy it is to create memory leaks with RxJS and that it's important to always clean up subscriptions.
This might be a tough question but we could really peek into the reasoning of the attendee here.

### 8: How would you test Angular applications?

This question has a lot of different answers, and none of them are right or wrong. But it's a great way to see how the
candidate feels about testing, where the priorities lie and how much experience they have with testing Angular applications.

I would first talk about the testing pyramid vs snowcone and how today I prefer something like the honeycomb principle:
A small amount of unit tests (only the real complex logic), a lot of integration tests for the components, a small amount of E2E tests 
to test the happy flows.
I would say something like I unittest the real logic in services and I don't use TestBed but `jest` just like I would test
any javascript or typescript class or function. I'd back it up with complexity, performance and why I don't like to be bound to a specific framework.
For components I use a combination of `cypress` and `storybook` as integration tests were we would create a storybook of the usecase
we would test and use `cypress` to do so.
I would also use `cypress` to tackle the E2E tests, but since these are slow and hard to maintain I wouldn't write too much of them.

I would challenge the use of a huge amount of unit tests because they are very brittle (an extra dependency in the constructor breaks every test).
and if we break a `cypress` `storybook` integration test chances are quite big that we actually broke something.

### 9: Explain to me how change detection works in Angular

Here I could talk about `zone.js` monkey patches all the native browser events and that Angular uses it to get notified when something happens.
I could talk about how Angular takes the component hierarchy and by default evaluates all the components from top to bottom.
I could say that this isn't the most performant thing to do and could explain how the `ChangeDetection.OnPush` strategy helps us with that.
When talking about that strategy we could explain the `markForCheck` thingy and the difference between `ChangeDetectorRef.markForCheck()` 
and `ChangeDetectorRef.detectChanges()`. We could also explain that we need immutable data flows to make this work and that it does not make sense
to use the `ChangeDetection.Onpush` strategy on components that don't have any inputs.

I would sidetrack on the advantages of immutable data structures and that its predictability is of more use than the performance gain.

It might also be worth noting that the `async` pipe also triggers a `markForCheck`, but we already said that didn't we?. 

#### Bonus question: What happens if you apply the `ChangeDetection.OnPush` strategy on your app component?

I could explain here that it's not a good idea to do that because it will basically break your change detection and you have to manually
run `markForCheck()`  for everything. A nice example could be this one:
When we do an `httpClient.get('url').subscribe(result => this.result = result)` in our code. Our application will never update because it isn't marked for check.
Also the change detection deep within your component hierarchy could be broken. Another thing is that our app component doesn't have any `@Input()` properties so it is useless anyway.

### 10: What is the Expression has changed after it was checked error?

I would start to laugh about the fact that this bug has bitten me in the butt more than once and explain when and how much it has occurred.
I would say that the change detection ran twice in development and that both results are compared.
If the results that are used in the template don't match it means something has changed in between proving that there is something wrong with our "clean" dataflow.

I could also explain why this isn't run in production and that even the bug is harmless, it does shed some light on problems.

### 11: How can you tackle redundancy in Angular?

Very open question, if you are a senior profile you could talk for tens of minutes but I will wrap it up quite shortly here:

- We can extract logic into reusable components
- We can extract logic into reusable directives
- We can extract logic into reusable pipes
- we can extract logic into reusable functions that we expose in javascript modules (better treeshaking)
- We can extract logic in services

### 12: What is trackBy and how does it work?

This question proves a level of seniority of the candidate within the framework.
I would explain that every `*ngFor` statement could benefit from that and how the performance is optimised.
Especially with big lists this property can have a huge impact.


### 13: Tell me about Angular CLI.

Here I can talk about code generation, about webpack. Maybe if I really want to make an impression I can talk about
why you think they chose for `webpack` and not `rollup`. Maybe mention why I think it wouldn't work with `vite` now.
I could talk about schematics and that there is a thing called Nx that takes the Angular CLI to the next level. 
I could talk about updating to new versions. I could talk about ng-packagr and how I would create a public Angular package.
I would talk about the CLI sets up webpack configs, unit test configurations, prettier config, linting config files etc.

### 14: How do you consume params from an ActivatedRoute and do you see complexities there?

Here I could say is that injecting the `ActivatedRoute` gives us observables of params but also snapshots if we want.
I could say that it only has access to its own params, and not to the params of its parent router-outlets.
Unless we set the `paramsInheritanceStrategy` of the routerconfig to `always` that is.

I would share frustrations that it is complex to access params from child router outlets and that it should also be available
because they are available in the url, but that I believe they have developed it like that to support auxiliary routes.

I would use this question to talk about how I love nesting router-outlets and using them to display dialogs so that Angular
takes care of the lifecycle for me.

One last thing to mention here is that when a param changes, the component is not being destroyed and reinstantiated.

### 15: Name your 3 favourite Angular characteristics

This question speaks for itself. You can verify experience, reasoning, passion and the ability to challenge technical decisions
by listening to the candidate talk.

My personal favorite is the integration with RxJS, the fact that it is opinionated and I think it is suited for huge projects.


### 16: Name your 3 biggest Angular frustrations

This question also speaks for itself. You can verify experience, reasoning, passion and the ability to challenge technical decisions
by listening to the candidate.

My biggest frustration is its bundle size, the build time and the ReactiveForms.
I would continue on the fact that it is nice that Angular 14 gives us typed forms but that I see a lot of improvements there.

### 17: Explain how you would do content projection in Angular

I could start out by the fact that you can have an `<ng-content>` slot and whatever I put between the tags of my components would be rendered there.
I could also mention that you can have multiple slots that I could name. And that all these slots can be referenced in the component
by using `@ContentChildren()`. After that I would probably start giving examples on where to use multiple slots like dialogs that have
both a title and a body section.

After that I could also explain that there is a thingy called `ngTemplateOutlet` but to be quite honest, that kind of stuff is the
stuff I have to look up every time I need it. That being said, mentioning the existence of it is way more important then
knowing the api by heart.

I could even say it is possible to render content from the right view into the left view by using services to pass template references, 
but now I'm just trying to be smart even though it is possible.

### 18: Tell me something about selector prefixes.

Again a question where you can validate the experience and reasoning.
- I'd say every component selector has a prefix, but selectors aren't even mandatory so prefixes aren't either.
- We pass these prefixes so they are unique and it's easier to see where they live.
- We use linting rules to validate if the prefixes are used correctly
- Both components and directives can have prefixes.
- It's a bad practice not to have prefixes.
- Prefixes are both stored in the `project.json` (for Nx) and `angular.json` (for Angular CLI) file for schematic generation of components and directives, and they are also
defined in the linting config files

This question is different then the other ones, here the candidate can just make a list of all the things he or she knows about a 
simple subject.

### 19: What version upgrades of Angular were really exciting for you and why?

This is a very easy question to check on seniority or if the candidate is up to date with the newest version.

At the time of writing I would talk about standalone components and typed forms in Angular 14.
That is was pretty weird that there was no Angular 3 but that I understand why.

I would go on that I was pretty frustrated that angular2@rc5 had modules when angular2@rc4 had not...
And that I had to rewrite my Angular fundamentals workshop just before my public workshops were planned.

I would go on that the upgrade path had gotten easier and that updating to Angular 6 was a pain in the butt for me.

I'd probably also be a bit more negative about Ivy because at ngVikings they showed a hello world of a few kilobytes
but that never seemed to become reality.

You see the question here shouldn't be about remembering versions, it should trigger the candidate to talk about his or
hers experience with Angular and which updates were important.

### 20: Who do you follow? Which blogs do you read? What do you do to keep up to date with Angular?

This is one of my favorites. One could talk about pluralsight or egghead trainings.
They could mention Angular core team members, or interesting pull requests.
They could talk about conferences or at least a talk they were interested in.
They can talk about books, interesting talks with colleagues and so on.
They can talk about pet projects and stuff they are doing in their own time.

This is a great question: not to test seniority, but to test passion and motivation in the framework.

## Conclusion

Keep the questions limited, keep them short and expect long answers. You might be surprised how smart our candidate is.
Every body can learn a framework, but not all of us can learn to reason. And syntax is easily forgotten of it has been a few months or
even weeks until we have used it in practice. Hope you enjoyed the article!

Special thanks to the awesome reviewers:
- [Tim Deschryver](https://twitter.com/tim_deschryver)
- [Santosh Yadav](https://twitter.com/SantoshYadavDev)
- [Gregor Woiwode](https://twitter.com/GregOnNet)
- [Tom Eustace](https://twitter.com/tomeustace)
- [Webdave](https://twitter.com/webdave_de)

