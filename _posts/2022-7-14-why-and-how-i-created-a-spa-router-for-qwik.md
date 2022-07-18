---
layout: post
title: Why and how I created a SPA router for Qwik
description:  
published: false
author: brechtbilliet
comments: true
date: 2022-07-14
subclass: 'post'
disqus: true
---

## The why

The people from [builder.io](https://builder.io) have done an awesome job in writing [Qwik](https://qwik.builder.io/), amongst an arsenal of other great tools.
I started playing with [Qwik](https://qwik.builder.io/) some time ago and decided to rewrite my website [brecht.io](https://brecht.io) in that specific technology. 
I'm also planning to work on more complex apps but I wanted to see that one in production first.
At the moment I started reworking my website there wasn't a tool that took care of routing, or at least not how I am used to do it in other client-side technologies.
I'm used to work with SPA routing in angularjs, Angular and react and I wanted to explore how to use these principles in [Qwik](https://qwik.builder.io/) applications.

There is this thing called Qwik-city which is crazy fast and offers MPA (multiple page application) routing.
At the moment of writing there was no full-fledged clientside router that offered SPA (single page application) routing.
Great news for me, because being the nerd that I am I decided to dive deeper and write my own SPA router for [Qwik](https://qwik.builder.io/). It has been an interesting journey
and it made me appreciate [Qwik](https://qwik.builder.io/) even better and helped me think [Qwik](https://qwik.builder.io/).

Now, before I continue, let's allign on the differences between MPA-routing and SPA-routing. 
In short: with MPA-routing the page does a full page refresh and with
SPA-routing we use the `history` property of the `window` object to manage the routing state. So for SPA routing the page does not refresh completely and the goal
of that type of routing is to only refresh parts of the page. Looking back at older technologies SPA routing was way faster but with Qwik city
the difference in performance compared to SPA routing might be trivial.

### Now why am I writing this?

Well because... it's a cool exercise... I learned a lot, I hit walls I didn't expect and it helped me understand certain pain points I experienced with routers in other frameworks.
Well that's not enough, right? No, that is not my only driving factor for demystifying SPA-routing in [Qwik](https://qwik.builder.io/).
I believe SPA routers do have quite a few benefits. I believe in Qwik and I wanted to see it work with SPA-routing.

#### State

One of the advantages of a SPA-router is that we don't loose application state... 
Since the instance of your application is only created once and kept alive we can keep the state alive in our application.
You can not only share state between components, but also between pages. 
Some users like their sidebar collapsed, others don't. But it's kind of annoying when we collapse a sidebar, and we navigate to another page
that the sidebar jumps open again because state is not shared.

#### The power of routing state

I'm a big fan of putting state in routes. Not all state belongs there but keeping state in routes gives us some benefits:

- We can bookmark a page without losing that state
- We can copy/paste routes and share them with other people without losing that state
- It's free to manage, no complex frameworks, no complexity regarding state invalidation etc
- We can use the browser navigation buttons to go back to previous states

#### Usability 

Having pages refresh on every route change can cause a certain discomfort when it comes to usability of our application.

- Scroll positions being forgotten. The application scrolls back to the top on refresh
- Cursor position being forgotten.
- Selected text getting unselected
- A video call that is being held or even a movie we are watching would be closed on refresh
- Background sound being interrupted
- Realtime connections being closed and reopend
- Open dialogs, snackbars, banners and success messages are hard to show/keep alive on full refresh
  Eg: Sending the contents of a form in page A, and navigating to page B on success. How and when would you show a success message?

#### Performance

- We only want to load stuff we need, that's the entire idea behind [Qwik](https://qwik.builder.io/), does it makes sense to reload the same DOM when we already have it?
- Does it make sense to re-render it?
- With [Qwik](https://qwik.builder.io/) we have lazy loading right out of the box! It just works and it works awesome! Why would we not use it for routing too?

#### Architecture

A router outlet is basically a component that will render a page in some kind of placeholder. The DOM of the entire page stays the same but
what's inside of that router-outlet gets updated. Router outlets can be quite powerful. Especially if you can nest them like we can with the Angular router.
The routing system I wrote does not support multiple nested router outlets (yet) but when we have multiple router outlets we can use that to 
optimise our architecture. We could attach a dialog to a route so we can close that dialog by clicking the native browser its previous button.
We don't have to keep state of that dialog, we just use the router outlet to render a component and destroy it when it needs to be destroyed.

#### Eventing

When we have SPA routing it is nice that we can get notified when something in the url changes.
Let's pretend we are in a user management page with search functionality and we want to make the search bookmarkable. 
In that case when the user types 'Brecht' we want the url to change to `my-website/users/search?q=Brecht` so we can bookmark it.
We don't want to refresh the entire page every time the user types a character right (that would result in cursor issues with the search input)?
We want to get notified when that specific `q` parameter changes. When that parameter changes we perform an XHR call and on success we rerender part of the page
with the results we have just retrieved. You know what's even more awesome? When we do refresh the page we get the exact same result but rendered on
the server because that's how awesome Qwik is.

## Writing an SPA-router for Qwik

This version of the router is very early stage and it could use some polishing, but the principles are there.

### The config

This is where it all starts, we need to create a config file that maps paths to components. A path could contain params.
And just like angular and nestjs we can use the `:` syntax.
```typescript
// routing/routing-types.ts
export type RoutingConfigItem = {
    component: any;
    path: string;
}
export type RoutingConfig = RoutingConfigItem[];
```
```typescript
// routing-config.tsx
export const routingConfig:RoutingConfig = [
    {
        path: '',
        component: <Home/>
    },
    {
        path: 'users',
        component: <Users/>
    },
    {
        path: 'users/:id',
        component: <UserDetail/>
    }
  
]

```

### The state

Qwik provides us with a state mechanism. We want to project the state in the url inside Qwik state.
First we need access to the url on the server. We need to pass the url to the `render` function.
Then we need to pass it to the `<Root/>` component which passes it along to the `<App/>` component.
That `<App/>` component will initialize the router with that url.
```typescript
// entry.dev.tsx
...
render(document, <Root url={''}/>);
```
```typescript
// entry.ssr.tsx
export function render(opts: RenderOptions) {
  return renderToString(<Root url={opts.url as string || ''} />, {
    manifest,
    ...opts,
  });
}

```
```typescript
// root.tsx
export default (opts: { url:  | string }) => {
  return (
    <html>
      ...
      <body>
        <App url={opts.url}/>
      </body>
    </html>
  );
};
```

So what we just did here is make sure that the `<App/>` component gets the url passed to it in all cases. That's all!
Now let's set up the state.
```typescript
// routing/routing-state.ts
import {createContext} from '@builder.io/qwik';

export interface RoutingState {
    // we don't want to store new Url() because it is not serializable    
    url: string; 
    segments: string[];
}

export const ROUTING = createContext<RoutingState>('Routing');

```
```typescript
// routing/routing.ts
import {ROUTING, RoutingState} from './routing-state';
import {useContextProvider, useStore} from '@builder.io/qwik';

// this one will be called by the <App/> component and initialize 
// the state once for the entire lifecycle of the application
export function initializeRouter(url: string): RoutingState {
    // create a store and state
    const routingState = useStore<RoutingState>(
        getRoutingStateByPath(url)
    );

    useContextProvider(ROUTING, routingState);
    return routingState;
}

// this will retrieve the routingstate by the path (the current url)
export function getRoutingStateByPath(path: string): RoutingState {
    const url = new URL(path);
    const segments = url.pathname?.split('/');
    segments.splice(0, 1);
    return {
        url: path,
        segments: segments
    }
}
```

The first part of the state is done, we just have to initialize the router in the `<App/>` component.

```typescript
// containers/app/app.tsx
export const App = component$((opts: { url: string | undefined }) => {
    const routingState = initializeRouter(opts.url);
    ...
});
```

All good now we want to actually set the router state when the route changes. There are 2 scenarios:
- The user clicks on a link and wants to navigate: `navigateTo()`
- The browser navigation buttons are being used: `listenToRouteChanges()`

This is functionality we only want to run in the browser, not on the server
```typescript
// routing/routing.ts
import {isServer} from '@builder.io/qwik/build';

// safely get the window object
export function getWindow(): Window | undefined {
    if (!isServer) {
        return document?.defaultView?.window
    }
    return undefined;
}

export function navigateTo(path: string, routingState: RoutingState): void {
    if (!isServer) {
        // we don't actually navigate, we just push a new state to
        // the history object
        getWindow()?.history?.pushState({page: path}, path, path);
        setRoutingState(routingState, path);
    }
}

export function listenToRouteChanges(routingState: RoutingState): void {
    if (!isServer) {
        // when the navigation buttons are being used
        // we want to set the routing state
        getWindow()?.addEventListener('popstate', (e) => {
            const path = e.state.page;
            setRoutingState(routingState, path);
        })
    }
}

export function setRoutingState(routingState: RoutingState, path: string): void {
    const oldUrl = new URL(routingState.url);
    const newUrl = new URL(oldUrl.origin + path);
    const {segments, url} = getRoutingStateByPath(newUrl.toString())
    routingState.segments = segments;
    routingState.url = url;
}

...
```

### The router outlet

We have a configuration object, we provided router state, we can get router state and we can listen to changes that will automatically set the router state.
Besides that we also have a `navigateTo` function that will not reload but update the `history` object.
Now we want to render the right components inside a router outlet.

Our app component looks like this:
```typescript
// containers/app/app.tsx
export const App = component$((opts: { url: string | undefined }) => {
    const routingState = initializeRouter(opts.url);
    return (
        <section>
            ... here comes the menu
            <RouterOutlet/>
        </section>
    );
});
```

Now let's create our `<RouterOutlet/>` component. We have the segments of the url and the routing config that we can map to a component.

```typescript
// routing/router-outlet.tsx
import {component$, useContext} from '@builder.io/qwik';
import {ROUTING} from './routing-state';
import {getMatchingConfig,} from './routing';
import {routingConfig} from '../routing-config';

export const RouterOutlet = component$(
    () => {
        const routing = useContext(ROUTING);
        // render the correct component
        return getMatchingConfig(routing.segments, routingConfig)?.component
    }
);
```

The `getMatchingConfig()` function will do the translation of the segments and config towards the actual component that we want to render.
This requires some logic so that it matches not only the right component, but it also takes the params into account.
Remember this piece of config?
```typescript
{
    path: 'users/:id',
    component: <UserDetail/>
}
```
Let's not dive to deeply in the following code, let's just know that it does the translation for us:

```typescript
// routing/routing.ts
...
// go over all the RoutingConfigItem objects and if they match return the config
// so we know which compnent to render
export function getMatchingConfig(segments: string[], config: RoutingConfig): RoutingConfigItem {
    for (let i = 0; i < routingConfig.length; i++) {
        if (segmentsMatch(segments, config[i])) {
            return config[i];
        }
    }
    return null;
}

export function segmentsMatch(pathSegments: string[], configItem: RoutingConfigItem): boolean {
    const configItemSegments = configItem.path.split('/');
    if (configItemSegments.length !== pathSegments.length) {
        return false;
    }
    const matches = pathSegments.filter((segment, index) => {
        return segment === configItemSegments[index] || configItemSegments[index].indexOf(':') === 0
    });
    return matches.length === pathSegments.length;
}
```

Now the application should work, it should render the right component on the right url but we are still not there yet.
Remember this `listenToRouteChanges()` function? We still need to call it. We can call that in the `<RouterOutlet/>` component
but we have to make sure we only run it on the client. The window object does not exist on the server.
For that [Qwik](https://qwik.builder.io/) provides us with the `useClientEffect$` function. The router outlet now looks like this.

```typescript
import {component$, useClientEffect$, useContext} from '@builder.io/qwik';
import {ROUTING} from './routing-state';
import {getMatchingConfig, listenToRouteChanges} from './routing';
import {routingConfig} from '../routing-config';

export const RouterOutlet = component$(
    () => {
        const routing = useContext(ROUTING);
        useClientEffect$(() => {
            listenToRouteChanges(routing);
        });
        return getMatchingConfig(routing.segments, routingConfig)?.component
    }
);

```

### The link component

Using the traditional anchor tag `<a>` will do a complete page refresh and that is not what we want. 
We want to use the `navigateTo()` function we have just written. Let's create a `<Link/>` component
that creates an anchor tag, prevents the default functionality and calls the `navigateTo()` function when the user
clicks. We use the `preventdefault:click` syntax to make sure that the actual navigation is being blocked but we still need
to set the `href` property otherwise this is bad for SEO.
Then within the `<a>` tag we use a `<Slot/>` to do content projection.
The `navigateTo()` requires the routingState, so we use the `useContext` that [Qwik](https://qwik.builder.io/) provides us to retrieve that state.

```typescript
// routing/link.tsx
import {component$, Slot, useContext} from '@builder.io/qwik';
import {navigateTo} from './routing';
import {RoutingState} from './routing-state';

export const Link = component$((opts: { path: string, routingState: RoutingState }) => {
    const routingState = useContext(ROUTING);
    const {path} = opts;
    return (
        <a
            // This will prevent the default behavior of the "click" event.
            preventdefault:click 
            href={path} onClick$={(e) => {
            navigateTo(path, routingState)
        }}><Slot/></a>
    );
});

```

The tsx of the app component now looks like this:
```tsx
<section>
    <ul>
        <li>
            <Link path={'/'}>Home</Link>
        </li>
        <li>
            <Link path={'/users'} >users</Link>
        </li>
        <li>
            <Link path={'/users/1'}>Brecht</Link>
        </li>
    </ul>
    <RouterOutlet/>
</section>
```

We have successfully set up clientside SPA routing with parameter support without too much effort.
There are 2 last things missing and that is functionality to get the params and the searchparams.

In the config we have `{path: 'users/:id'}` and in the url we have `users/1` so we want to be able to do 
something like `getParams(routingState).id` and we should retrieve the string `1`.

So in `routing/routing.ts` we add 2 additional functions:
```typescript
// routing/routing.tsx
export function getParams(routingState: RoutingState): { [key: string]: string } {
    const matchingConfig = getMatchingConfig(routingState.segments, routingConfig);
    const params = matchingConfig.path.split('/')
        .map((segment: string, index: number) => {
            if (segment.indexOf(':') === 0) {
                return {
                    index,
                    paramName: segment.replace(':', '')
                }
            } else {
                return undefined
            }
        })
        .filter(v => !!v);
    const returnObj: { [key: string]: string } = {};
    params.forEach(param => {
        returnObj[param.paramName] = routingState.segments[param.index]
    })
    return returnObj;
}

export function getSearchParams(routingState: RoutingState): URLSearchParams {
    return new URL(routingState.url).searchParams;
}
```

## Wrapping up

That's it we have a complete clientside SPA router with very limited code that works with lazy loading because
[Qwik](https://qwik.builder.io/) provides that out of the box. It was a very pleasant journey for me and I sure learned a lot.
I hope you found it interesting as well!
You can find the source code of this demo here:

Special thanks to the reviewers:
- x
- y
- z
