---
lab:
    title: 'Explore generative AI'
    description: 'Use a chat playground to interact with a generative AI model'
---

# Explore generative AI

In this exercise, you'll use a chat playground to interact with a generative AI model. The goal of this exercise is to explore the effect of system prompts, model parameters, and grounding models with data.

This exercise should take approximately **15** minutes to complete.

## Chat with a model

Let's start by using a chat interface to submit prompts to a generative AI model. In this exercise, we'll use the **Microsoft Phi 3 Mini model**; a small language model that is useful for general chat solutions in low bandwidth scenarios.

> **Note**: The model will run in your browser, on your local computer. Performance may vary depending on the available memory in your computer and your network bandwidth to download the model. If WebLLM models are not supported in your browser, a fallback mode with reduced functionality will be enabled. After opening the app, use the **?** (*About this app*) icon in the chat area to find out more.

1. In a web browser, open the **[Chat Playground](https://aka.ms/chat-playground){:target="_blank"}** at `https://aka.ms/chat-playground`.
1. Wait for the model to download and initialize.

    > **Tip**: The first time you open the chat playground, it may take a few minutes for the model to download. Subsequent downloads will be faster.

1. When the model is ready, enter a prompt such as `Who was Ada Lovelace?`, and review the response.

    ![Screenshot of the chat playground.](./media/gen-ai-01.png)

1. Enter a follow-up prompt, such as `Tell me more about Charles Babbage.` and review the response.

    > **Note**: When using an LLM such as the Microsoft Phi model, chat  applications often include the conversation history in the prompt; so the context of the conversation is retained between messages (for example, a follow-up prompt like `Who was her father?` would be interpreted as relating to Ada Lovelace). In this application, if you are using the "None" fallback model, the conversation context is <u>not</u> retained.

1. At the top of the chat pane, use the **New chat** (&#128172;) button to restart the conversation. This removes all conversation history.
1. Enter a new prompt, such as `What was ENIAC?` and view the response.

## Experiment with system prompts

A system prompt is used to provide the model with an overall context for its responses. You can use the system prompt to provide guidelines about format, style, and constraints about what the model should and should not include in its responses.

1. In the pane on the left, in the **Instructions** text area, change the system prompt to `You are an AI assistant that provides short and concise answers using simple language. Limit responses to a single sentence.`
1. Now try the same prompt as before (`What was ENIAC?`) and review the output.
1. Continue to experiment with different system prompts to try to influence the kinds of response returned by the model.

> **Note**: If you are using the "None" fallback model, changing the system prompt has no effect other than shortening responses if the system prompt includes "short", "concise", "summary", or "summarize".

1. When you have finished experimenting, change the system prompt back to `You are an AI assistant that helps people find information.`

## Experiment with model parameters

Model parameters control how the model works, and can be useful for restricting the size of its responses (measured in *tokens*) and controlling how "creative" its responses can be.

1. Use the **New chat** (&#128172;) button to restart the conversation.
1. In the pane on the left, next to the selected model, select **Parameters** (&#128880;).
1. Review the parameter settings; then, without changing them, enter a prompt like `What is Moore's law?` and review the response
1. Experiment by changing the parameter values and repeating the same prompt. You should see some differences in behavior from the model. For example, changing the **Temperature** modifies the randomness of the model's word selection, changing the "creativity" of the responses (to the point that too high a temperature can cause nonsensical responses).

    ***Tip**: You can use the **Stop generation** button in the chat pane to stop the response.*

    > **Note**: If you are using the "None" fallback model, maximizing the *Temperature* parameter will result in some randomization of the response text. This behavior is intended to simulate the effect of high temperature settings in a real generative AI model. No other parameter changes will affect the fallback model.

1. When you've finished experimenting, reset the parameters to their default values.

## Ground responses with data

Generative AI is the foundation for *agentic* solutions; in which AI agents can assist you and act on your behalf. Agents are more than general purpose chat apps. They usually have a particular focus, and use knowledge and tools to perform their duties.

For example, let's suppose an organization wants to use a generative AI agent to help employees with expense claims.

1. Change the system prompt to `You are a helpful AI assistant who supports employees with expense claims.` and start a new chat conversation.
1. Enter an expenses-related prompt, such as `How much can I claim for a taxi?` and view the response.

    The response is likely to be generic. Accurate; but not particularly helpful to the employee. We need to give the agent some knowledge about the company's expense policies and procedures.

1. Open a new browser tab, and view the **[expenses guide](https://aka.ms/expenses-txt){:target="_blank"}** at `https://aka.ms/expenses-txt`. We'll use this to ground the model, so it has some context for questions about expenses.

    > **Note**: This is a very small document for the purposes of this exercise. In a real scenario, an AI agent might have access to large volumes of data; usually in the form of a *vector index*.

1. Save the **expenses.txt** file on your local computer.
1. Return to the tab containing the chat playground, and in the pane on the left, expand the **Tools** section if it's not already expanded.
1. Upload the **expenses.txt** file. The chat is automatically restarted.
1. Enter the same expenses-related prompt (for example, `How much can I claim for a taxi?`) and view the response.

    This time the response should be informed by the information in the expenses data source.

1. Try a few more expenses-related prompts, like `What about a hotel?` or `Can I claim the cost of my dinner?`

## Summary

in this exercise, you explored a generative AI model in a chat playground. You've seen how a model's responses can be affected by changing the system prompt, configuring model parameters, and by adding data.

The interface and techniques used in this exercise are similar to those in Microsoft Foundry portal; a platform for building AI apps and agents in the Microsoft Azure cloud.
