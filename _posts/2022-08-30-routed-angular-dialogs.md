---
layout: post
title: Routed Angular dialogs
description:  
published: false
author: brechtbilliet
comments: true
date: 2022-08-30
subclass: 'post'
disqus: true
---

This article should be a rather short one.
It's about how we can create dialogs in Angular. Using dialogs in Angular can be tackled in complex ways but can be easy as well.
When I started out with Angular I created this [article](https://blog.brecht.io/Modals-in-angular2/). This is already 6 years ago
at the time of writing this, and I believe there are better solutions now. Come to think of it... There already were.

## The dialog itself

A dialog could be nothing more than a `<div>` with a `position:fixed` that contains a title and a body. We can use content-projection to pass a title and a body.
`@Input()` properties might not be enough here.
We could also use the `<dialog>` html element but for simplicity I chose not to use that for this article.
The simplest implementation can be found here:

```typescript
@Component({
  selector: 'my-dialog',
  template: `
  <h1 class="header">
    <ng-content select="[my-dialog-header]"></ng-content>
  </h1>
  <div class="body">
    <ng-content select="[my-dialog-body]"></ng-content>
  </div>

  `,
  styles: [
    `
    :host {
      width: 400px;
      height: 400px;
      background: #ccc;
      display: flex;
      flex-direction: column;
      opacity: 0.9;
      position: fixed;
      left: 50%;
      padding: 8px;
      top: 50%;
      transform: translate(-50%, -50%);
    }
    `,
  ],
})
export class MyDialogComponent {}
```

We use the `my-dialog-header` selector to project the header into the component and we use the `my-dialog-body` selector to project the body.

How we consume it, can be found here. I won't add too much information since this should be self-explanatory:
```typescript
@Component({
  selector: 'app',
  template: `
  <my-dialog>
    <ng-container my-dialog-header>Hi there!</ng-container>
    <ng-container my-dialog-body>What's up?!</ng-container>
  </my-dialog>
  <p>
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce gravida
   ...
  </p>

  `,
})
export class AppComponent {}

```

That was quite easy, we have a dialog that is always shown. In most cases that is not what we want of course. We want to show dialogs conditionally when 
the user performs actions. There are a few ways of managing the existence and visibility of our dialogs.

I'm not a huge fan of using libraries to do that for us (Except Angular Material CDK) because well, approach 3 is way easier.

## Approach one: the dialog service

In this approach we would create a service that handles the creation and destruction of these dialogs for us.
We could use the approach of my previous article I just mentioned, but it would be better to use the `Angular Material CDK` for that.
I'm not going into detail for this approach since it's out of scope for this article, but the developer would be in charge of the lifecycle of
that component. The developer should always manually create the dialog and always manually destroy that dialog.

For confirmation-dialogs one could recommend this approach but for more complex dialogs it might be better to have something that
takes care of the lifecycle of our dialogs automatically.

Advantages:
- We can easily inject a service that creates and destroys dialogs for us. However the only use-case I see is the one for confirmation dialogs.
They could always have the same api (no inputs and always a *confirm* and *cancel* button).

Disadvantages:
- We have to take care of dependency injection ourself.
- It's not that easy to provide inputs and outputs.
- It's rather complex in general.
- There is a lot of bookkeeping that we need to do just to show simple dialogs.

Use case:
- Confirmation dialogs.

## Approach two: The *ngIf statement

We can use `*ngIf` statements in our template that would determine whether dialogs are shown or not.
The syntax for this is quite easy:

```html
<my-user-detail-dialog *ngIf="showUserDialog"></my-user-detail-dialog>
```

When the `showUserDialog` property is `true` the component will be rendered and thus the dialog will be shown.
When it's set back to false it will be hidden.

Advantages:
- We don't have to worry about the lifecycle of the component. When the dialog is destroyed we don't need to worry about memory leaks.
- It's a very simple and easy approach.

Disadvantages:
- It doesn't scale. Imagine having tons of `*ngIf` statements in our code that are only there to determine when dialogs should be shown or not.
- What if a `<user-row>` component has a dropdown with 10 actions, all actions resulting in another dialog. That would result in 10
different `*ngIf` statements. This doesn't scale.

Use case:
- When there is only one dialog we want to show, and we don't want to have it configured to a route.


## Approach 3: Routed dialogs

A best practice in web development is providing functionality that when a user refreshes the page he or she gets the exact same state as before.
They should not be redirected to the root page but they should stay in the exact same spot. At least that would result in the best user-experience.

Take this example for instance:
We have a page with a table of users. When we click on the user it would open something with detailed information of that user.
Whether that is shown in a dialog or a different page is irrelevant. `user/:userId` should result in the `<user-detail>` component.
In our minds this is a different page for now but, product management has just decided that `<user-detail>` is not a page but a dialog, which means we would have a `<user-detail-dialog>` component.

This approach is actually super easy. We create a `<user-detail-dialog>` that uses our previous `my-dialog` component.
We bind it to the `user/:userId` route with the help of a child `router-outlet` and everything works.

We don't need a lot of code to achieve this:

Our app component just contains a `router-outlet`. This will be used to render the top level of routing config components.
```typescript
// app.component.ts
@Component({
  selector: 'app',
  template: `
  <router-outlet></router-outlet>
  `,
})
export class AppComponent {}
```

We have created a `<users>` component which loads some mocked user data and shows it in a table. This will be rendered in the
previously mentioned `router-outlet`. It also provides a detail link for every user that will navigate to `users/:userId`.
It's very important to note here that below the table we have another child `router-outlet`. This will be used to render
the dialog in.

```typescript
@Component({
  selector: 'users',
  template: `
  <table>
    <tbody>
      <tr *ngFor="let user of users$|async">
        <td>{{user.firstName}}</td>
        <td>{{user.lastName}}</td>
        <td>
          <a routerLink="{{user.id}}">Detail</a>
        </td>
      </tr>
    </tbody>
  </table>
  <router-outlet></router-outlet>
  `,
})
export class UsersComponent {
  users$ = this.usersService.getUsers();
  constructor(private usersService: UsersService) {}
}
```

We have created a `<users-detail>` component which uses our previous `<my-dialog>` component to display the details
of a user. Based on the `:userId` param it uses the `UsersService` to retrieve that information and show it with the necessary content projection.

```typescript
@Component({
  selector: 'users-detail',
  template: `
  <my-dialog *ngIf="user$|async as user">
    <ng-container my-dialog-header>Details of {{user.firstName}} {{user.lastName}}</ng-container>
    <ng-container my-dialog-body>Role: {{user.role}}</ng-container>
  </my-dialog>
  `,
})
export class UsersDetailComponent {
  private userId$ = this.activatedRoute.params.pipe(map(p => p.userId));
  user$ = this.userId$.pipe(
    switchMap(id => this.usersService.getById(id))
  )
  constructor(
    private activatedRoute: ActivatedRoute,
    private usersService: UsersService
  ) {}
}
```

In the module below we see the routingConfig. What is important here is that the `UsersDetailComponent` class
is configured within the children of the `UsersComponent` class. By looking closely at this config we can see that
we are dealing with 2 nested `router-outlet`'s.

```typescript
@NgModule({
  imports: [
    ...
    RouterModule.forRoot([
      {
        path: '',
        redirectTo: 'users',
        pathMatch: 'full',
      },
      {
        path: 'users',
        component: UsersComponent,
        children: [
          {
            path: ':userId',
            component: UsersDetailComponent,
          },
        ],
      },
    ]),
  ],
  ...
})
export class AppModule {}
```

That's it. When product management decides that the details of a user should not be shown in a dialog but on a page
we should have minimal work to make that happen. We can refresh the page when we want and we don't have to worry
about the lifecycle of our dialogs.

Advantages:
- We can bookmark our dialog.
- We can share our url with colleagues.
- We can use the previous and back buttons of the browser.
- We can leverage `Guards` to block the user of navigating away from the dialog (maybe they have a dirty form in there).
- We don't have to worry about memory leaks. We shouldn't even know that the user detail information is shown in a dialog.

Disadvantages:
- Not ideal for confirmation dialogs (we don't want to have confirm routes everywhere).

Use case:
- I would use this for all dialogs that are not generic.

## Angular CDK

We could use the Angular CDK to clean up everything with position strategies etc but that can be material for a next article.

## Conclusion

Adding state in routes gives us a bunch of advantages. Using that state can be used to show or hide a dialog.
Whether a view is shown in a dialog or another page shouldn't determine the routing configuration.

You can check the demo [here](https://stackblitz.com/edit/angular-ivy-3qe9tv?file=src%2Fapp%2Fmy-dialog%2Fmy-dialog.component.ts,src%2Fapp%2Fapp.component.ts,src%2Fapp%2Fapp.module.ts,src%2Fapp%2Fmy-dialog%2Fmy-dialog.component.css,src%2Findex.html,src%2Fapp%2Fusers.service.ts,src%2Fapp%2Fusers-detail%2Fusers-detail.component.ts,src%2Fapp%2Fusers%2Fusers.component.ts)
<iframe src="https://stackblitz.com/edit/angular-ivy-3qe9tv?embed=1&file=src/app/users-detail/users-detail.component.ts"></iframe>

## Reviewers

Special thanks for the awesome reviewers:
- [Tim Deschryver](https://twitter.com/tim_deschryver)
- [Ruben Vermeulen](https://twitter.com/rubverm)
