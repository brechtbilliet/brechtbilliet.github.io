---
layout: post
title: Creating a reactive calendar in Angular 4 and RXJS
published: false
author: brechtbilliet
comments: true
---

## Foreword

RxJS is an awesome library that can help us with creating **reactive web-applications**. Reactive web-applications can be overwhelming in the beginning but they can be really rewarding afterwards.

This article is all about making the paradigm-switch from thinking imperative towards **thinking reactive**.
In this article we will learn how to write a reactive calendar-application in only a few lines of code.

We will use Angular, Angular material, typescript, RxJS, firebase and angularfire as our main technology-stack, but this article really focusses on reactive programming. Don't expect a deep dive in all RxJS operators, but rather expect how to draw, think and reason about reactive web-applications. 

**Note:** This article contains personal terminology.

## The reactive calendar
This is the application that we are going to write. It's a small but complete (kindoff) calendar application that allows us to:

- Switch between different viewmodes: day, week, month.
- Navigate to previous and next days, weeks and months
- Add appointments, update appointments and remove them
- Search for specific appointments

![Reactive calendar](https://raw.githubusercontent.com/brechtbilliet/brechtbilliet.github.io/master/_posts/reactivecalendar/reactivecalendar1.png)


The user can interact with the following UI-elements:

- **Next button:** Allows the user to go to the next day in Day-mode, week in Week-mode, etc...
- **Previous button:** Allows the user to go to the previous day in Day-mode, week in week-mode, etc...
- **Day, Week, Month buttons:** Allows the user to switch between the different viewmodes
- **searchTerm input:** Allows the user to filter the appointments on the fly
- **plus-buttons:** Allows the user to create new appointments
- **trashcan-buttons:** Allows the user to remove appointments
- **description inputs:** Allows the user to update the description of an appointment

I decided to use firebase as a backend and let me spoil something for you. **This application will be completely real-time, and it will work without an internet connection as well**.

**Note:** One small issue, we can only create lunch-appointments =) But hey! Consider it some homework.


## Setting up the project

I've created the git branch **initial** to get us started. It contains the default logic/components, setup and styles. There is no reactive code written yet, just plain angular code. The goal is to write the reactive part ourselves.


### The component tree

