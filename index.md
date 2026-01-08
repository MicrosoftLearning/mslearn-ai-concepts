---
title: Introduction to AI Concepts
permalink: index.html
layout: home
---

This page lists exercises associated with Microsoft skilling content on [Microsoft Learn](https://aka.ms/mslearn-ai-concepts-intro)

{% assign labs = site.pages | where_exp:"page", "page.url contains '/Instructions/exercises'" %}
{% for activity in labs  %}
<hr>
### [{{ activity.lab.title }}]({{ site.github.url }}{{ activity.url }})

{{activity.lab.description}}

{% endfor %}

<hr>
