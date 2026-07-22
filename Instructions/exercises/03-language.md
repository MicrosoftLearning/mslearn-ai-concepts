---
lab:
  title: Explore AI text analysis
  description: Use AI to analyze text.
  duration: 15
  level: 100
  islab: true
---

# Explore text analytics

![Image of Anton.](./media/anton-icon.png)<br/>**Hi, I'm Anton.**<br/>I'll be here to help you with hints and tips as you work through this lab.

You can also interact with me in the *Ask Anton* app.

<details>
<strong><i><a href="https://aka.ms/choose-anton" target="_blank">Ask Anton</a></i></strong> is available in two forms at <code>https://aka.ms/choose-anton</code>:
<ul>
<li><strong>Azure-based</strong>: Best experience <i>(requires an Azure subscription and deployment of a model in a Foundry project)</i>.</li>
<li><strong>Browser-based</strong>: Use a small language model in your browser <i>(reduced functionality - may be slow or work only in "basic" mode in older/lower-spec devices)</i>.</li>
</ul>
<blockquote><i>Ask Anton is <u>not</u> a supported Microsoft product or a component of Microsoft Learn or AI Skills Navigator.</i>
</blockquote>
</details>
<hr/>

In this lab, you'll use AI natural language processing functionality to analyze text. The goal of this exercise is to explore common applications of text analysis techniques. We'll use browser-based applications that are based on simplified implementations of the chat and language playgrounds in the Microsoft Foundry portal.

To complete this lab, you need a modern browser on a computer with sufficient hardware resources to load and run the models used by the *Chat Playground* app. On older or low-spec computers, the app may run very slowly or experience errors.

> **Minimum spec**<br/>If your computer does not meet these requirements, the AI model may not run successfully. However, the app does support a failsafe *Basic* mode in which no model is used; which provides simpler, but faster responses.<br/>
>
> - 64-bit CPU, 8 cores
> - GPU (recommended)
> - 8+ GB system RAM (16 GB recommended)
> - Enough storage to cache ~300MB–800MB model assets
> - Latest Chrome / Edge / Firefox with WASM SIMD enabled/available (WebGPU support is recommended; a WASM-based fallback is provided)
> - Audio hardware (mic and speaker) required for speech functionality

This exercise should take approximately **15** minutes to complete.

## Use a generative AI model to summarize text

Let's start by using a chat interface to submit prompts to a generative AI model to perform a common text analysis task - summarizing text. In this exercise, we'll use a small language model that is useful for general chat solutions in low bandwidth scenarios.

> If your browser supports WebGPU, the chat playground uses the *Microsoft Phi 3.5 Mini* model running on your computer's GPU. If not, the model runs on CPU - with reduced response-generation quality. If *that* fails, a basic mode with no model and responses retrieved from Wikipedia is activated. Performance may vary depending on the available memory in your computer and your network bandwidth to download the model. After opening the app, use the **?** (*About this app*) icon in the chat area to find out more.

