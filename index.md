---
title: Introduction to AI Concepts
permalink: index.html
layout: home
---

This page lists exercises associated with Microsoft skilling content on [Microsoft Learn](https://aka.ms/mslearn-ai-concepts-intro)

<hr>

{% assign labs = site.pages | where_exp:"page", "page.url contains '/Instructions/exercises'" %}
{% for activity in labs  %}
{% if activity.lab.title %}
### [{{ activity.lab.title }}]({{ site.github.url }}{{ activity.url }})


{% if activity.lab.level %}**Level**: {{activity.lab.level}} \| {% endif %}{% if activity.lab.duration %}**Duration**: {{activity.lab.duration}}{% endif %}

{% if activity.lab.description %}
*{{activity.lab.description}}*
{% endif %}
<hr>
{% endif %}
{% endfor %}

