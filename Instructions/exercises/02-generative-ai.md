---
lab:
  title: Explore generative AI
  description: Use a chat playground to interact with a generative AI model
  duration: 15
  level: 100
  islab: true
---

# Explore generative AI

In this exercise, you'll use a chat playground to interact with a generative AI model, and explore how it could be used to support an employee expenses agent that helps employees with expense claim policies and processes.

To complete this exercise, you need a modern browser on a computer with sufficient hardware resources to load and run the models used by the apps. On older or low-spec computers, the apps may run very slowly or experience errors.

> **Minimum spec**
>
> - 64-bit CPU, 4+ physical cores (8 logical threads preferred)
> - GPU required for the default Phi 3-mini model.
> - 8+ GB system RAM (16 GB recommended)
> - Enough storage to cache ~300MB–800MB model assets
> - Latest Chrome / Edge / Firefox with WASM SIMD enabled/available (WebGPU support is required for the default model; a WASM-based fallback is provided)
> - Audio hardware (mic and speaker) required for speech functionality

If your computer does not meet these requirements, the CPU-based fallback model may not run successfully. However, the apps support a failsafe "Basic" mode in which no model is used; which you may be able to use.

This exercise should take approximately **15** minutes to complete.

## Chat with a model

Let's start by using a chat interface to submit prompts to a generative AI model. In this exercise, we'll use a small language model that is useful for general chat solutions in low bandwidth scenarios.

> **Note**: If your browser supports WebGPU, the chat playground uses the *Microsoft Phi 3 Mini* model running on your computer's GPU. If not, the *Microsoft Phi 2* model is used, running on CPU - with reduced response-generation quality. Performance for either model may vary depending on the available memory in your computer and your network bandwidth to download the model. On older or low-spec devices, you may get more reliable behavior by switching to the *None* model even if CPU or GPU is available. After opening the app, use the **?** (*About this app*) icon in the chat area to find out more.

