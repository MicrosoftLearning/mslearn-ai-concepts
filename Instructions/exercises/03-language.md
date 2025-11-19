---
lab:
    title: 'Explore AI text analysis'
    description: 'Use AI to analyze text.'
---

# Explore text analytics

In this exercise, you'll use AI natural language processing functionality to analyze text.

This exercise should take approximately **15** minutes to complete.

## Open the text analyzer app and download text

We'll use a browser-based application that's based on a subset of the text analysis capabilities provided in the Azure AI Foundry language playground.

1. Download and extract **[text.zip](https://aka.ms/ai-text){:target="_blank"}** at `https://aka.ms/ai-text`. This archive contains multiple text documents that you'll use in this exercise.
1. In a web browser, open the **[Text Analyzer](https://aka.ms/text-analyzer){:target="_blank"}** at `https://aka.ms/text-analyzer`. This application provides the text analysis functionality you'll use.

> **Note**: The app uses a Microsoft Phi generative AI model to analyze text. This functionality requires GPU support in your browser. If no GPU is available, the app will fallback to use statistical analysis techniques. Even if your browser does support GPUs, you can choose to explicitly disable generative AI analysis to reduce memory requirements or if you just want to compare the results from both techniques. Generative AI analysis will take significantly longer than statistical analysis, but the results will often be better.

## Analyze sentiment

Sentiment analysis is a common NLP task. It's used to determine whether text conveys a positive, neutral or negative sentiment; which makes it useful for categorizing reviews, social media posts, and other subjective documents.

1. In the Text Analyzer app, ensure the **Analyze sentiment** tile is selected.
1. Upload **review-1.txt** from the folder where you extracted the downloaded text files.
1. Run the analysis and observe the resulting sentiment prediction.
1. Repeat the analysis for **review-2.txt**.

    You can experiment further by uploading your own text files or by typing text into the Text Analyzer interface.

## Detect language

Language detection is useful when you need to work with documents that may be written in multiple languages.

1. In the Text Analyzer app, select the **Detect language** tile.
1. Upload **language-1.txt** from the folder where you extracted the downloaded text files.
1. Run the analysis and observe the resulting language prediction.
1. Repeat the analysis for **language-2.txt** and **language-3.txt**.

    You can experiment further by uploading your own text files or by typing text into the Text Analyzer interface.

## Extract key phrases

Key phrase extraction can be a useful first step in identifying the main topics in a document.

1. In the Text Analyzer app, select the **Extract key phrases** tile.
1. Upload **document-1.txt** from the folder where you extracted the downloaded text files.
1. Run the analysis and observe the resulting key phrases.
1. Repeat the analysis for **document-2.txt** and **document-3.txt**.

    You can experiment further by uploading your own text files or by typing text into the Text Analyzer interface.

## Extract named entities

Named entities are the people, places, dates, and other important items mentioned in text.

1. In the Text Analyzer app, select the **Extract named entities** tile.
1. Upload **document-1.txt** from the folder where you extracted the downloaded text files.
1. Run the analysis and observe the resulting named entities.
1. Repeat the analysis for **document-2.txt** and **document-3.txt**.

    You can experiment further by uploading your own text files or by typing text into the Text Analyzer interface.

## Summarize text

Summarization is a way to distill the main points in a document into a shorter amount of text.

1. In the Text Analyzer app, select the **Summarize text** tile.
1. Upload **document-1.txt** from the folder where you extracted the downloaded text files.
1. Run the analysis and observe the resulting summarization.
1. Repeat the analysis for **document-2.txt** and **document-3.txt**.

    You can experiment further by uploading your own text files or by typing text into the Text Analyzer interface.

## Summary

in this exercise, you explored the use of a AI to analyze text, using NLP functionality in a browser-based app.

To perform language analytics at scale, you should use a cloud-based AI platform like Azure AI Foundry. Azure AI Foundry a wide range of language models, some of which are optimized for specific language processing tasks. Additionally, Azure AI Foundry includes the Azure AI Language service, which offers a specialized service with APIs for common text analytics tasks.
