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

Sometimes forms in Angular can be a pain, and some of us have been struggling with them since the beta phases of Angular2.
First there was only the template driven forms approach, and then later on the Angular core team
introduced Reactive forms. Both solutions still exist today, but the community sold Reactive forms as a best practice and they basically told
us to stay away from template driven forms.
The reasoning behind this was:
- Reactive forms are easier to unit-test.
- Less chance of 2-way databinding on models directly.
- Reactive api's like `valueChanges` and `statusChanges` returned observables for us.
- Validation was supposed to be better, but there is some debate around that topic.

Even though the reactive forms were recommended they also had some disadvantages:
- There was a big pain when it came to type safety but that is something that they "fixed" in version 14 where typed forms were 
introduced.
- There was a lot of redundancy when it came to showing validations, error messages, etc...
- It's also worth noting that `FormGroup` and `FormControl` are not immutable, so we can't use `ChangeDetectionStrategy.OnPush` on components
where we pass those formGroups and formControls as `@Input()`'s, not without having the occasional manual `markForCheck()` statement at least.

It makes sense actually, there are a lot of different ways to handle validations, composing forms etc, and the Angular team has provided us with
a solution that can be used in a variety of different approaches. We can make the usage of forms easier, but it's important that we stay close to the
current api.

A small mention here is that there are a few discussions going on, on whether we should use template driven forms of Reactive forms but let's
not go into detail. Both approaches have their advantages and disadvantages. For this article we are going to use Reactive typed forms in Angular.

## Writing our own wrappers and abstractions

When helping out companies, complex forms is a subject that keeps coming back and I generally introduce some custom form components and abstractions.
The goal is to reduce both complexity and redundancy while we still improve consistency.
In this article we will create a set of 4 custom written items that work together to achieve a clean way of handling forms:
- `<form-wrapper>` component: This will hold the native form element and a submitted state.
- `<form-input-wrapper>` component: This has a label and takes care of validation error messages.
- `[formInput]` directive: This is used as glue between the `<form-input-wrapper>` and the inputs.
- `formInputErrors` pipe: This is used to render the errors without to much code.

I'm not a huge fan of writing our own `FormBuilderService`, nor am I a fan of using a third party lib like `formly` that uses huge chunks of
configurations with embedded logic. We want to stay as close as possible to Angular, but we do want to avoid redundancy.

### The form-wrapper component

This component is a wrapper for the native `form` element. It can hold some styling to enforce consistency within our application,
but it also has a `submitted$` BehaviorSubject that we can use to show validation errors only when the form is submitted.
In this case, we don't want to bug the user with validation messages if the form hasn't even been submitted yet (unless the control is dirty).
why a BehaviorSubject? A `submitted` property that would hold a boolean would not enough, since we need a reference type to consume it in another class.
We could use that BehaviorSubject to assign it to a `submit` output.
Other than that, we use content projection to add the actual content of the form and that is basically it:

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
    standalone: true
})
export class FormWrapperComponent {
    @Input() public readonly formGroup: FormGroup;
    public readonly submitted$ = new BehaviorSubject(false);
    // skip(1): don't emit the initial value
    @Output() public readonly submit = this.submitted$.pipe(skip(1)); 
    
