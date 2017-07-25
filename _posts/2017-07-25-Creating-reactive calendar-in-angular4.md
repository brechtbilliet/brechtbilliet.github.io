# Creating a reactive calendar

## Foreword

RxJS is an awesome library that helps us in creating reactive web-applications. Reactive web-applications can be overwhelming in the beginning but they can be really rewarding in the end.

This article is all about making that paradigm switch from thinking imperative towards **how to think reactive**.
In this article we will learn how to write a reactive calendar application in only a few lines of code.

We will use Angular, Angular material, typescript, RxJS and firebase as our mqin technology-stack, but the focus of this article really lies on the reactiveness. Don't expect a deep dive in all RxJS operators, but rather expect how to draw, think and reason about reactive web applications.

### The reactive calendar

![Reactive calendar](https://raw.githubusercontent.com/brechtbilliet/brechtbilliet.github.io/master/_posts/reactivecalendar/reactivecalendar1.png)
The reactive calendar is a small but complete calendar application that allows us to:

- Switch between different viewmodes (day, week, month)
- Navigate to previous and next days, weeks and months
- Add appointments, update appointments and remove them
- Search for specific appointments

**Note:** One small issue, we can only create appointments at noon =) But hey! Consider it some homework.


### Setting up the project

I've created a branch to get us started. It contains the dumb components, empty smart components, the setup and the styles. That way we can completely focus on the reactive part.

First of all, we will clone the project locally, and checkout the **initial** branch. This branch already contains all the uninteresting parts we don't want to write right now. 

```
git clone git@github.com:brechtbilliet/reactive-calendar.git
cd reactive-calendar/reactive-calendar
git checkout initial
npm i
```

#### Setting up firebase
Go to [https://firebase.google.com](https://firebase.google.com/) and click on the "GO TO CONSOLE" button and choose your google account.
Click on the "Add project" button and choose a name for your project. Let's take **reactive-calendar** to keep it simple. Click on the "CREATE PROJECT" button. Now we should be redirected to [something like this](https://console.firebase.google.com/project/reactive-calendar/overview).

On the Authentication tab, go to "SIGN-IN METHOD" and enable the Anonymous setting.

Go back to the Overview by clicking on the home symbol and select "Add Firebase to your web app"
todo: screenshot

Copy the config with the correct properties and replace the firebaseConfig object in src/app/app.module.ts with these properties.
This might look something like this:

```typescript
const firebaseConfig = {
    apiKey: "AIzaSyBuqjTJd5v6xTf8D2EZmvFUl8lseH8lVuHU",
    authDomain: "reactive-calendar.firebaseapp.com",
    databaseURL: "https://reactive-calendar.firebaseio.com",
    projectId: "reactive-calendar",
    storageBucket: "reactive-calendar.appspot.com",
    messagingSenderId: "3978123451455750"
};
```

Let's continue, start the project by running the following command and open your browser on [http://localhost:4200](http://localhost:4200). 

```
npm start
```

This should build the application and show it in the browser, as you can see this just handles static data, the buttons/inputs won't work and the appointments are not loaded yet.
This is where we start from.




share the slides here too