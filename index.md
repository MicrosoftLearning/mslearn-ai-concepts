---
title: Introduction to AI Concepts
permalink: index.html
layout: home
---

This page lists exercises associated with  skilling content on [Microsoft AI Skills Navigator](https://aiskillsnavigator.microsoft.com/explore/search/learningpath-64735f4d575e2684eefd5b9e24b2b9d7b4126931707290aa539166a63501f4d6)

<hr>

{% assign labs = site.pages | where_exp:"page", "page.url contains '/Instructions/exercises'" %}
{% for activity in labs  %}
{% if activity.lab.islab == true %}
{% if activity.lab.title %}

### [{{ activity.lab.title }}]({{ site.github.url }}{{ activity.url }})

{% if activity.lab.level %}**Level**: {{activity.lab.level}} \| {% endif %}{% if activity.lab.duration %}**Duration**: {{activity.lab.duration}}{% endif %}

{% if activity.lab.description %}
*{{activity.lab.description}}*
{% endif %}
<hr>
{% endif %}
{% endif %}
{% endfor %}
