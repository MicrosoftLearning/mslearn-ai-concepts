---
lab:
    title: 'Explore AI text analysis'
    description: 'Use AI to analyze text with a generative AI model.'
---

# Explore text analytics

In this exercise, you'll use a chat playground to interact with a generative AI model and have it analyze text.

This exercise should take approximately **15** minutes to complete.

## Summarize text

Let's start by using a generative AI model to summarize some text. In this exercise, we'll use the **Microsoft Phi 3 Mini model**; a small language model that is useful for general chat solutions in low bandwidth scenarios.

> **Note**: The model will run in your browser, on your local computer. Performance may vary depending on the available memory in your computer and your network bandwidth to download the model. 

1. In a web browser, open the **[Chat Playground](https://aka.ms/chat-playground){:target="_blank"}** at `https://aka.ms/chat-playground`.
1. Wait for the model to download and initialize.

    > **Tip**: The first time you open the chat playground, it may take a few minutes for the model to download. Subsequent downloads will be faster.

1. When the model is ready, enter the following prompt:

    ```
    Summarize this hotel review as a single, short paragraph:
    
    ---
    Review Title: Good Hotel and staff
    Hotel: The Royal Hotel, London, UK
    Review Date: March 2nd 2025
    
    Clean rooms, good service, great location near Buckingham Palace and Westminster Abbey, and so on. We thoroughly enjoyed our stay. The courtyard is very peaceful and we went to a restaurant which is part of the same group and is Indian ( West coast so plenty of fish) with a Michelin Star. We had the taster menu which was fabulous. The rooms were very well appointed with a comfortable bedroom and enormous bathroom.

    The hotel staff were very friendly and helpful. In particular, George at the front desk had some great recommendations for activities and sights that made our visit even more enjoyable.

    Thoroughly recommended.
    ---
    
    ```

    The response should summarize the review text.

## Extract named entities

1. Submit the following prompt:

    ```
    List the named entities you detect in this review.
    ```

    The response should identify entities such as places, dates, and people mentioned in the review.

## Evaluate sentiment

1. Submit the following prompt:

    ```
    Classify the sentiment of the review as "positive", "negative", or "neutral".
    ```

    The response should indicate the sentiment of the review.

## Try another review

1. At the top of the chat pane, use the **Clear chat** (&#128465;) button to restart the conversation.
1. Use the model to generate a summary of the following review text:

    ```
    ---
    Review Title: Tired hotel with poor service
    Hotel: The Capital Hotel, London, UK
    Review Date: May 6th 2025

    This is a old hotel (has been around since 1950's) and the room furnishings are average - becoming a bit old now and require changing. The internet didn't work and had to come to one of their office rooms to check in for my flight home. The website says it's close to the British Museum, but it's too far to walk.

    The hotel has no restaurant, and the room service options are very limited. What little food they did have available (Microwaved pastries and burgers) wasn't very nice.

    Zero stars - would not recommend!

    ---

    ```

1. Use the model to extract the named entities from the review.
1. Use the model to evaluate the sentiment of the review.

## Summary

in this exercise, you explored the use of a generative AI model to analyze text.

The semantic language embeddings in LLMs makes them inherently useful for linguistic analysis. Azure AI Foundry a wide range f language models, some of which are optimized for specific language processing tasks. Additionally, Azure AI Foundry includes the Azure AI Language service, which offers a specialized service with APIs for common text analytics tasks.
