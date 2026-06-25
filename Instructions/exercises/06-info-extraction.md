---
lab:
  title: Explore information extraction
  description: Use OCR and generative AI to extract information from documents.
  duration: 15
  level: 100
  islab: true
---

# Explore information extraction

In this exercise, you'll use optical character recognition (OCR) and generative AI to extract information from receipts. The goal of this exercise is to explore for yourself how information extraction from documents involves an OCR process to detect text, and a field extraction stage to map specific text strings to field values.

To complete this lab, you need a modern browser on a computer with sufficient hardware resources to load and run the models used by the AI agent app. On older or low-spec computers, the app may run very slowly or experience errors.

> **Minimum spec**
>
> - 64-bit CPU, 8 cores
> - GPU (recommended)
> - 8+ GB system RAM (16 GB recommended)
> - Enough storage to cache ~300MB–800MB model assets
> - Latest Chrome / Edge / Firefox with WASM SIMD enabled/available (WebGPU support is recommended; a WASM-based fallback is provided)

This exercise should take approximately **15** minutes to complete.

## Extract information from receipts

Suppose you need to extract data fields from scanned receipts to help automate an expense claim solution. You can use an AI technique called optical character recognition (OCR) to identify text and its location in images. By combining this text extraction with a generative AI model, you can then apply semantic analysis to associate individual text values with specific data fields - such as names, phone numbers, dates, amounts, and so on.

> **Note**: If your browser supports WebGPU, the Info Extractor app uses the *Microsoft Phi 3.5 Mini* model running on your computer's GPU. If not, the model run on CPU - with reduced response-generation quality. If *that* fails, a basic mode with no model and responses retrieved using text processing and pattern matching is activated. Performance may vary depending on the available memory in your computer and your network bandwidth to download the model.

1. In a web browser, open the **[Information Extractor](https://aka.ms/info-extractor){:target="_blank"}** app at `https://aka.ms/info-extractor`.
1. Wait for the model to download and initialize.

    > **Tip**: The first time you open the app, it may take a few minutes for the model to download. Subsequent downloads will be faster.<br><br>If the model is taking a long time to load, you can cancel and start in basic mode. You can switch between available modes at any time by using the *Use Generative AI* toggle.

1. While you're waiting for the model to initialize, in a new browser tab, download **[receipts.zip](https://aka.ms/receipts){:target="_blank"}** from `https://aka.ms/receipts` to your local computer.
1. Extract the downloaded archive in a local folder to see the files it contains. These files are the receipt images you will use AI to analyze.
1. Return to the browser tab containing the Information Extractor app, and verify that the model has loaded.
1. View the sample receipt that is pre-loaded.

    ![Screenshot of the Information Extractor app with an uploaded image.](./media/info-extractor-01.png)

    > **Tip**: You can switch between *light* and *dark* themes using the &#x263C; / &#x263E; toggle at the top right.

1. Run analysis on the sample image, and wait for the OCR and field extraction processes to complete.

    When the analysis is complete, the text regions in the scanned receipt identified by the OCR process are highlighted on the image, and specific values required for expense claim processing are identified by the field extraction process and listed in the **Fields** pane. The full OCR text results are in the **Result** tab.

    ![Screenshot of the Information Extractor app with an analyzed image.](./media/info-extractor-02.png)

1. Upload any of the receipt images, and view it in the main content area of the app.
1. Run analysis on the uploaded image and review the fields and results.
1. Repeat the process to analyze the other receipt images you downloaded (or a scanned receipt of your own).

## Summary

In this exercise, you explored how AI can be used to extract information from content using a combination of OCR and generative AI.

In Microsoft Foundry, the Content Understanding tool is a multimodal information extraction solution that you can use to analyze documents, images, audio files, and videos.

> **[Ask Anton](https://aka.ms/ask-anton){:target="_blank"}**<br/>![Anton avatar.](./media/anton-icon.png)<br/>If you have questions about some of the topics covered in this exercise, *[Ask Anton](https://aka.ms/ask-anton){:target="_blank"}* is a generative AI-based agent that you can ask about AI concepts and Microsoft Foundry.<br/><br/>*Ask Anton is not a supported Microsoft product or a component of Microsoft Learn or AI Skills Navigator. Just a sample AI agent for you to explore as you learn about what's possible with AI.*<br/><br/>If you *do* check out Ask Anton, we'd love you to *[tell us about your experience with the app](https://forms.office.com/r/fC0ndfBQeK){:target="_blank"}*!
