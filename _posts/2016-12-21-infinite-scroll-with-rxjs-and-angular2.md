## About this article
This article explains how the "reactive-programming" approach helps us to create an awesome infinite-scroll-list in only a few lines of code. For this article, I'm going to use [RXJS](http://reactivex.io/rxjs/) and [angular](http://angular.io). If you haven't heard about [RXJS](http://reactivex.io/rxjs/) before I suggest to read the documentation first. Whether you use [angular](http://angular.io) or something else like [react](https://facebook.github.io/react/), it shouln't really interfere with the clarity of this post.

## Reactive programming
Reactive programming is really hot these days. However, there are a huge amount of people that have problems with thinking completely reactively. Thinking reactively is a huge mind-switch that one must make to completely accept this "new" way of coding things. The whole "My application reacts to a statemanagement-layer like [redux](http://redux.js.org/)" principle is grasped quite quickly, but when it comes to [thinking in streams](http://freecontent.manning.com/reactive-fundamentals-thinking-in-streams/) it can become quite difficult in the beginning. 

### Why not imperative but reactive programming?
<ul>
<li>No more "if this, then that scenario's"</li>
<li>You can forget about a ton of edge-cases</li>
<li>It's easy to seperate presentation logic from other logic (The presentation layer will just react to streams)</li>
<li>It's a standard: widely supported by tons of languages</li>
<li>When you grab the concepts, you write complex logic in a few lines of code in a very simple manner </li>
</ul>

A few days back a colleague of mine came to me with this problem: He wanted to create an **infinite-scroll in Angular 2** but he had bumped into the  boundaries of imperative programming. Turns out that an infinite-scroll-solution was actually a great component to explain when reactive programming can help you write better code.



## The infinite scroll

### What should it do?
An infinite-scroll-list, is a list where its data is being loaded asynchronous when the user scrolls further down the application. It's a great way to avoid a pager (where the user had to click on every time) and it can really keep the application performant. It's an efficient way to keep bandwidth low and increase the user-experience.

For this scenario, let's say that every page contains 10 results and that all the pages with results are being shown as one long scrollable list => the infinite-scroll-list.

Now what features should this list implement?
<ul>
<li>It should page 1 by default</li>
<li>When the results of page 1 don't fill the page completely, it should fill page 2, and so on, untill the page is full</li>
<li>When the user scrolls down, it should load page 3, and so on...</li>
<li>When the user resizes it's window, and more space is freed for results, it should load the next page</li>
<li>It should  make sure that it doesn't load the same pages more than once</li>
</ul>

### How do we start?
Like most coding decisions, I prefer to draw it on a whiteboard first. That might be a personal approach, but it helps me not to write code that will be removed later. 

Based on the feature-list, there are three actions that will trigger the application to load data: Scrolling, resizing, and an initial action that can be retriggered to manually fetch pages. When thinking reactively I can see 3 sources of events happening, let's call them streams
<ul>
<li>A stream of scroll events: **scroll$**</li>
<li>A stream of resize events: **resize$**</li>
<li>A manual stream where the user tells what page to load: **pageByManual$**</li>
</ul>

**Note: Streams are being suffixed with $ to indicate that they are streams**

Let's draw these streams on a white-board shall we?
![Whiteboard 1](https://raw.githubusercontent.com/brechtbilliet/brechtbilliet.github.io/master/_posts/infinite-scroll/whiteboard1.png)

The streams would contain certain values over time:
![Whiteboard 2](https://raw.githubusercontent.com/brechtbilliet/brechtbilliet.github.io/master/_posts/infinite-scroll/whiteboard2.png)

The scroll$ has Y values, which we can use to calculate the pagenumber. 

The resize$ has event values, which we won't use because we can calculate it based on the screen size.

The pageByManual$ will contain pagenumbers, which we can set directly since this is a subject (more on that later).


What if we could map all these streams, to streams that contain pagenumbers? That would be awesome, because based on the pagenumber, we could load a specific page. How we map the current streams to pagenumber-streams is not something that we need to think about right now (we are just drawing remember).
The next drawing might look something like this:

![Whiteboard 3](https://raw.githubusercontent.com/brechtbilliet/brechtbilliet.github.io/master/_posts/infinite-scroll/whiteboard3.png)

You see that we have created the following streams based on our initial streams:
<ul>
<li>**pageByScroll$**: which contains pagenumbers based on the scroll-events</li>
<li>**pageByResize$**: which contains pagenumbers based on the resize-events</li>
<li>**pageByManual$**: which contains pagenumbers based on manual events (for instance, there is still whitespace on the screen, load the next page)</li>
</ul>

What if we could merge all these streams in an efficient manner