    public onSubmit(): void {
        this.submitted$.next(true);
    }
}
```

### form-input-wrapper component

The `form-input-wrapper` component will remove the most of our redundant code (only 3 lines per input). Think about all the `*ngIf` code we have to rewrite for every input. 
What about making sure the label is on top of the input instead of on the left of it. 
The `form-input-wrapper` component contains a label, and an element that implements `ControlValueAccessor`.

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

As we can see, we don't care about validation error messages yet, that is something we will tackle later.
This component will render a label and project some content.

### form-input directive

In the `<form-input-wrapper>` component we need a reference to the form control, because that form control holds the valid state which
is exactly what we need to show in the `<form-input-wrapper>` component.
We could pass that formControl as an input, but that seems like a lot of work to do that every time (It's redundant).
We need some way to get access to that control from inside the `<form-input-wrapper>` component.
We will use `@ContentChildren()` for that, but the element can be an `form-input` or a `textarea` or maybe some custom
form control that implements the `ControlValueAccessor` interface. We don't know which query we should pass in the `@ContentChildren()`.
To get access to the element that is projected in the content, we can create an
`[formInput]` directive which is applied on every of those elements. Later on we can use `@ContentChildren(FormInputDirective)` to get that reference.

The implementation of the `[formInput]` directive doesn't hold logic, like we mentioned before: It's just the glue that gives access:

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

By using `@ContentChildren(FormInputDirective)`, we now can add the `formInputs` property to the `<form-input-wrapper>` component which we will later use to retrieve its validity state from.

```typescript
export class FormInputWrapperComponent {
    @Input() public readonly label: string;
    @ContentChildren(FormInputDirective, { descendants: true })
        public readonly formInputs: QueryList<FormInputDirective>;
}
```

## The structure

A small recap: We have one `<form-wrapper>` component which holds the submitted state, and that wraps `<form-input-wrapper>`'s to reduce redundancy with a `[formInput]` directive
that acts as glue. In the code below we show an example where we have a **general** form group, and an **address** form group. This HTML won't change anymore,
so this is the only code we will have to write when creating forms in the future.

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
Typed forms need types. We can create types but we will use classes instead because later on we will leverage decorators to add validation on them.
We will create the 2 classes `UserForm` and `AddressForm`, and we use the `FormBuilder` api to compose our form:

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
    ...
    templateUrl: './app.component.html',
    imports: [FormWrapperComponent, FormInputWrapperComponent, FormInputDirective, ReactiveFormsModule, FormsModule, CommonModule],
    standalone: true,
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

To have readable consistent validation, let's use [class-validator](https://github.com/typestack/class-validator). 
We can use it on the frontend, on the backend and it's
possible to write our own validators. Since class-validator provides us with decorators it's possible to put them on our forms. 

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

The next thing we need to do is translate these classes into lists of async validators and apply them on our `userForm` and `addressForm`.
Why async validators? Because `class-validator` returns promises when it validates.
Let's create a shared function called `addAsyncValidators()` that will add validators to our form groups.
In the first argument we pass the form group and in the next one the type of its form class (The one with the validation decorators).

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

public readonly form = this.fb.group({
    user: this.userForm,
    address: this.addressForm
})
```

There is a reason why we compose our form like this. Our form classes will never have nested properties. Each nested property would be a form group, and would 
use the `addAsyncValidators()` function. That way we can keep it simple and still use the regular angular FormBuilder api.

The `addAsyncValidators()` function would loop over the form and would add the correct validators based on the class
that leverage the decorators. I'm not going to go into detail regarding the following implementation. It is not the goal
 of this article and it's already long enough. Just know that we only need to write this once and put this in a shared lib.
You can just copy paste it, or improve it and let me know! In a nutshell: We loop over the form object, look up the keys in our class with decorators,
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
The validation errors that `class-validator` spits out have a very specific format: 
`constraints[keyname]` holds the validation message. We know multiple validation messages for one
form input is possible so let's write a pipe to loop over that data and return the list.
Let's create a `formInputErrors` pipe that checks if there are constraints, and if there are any, it returns a nice list
of these validation errors:

```typescript
import { Pipe, PipeTransform } from '@angular/core';
import { ValidationErrors } from '@angular/forms';

@Pipe({
    name: 'formInputErrors',
    standalone: true
})
export class FormInputErrorsPipe implements PipeTransform {
    transform(value: ValidationErrors | null | undefined, args?: any): any {
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
Because we are working with standalone components, don't forget to add the `FormInputErrorsPipe` into the imports of that component:

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
          <li *ngFor="let child of formInputs?.first?.formControl?.errors|formInputErrors">{{child}}</li>
        </ul>
    `,
    imports: [CommonModule, FormInputDirective, FormInputErrorsPipe],
    standalone: true,
})
export class FormInputWrapperComponent {
    @Input() public readonly label: string;
    // search for elements of type FormInputDirective in the <ng-content>
    @ContentChildren(FormInputDirective, { descendants: true })
    public readonly formInputs: QueryList<FormInputDirective>;
}