1. In a web browser, open the **[Chat Playground](https://aka.ms/chat-playground){:target="_blank"}** at `https://aka.ms/chat-playground`.
1. Wait for the model to download and initialize.

    > **Tip**: The first time you download a model, it may take a few minutes. Subsequent downloads will be faster. If your browser or operating system does not support WebGPU models, the fallback CPU-based model will be selected (which provides slower performance and reduced quality of response generations). If *that* fails, a basic mode with no model and responses retrieved from Wikipedia is used.

1. When the model is ready, enter the prompt `What is expense management?`, and review the response (which may take some time to be generated).

    ![Screenshot of the chat playground.](./media/gen-ai-01.png)

1. In the pane on the left, in the **Instructions** text area, change the model's instructions to `You are an AI assistant that provides short, concise answers to expense-related questions.`

    Instructions, sometimes known as a *system prompt*, are used to provide the model with an overall context for its responses. You can use the system prompt to provide guidelines about format, style, and constraints about what the model should and should not include in its responses.

1. At the top of the chat pane, use the **New chat** (&#128172;) button to restart the conversation. This removes all conversation history.

1. Now try the same prompt as before (`What is expense management?`) and review the output.

1. Enter another prompt, such as `Tell about per-diem allowances.` and review the response.
1. Now try a follow-up question: `How are they reimbursed?`

    > **Note**: Generative AI chat applications often include chat history in the prompt; so the context of the conversation is retained between messages (for example, in the follow-up prompt `How are they reimbursed?`, "they" is interpreted as relating to per-diem allowances).

## Ground responses with data

Generative AI is the foundation for *agentic* solutions; in which AI agents can assist you and act on your behalf. To accomplish this, agents need *tools* that allow them to access specific knowledge and perform tasks.

In the case of our expenses assistant, we need to provide a tool with access to the company's expenses policy documentation.

1. Open a new browser tab, and view the **[expenses guide](https://aka.ms/expenses-txt){:target="_blank"}** at `https://aka.ms/expenses-txt`. We'll use this to ground the model, so it has some context for questions about expenses.

    > **Note**: This is a very small document for the purposes of this exercise. In a real scenario, an AI agent might have access to large volumes of data; usually in the form of a *vector index*.

1. Save the **expenses.txt** file on your local computer.
1. Return to the tab containing the chat playground, and in the pane on the left, expand the **Tools** section if it's not already expanded.
1. Upload the **expenses.txt** file. The chat is automatically restarted.
1. Enter the prompt `How do I submit a claim?` and view the response.

    This time the response should be informed by the information in the expenses data source.

1. Try a few more expenses-related prompts: `How much can I spend on a taxi?`, `What about a hotel?` and `Can I claim the cost of my dinner?`

    **Note**: The small amount of data and the limited capabilities of the small models used in this exercise may result in some inaccurate responses; but the principle of *retrieving* contextual information, using it to *augment* the prompt, and *generating* responses based on the data is a common pattern in generative AI solutions known as *Retrieval Augmented Generation* (or *RAG*).

## Explore client code

You've seen how models and agents can be used in a pre-provided chat playground, but how do developers build apps and agents that submit prompts to models and process responses?

One of the most commonly used application programming interfaces (APIs) used to develop apps that work with LLMs is the OpenAI API - and in particular the Python SDK for the OpenAI API.

1. Navigate away from the Chat Playground app to the **[Model Coder](https://aka.ms/model-coder){:target="_blank"}** app at `https://aka.ms/model-coder` and wait for the Python environment and model to load.

    > **Note**: As with the chat playground, the first time the model is loaded it may take a minute or so. If your browser supports WebGPU, the Microsoft Phi 3-mini model will be loaded using the WebLLM engine. Otherwise, the SmolLM2 model will be used in wllama, running in CPU mode.

    ![Screenshot of Model Coder](./media/model-coder.png)

    This app provides an in-browser sandbox with a Python library that encapsulates the most common classes in the OpenAI SDK. You'll use it to write and run real Python code that submits prompts to a local LLM running in the browser.

1. When the model has loaded, ensure the **Blank Page** sample is selected and that there is no existing code in the **Editor** pane. Then add the following code to implement a simple AI agent that can help you categorize expenses:

    ```python
   # import namespace
   from openai import OpenAI
    
   def main():
    
        try:
            # Configuration settings 
            endpoint = "https://local/openai"
            key = "key123"
            model_name = "local-llm"
    
            # Initialize the OpenAI client
            openai_client = OpenAI(
                base_url=endpoint,
                api_key=key
            )
            
            # Get a response to a prompt
            input_text = input('\nAgent: Enter a question about expense categories.\nYou: ')
            response = openai_client.responses.create(
                        model=model_name,
                        instructions="""
                        You are an AI assistant that provides short, concise answers to expense-related questions.
                        """,
                        input=input_text
            )
            print(f"Agent: {response.output_text}")
                
    
        except Exception as ex:
            print(ex)
    
   if __name__ == '__main__':
        main()
    ```

    This code uses the OpenAI *Responses* API, which is commonly used to submit prompts to models and agents.

1. Use the **&#9654;** (Run code) button on the toolbar to run the Python code.

    The code runs in the **Terminal** pane at the bottom of the screen (it may take a minute or so to run).

1. When prompted, enter a question about expense categories; such as:

    ```
   What's a purchasing card?
    ```

1. Wait for the response, and then review the answer that was returned.

    > **Note**: The model used in this app is a small language model with limited training data and a small context window. Responses may not be accurate. However, the point of the exercise is to explore the OpenAI SDK syntax to submit prompts and receive responses.

## Summary

In this exercise, you explored a generative AI model in a chat playground. You've seen how a model's responses can be affected by changing the system prompt, configuring model parameters, and by adding data. Finally, you've explored how developers can build generative AI client applications through OpenAI-compatible APIs in Python.

The interface and techniques used in this exercise are similar to those in Microsoft Foundry portal; a platform for building AI apps and agents in the Microsoft Azure cloud. You can use the OpenAI SDK to connect to Microsoft Foundry endpoints and work with your models and agents there.
