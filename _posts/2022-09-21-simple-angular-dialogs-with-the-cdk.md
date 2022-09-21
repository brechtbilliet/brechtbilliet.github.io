---
layout: post
title: Simple Angular dialogs with the cdk
description:  
published: false
author: brechtbilliet
comments: true
date: 2022-09-19
subclass: 'post'
disqus: true
---

## The goal of this article

In the [Angular routed dialogs](https://blog.brecht.io/routed-angular-dialogs/) article, the benefits of having dialogs after routes are explained.
We can consider dialogs as pages just like we would consider other components that are connected
to routes as pages. In that Angular routed dialogs article we see different approaches of handling dialogs and we focus on the benefits of putting dialogs behind routes.

### Some context

We will continue from the context of the [Angular routed dialogs](https://blog.brecht.io/routed-angular-dialogs/) article.
We have a `UsersComponent` that will display a list of users, and a `UsersDetailComponent` that will display
the details of that user. The `UsersDetailComponent` wants to use our custom dialog called `MyDialogComponent` to render the 
details of a specific user in a dialog. We use the same setup as the [Angular routed dialogs](https://blog.brecht.io/routed-angular-dialogs/) article
so we might want to read that first.
This article focusses on the dialog, not on the application structure itself.
In this article we are going to see how we can tackle real dialog functionality with the Angular CDK.

## Why the Angular CDK?

This library provided by material is focussed on behavior.
It can provide us with 2 things that we can use for creating modals
- The **portal**: This is a piece of UI that can be dynamically rendered to an open slot on the page
- The **overlay**: This is something we can use to create dialog behavior: It supports position strategies, we can configure a backdrop, and
it has some basic functionality that we can use for our modal that we don't want to write ourselves. Most importantly, it will render the dialog as the last
node of the body element so that an overlay is never clipped by an overflow: hidden parent. Every thing will be rendered in a div with a class
`cdk-overlay-container`.

## Getting started

First of all we can install the package by running:

```shell script
npm i @angular/cdk --save
```

We need the `portal` and `overlay` so let's import the `PortalModule` and the `OverlayModule` in our `AppModule`.
If we are using **standalone** components we should import them in our components.
The overlay needs some cdk prebuilt styles to render eg: the backdrop do we will have to import that as well.
In our `styles.css` we can important by adding:

```css
@import '@angular/cdk/overlay-prebuilt.css';
```


## Creating the dialog component

We already have a `my-dialog` component when we start from the previous article. 
We consume the dialog like this:

```html
  <my-dialog>
    <ng-container my-dialog-header>Here is my header</ng-container>
    <ng-container my-dialog-body>Here is my body</ng-container>
  </my-dialog>
```

Since everything will be rendered in an **overview-container** it's hard to add styles to our dialog.
For that reason we need to us `encapsulation: ViewEncapsulation.None`:

```typescript
@Component({
  selector: 'my-dialog',
  ...
  encapsulation: ViewEncapsulation.None
})
```