1. In a web browser, open the **[Chat Playground](https://aka.ms/chat-playground){:target="_blank"}** at `https://aka.ms/chat-playground`.
1. Wait for the model to download and initialize.

    > ![Image of Anton.](./media/anton-icon.png)<br>**Tip**: The first time you download a model, it may take a few minutes. Subsequent downloads will be faster.<br/>If the model is taking a *very* long time to load, you can cancel and start in **Basic** mode. You can switch between available models at any time in the main application user interface; but older or low-spec devices may run the Phi model slowly or experience errors.

1. In the pane on the left, change the default **Instructions** to:

    ```
   You are an AI assistant that analyzes and summarizes text.
    ```

    Now, suppose you've found an old article from a computer trade magazine, that includes a review of a home computer that was launched in the 1980s

1. Enter the following prompt (you can press CTRL+ENTER for a new line):

    ```
   Summarize this review as a single short paragraph:

   Commodore 64: A Strong Contender in the Home Computer Market

   Commodore's long-awaited Commodore 64 has finally arrived on dealers' shelves, and first impressions suggest that the company may have another substantial success on its hands. Priced aggressively and boasting a full 64K of RAM, the machine offers specifications that would have seemed remarkable in a home computer only a short time ago. Its colourful graphics and impressive sound capabilities place it among the most capable entertainment-oriented systems currently available.

   Particularly noteworthy is the SID sound generator, which produces effects and musical output far beyond what users have come to expect from machines in this price bracket. Software houses are already expressing strong interest in the platform, and the combination of advanced graphics and sound should make the Commodore 64 an attractive proposition for both game developers and serious hobbyists alike.

   The machine is not without its shortcomings, however. The keyboard, while serviceable, lacks the solid feel of some competing systems, and Commodore's documentation will do little to reassure newcomers to computing. Furthermore, prospective purchasers may wish to consider the total cost of ownership, as disk drives and other peripherals remain relatively expensive. Nevertheless, the Commodore 64 enters the market as one of the most compelling home computers currently available and is likely to be a significant force in the months ahead.
    ```

    The model should generate a summary of the article.

    ![Screenshot of summarization results in the chat playground.](./media/text-03.png)

## Use a specialized language analysis tool

While a large language model that's trained for general generative AI workloads can often do a great job of text analysis, sometimes a more specialized tool can be used by an agent to get more predictable results.

1. In your web browser, navigate away from the Chat Playground app to the **[Language Playground](https://aka.ms/language-app){:target="_blank"}** app at `https://aka.ms/language-app`.
1. Wait until the model is ready.

    > ![Image of Anton.](./media/anton-icon.png)<br>**Tip**: The Language Playground app uses the same Phi 3.5-mini model as the Chat Playground app, with a fallback *Basic* mode that uses statistical text analysis techniques to perform language detection and personally identifiable information (PII) redaction.

### Detect language

In scenarios where text could potentially be in one of multiple languages, the first step in an analysis workflow is often to determine the primary language so the text can be routed to the most appropriate model or agent for the subsequent processing.

1. In the Language Playground app, ensure that the **Language detection** analyzer is selected.
1. In the **Input text** list, select one of the provided sample documents. Then use the **Detect** button to detect the language in which the sample is written.

    ![Screenshot of a detected language in the Language Playground](./media/text-04.png)

    > ![Image of Anton.](./media/anton-icon.png)<br>**Tip**: You can switch between *light* and *dark* themes using the &#x263C; / &#x263E; toggle at the top right.

1. After reviewing the detected language details, use the **Edit** button to make the input text editable again. Now you can:
    - Select another sample.
    - Type your own text.
    - Upload a text file.

    For example, suppose you encounter a vintage computer, and you're curious about its history. You find a label that contains the following text on the computer casing. Enter the text and detect the language it is written in:

    ```
   CPC 464
   Art.-Nr.: 31020
   Serien-Nr.: 464-87-041256
   220–240 V ~ 50 Hz
   40 W
   Hergestellt in Korea
   SCHNEIDER RUNDFUNKWERKE AG
   Türkheim/Unterallgäu
   Bundesrepublik Deutschland
    ```

1. Experiment with input of your own. The Language Playground app is designed to support detection of the following languages:

    - English
    - French
    - Spanish
    - Portuguese
    - German
    - Italian
    - Simplified Chinese
    - Japanese
    - Hindi
    - Arabic
    - Russian

    > ![Image of Anton.](./media/anton-icon.png)<br>**Tip**: You can use the [Bing Translator](https://www.bing.com/translator){:target="_blank"} at `https://www.bing.com/translator` to generate text in languages you don't speak!

### Identify PII in text

To comply with privacy policies and laws, organizations often need to detect and redact personally identifiable information (PII) such as names, addresses, phone numbers, email addresses, and other personal details.

1. In the Language Playground app, select the **Text PII extraction** analyzer.
1. In the **Input text** list, select one of the provided sample documents. Then use the **Detect** button to detect PII values in the text.

    ![Screenshot of a detected PII in the Language Playground](./media/text-05.png)

1. After reviewing the detected PII details, use the **Edit** button to make the input text editable again. Now you can:
    - Select another sample.
    - Type your own text.
    - Upload a text file.

    For example, suppose you find the following invoice in the box of a vintage computer you have purchased:

    ```
   Tailspin Toys Ltd
   Invoice
   14 September 1984
    
   Customer:
     Margaret Ellis
     128 High Street, Reading, Berkshire RG1 2AB
     Telephone: 021 685 4215
    
   Item: ZX Spectrum 48K home computer (includes power supply, RF lead, and user manual)
   Price: £79.00
   Payment received:  £79.00
    ```

    Enter this text and determine what personally identifiable information it contains.

1. Experiment with input of your own. The Language Playground app is designed to support detection of the following types of PII:

    - People names
    - Email addresses
    - Phone numbers
    - Street addresses

    > **Note**: The Language Playground app uses a combination of generative AI, statistical analysis, and regular expression matching to detect potential PII fields. It's <u>not</u> designed as a production-level tool and is likely to detect false positives and fail to detect PII fields in some cases - particularly when using pattern-matching mode.

## Summary

In this exercise, you explored the use of a AI to analyze text, using NLP functionality in browser-based apps.

While the small models and statistical techniques in this exercise are sufficient to demonstrate the concepts, to perform high-quality language analytics at scale, you should use a cloud-based AI platform like Microsoft Foundry. Microsoft Foundry includes a wide range of generative AI models, many of which are extremely proficient at language processing tasks. Additionally, Azure Language in Microsoft Foundry tools offers a specialized service with APIs for common text analytics tasks.

> ![Anton avatar.](./media/anton-icon.png)<br/>If you used the [*Ask Anton*](https://aka.ms/ask-anton){:target="_blank"} app during this lab, we'd love you to [tell us about your experience with it](https://forms.office.com/r/fC0ndfBQeK){:target="_blank"}!