![The component tree](https://raw.githubusercontent.com/brechtbilliet/brechtbilliet.github.io/master/_posts/reactivecalendar/reactivecalendar3.png)
The dumb components (blue) are completely implemented. The app-root (orange) is the one and only smart component in the application and the only place where we will write reactive code.

If you don't know the difference between smart and dumb components, [read this first](http://blog.brecht.io/components-demystified/#smart-vs-dumb-components).


### Installing the project locally
First of all, we have to clone the project locally, and checkout the **initial** branch. This branch already contains all the uninteresting parts that don't have anything to do with this article. 

In the terminal, we have to go to the folder where we want to install the project and run the following commands:

```
$ git clone git@github.com:brechtbilliet/reactive-calendar.git
$ cd reactive-calendar/reactive-calendar
$ git checkout initial
$ npm install
```

### Setting up firebase

We are using [firebase](https://firebase.google.com/) as our backend because it requires minimal setup, it's realtime by default and [angularfire](https://github.com/angular/angularfire2) gives us streams for free. In these few steps we can complete the firebase configuration:

- Go to [https://firebase.google.com](https://firebase.google.com/) and click on the "GO TO CONSOLE" button and choose your google account.
- Click on the "Add project" button and choose a name for your project. Let's take **"reactive-calendar"** to keep it simple. 
- Click on the "CREATE PROJECT" button. Now we should be redirected to [something like this](https://console.firebase.google.com/project/reactive-calendar/overview).
- On the Authentication-tab, go to "SIGN-IN METHOD" and enable the "Anonymous" setting.
- Go back to the Overview by clicking on the home-symbol and then select "Add Firebase to your web app".
- Copy the config with the correct properties and replace the firebaseConfig object in src/app/app.module.ts with these properties.
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

As you can see this just handles static data, the buttons/inputs won't work and the appointments are not loaded yet.
This is where we start from.

## Thinking reactive

Here comes the tricky part, we are trying to forget imperative programming for now, and we are trying to evolve into a reactive mind-set.

### Todo: marble diagrams
todo: asci comments

### Imperative programming: What does the app have to do?

When we think about the functionality of our application, we quickly notice that there are quite a few cornercases and special scenarios. For every interaction the user makes with the UI, the app needs to handle that specific interaction accordingly. Sometimes it has to combine these interactions together and handle that specific combination as well. Take this crazy (but simple) example for instance.

<blockquote>
When the viewMode is changed to Week-mode, and the previous viewMode was Month-mode, and the month was June, and the year was 2017, and an appointment was added, while the searchterm was set to "Brecht", then we would have to update...
</blockquote>

Yes, we would have to update a bunch of stuff. This is imperative thinking and it can become exhausting. There is a big chance that we forget certain corner-cases. Let's imagine that we have to combine that with asynchronous actions as well.

In the image below we see all the different interactions the user has in the calendar application.
![Application events](https://raw.githubusercontent.com/brechtbilliet/brechtbilliet.github.io/master/_posts/reactivecalendar/reactivecalendar2.png)

As we can see, for every specific interaction. The UI will have to update specific things.

### Reactive programming: What data will change, and what data do the components need?

#### Source streams

Now let's completely stop with what we are thinking. Let's free our mind and stop thinking about cornercases and special scenarios. We have to learn to think in streams. A stream is a collection of events that will change over time. Think about what can change in your application and call these streams of data. Let's call them **source-streams**. 

**Note:** For readability purposes, we will suffix all the streams with a '$' symbol.

When can come up with 4 source-streams:

- **navigation$:** Can contain the values: -1, 0 or 1
- **viewMode$:** Can contain the vallues: DAY, WEEK or MONTH
- **searchTerm$:** The value of the search-field
- **appointments$:** This is an array of appointments, that comes from firebase

![data streams](https://raw.githubusercontent.com/brechtbilliet/brechtbilliet.github.io/master/_posts/reactivecalendar/reactivecalendar4.png)

That was pretty easy, we just had to think about the events that can occur in our application. A user can navigate, change viewmode, search for appointments and the appointments in firebase can change. This is the beginning of thinking reactive. Don't think about who triggers what. Think about the changes as streams.


It's always a good idea to draw marble diagrams to make it easier to reason about.

![data stream diagram](https://raw.githubusercontent.com/brechtbilliet/brechtbilliet.github.io/master/_posts/reactivecalendar/reactivecalendar5.png)

The appointments$ is a stream that angularfire will provide us, but the viewMode$, searchTerm$ and navigation$ are simple behavior subjects. We use subjects because we need to control the values of the streams ourselves and we use the BehaviorSubject in particular because all our source streams need an initial value.

```typescript
export class AppComponent {
    ...
    appointments$ = this.db.list('/appointments');
   	 // 0--------(+1)----(+1)----(-1)-------------...
    viewMode$ = new BehaviorSubject(VIEW_MODE.MONTH);
	navigation$ = new BehaviorSubject(0);
	searchTerm$ = new BehaviorSubject('');

    constructor(private db: AngularFireDatabase) {
    }
    ...
}

```

#### Presentational streams

Now we have to think about the data that our components need, because those components will need to be updated based on those source streams.
Let's take this code sample for instance: 

```html
<div [ngSwitch]="XX" class="main">
    <day-view
            *ngSwitchCase="'DAY'"
            [appointments]="XX"
            [date]="XX"
            ...>
    </day-view>
    <week-view
            *ngSwitchCase="'WEEK'"
            [appointments]="XX"
            [year]="XX"
            [week]="XX"
            ...>
    </week-view>
    <month-view
            *ngSwitchCase="'MONTH'"
            [month]="XX"
            [year]="XX"
            [appointments]="xxx"
            ...>
    </month-view>
</div>
```

I marked the input properties with XX to show us what our components need in terms of data. These places will need streams as well, let's call them **presentational streams**.

Let's try to fill in these gaps, shall we?!

**Note:** We use the [async pipe](https://angular.io/api/common/AsyncPipe) from angular to subscribe/unsubscribe the streams automatically.

```html
<div [ngSwitch]="viewMode$|async" class="main">
    <day-view
            *ngSwitchCase="'DAY'"
            [appointments]="filteredAppointments$|async"
            [date]="currentDate$|async"
            ...>
    </day-view>
    <week-view
            *ngSwitchCase="'WEEK'"
            [appointments]="filteredAppointments$|async"
            [year]="currentYear$|async"
            [week]="currentWeek$|async"
            ...>
    </week-view>
    <month-view
            *ngSwitchCase="'MONTH'"
            [month]="currentMonth$|async"
            [year]="currentYear$|async"
            [appointments]="filteredAppointments$|async"
            ...>
    </month-view>
</div>
```

We have gathered the 6 following presentational streams:

- **viewMode$ (string):** needed to determine which view has to shown
- **filteredAppointments$ (Array < Appointment >):** needed by day-view, week-view and month-view to render the correct appointments
- **currentDate$ (Date):** the current Date for the day-view
- **currentWeek$ (number):** the current week for the week-view
- **currentYear$ (number):** needed by week-view and month-view
- **currentMonth$ (number):** needed by the month-view

Ok great, we know the source streams, which are the sources of change in our application.
We know the presentational streams, which are simply the streams that our components need. Now it's time for the cool part: **We need to create those presentational streams based on the source streams**.

![sources to presentational streams](https://raw.githubusercontent.com/brechtbilliet/brechtbilliet.github.io/master/_posts/reactivecalendar/reactivecalendar6.png)

The first presentational stream we need is viewMode$. This is allready an easy one since viewMode$ is also a source stream.

#### currentDate$
![currentDate$](https://raw.githubusercontent.com/brechtbilliet/brechtbilliet.github.io/master/_posts/reactivecalendar/reactivecalendar7.png)

```typescript
// we will need this stream a few times so let's extract the stream 
// in a currentDateM first

// viewMode$:     M------------------W---------------D--------...
// navigation$:   0---(+1)-(-1)----------(+1)-(-1)------------...
// currentDateM$: d---d----d---------d---d----d------d--------...
private currentDateM = this.viewMode$.flatMap((viewMode: string) => {
	// every time the viewMode changes, the navigation should be reset as well
	// the dateM variable will contain the navigation and because of the 
	// flatMap it will reset every time the viewmode changes
	// if the navigation$ changes afterwards it will manipulate the dateM object
	// by adding months, weeks or days depending on the viewMode
    let dateM = moment();
    return this.navigation$
        .map((action: number) => {
            switch (viewMode) {
                case VIEW_MODE.MONTH:
                    return dateM.startOf('month').add(action, "months");
                case VIEW_MODE.WEEK:
                    return dateM.startOf('week').add(action, "weeks");
                case VIEW_MODE.DAY:
                    return dateM.startOf('day').add(action, "days");
            }
            return dateM;
        })
})
currentDate$ = this.currentDateM$.map(dateM => dateM.toDate());

```

#### currentWeek$

Based on the currentDateM$ we can calculate the current week. The currentDateM$ is just a moment object of the current date based on the navigation and viewMode.

![currentWeek$](https://raw.githubusercontent.com/brechtbilliet/brechtbilliet.github.io/master/_posts/reactivecalendar/reactivecalendar8.png)

```typescript
currentWeek$ = this.currentDateM$.map(dateM => dateM.week());
```

#### currentMonth$

Just like we calculated the currentWeek$ based on the currentDateM$, we can do the same thing here.

![currentMonth$](https://raw.githubusercontent.com/brechtbilliet/brechtbilliet.github.io/master/_posts/reactivecalendar/reactivecalendar9.png)

```typescript
currentMonth$ = this.currentDateM$.map(dateM => month());
```
#### currentYear$

Just like we calculated the currentWeek$ and the currentMonth$ based on the currentDateM$, we can do the same thing here.

![currentYear$](https://raw.githubusercontent.com/brechtbilliet/brechtbilliet.github.io/master/_posts/reactivecalendar/reactivecalendar10.png)

```typescript
currentYear$ = this.currentDateM$.map(dateM => year());
```

#### filteredAppointments$

Calculating this stream is a bit harder. The filteredAppointments$ is dependent on the viewMode$, currentDateM$, appointments$ and searchTerm$.

