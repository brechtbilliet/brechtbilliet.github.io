----		
 -layout: post		
 -title: Modals in Angular 2	
 -published: true
----

# Modals in Angular 2
Since one of my late newyears resolutions is blogging, behold my very first blogpost.
For a customer of mine I had to implement modal-dialog functionality in Angular 2.
As most developers would do in this scenario, I also crawled the web searching for existing solutions.

Since Angular 2 has made some big breaking changes in it's latest release candidates, most of these solutions were deprecated. The ones that weren't deprecated weren't stable enough and/or very bloated.

What I needed was actually very simple... I just needed a service that would open modals in Angular 2 and I only needed a few features:
<ul>
<li>Multiple modals above each other</li>
<li>Custom modals</li>
<li>Modals must be destroyed inside and outside the modal</li>
</ul>

<strong>Note:</strong> I'm using bootstrap as css framework so I don't care about the actual modal behavior.

What I needed was a simple service where I could pass a component that would get rendered on the page, without memory leaks of course. I needed something like this:

```typescript

this.modalService.create(MyCustomModalComponent, {foo: "bar"});

```

Since I didn't found any viable solutions, I decided to write it myself.

Writing this piece of functionality myself, actually made me realise a few things:
<ul>
<li>It wasn't difficult to write this functionality on my own</li>
<li>It was way more flexible than the solutions I found on the internet</li>
<li>It wasn't bloated at all</li>
<li>I wrote very few lines of code</li>
<li><strong>We use to much dependencies from the net</strong></li>
</ul>

Don't get me wrong, I don't think we should reinvent the wheel everytime. I'm just saying that sometimes it's better to write something yourself, when it doesn't cost you to much effort and saves you a lot of bloat.

The thing about a lot of open-source libraries is they want to make everybody happy, which mostly comes with a lot of bloat and features you don't realy need. And..., with a big codebase, comes a big issuelist... 

<strong>Enough about that, let's see how I implemented this...</strong>
### The modal placeholder

In Angular 2, you can not just compile stuff to the DOM, you need a placeholder.
That's why I created a <strong>modal-placeholder</strong>, that I can use like this. This will be the placeholder where our modals will be rendered in.

```typescript
@Component({
    selector: "application",
    template: `    
       ...
       <modal-placeholder></modal-placeholder>
       ...
`
})
export class ApplicationContainer {
	...
}
```

<strong>Let's look at the implementation</strong>

The modal-placeholder has 3 goals:
<ul>
<li>Create a placeholder (see the # symbol)</li>
<li>It should register that placeholder to a service where we can render modals into it (see ViewContainerRef)</li>
<li>It should register the injector to that service. Our modals will need DI as well...</li>
</ul>

```typescript
@Component({
    selector: "modal-placeholder",
    template: `<div #modalplaceholder></div>`
})
export class ModalPlaceholderComponent implements OnInit {
    @ViewChild("modalplaceholder", {read: ViewContainerRef}) viewContainerRef;

    constructor(private modalService: ModalService, private injector: Injector) {
    }
    ngOnInit(): void {
        this.modalService.registerViewContainerRef(this.viewContainerRef);
        this.modalService.registerInjector(this.injector);
    }
}
```

### The modal service
This is the service that will dynamically generate custom components.

```typescript
export class ModalService {
    private vcRef: ViewContainerRef; // here we hold our placeholder
    private injector: Injector; // here we hold our injector
    public activeInstances: number = 0; // we an use this to determine z-index of multiple modals

    constructor(private compiler: Compiler) {
    }

    registerViewContainerRef(vcRef: ViewContainerRef): void {
        this.vcRef = vcRef;
    }

    registerInjector(injector: Injector): void {
        this.injector = injector;
    }

    create<T>(component: any, parameters?: Object): Observable<ComponentRef<T>> {
        let componentRef$ = Subject.create(); // we return a stream
        this.compiler.compileComponentAsync(component)
            .then(factory => {
                const childInjector = ReflectiveInjector.resolveAndCreate([], this.injector);
                let componentRef = this.vcRef.createComponent(factory, 0, childInjector);
                // pass the @Input parameters to the instance
                Object.assign(componentRef.instance, parameters); 
                this.activeInstances ++;
                // add a destroy method to the modal instance
                componentRef.instance["destroy"] = () => {
                    this.activeInstances --;
                    componentRef.destroy(); // this will destroy the component
                };
                componentRef$.next(componentRef);
                componentRef$.complete();
            });
        return componentRef$;
    }
}
```

As we saw above, every modal component will have a destroy method. That method is dynamically added (see logic above) to the instance of the modalcomponent. This will call the <strong>componentRef.destroy()</strong> behind the scenes which will safely destroy the component. I also found it convenient to have a closeModal function on the modal as well. Therefore every custom modal component we create should inherit this class:

```typescript
export class ModalContainer {
    destroy: Function;
    closeModal(): void {
        this.destroy();
    }
}
```

This means, a custom modal could look like this: (ideally you could also create a generic modal component)

```typescript
@Component({
	selector: "my-custom-modal",
	template: `
	<div modal="" class="modal fade in">
		<div class="modal-dialog">
			<div class="modal-content">
				 <button type="button" class="close" (click)="closeModal()">×</button>
				...
			</div>
		</div>
	</div>
	<div class="modal-backdrop fade in"></div>
`
})
export class MyCustomModalComponent extends ModalContainer {
	@Input() foo;
	onSave(): Function;
	constructor(){
		super();
	}
	// the closeModal function will be executed on the ModalContainer parent class
}
```

I love typescript decorators, and I didn't want to inherit this ModalContainer everytime.
I wanted to create modal components like this:

```typescript
@Component({
	selector: "my-custom-modal",
	template: `
	...
`
})
@Modal()
export class ModalWrapperComponent {
	@Input() foo;
	onSave(): Function;
}
```

This is basically the same thing as above, but much cleaner right?

Here's the code for the custom decorator: (How easy is that?!)

```typescript
export function Modal() {
    return function (target) {
        Object.assign(target.prototype,  ModalContainer.prototype);
    };
}
```

Ok, so what we have now is:
<ul>
<li>modal-placeholder</li>
<li>modal-service</li>
<li>Modal container class with destroy delegation</li>
<li>modal-decorator to make the inheritance cleaner</li>
</ul>

And... that's it folks. That's the only code I had to write (cleaned up a bit but still...)
It's flexible, maintainable and easy to use... Let me show you...

### The use of the modalservice

I want to create a modal of Type "MyCustomComponent", pass it the property foo (@input) and pass a callback for the onSave function.

```typescript
	this.modalService.create<MyCustomComponent>(MyCustomComponent, 
	{ 
		foo: "bar", 
		onSave: () => alert('save me')
	});
```


But wait? What if we want to destroy it outside of the component, you said you needed control right?

That's why the create function returns an observable that contains the componentRef, which has a destroy function.

```typescript
this.modalService.create<MyCustomComponent>(MyCustomComponent, 
	{ 
		foo: "bar", 
		onSave: () => alert('save me')
	})
	.subscribe((ref: ComponentRef<MyCustomComponent>) => {
		//destroy after 1 second
		setTimeout(() => ref.destroy(), 1000);
	});
```

Thanks for reading! Hope you enjoyed it
