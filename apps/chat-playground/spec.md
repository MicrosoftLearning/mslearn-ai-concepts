This is a specification for a web chat app. The app should be a HTML 5 web site with a single HTML file supported by a single JavaScript file for code and a single CSS file for visual themes.

The web page should include a chat pane in which the user can enter questions and see responses.

The app should use the WebLLM module, which should be downloaded via CDN.

When the app first opens, the Microsoft Phi 3 Mini 4K Instruct model should be downloaded and set as the model for the Web LLM chat session. A download progress par should be shown to indicate that the model is initializing with the progress shown as a percentage. The rest of the UI should be disabled until the model has downloaded.

The app should use to support the chat functionality. The model should be given the default system message "You are an AI assistant that helps people find information" and whatever user prompt the user enters. The model's responses should be revealed as though they are being typed, but quickly. With each chat iteration, the system message and up to ten of the previous user prompts and responses should be added to the conversation thread to provide context.