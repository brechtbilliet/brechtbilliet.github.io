---
layout: post
title: Why and how I created a SPA router for Qwik
description:  
published: true
author: brechtbilliet
comments: true
date: 2022-08-03
subclass: 'post'
disqus: true
---

## The why

The people from [builder.io](https://builder.io) have done an awesome job writing [Qwik](https://qwik.builder.io/), and their arsenal of other great tools.
I started playing with Qwik some time ago and decided to rewrite my website [brecht.io](https://brecht.io) in it. 
(I'm also planning to use Qwik in more complex apps, but I wanted to see my website in production first.)
When I started reworking my website, there wasn't a tool that took care of in-page SPA (single page application) routing &mdash; or at least not how I'm used to it from other client-side technologies.
I'm used to working with SPA routing in [AngularJS](https://angularjs.org/), [Angular](https://angular.io), and [React](https://reactjs.org/), so I wanted to explore their routing principles in Qwik applications.

There is this thing, called Qwik-city, which is crazy fast and offers MPA (multiple page application) routing.
At the time of writing, Qwik had no full-fledged client-side router that offered SPA routing.
Great news for me, the nerd that I am, so I decided to dive deeper and write a custom SPA router for Qwik. It has been an interesting journey
that made me appreciate Qwik even better and helped me "think in" Qwik. 

Now, before I continue, let's align on the differences between MPA-routing and SPA-routing. 
In short: In MPA-routing, the page does a full page refresh on every navigation.
SPA-routing uses the `history` property of the `window` object to manage routing state. So for SPA-routing, the page does not refresh completely and the goal
is to only re-render parts of the page. When we look back at older technologies, SPA-routing used to be way faster, but with Qwik-city
the difference in performance might be trivial.

### Now why am I writing this?

Well, because... it's a cool exercise... I learned a lot, I hit walls I didn't expect to hit, and it helped me understand pain points I experienced with routers in other frameworks.
But that's not enough, right? No, that is not my only driving factor for demystifying SPA-routing in Qwik.
I believe SPA routers do have quite a few benefits. I believe in Qwik, and I think it would be even more awesome to see it work with SPA-routing.

#### State

One of the advantages of a SPA-router is that we don't lose application state... 
Since the instance of our application is only created once and kept alive, we can keep the state alive in our application.
We can not only share state between components, but also between pages. 
Some users like their sidebar collapsed, others don't. It's kind of annoying when you collapse a sidebar, then navigate to another page
where the sidebar jumps open again because state is not shared.

#### The power of routing state

I'm a big fan of putting state (params and searchParams) in routes. Not all state belongs there, but keeping state in routes gives us some benefits:

- We can bookmark a page without losing that state.
- We can copy/paste URLs to share them with other people without losing that state that is kept in that route.
- It's free to manage, no need for complex frameworks, no complexity regarding state invalidation, etc. <!-- This may be true at first, but the Navigation History proposal summarizes some cases where it stops being true: https://github.com/WICG/navigation-api/blob/main/README.md#summary -->
- We can use the browser navigation buttons to go back to previous and next states.

Do note: When using MPA-routing we can also put the state in the url, but the more state that would change in the url, the more page refreshes we would have
which would result in less usability.
 
#### Usability 

Having pages refresh on every route change can cause certain discomforts to the usability of our application.

- Cursor position being forgotten on refresh.
- Selected text getting unselected on refresh.
- A video call that is being held or even a movie we are watching would be closed on refresh
- Background sound being interrupted on refresh.
- Open dialogs, snackbars, banners and success messages are hard to show/keep alive on full refresh. 
  Eg: Sending the contents of a form in page A, and navigating to page B on success. How and when would you show a success message? 
  MPA frameworks often call this “flash” messaging, but it's easier to manage in a SPA.

#### Performance

- We only want to load stuff we need, that's the entire idea behind Qwik. Does it makes sense to reload the same DOM when we already have it?
- Does it make sense to re-render part of the DOM that is already rendered? E.g the menu.
- Qwik has lazy-loading right out of the box! It just works and it works awesome! Why not use it for routing, too?

#### Architecture

A router outlet is basically a component that will render a page in some kind of placeholder: the DOM of the entire page stays the same, but
what's inside the router outlet gets updated. Router outlets can be quite powerful, especially if you can nest them like we can with the Angular router.
The routing system I wrote does not support multiple nested router outlets yet, but when we have multiple router outlets we can use them to 
optimise our architecture. We could attach a dialog to a route so we can close that dialog by clicking the native browser Back button.
We don't have to keep state of that dialog, we just use the router outlet to render a component and destroy it when it needs to be destroyed.

#### Eventing

When we have SPA-routing, it's nice to be notified when something in the URL changes.
Let's pretend we are in a user management page with search functionality, and we want to make the search query bookmarkable. 
In that case when the user types 'Brecht' we want the URL to change to `/users/search?q=Brecht` so we can bookmark it.
We don't want to refresh the entire page every time the user types a character, right? That would result in cursor issues with the search input. Think about debouncing as well...
We want to get notified when that specific `q` parameter changes. When it does, we perform an XHR call, and on success we rerender part of the page
with the results. You know what's even more awesome? If we do have a full refresh of the page, we get the exact same result rendered on
the server, because that's how awesome Qwik is.

## Writing a SPA-router for Qwik

This version of the router is very early stage and could use polishing, but the principles are there. So let's go through the code together.

### The config

This is where it all starts, we need to create a config file that maps paths to components. A path can contain params.
Like Angular and Nest, we can use the `:` syntax to define params.
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
The base path `/` will resolve in the home page, the `users` path to the `<Users/>` component, and the `users/:id` to the `<UserDetail/>` component.

### The state

Qwik provides us with a state mechanism. We want to reflect the state in the URL to Qwik's state.
First we need to access the URL on the server, then pass it to the `render` function.
Then we need to pass it to the `<Root/>` component, which passes it along to the `<App/>` component.
That `<App/>` component will initialize the router with the URL.
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
export default (opts: { url: string }) => { 
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

So, what we just did here is ensure that the `<App/>` component gets the URL passed to it in all cases. That's all!
Now let's set up the state.
```typescript
// routing/routing-state.ts
import {createContext} from '@builder.io/qwik';

export interface RoutingState {
    // we don't want to store `new URL()` because it is not serializable    
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
    const segments = url.pathname.split('/');
    segments.splice(0, 1); // remove empty segment 
    return {
        url: path,
        segments
    }
}
```

The first part of the state is done, we just have to initialize the router in the `<App/>` component.

```typescript
// containers/app/app.tsx
export const App = component$((opts: { url: string | undefined }) => {
    initializeRouter(opts.url);
    ...
});
```

All good! Now we want to actually set the router state when the route changes. There are 2 scenarios:
- The user clicks on a link and wants to navigate towards a page in our app: `navigateTo()`
- The browser navigation buttons are being used, and we want to listen to those events: `listenToRouteChanges()`

This is functionality we only want to run in the browser, not on the server.
We use `isServer` here, but we could also use `isBrowser`.

```typescript
// routing/routing.ts
import {isServer} from '@builder.io/qwik/build';

// safely get the window object
export function getWindow(): Window | undefined {
    if (!isServer) {
       return typeof window === 'object' ? window : undefined
    }
    return undefined;
}

export function navigateTo(path: string, routingState: RoutingState): void {
    if (!isServer) {
        // we don't actually navigate, but push a new state to
        // the history object
        getWindow()?.history?.pushState({page: path}, path, path);
        setRoutingState(path, routingState);
    }
}

export function listenToRouteChanges(routingState: RoutingState): void {
    if (!isServer) {
        // when the navigation buttons are being used
        // we want to set the routing state
        getWindow()?.addEventListener('popstate', (e) => {
            const path = e.state.page;
            setRoutingState(path, routingState);
        })
    }
}

export function setRoutingState(path: string, routingState: RoutingState): void {
    const oldUrl = new URL(routingState.url);
    const newUrl = new URL(path, oldUrl);
    const {segments, url} = getRoutingStateByPath(newUrl.toString())
    routingState.segments = segments;
    routingState.url = url;
}
```

### The router outlet

We have a configuration object, we provided router state, we can get that router state, and we can listen to changes that will automatically set the router state.
Besides that we also have a `navigateTo()` function that will update the `history` object instead of reloading the page.
Now we want to render the right components for the right path inside a router outlet.

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

Now let's create our `<RouterOutlet/>` component. We have the segments of the URL, and the routing config that we can map to a component.

```typescript
// routing/router-outlet.tsx
import {component$, useContext} from '@builder.io/qwik';
import {ROUTING} from './routing-state';
import {getMatchingConfig,} from './routing';
import {routingConfig} from '../routing-config';

export const RouterOutlet = component$(
    () => {
        const routingState = useContext(ROUTING);
        // render the correct component
        return getMatchingConfig(routingState.segments, routingConfig)?.component
    }
);
```

The `getMatchingConfig()` function will translate the segments and config into the actual component that we want to render.
This requires some logic so that it matches not only the right component, but also takes the params into account.
Remember this piece of config?
```typescript
{
    path: 'users/:id',
    component: <UserDetail/>
}
```
Let's not dive too deeply into the following code, just know that it does the translation for us:

```typescript
// routing/routing.ts
...
// go over all the RoutingConfigItem objects and if they match return the config
// so we know which compnent to render
export function getMatchingConfig(segments: string[], config: RoutingConfig): RoutingConfigItem {
    const found = config.find(item => segmentsMatch(segments, item))
    if (found) {
        return found;
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

Now the application should work. It should render the right component on the right URL, but we are still not there yet.
Remember the `listenToRouteChanges()` function? We still need to call it. We can call that in the `<RouterOutlet/>` component,
but we have to make sure we only run it on the client: the `window` object does not exist on the server.
For that, Qwik provides us with the `useClientEffect$` function. The router outlet now looks like this.

```typescript
import {component$, useClientEffect$, useContext} from '@builder.io/qwik';
import {ROUTING} from './routing-state';
import {getMatchingConfig, listenToRouteChanges} from './routing';
import {routingConfig} from '../routing-config';

export const RouterOutlet = component$(
    () => {
        const routingState = useContext(ROUTING);
        useClientEffect$(() => {
            listenToRouteChanges(routingState);
        });
        return getMatchingConfig(routingState.segments, routingConfig)?.component
    }
);

```

### The link component

The traditional anchor tag `<a>` will completely refresh the page, which is not what we want. 
Instead, we want the `navigateTo()` function we wrote. Let's create a `<Link/>` component
that renders an anchor tag, but prevents the default functionality and calls the `navigateTo()` function when the user
clicks. We use the `preventdefault:click` syntax to make sure that the actual navigation is blocked, but we still need
a `href` property for good SEO.
Then, within the `<a>` tag we use a `<Slot/>` for content projection.
The `navigateTo()` requires the `routingState`, so we import `useContext` from Qwik to retrieve that state.

```typescript
// routing/link.tsx
import {component$, Slot, useContext} from '@builder.io/qwik';
import {navigateTo} from './routing';

export const Link = component$((opts: { path: string }) => {
    const routingState = useContext(ROUTING);
    const {path} = opts;
    // check whether the link should be active or not
    const isActive = `/${routingState.segments.join('/')}` === path;
    return (
        <a
            // This will prevent the default behavior of the "click" event.
            preventdefault:click 
            // set the correct class when the link is active
            className={isActive ? 'link--active' : ''}
            href={path} onClick$={(e) => {
            navigateTo(path, routingState)
        }}><Slot/></a>
    );
});

```

The `.tsx` of the app component now looks like this:
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

We have successfully set up client-side SPA routing with parameter support without too much effort.
There are 2 last things missing: functionality to get path params and search params.

In the config we have `{path: 'users/:id'}`, and in the URL we have `users/1`, so we want
something like `getParams(routingState).id` that returns the string `"1"`.

In `routing/routing.ts` we add 2 more functions:
```typescript
// routing/routing.tsx
export function getParams(routingState: RoutingState): { [key: string]: string } {
    const matchingConfig = getMatchingConfig(routingState.segments, routingConfig);
    const params = matchingConfig.path.split('/')
        .map((segment: string, index: number) => {
            if (segment.startsWith(':')) {
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


## Conclusion

That's it!! We have a complete client-side SPA router without much code, that works with lazy loading thanks to
Qwik providing it out of the box. It was a very pleasant journey for me and I sure learned a lot.
Chances are my upcoming posts will be Qwik-related.

- I learned that we have to block the traditional routing by creating a custom `Link` component that also pushes a new state to the 
history object
- I realized we couldn't store the URL prototype into the state because it is not serializable and having the string is enough.
- I thought it was going to be hard to map a component to a route but that turned out to be quite easy and straightforward.
- Routers shouldn't be that complex. We achieved a lot with a small amount of code
- `useClientEffect$` is handy when you only want to execute something on the client.
- I thought it was going to be easy to work with nested router outlets but I believe there is a bigger complexity there,
but I will definitely check that out in the future

You can also [check out the source code of this demo](https://github.com/brechtbilliet/qwik-spa-routing-demo/tree/main/spa-routing).
I hope you found it interesting as well!


Special thanks to the reviewers:
- [Miško Hevery](https://twitter.com/mhevery)
- [Taylor Hunt](https://twitter.com/tigt_)
- [Antoine Pairet](https://twitter.com/antoinepairet)