```

### Adding a validation class on the `formInput` directive

Sometimes we want to have a red border our another specific style on invalid fields.
Let's add a css class called `form-input--invalid` when the form input contains errors.
We can do that by using a `@HostBinding()`, injecting the `FormWrapperComponent` and using the form control that we pass
through an `@Input()` property.

```typescript
export class FormInputDirective {
    private readonly submitted$ = inject(FormWrapperComponent).submitted$; // a value type wouldn't be sufficient here
    @Input() public readonly formControl: FormControl;
    
    @HostBinding('class.form-input--invalid')
    public get invalid(): boolean {
        return (
            this.formControl?.invalid && (this.formControl?.touched || this.submitted$.value)
        )
    }
}
```

This will set the `form-input--invalid` class every time the control is invalid, and it has been touched or the form is submitted.

### Conditionally showing the validations with dependency injection

Now the validations are shown, we only want to show them when the form is submitted or when the form control is touched.
For that we can inject the `FormWrapperComponent` into the `<form-input-wrapper>` component and add an 
`*ngIf` statement on the `<ul>` element that checks if the form is submitted, or the form control is dirty.


```typescript
@Component({
    selector: 'form-input-wrapper',
    imports: [
        CommonModule,
        FormInputDirective,
        FormInputErrorsPipe,
    ],
    standalone: true,
    template: `
    <label>{{ label }}</label> <ng-content></ng-content>
    <ul *ngIf="(submitted$|async)|| 
        (formInputs?.first?.formControl.touched && formInputs?.first?.formControl?.errors)">
        <li *ngFor="let child of formInputs?.first?.formControl?.errors|formInputErrors">{{child}}</li>
    </ul>
`,

})
export class FormInputWrapperComponent {
    @Input() public readonly label: string;
    @ContentChildren(FormInputDirective, { descendants: true })
    public readonly formInputs: QueryList<FormInputDirective>;
    public readonly submitted$ = inject(FormWrapperComponent).submitted$;
}

```

### Custom validator

Creating a custom validator for `class-validator` is not that hard. 
Let's create a `noSpecialChars` validator that will throw an error when the user
types a special character in one of the name fields.
The usage of our validator looks like this:

We will use our decorator like this:
```typescript
function noSpecialChars(value: string): boolean {
    const regex = /[\!\@\#\$\%\^\&\*\)\(\+\=\.\<\>\{\}\[\]\:\;\'\"\|\~\`\_]/g;
    return !regex.test(value);
}
export class UserForm {
    @IsNotEmpty()
    @CustomValidator(noSpecialChars, {message: 'First name can not contain special chars'})
    public readonly firstName: string;
    
    @IsNotEmpty()
    @CustomValidator(noSpecialChars, {message: 'Last name can not contain special chars'})
    public readonly lastName: string;
    
    @Min(0)
    @Max(100)
    public readonly age: number;
}
```

We have written a `@CustomValidator()` because it's convenient to a pass validation function in that.
The implementation of the `@CustomValidator()` looks like the code sample below. For more information on this, I would
advice to consult [the docs](https://github.com/typestack/class-validator#custom-validation-decorators)

```typescript
import {
    registerDecorator,
    ValidationArguments,
    ValidationOptions,
} from 'class-validator';

export function CustomValidator(validatorFn: Function, options? : ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'custom',
            target: object.constructor,
            propertyName: propertyName,
            options: options,
            constraints: [],
            validator: {
                validate(value: any, args: ValidationArguments) {
                    return validatorFn(value);
                }
            }
        });
    };
}

```

## Conclusion

That's it folks! We have written some custom logic in order to write less form code in the future.
- We have less HTML that we need to write in the future
- We have a consistent way of placing the input and label
- We have a consistent way of showing validation errors and when to show them (if submitted or dirty)
- We have clean form classes that we decorate with validators
- We can write custom decorators and pass them to the `CustomValidator()` decorator.

Here you can check out the Stackblitz example:

<iframe src="https://stackblitz.com/edit/angular-ivy-ri8j21" width="100%"></iframe>

**A big thanks to the reviewers!!**
- [Aaron Delange](https://twitter.com/aaron_delange)
- [Jan-Niklas wortmann](https://twitter.com/niklas_wortmann)
- [Webdave](https://twitter.com/webdave_de)

