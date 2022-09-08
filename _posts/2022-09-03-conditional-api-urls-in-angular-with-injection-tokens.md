---
layout: post
title: Conditional api urls in Angular with injection tokens
description:  
published: true
author: brechtbilliet
comments: true
date: 2022-09-08
subclass: 'post'
disqus: true
---

## Using env.js files
When we deploy our Angular application, chances are big that we will let our data-access layer connect to another api url than the one
we connect to in development. This means that this api url should be configurable at some point.
There are multiple ways of working with environment variables in Angular code-bases.
I like to choose for a simple `env.js` file that can easily be replaced by the continuous integration ([read this article](https://www.jvandemo.com/how-to-use-environment-variables-to-configure-your-angular-application-without-a-rebuild/)).
This way the `env.js` file is never really part of the build and can be replaced at all times.
This file could look like this:

```javascript
// app-name/src/env.js
(function (window) {
  window.__env = {};
  window.__env.apiUrl = 'http://localhost:1234/api';
})(this);
```

As we can see above we use an immediately invoked function expression (iife) where we just set these environment variables
directly on the window object. This approach would not work for server-side rendered applications but that's beyond the goal of this article.

### How do we achieve a working solution?

What we need to do in the `angular.json` file is to add this `env.js` file to the `options.assets` array of the `build` target, so it will be available after
compilation time. We also need to import it into the `index.html` of our application.

```html
  <head>
    <!-- Load environment variables -->
    <script src="env.js"></script>
  </head>
  ...
```

What we did so far is we made sure the variable `apiUrl` will be available in the `__env` property of the `window` object which is available everywhere in the frontend.
Calling the window directly in Angular is seen as a **bad practice** and calling `window['__env'].apiUrl` everywhere is even worse.

To consume the `apiUrl` in our Angular application in a proper way, we need to create an `InjectionToken` that we can use for dependency injection.
Let's go ahead and create an `injection-tokens.ts` file that exposes the `API_URL` token.

````typescript
// app-name/src/injection-tokens.ts
import { InjectionToken } from "@angular/core";

export const API_URL = new InjectionToken<string>('API_URL');
````

We have our environment variables living on our `window` object and we have an injection token that we will use to inject that in any constructor.
The last thing that we need to do tell Angular that injecting the `API_URL` token into a constructor should retrieve the `apiUrl` living on the `__env` property of the
`window` object. To do that we have to add some logic to the `providers` property of the `@NgModule()` decorator of our `AppModule`.
We provide the `API_URL` in dthe provide property, we use a factory where `Document` is injected and we use `document.defaultView` which refers to the `window` object
to retrieve the `apiUrl` living in the `__env` property. Since we inject `Document` we need to add `DOCUMENT` to the deps property for it to become available.

```typescript
@NgModule({
  ...
  providers: [
    {
      provide: API_URL,
      useFactory: (document: Document) => {
        return document.defaultView['__env'].apiUrl;
      },
      deps: [DOCUMENT],
    },
  ]
})
export class AppModule {}
```

This is great! Now in our services we can just inject the `API_URL` with the `@Inject()` decorator, and our service knows exactly where to send its XHR calls to.

```typescript
import { Injectable, Inject } from '@angular/core';
import { CONDITIONAL_API_URL } from './injection-tokens';
@Injectable({providedIn:'root'})
export class FooService {
  constructor(@Inject(API_URL) private readonly apiUrl) {
  }
  ...
}
```

## Extra problem

The essence of this article is not to explain environment variables nor InjectionTokens. Let's dive a bit deeper than that.

A short while ago a client of mine had this specific use-case:
They had an entire application that was already running in production.
When their product grew they realised that there was a use-case where they wanted that exact application (the exact same logic) but they needed it to connect to another `apiUrl`.

The first thing that would come to mind, is to change the value of `apiUrl` in our `env.js` but the thing was they also needed the previous
flow to keep on working. They actually needed two flows of the same application that both had their own endpoint. Flow one needed to consume the old `apiUrl` and flow two needed to consume
the other `apiUrl`.

### Let's try to implement this:

Since we don't want to touch the current routing flow we will pass a QueryParam called `secondary=true` to the url of our application. If that QueryParam exists we don't want to consume
`window['__env'].apiUrl` but `window['__env'].secondaryApiUrl` and if it doesn't exist we want to use `window['__env'].apiUrl`.
 
Let's add the `secondaryApiUrl` to the `env.js` file and update the `injection-tokens.ts` and `app.module.ts` accordingly.

```javascript
// app-name/src/env.js
(function (window) {
  window.__env = {};
  window.__env.apiUrl = 'http://localhost:1234/api';
  window.__env.secondaryApiUrl = 'http://localhost:4321/api';
})(this);
``` 

```typescript
// app-name/src/injection-tokens.ts
import { InjectionToken } from "@angular/core";

export const API_URL = new InjectionToken<string>('API_URL');
export const SECONDARY_API_URL = new InjectionToken<string>('SECONDARY_API_URL');
````

```typescript
// app-name/src/app.module.ts
@NgModule({
  ...
  providers: [
    {
      provide: API_URL,
      useFactory: (document: Document) => {
        return document.defaultView['__env'].apiUrl;
      },
      deps: [DOCUMENT],
    },
    {
      provide: SECONDARY_API_URL,
      useFactory: (document: Document) => {
        return document.defaultView['__env'].secondaryApiUrl;
      },
      deps: [DOCUMENT],
    },
  ]
})
export class AppModule {}
```

### How will we decide which apiUrl to take?

In our `FooService` we could inject both the `API_URL` and the `SECONDARY_API_URL` together with the `ActivatedRoute` but
that seems like a lot of redundant code to implement in every service.

```typescript
@Injectable({providedIn:'root'})
export class FooService {
  constructor(
    private readonly activatedRoute: ActivatedRoute,
    @Inject(API_URL) private readonly apiUrl,
    @Inject(SECONDARY_API_URL) private readonly secondaryApiUrl,

    ){
      const conditionalApiUrl = activatedRoute.snapshot.queryParams.secondary
      ? secondaryApiUrl
      : apiUrl;
  }
}
```

The following code would be way nicer and that's what we will implement in a minute:

```typescript
import { Injectable, Inject } from '@angular/core';
import { CONDITIONAL_API_URL } from './injection-tokens';

@Injectable({providedIn:'root'})
export class FooService {

 constructor(@Inject(CONDITIONAL_API_URL) private readonly apiUrl) {
   // console.log(apiUrl);
  }
}
```

For this to work we need to create a new InjectionToken called `CONDITIONAL_API_URL` that will determine
which api url to choose. `CONDITIONAL_API_URL` is just a token that will use the `inject` function of Angular to inject
our 3 dependencies and will decide which api url to use based on the existence of the `secondary` QueryParam.

```typescript
import { inject, InjectionToken } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

export const API_URL = new InjectionToken<string>('API_URL');
export const SECONDARY_API_URL = new InjectionToken<string>(
  'SECONDARY_API_URL'
);
export const CONDITIONAL_API_URL = new InjectionToken('CONDITIONAL_API_URL', {
  factory() {
    const activatedRoute = inject(ActivatedRoute);
    const apiUrl = inject(API_URL);
    const secondaryApiUrl = inject(SECONDARY_API_URL);
    return activatedRoute.snapshot.queryParams.secondary
      ? secondaryApiUrl
      : apiUrl;
  },
});
```

There is no need to provide `CONDITIONAL_API_URL`, we can just inject it in the `FooService` as we just shown.
Every time the application is loaded with the `secondary` queryParam in the url it will use the `SECONDARY_API_URL`.
Otherwise it will use the `API_URL`;

## Conclusion

InjectionTokens are a powerful thing and combining them with the `inject()` function of Angular (service locator pattern)
we can combine tokens and put functionality in them. For more information on the `inject()` function of Angular, take a
look at [this article](https://kevinkreuzer.medium.com/angular-inject-33c6ce8cfd07).

[Here](https://stackblitz.com/edit/angular-ivy-byqm8u) is a stackblitz example where we can find the source code.
**Note:** external javascript files in those stackblitz projects are not possible at the time of writing this.
That's why we have added the contents of the `env.js` file directly into the `index.html`.



### Thanks for the reviewers

- [Webdave](https://twitter.com/webdave_de)
- [Jurgen Van de Moere](https://twitter.com/jvandemo)

Thanks, [Wim Holvoet](https://twitter.com/wim_holvoet) for the idea of using injection tokens.
