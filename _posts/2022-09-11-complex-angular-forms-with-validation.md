---
layout: post
title: Complex Angular forms with validation
description:  
published: false
author: brechtbilliet
comments: true
date: 2022-09-11
subclass: 'post'
disqus: true
---

Sometimes forms in Angular can be a pain, and I have been struggling with them since the beta phases of Angular2.
First there was the template driven forms approach which still exists, and then later on the Angular core team
introduced Reactive forms. The community sold Reactive forms as a best practice and they basically told
us to stay away from template driven forms.
The reason was:
- It's easier to unit-test.
- Less chance of 2-way databinding on models directly.
- Reactive api's like `valueChanges` and `statusChanges` returned observables for us.
- Validation was supposed to be better, but there is some debate around that topic.

Even though the reactive forms were recommended they also had some disadvantages:
- There was a big pain when it came to type safety but that is something that they "fixed" in version 14 where typed forms were 
introduced.
- There was a lot of redundancy when it came to showing validations, error messages, etc...
- It's also worth noting that `FormGroup` and `FormControl` are not immutable so we can't use `ChangeDetectionStrategy.OnPush` on components
where we pass those formGroups and formControls as `@Input()`'s, not without having the occasional manual `markForCheck()` statement at least.

It makes sense actually, there are a lot of different ways to handle validations, composing forms etc, and the Angular team has provided us with
a solution that can be used in a variety of different approaches.

Let's mention that there are a few big discussions going on, on whether we should use template driven forms of Reactive forms but let's
not go into detail. Both approaches have their advantages and disadvantages. For this article we are going to use Reactive typed forms in Angular.

## Writing our own wrappers and abstractions

When I help out companies, complex forms is a subject that keeps coming back and I generally introduce some custom form wrappers and abstractions.
The goal is to reduce both complexity and redundancy and also improve consistency.
In this article we will create a set of 4 concepts that work together to achieve a clean way of handling forms:
- `<form-wrapper>` component: This will hold the native form element.
- `<form-input-wrapper>` component: This has a label and takes care of validation messages.
- `[formInput]` directive: This is used as glue between the `<form-input-wrapper>` and the inputs.
- `formInputErrors` pipe: This is used to render the errors in a clean way without to much code.

I'm not a huge fan of writing our own `FormBuilderService`, nor am I a fan of using a third party lib like `formly` that uses huge chunks of
configurations with embedded logic. We want to stay as close as possible to Angular, but we do want to avoid redundancy.

### The form-wrapper component

This component is a wrapper for the native `form` element. It can hold some styling to enforce consistency within our application,
but it also has a `submitted$` observable that we can use to show validation errors only when the form is submitted.
We use an observable so it is easier to consume in another class.
In this case, we don't want to bug the user with validation messages if the form hasn't even been submitted yet (unless the control is dirty).
We use content projection to add the actual content of the form. This following code shows that this is an easy component:

*Note: For this article we have chosen to use the `standalone` component structure, but it could be written with modules as well.*

```typescript
@Component({
    selector: 'form-wrapper',
    imports: [CommonModule, ReactiveFormsModule],
    template: `
        <form (submit)="onSubmit()" [formGroup]="formGroup">
          <ng-content></ng-content>
        </form>
    `,
    standalone: true,
    styleUrls: ['./form-wrapper.component.css'],
})
export class FormWrapperComponent {
    @Input() public readonly formGroup: FormGroup;
    @Output() public readonly submit = new EventEmitter();
    public readonly submitted$ = new BehaviorSubject(false);
    
    public onSubmit(): void {
        this.submitted$.next(true);
        this.submit.emit();
    }
}
```

### form-input-wrapper component

This component will remove the most redundancy. Think about all the `*ngIf` code to show errors or not. Making sure the label
is on top of the input instead of on the left of it, and there are a few other examples which I won't mention now.
The `form-input-wrapper` component contains a label and an element that implements `ControlValueAccessor`.

We could consume the component like this:

```html
<form-wrapper [formGroup]="form" (submit)="onSubmit()">
    <form-input-wrapper label="First name">
        <input type="text" [formControl]="form.controls.firstName"
    </form-input-wrapper>
    ...
</form-wrapper>
```

The code of the implementation of the `form-input-wrapper` might look like this:

```typescript
@Component({
    selector: 'form-input-wrapper',
    template: `
        <label>{{ label }}</label>
        <ng-content></ng-content>
        <!-- Todo: add validation errors later -->
    `,
    imports: [CommonModule],
    standalone: true,
})
export class FormInputWrapperComponent {
    @Input() public readonly label: string;
}

```

