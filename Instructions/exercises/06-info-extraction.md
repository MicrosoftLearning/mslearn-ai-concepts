---
lab:
    title: 'Explore information extraction'
    description: 'Use OCR and generative AI to extract information from documents.'
---

# Explore information extraction

In this exercise, you'll use optical character recognition (OCR) and generative AI to extract information from receipts.

This exercise should take approximately **15** minutes to complete.

## Extract information from receipts

Suppose you need to extract data fields from scanned receipts to help automate an expense claim solution. You can use an AI technique called optical character recognition (OCR) to identify text and its location in images. By combining this text extraction with a generative AI model, you can then apply semantic analysis to associate individual text values with specific data fields - such as names, phone numbers, dates, amounts, and so on.

> **Note**: The models used in this exercise will run in your browser, on your local computer. Performance may vary depending on the available memory in your computer and your network bandwidth to download the model. If WebLLM models are not supported in your browser, a fallback mode with reduced functionality will be enabled, allowing you to use OCR to extract text and statistical heuristics to match fields.

1. In a web browser, open the **[Information Extractor](https://aka.ms/info-extractor){:target="_blank"}** app at `https://aka.ms/info-extractor`.
1. Wait for the model to download and initialize.

    > **Tip**: The first time you open the app, it may take a few minutes for the model to download. Subsequent downloads will be faster.

1. While you're waiting for the model to initialize, in a new browser tab, download **[receipts.zip](https://aka.ms/receipts){:target="_blank"}** from `https://aka.ms/receipts` to your local computer.
1. Extract the downloaded archive in a local folder to see the files it contains. These files are the receipt images you will use AI to analyze.
1. Return to the browser tab containing the Information Extractor app, and verify that the model has loaded.
1. View the sample receipt that is pre-loaded.

    ![Screenshot of the Information Extractor app with an uploaded image.](./media/info-extractor-01.png)

1. Run analysis on the sample image, and wait for the OCR and field extraction processes to complete.

    When the analysis is complete, the text regions in the scanned receipt identified by the OCR process are highlighted on the image, and specific values required for expense claim processing are identified by the field extraction process and listed in the **Fields** pane. The full OCR text results are in the **Result** tab.

    ![Screenshot of the Information Extractor app with an analyzed image.](./media/info-extractor-02.png)

1. Upload any of the receipt images, and view it in the main content area of the app.
1. Run analysis on the uploaded image and review the fields and results.
1. Repeat the process to analyze the other receipt images you downloaded (or a scanned receipt of your own).

## Summary

in this exercise, you explored how AI can be used to extract information from content using a combination of OCR and generative AI.

In Microsoft Foundry, the Content Understanding tool is a multimodal information extraction solution that you can use to analyze documents, images, audio files, and videos.
