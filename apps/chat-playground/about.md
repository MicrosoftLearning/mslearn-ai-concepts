## About this app

This app is designed as a learning aid for anyone seeking to become familiar with Generative AI apps and agents. It's based on the user interface in Azure AI Foundry portal, but does not use any Azure cloud services.

The language model used by the app is the **Microsoft Phi 3** mini SLM, hosted in the WebLLM module. WebLLM requires a modern browser that supports the WebGPU API, and an integrated or dedicated GPU on the computer. If WebLLM fails to load, the app is designed to fallback to a simpler mode in which it used Wikipedia as a knowledge source instead of a generative AI model. In this mode, responses may be less relevant and some functionality may not be available.

The app also makes use of the MobileNetV3 model and the TensorFlow.js framework to implement image classification, and the Web Speech API to support speech recognition and synthesis.

### Known issues

- The initial download of the Microsoft Phi model may take a few minutes - particularly on low-bandwidth connections. Subsequent downloads should be quicker.
- Some GPU-enabled computers (particularly those with ARM-based processors) do not support WebGPU without enabling the **Unsafe WebGPU Support** browser flag. If your browser fails to load the Microsoft Phi model, you can try enabling this flag at edge://flags on Microsoft Edge or chrome://flags on Google Chrome. Disable it again when finished!
- Microsoft Edge on ARM-based computers does not support Web Speech for speech recognition (speech to text), and returns a network error when attempting to capture input from the mic. Speech synthesis (text to speech) should still work.
- Older computers with slower processors and low amounts of memory may struggle to use WebLLM. You can switch the model to "None" to use the Wikipedia-based fallback option.