As we can see, we don't care about validation errors yet, that is something we will tackle later.
It's a fairly simple component that will render a label and project some content.

### form-input directive

In the `<form-input-wrapper>` component we need a reference to the form control, because that form control holds the valid state which
is exactly what we want to show in the `<form-input-wrapper>` component.
We could pass that formControl as an input, but that seems like a lot of work to do that every time.
We need some way to get access to that control from inside the `<form-input-wrapper>` component.
We could use `@ContentChildren()` for that, but the element can be an `form-input` or a `textarea` or maybe some custom
form control that implements the `ControlValueAccessor` interface. We don't know which query we should pass in the `@ContentChildren()`.
To get access to all the elements that implement the `ControlValueAccessor` interface, we can create an
`[formInput]` directive which is applied on every of those elements. Later on we can use `@ContentChildren(FormInputDirective)` to get that reference.

The implementation of the `[formInput]` directive is quite simple, like we mentioned before: It's just the glue:

```typescript
@Directive({
    selector: '[formInput]',
    standalone: true
})
export class FormInputDirective {
    @Input() public readonly formControl: FormControl;
}
```

We have to apply the `[formInput]` directive on every input element (or element that implements the `ControlValueAccessor` interface) to glue it to
its `<form-input-wrapper>` component:

```html
<form-input-wrapper label="First name">
    <input
        type="text"
        formInput
        [formControl]="form.controls.user.controls.firstName"
    />
</form-input-wrapper>
```

Now we can add the `formInputs` propety to the `<form-input-wrapper>` component which we will later use to retrieve its validity state from.

```typescript
export class FormInputWrapperComponent {
    @Input() public readonly label: string;
    @ContentChildren(FormInputDirective, { descendants: true })
        public readonly formInputs: QueryList<FormInputDirective>;
}
```

## The structure

We have one `<form-wrapper>` component which holds the submitted state, and that wraps `<form-input-wrapper>`'s to reduce redundancy with a `[formInput]` directive
that acts as glue. In the code below we show an example where we have a **general** form group and an **address** form group. This HTML won't change anymore,
so this is the most redundancy we will have in our HTML.

```html
<form-wrapper [formGroup]="form" (submit)="onSubmit()">
    <fieldset>
        <h3>General</h3>
        <form-input-wrapper label="First name">
            <input
                type="text"
                formInput
                [formControl]="form.controls.user.controls.firstName"
            />
        </form-input-wrapper>
        <form-input-wrapper label="Last name">
            <input
                type="text"
                formInput
                [formControl]="form.controls.user.controls.lastName"
            />
        </form-input-wrapper>
        <form-input-wrapper label="Age">
            <input
                type="number"
                formInput
                [formControl]="form.controls.user.controls.age"
            />
        </form-input-wrapper>
    </fieldset>
    <fieldset>
        <h3>Address</h3>
        <form-input-wrapper label="Street">
            <input
                type="text"
                formInput
                [formControl]="form.controls.address.controls.street"
            />
        </form-input-wrapper>
        <form-input-wrapper label="Street number">
            <input
                type="text"
                formInput
                [formControl]="form.controls.address.controls.streetNumber"
            />
        </form-input-wrapper>
        <form-input-wrapper label="City">
            <input
                type="text"
                formInput
                [formControl]="form.controls.address.controls.city"
            />
        </form-input-wrapper>
        <form-input-wrapper label="Zipcode">
            <input
                type="text"
                formInput
                [formControl]="form.controls.address.controls.zipCode"
            />
        </form-input-wrapper>
    </fieldset>
    <button type="submit">Submit</button>
</form-wrapper>

```

Since we use typed forms we will create 2 classes: The `UserForm` and the `AddressForm`.
We use the basic `FormBuilder` api to compose our form:

*Note: Making these properties **readonly** enforces us to work in an immutable way*

```typescript
export class UserForm {
    public readonly firstName: string;
    public readonly lastName: string;
    public readonly age: number;
}

export class AddressForm {
    public readonly street: string;
    public readonly streetNumber: string;
    public readonly city: string;
    public readonly zipCode: string;
}

@Component({
    selector: 'my-app',
    templateUrl: './app.component.html',
    imports: [FormWrapperComponent, FormInputWrapperComponent, FormInputDirective, ReactiveFormsModule, FormsModule, CommonModule],
    standalone: true,
    styleUrls: [ './app.component.css' ]
})
export class AppComponent  {
    private readonly addressForm = this.fb.group<AddressForm>({
        street: '',
        streetNumber: '',
        city: '',
        zipCode: ''
    });
    
    private readonly userForm = this.fb.group<UserForm>({
        firstName: '',
        lastName: '',
        age: null
    });
    
    public readonly form = this.fb.group({
        user: this.userForm,
        address: this.addressForm
    })
    
    constructor(private fb: FormBuilder){
    }
    
    public onSubmit(): void {
        console.log(this.form.value);
    }
}
```



