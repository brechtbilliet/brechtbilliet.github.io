---
layout: post
title: Simple Angular dialogs with the Angular CDK
description:  
published: true
author: brechtbilliet
comments: true
date: 2022-09-19
subclass: 'post'
disqus: true
---

## The goal of this **article**

In the article [Angular routed dialogs](https://blog.brecht.io/routed-angular-dialogs/) I wrote a while ago, the benefits of having dialogs behind routes are explained.
We can consider dialogs as pages just like we would consider other components that are connected
to routes as pages. In the previous article, we see different approaches to handling dialogs and focus on the benefits of putting dialogs behind routes.

### Some context

We will continue from the context of the [Angular routed dialogs](https://blog.brecht.io/routed-angular-dialogs/) article. We have a `UsersComponent` that will display a list of users and a `UsersDetailComponent` that will display
the details of that use. When clicking in the list of users on a specific user, we want to open its details. The `UsersDetailComponent` uses our custom component called `MyDialogComponent` to render the details of a specific user in a nice dialog. We use the same setup as the [Angular routed dialogs](https://blog.brecht.io/routed-angular-dialogs/) article so if you didn't read that one yet, you might want to read that first before reading further.

In this article, we will focus on how we can tackle real dialog functionality with the Angular CDK.

## Why the Angular CDK?

The Angular CDK library focuses on "behavior(s)" that web application needs. This library includes accessibility, Coercion, Drag and Drop etc. And a other advantage is that is maintained by the Angular Material team.

The CDK provides us with 2 things that we can use for creating modals:



1. The [**portal**](https://material.angular.io/cdk/portal/overview): a piece of UI that can be dynamically rendered to an open slot on the page.
2. The [**overlay**](https://material.angular.io/cdk/overlay/overview): to create dialog behavior. It supports position strategies and backdrop behavior and provides some additional basic functionalities to leverage our modal.
Most importantly, it will render a div with a class `cdk-overlay-container` at the bottom of the `body` element where the dialog
will be rendered in. That way, an overlay is never clipped by an `overflow: hidden` parent. 

## Getting started

First of all we need to install the `@angular/cdk` package by running:

```shell script
npm i @angular/cdk --save
```

We need the `portal` and `overlay` so let's import the `PortalModule` and the `OverlayModule` into our `AppModule`.
If we are using **standalone** components, we should import them in the `imports` property of our components.

The overlay needs some CDK prebuilt styles to render, e.g: the backdrop.
In our `styles.css` we can import that by adding:

```css
@import '@angular/cdk/overlay-prebuilt.css';
```


## Creating the dialog component

We already have a `my-dialog` component when we continue from the previous article.
We consume the dialog like this:

```html
<my-dialog>
    <ng-container my-dialog-header>Here is my header</ng-container>
    <ng-container my-dialog-body>Here is my body</ng-container>
</my-dialog>
```

Since everything will be rendered in an **overlay-container** we need to disable the encapsulation of the styles.
For that reason, we need to set the encapsulation to `ViewEncapsulation.None` (otherwise the css won't make it into the portal):

```typescript
@Component({
    selector: 'my-dialog',
    ...
    encapsulation: ViewEncapsulation.None
})
```

### The dialog component html

The html of the template looks like this:

```html
<ng-template cdkPortal>
    <div class="dialog">
        <div class="dialog__header">
            <ng-content select="[my-dialog-header]"></ng-content>
            <button (click)="closeDialog.emit()">Close</button>
        </div>
        <div class="dialog__body">
            <ng-content select="[my-dialog-body]"></ng-content>
        </div>
    </div>
</ng-template>
```

Everything is wrapped in an `ng-template` that uses the `cdkPortal` directive.
We will use `ViewChild` later to reference it in our component class.
For the rest, we see 2 `ng-content` slots that are used to project the header and the body.
A close button in the header will call the `closeDialog` output from our component class (telling its parent to destroy the component).

### The dialog component class

The first thing we need to do is create an `overLayRef`. We will use the `Overlay` from the CDK
to create that `overlayRef` by using its `create()` function. It takes an `overlayConfig` parameter to
configure its position, width, backdrop, etc.

```typescript
export class MyDialogComponent {
    private readonly overlayConfig = new OverlayConfig({
        // show backdrop
        hasBackdrop: true,
        // position the dialog in the center of the page
        positionStrategy: this.overlay.position().global().centerHorizontally().centerVertically(),
        // when in the dialog, block scrolling of the page      
        scrollStrategy: this.overlay.scrollStrategies.block(),
        minWidth: 500,
    });
    private overlayRef = this.overlay.create(this.overlayConfig);

    constructor(private readonly overlay: Overlay){
    }
}
```

The next thing we need to do is attach the portal to the `overlayRef` so we can leverage that portal
to render the contents of it inside the overlay. We have to do that
after the view is initialized, so we will need to handle this in the `ngAfterViewInit` lifecycle hook.
We will use `@ViewChild(CdkPortal)` to get a handle on the `portal` we have defined in our template:

```typescript
export class MyDialogComponent implements OnInit, AfterViewInit {
    // get a grasp on the ng-template with the cdkPortal directive
    @ViewChild(CdkPortal) public readonly portal: CdkPortal | undefined;

    private readonly overlayConfig = new OverlayConfig({...});
    private overlayRef = this.overlay.create(this.overlayConfig);
    constructor(private readonly overlay: Overlay){
    }
    
    public ngAfterViewInit(): void {
        // Wait until the view is initialized to attach the portal to the overlay
        this.overlayRef?.attach(this.portal);
    }
}
```

This is the only thing we need to do to make this work, but we have forgotten about the destruction of this component.
The component does not have any close functionality as it's not his responsibility.
The dialog will be closed/destroyed by an `*ngIf` or a route change.
However we do need to clean up the `overlayRef` by calling its `detach()` function and its `dispose()`
function. We will do that on the `ngOnDestroy` lifecycle hook:

```typescript

export class MyDialogComponent implements OnInit, AfterViewInit, OnDestroy {
    // Tell the parent to destroy the component
    @Output() public readonly closeDialog = new EventEmitter<void>();

    @ViewChild(CdkPortal) public readonly portal: CdkPortal | undefined;
    ...
    public ngOnDestroy(): void {
        // parent destroys this component, this component destroys the overlayRef
        this.overlayRef?.detach();
        this.overlayRef?.dispose();
    }
}
```

We see that we have added a `closeDialog` output that will be called from within the template
when the close button is clicked.

### Closing on backdrop click

By clicking the close button in the dialog we can tell our parent to destroy the `MyDialog` component.
However, we want to do the same when the user clicks on the backdrop.

It turns out that our `overlayRef` has a function called `backdropClick()` that will return an observable receiving
events when the user clicks on the backdrop. We could leverage that to close the dialog by emitting on the `closeDialog`
EventEmitter. In our constructor we can subscribe to that observable and emit when needed:

```typescript
constructor(...) {
    this.overlayRef?.backdropClick()
        .subscribe(() => {
            this.closeDialog.emit();
        });
}
```

### Conclusion

Below we see the entire implementation of the `MyDialog` component class:

```typescript
export class MyDialogComponent implements AfterViewInit {
    // get a grasp on the ng-template with the cdkPortal directive 
    @ViewChild(CdkPortal) public readonly portal: CdkPortal | undefined;
    // the parent is in charge of destroying this component (usually through ngIf or route change)
    @Output() public readonly closeDialog = new EventEmitter<void>();
    
    // the configuration of the overlay
    private readonly overlayConfig = new OverlayConfig({
        hasBackdrop: true,
        positionStrategy: this.overlay
            .position()
            .global()
            .centerHorizontally()
            .centerVertically(),
        scrollStrategy: this.overlay.scrollStrategies.block(),
        minWidth: 500,
    });
    // creating the overlayRef
    private overlayRef = this.overlay.create(this.overlayConfig);

    constructor(private readonly overlay: Overlay) {
        // telling the parent to destroy the dialog when the user
        // clicks on the backdrop
        this.overlayRef.backdropClick().subscribe(() => {
            this.closeDialog.emit();
        });
    }
    
    // attach the portal to the overlayRef when the view is initialized
    public ngAfterViewInit(): void {
        this.overlayRef?.attach(this.portal);
    }

    public ngOnDestroy(): void {
        // When the parent destroys this component, this component destroys the overlayRef
        this.overlayRef?.detach();
        this.overlayRef?.dispose();
    }
}

```

Thanks for reading this short article! I hope you liked it.

Here you can find the Stackblitz example:

<iframe href="https://stackblitz.com/edit/angular-ivy-ppdmmd" width="100%" height="500px"></iframe>


## Big thanks for the reviewers
- [Jeffrey Bosch](https://twiter.com/jefiozie)
- [Gerome Grignon](https://twitter.com/geromegrignon)
- [Ozcar](https://twitter.com/Ozcar80923785)
- [Robin Pellegrims](https://twitter.com/robinpel)
- [Nelson Gutiérrez](https://twitter.com/nel81212)

