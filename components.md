---
layout: page
title: Components
permalink: /components/
description: This is the components page
---

<h2 class="section-title h3">Fonts</h2>

Primary Font: 'Alegreya', sans-serif

*Primary Font Italic: 'Alegreya', sans-serif*

**Primary Font Bold: 'Alegreya', sans-serif**

<p class="font-secondary">Secondary Font: 'Open Sans', serif</p>

<p class="font-secondary"><em>Secondary Font Italic: 'Open Sans', serif</em></p>

<p class="font-secondary"><strong>Secondary Font Bold: 'Open Sans', serif</strong></p>

<h2 class="section-title h3">Links</h2>
Lorem ipsum dolor sit amet, consectetur [jekyllrb.com](http://jekyllrb.com/) adipisicing elit. Illo, enim!

<h2 class="section-title h3">Headings</h2>

# Heading Level 1

## Heading Level 2

### Heading Level 3

#### Heading Level 4

##### Heading Level 5

###### Heading Level 6

<h2 class="section-title h3">Paragraph</h2>

<p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Voluptas officiis iure, mollitia, vero magnam error assumenda aspernatur itaque ratione quod minima laborum culpa non, sed provident nisi ullam! Quis, laborum.</p>

<h2 class="section-title h3">Blockquote</h2>

> Justin is hip. Pawnee is the opposite of hip. People in this town are just now getting into Nirvana. I don’t have the heart to tell them what’s gonna happen to Kurt Cobain in 1994.

<h2 class="section-title h3">Hr</h2>

---

<h2 class="section-title h3">Unordered List</h2>

* Unordered list can use asterisks
* Unordered list can use asterisks
    * Unordered list can use asterisks
    * Unordered list can use asterisks
* Unordered list can use asterisks

<h2 class="section-title h3">Ordered List</h2>

1. Unordered list can use asterisks
2. Unordered list can use asterisks
    2. Unordered list can use asterisks
    2. Unordered list can use asterisks
3. Unordered list can use asterisks

<h2 class="section-title h3">Icons</h2>

<svg class="icon icon-twitter"><use xlink:href="#icon-twitter"></use></svg>
<svg class="icon icon-facebook"><use xlink:href="#icon-facebook"></use></svg>
<svg class="icon icon-youtube"><use xlink:href="#icon-youtube"></use></svg>
<svg class="icon icon-instagram"><use xlink:href="#icon-instagram"></use></svg>
<svg class="icon icon-github"><use xlink:href="#icon-github"></use></svg>
<svg class="icon icon-linkedin"><use xlink:href="#icon-linkedin"></use></svg>
<svg class="icon icon-skype"><use xlink:href="#icon-skype"></use></svg>
<svg class="icon icon-behance"><use xlink:href="#icon-behance"></use></svg>
<svg class="icon icon-feed"><use xlink:href="#icon-feed"></use></svg>
<svg class="icon icon-google-plus"><use xlink:href="#icon-google-plus"></use></svg>
<svg class="icon icon-vine"><use xlink:href="#icon-vine"></use></svg>
<svg class="icon icon-pinterest"><use xlink:href="#icon-pinterest"></use></svg>

<h2 class="section-title h3">Syntax Highlight</h2>

<pre>
<code class="language-scss">// Reset and dependencies
@import "bootstrap/normalize";
@import "bootstrap/print";
// @import "bootstrap/glyphicons"; desactivamos los glyphicons</code>
</pre>

<h2 class="section-title h3">Author</h2>

<div class="author">  
    <div class="media-object">
        <img src="{{ site.baseurl }}/img/{{ site.author_image }}" alt="{{ site.author_name }}">
        <div class="media-bd">
            <span class="written h5">Written by</span>
            <h4><a href="{{ site.author_url }}">{{ site.author_name }}</a></h4>
            <p>{{ site.author_bio }}</p>
        </div>
    </div>
</div>