## Validation

To make validation easier let's use `class-validator`. You can use it on the frontend, on the backend and it's
easy to write our own validators. We already have the `UserForm` class and the `AddressForm` class and to simplify
validations we can just add decorators on them. They are readable and reusable if we want them to be.

```typescript
import { IsNotEmpty, Min, Max } from 'class-validator';

export class UserForm {
    @IsNotEmpty()
    public readonly firstName: string;
    
    @IsNotEmpty()
    public readonly lastName: string;
    
    @Min(0)
    @Max(100)
    public readonly age: number;
}

export class AddressForm {
    @IsNotEmpty()
    public readonly street: string;
    
    @IsNotEmpty()
    public readonly streetNumber: string;
    
    @IsNotEmpty()
    public readonly city: string;
    
    @IsNotEmpty()
    public readonly zipCode: string;
}

```

The next thing we need to do is translate these classes into lists of validators and apply them on our `userForm` and `addressForm`.
We want to automate that as much as possible so we only want to create a function called `addAsyncValidators()` that will just do that.
In the first argument we pass the form group and in the next one the type of its form class.

```typescript
private readonly addressForm = addAsyncValidators(this.fb.group<AddressForm>({
    street: '',
    streetNumber: '',
    city: '',
    zipCode: ''
}), AddressForm);

private readonly userForm = addAsyncValidators(this.fb.group<UserForm>({
    firstName: '',
    lastName: '',
    age: null
}), UserForm);
```

The `addAsyncValidators()` function would loop over the form and would add the correct validators based on the class
with the decorators. I'm not going to go into detail regarding the following implementation. It is not the goal
 of this article and it's already long enough.
You can just copy paste it, or improve it and let me know :) This code is something that we only need to write once and
then consume in different applications. In a nutshell: We loop over the form object, look up the keys in our class with decorators,
translate the decorators into async validators and create a new form group with those validators attached to it.

```typescript
// form-utils.ts
import {
    AbstractControl,
    AsyncValidatorFn,
    FormControl,
    FormGroup,
} from '@angular/forms';
import { validate, ValidationError } from 'class-validator';

export function addAsyncValidators<T extends FormGroup>(
    form: T,
    formType: new () => any
): T {
    const groupObj = Object.keys(form.controls).reduce(
        (obj: { [key in keyof T]: FormControl }, key: keyof T & string) => {
            const validators = [createValidatorFn(key, formType)];
            const formControl = new FormControl(form.value[key], {
                asyncValidators: validators,
            });
            return {
                ...obj,
                [key]: formControl,
            };
        },
        {} as { [key in keyof T]: FormControl }
  );
  return new FormGroup(groupObj as { [key in keyof T]: FormControl }) as T;
}

function createValidatorFn<T>(
    key: string,
    formType: new () => any
): AsyncValidatorFn {
    return (control: AbstractControl) => {
        const toValidate = new formType();
        toValidate[key] = control.value;
        return validate(toValidate).then((validationErrors: ValidationError[]) => {
            const err = validationErrors.find(
                (v: ValidationError) => v?.property === key
            );
            
            return err 
            ? ({
                constraints: err.constraints,
                contexts: err.contexts,
            } as ValidationError)
            : null;
        });
    };
}

```

### Showing the validations

To show the validators we need to use the `formInputs` property of the `<form-input-wrapper>` component.
The errors that we want to show live in `formInputs?.first?.formControl?.errors`.
The validation errors aht `class-validator` spits out has a very specific format: 
`constraints[keyname]` holds the validation message. We know multiple validation messages for one
form input is possible so let's write a pipe to loop over that data and return the list.
Let's create a `formInputErrors` pipe that checks if there are constraints, and if there are any, it returns a nice list
of these validation errors:

```typescript
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'formInputErrors',
    standalone: true
})
export class FormInputErrorsPipe implements PipeTransform {
    transform(value: any, args?: any): any {
        if(value?.constraints){
            return Object.keys(value?.constraints).map(key => {
                return value?.constraints[key]
            });
        }
        return null;
    }
}
```

To use this pipe we add an `*ngFor` statement in the `<form-input-wrapper>` component.
Don't forget to add the `FormInputErrorsPipe` into the imports of that component:

```typescript
import { CommonModule } from '@angular/common';
import { Component, ContentChildren, Input, QueryList } from '@angular/core';
import { FormInputErrorsPipe } from '../form-input-errors.pipe';
import { FormInputDirective } from '../form-input.directive';

@Component({
    selector: 'form-input-wrapper',
    template: `
        <label>{{ label }}</label> <ng-content></ng-content>
        <ul>
          <li *ngFor="let child of formInputs?.first?.formControl?.errors|formInputErrors; trackBy: tracker">{{child}}</li>
        </ul>
    `,
    imports: [CommonModule, FormInputDirective, FormInputErrorsPipe],
    styleUrls: ['./form-input-wrapper.component.css'],
    standalone: true,
})
export class FormInputWrapperComponent {
    @Input() public readonly label: string;
    @ContentChildren(FormInputDirective, { descendants: true })
    public readonly formInputs: QueryList<FormInputDirective>;
    
    public readonly tracker = (i) => i;
}

```

### Adding a validation class on the `formInput` directive

We also want to add a css class called `form-input--invalid` when the form input contains errors.
We can do that by using a `@HostBinding()`, injecting the `FormWrapperComponent` and using the form control that we pass
through an `@Input()` property.

```typescript
export class FormInputDirective {
    private readonly submitted$ = inject(FormWrapperComponent).submitted$;
    @Input() public readonly formControl: FormControl;
    
    @HostBinding('class.form-input--invalid')
    public get invalid(): boolean {
        return (
            this.formControl?.invalid && (this.formControl?.touched || this.submitted$.value)
        )
    }
}
```

### Conditionally showing the validations with dependency injection

Now we our validations are shown nicely, but we only want to show them when the form is submitted
or when the form control is dirty.
For that we can inject the `FormWrapperComponent` into the `<form-input-wrapper>` component and add an 
`*ngIf` statement on the `<ul>` element that checks if the form is submitted or the form control is dirty.


```typescript
@Component({
    selector: 'form-input-wrapper',
    imports: [
        CommonModule,
        FormInputDirective,
        FormInputErrorsPipe,
    ],
    styleUrls: ['./form-input-wrapper.component.css'],
    standalone: true,
    template: `
    <label>{{ label }}</label> <ng-content></ng-content>
    <ul *ngIf="(submitted$|async)|| 
        (formInputs?.first?.formControl.touched && formInputs?.first?.formControl?.errors)">
        <li *ngFor="let child of formInputs?.first?.formControl?.errors|formInputErrors; 
            trackBy: tracker">{{child}}</li>
    </ul>
`,

})
export class FormInputWrapperComponent {
    @Input() public readonly label: string;
    @ContentChildren(FormInputDirective, { descendants: true })
    public readonly formInputs: QueryList<FormInputDirective>;
    public readonly submitted$ = inject(FormWrapperComponent).submitted$;
    public readonly tracker = (i) => i;
}

```

### Custom validator

Creating a custom validator for `class-validator` is not that hard.
Let's create a `NoSpecialChars` decorator that will throw an error when the user
types a special character in one of the name fields.

We will use our decorator like this:
```typescript
export class UserForm {
    @IsNotEmpty()
    @NoSpecialChars()
    public readonly firstName: string;
    
    @IsNotEmpty()
    @NoSpecialChars()
    public readonly lastName: string;
    ...
}
```

A decorator is just a function that returns a function. In that function we use the `registerDecorator()` function
that `class-validator` provides us to register our new validator.
There are multiple ways of doing this. We choose the use of `@ValidatorConstraint` for this article.
This decorator has to be applied on a class that implements the `ValidatorConstraintInterface` interface.
For that we need to implement the `validate()` function where we use a regex to test our value.
In the `defaultMessage` function we can return the message we want to show.

```typescript
import {
    registerDecorator,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator';

export function NoSpecialChars(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            validator: new RRuleConstraint(),
            options: validationOptions,
        });
    };
}

@ValidatorConstraint({ name: 'noSpecialChars' })
class RRuleConstraint implements ValidatorConstraintInterface {
    public validate(value: string) {
        const regex = /[\!\@\#\$\%\^\&\*\)\(\+\=\.\<\>\{\}\[\]\:\;\'\"\|\~\`\_]/g;
        return !regex.test(value);
    }
    public defaultMessage(): string {
        return 'Should not contain special charactes';
    }
}

```

## Conclusion

That's it folks! We have written some custom logic that we only needed to write once:
- We have greatly reduced redundant code
- We saw how easy it was to creat custom validators and create decorators for them
- We are able to add validators on our classes for typed forms
- We stayed super close to the Angular api which gives us a lot of flexibility

Here you can check out the Stackblitz example:

<iframe src="https://stackblitz.com/edit/angular-ivy-wrdn8k" width="100%"></iframe>


