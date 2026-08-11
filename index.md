---
title: Introduction to AI Concepts
permalink: index.html
layout: home
---

This page lists exercises associated with  skilling content on [Microsoft AI Skills Navigator](https://aiskillsnavigator.microsoft.com/explore/search/learningpath-64735f4d575e2684eefd5b9e24b2b9d7b4126931707290aa539166a63501f4d6)

> These exercises use browser-based apps that run an AI model locally in your browser to provide a simplified version of real application interfaces like Microsoft Foundry, without requiring an Azure subscription. The performance of the apps may vary depending on the hardware spec of your computer,<br/>If you have an Azure subscription, you can explore how to implement AI capabilities in Microsoft Foundry in the [Get started with AI apps and agents in Azure](https://microsoftlearning.github.io/mslearn-ai-fundamentals/) exercises; which parallel the conceptual exercises in this site.

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
