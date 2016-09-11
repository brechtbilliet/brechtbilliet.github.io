---
layout: post
title: How we made our app real-time in 6 lines of code
published: false
author: brechtbilliet
comments: true
---

## How we made our app real-time in 6 lines of code

Me and [Kwinten Pisman](https://blog.kwintenp.com/) will give a workshop at the first Belgian Angular conference [ngbe](http://ng-be.org) about Reactive applications with [Angular 2](http://angular.io), [RXJS](https://github.com/ReactiveX/rxjs) and [@ngrx](https://github.com/ngrx).
The application we are using is the [winecellar](http://winecellar.surge.sh), which I already used in all my Angular 2 workshops. The focus of that workshop is Reactive programming and architectural choices.

Something that can't miss in a reactive workshop are real-time updates. While me and Kwinten were working on that particular workshop, we had this crazy idea to make the winecellar application real-time.

When we updated the node.js backend (which is out of scope for the workshop and this post) we started changing our application to make it real-time.
First, we thought about a lot of different scenarios that would take some big code refactors. At the end we did it in only 6 lines of code.

Here's the result: At both computers, we are signed in with the same account.
![Winecellar app](https://raw.githubusercontent.com/brechtbilliet/brechtbilliet.github.io/master/_posts/realtimein6lines/realtimewinecellar.gif)


### The winecellar app

The winecellar application is a simple application with only a few features, but we overengineered it on purpose to make it work for largescale applications.
You can find the open-source code of the winecellar project here: [frontend, (realtime branch)](https://github.com/brechtbilliet/winecellar) and [backend](https://github.com/brechtbilliet/WineCellarBackend). Beware, the backend might be a little quick and dirty ;)

The main features of the winecellar app are:
<ul>
<li>Authentication</li>
<li>Add, update, remove wines</li>
<li>Searching in a public wine database (wine.com)</li>
<li>Filtering wines</li>
<li>Update the stock of wines</li>
<li>Setting ratings for wines</li>
</ul>
![Winecellar app](https://raw.githubusercontent.com/brechtbilliet/brechtbilliet.github.io/master/_posts/realtimein6lines/winecellar.png)

### What part of the application should be real-time?

<ul>
<li>All the actions that will update the database eventually should push notifications to all clients except the one sending them.</li>
<li>Even the filter should be real-time. (Eg. when filtering on "Chateau pomerol", and somebody adds that wine, we want to update our filtered results real-time)</li>
</ul>

But why did we made something like that real-time? Actually, **just because we can**! It doesn't realy make sense that a user is logged in twice right? We did it for the purpose of the workshop.

### How did we manage to make it real-time?

First, let me give you a little bit of information about the technology stack and how the winecellar realy works.

The technology stack is Angular 2, @ngrx/store and RXJS. @ngrx/store is a redux library that we use to maintain the state of our application. Basically, you can see it as a client-side store of all our wines and other state. We use that particular store as a single-source-of-truth. We will send actions towards that store which will update the state with pure functions called reducers.

In the following scheme you can see the unidirectional dataflow of redux: The view sends action to the store which will update the state and then update the view.
![Redux](https://raw.githubusercontent.com/brechtbilliet/brechtbilliet.github.io/master/_posts/realtimein6lines/redux.png)

Redux also has devtools.
In The devtools below you'll see the actions being dispatched when updating the stock of a wine for instance:
![Winecellar devtools](https://raw.githubusercontent.com/brechtbilliet/brechtbilliet.github.io/master/_posts/realtimein6lines/winecellar_devtools.png)

Let's say we want to add a wine. when we add a wine, we send a XHR request to the backend and send an action to the store, like you can see in the snippet below.

```typescript
add(wine: Wine): void {
    this.http.post(`${API_URL}/wines`, wine, this.authorizedHttpOptions())
        .map((res: Response) => res.json())
    	.subscribe(resp =>
    		this.store.dispatch({type: DATA_WINES_ADD, payload: {wine:resp}})
		);
}
```

This doesn't have anything to do with real-time, right?! You are right, it doesn't... but I want to show that we only have to update the store to make the view react on that.

When this XHR request is handled in the backend, and the wine is added in the database, The backend will send a push notification with socket.io (but only towards the other clients, we don't want to be notified for something we just did, now do we?)

Basically, for every crud action the backend will handle the database communication and send a push notification to every client which is logged in with the same username.
For every REST call that changed something in the database, I wanted to send a custom action to the frontend which I would consume like this:

```typescript
// connect with socket.io and listen  actions
connect(): void {
    this.store.select(state => state.data.authentication.jwtToken)
    	.take(1).subscribe((token: string) => {
	        let socket = io(BACKEND, {query: "jwttoken=" + token});
	        socket.on("ADDWINE", (wine: Wine) => {
	        	// add the wine to the store
	        });
	        socket.on("UPDATEWINE", (wine: Wine) => {
	        	...
	        });
	        socket.on("REMOVEWINE", (_id: string) => {
	        	...
	        });
	        ...
    });
}
```

Kwinten had the great idea to just send redux actions from the backend. That way, we only have to listen for one event, which will receive an action, that will be dispatched directly to the redux store.

The snippet below is all the code we had to write to make this work:

```typescript
// connect with socket.io and listen to redux actions
connect(): void {
    this.store.select(state => state.data.authentication.jwtToken)
    	.take(1).subscribe((token: string) => {
	        let socket = io(BACKEND, {query: "jwttoken=" + token});
	        socket.on("UPDATE_REDUX", action => this.store.dispatch(action));
    });
}
```

This is super awesome, we just made our node.js backend send the same actions as our frontend. This means, that because of the fact that we use the redux principle and we carefully designed our state, that we can make our application real-time in a few minutes.

This is a simplified example of what happens on the backend when we add a wine, for instance.

```typescript
@Post("/")
public post(@Req()req: Request, @Res() res: Response): void {
    let userId = handleAuth(req, res);
    new Wine(req.body).save((error, response) => {
        ...
        this.pushToClient(userId, req, {type: DATA_WINES_ADD, payload: {wine: response}});
        res.send(response);
    });
}
```

### Conclusion

Because of the redux principle, we can make our application real-time in a matter of minutes. This was a great breakthrough for us and we look forward of teaching these principles in our ngbe workshop.