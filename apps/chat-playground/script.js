import * as webllm from "https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.46/+esm";

class ChatPlayground {
    constructor() {
        // Core state
        this.engine = null;
        this.isModelLoaded = false;
        this.conversationHistory = [];
        this.isGenerating = false;
        this.isSpeaking = false;
        this.stopRequested = false;
        this.typingState = null;
        this.currentSystemMessage = "You are an AI assistant that helps people find information.";
        this.currentModelId = null;

        // Configuration objects
        this.config = {
            modelParameters: {
                temperature: 0.7,
                top_p: 0.9,
                max_tokens: 1000,
                repetition_penalty: 1.1
            },
            fileUpload: {
                content: null,
                fileName: null,
                maxSize: 3 * 1024, // 3KB
                allowedTypes: ['.txt']
            },
            speechSettings: {
                speechToText: false,
                textToSpeech: false,
                voice: '',
                speed: '1x',
                sampleText: 'Hi, how can I help you today?'
            },
            visionSettings: {
                imageAnalysis: false,
                maxImageSize: 5 * 1024 * 1024, // 5MB
                allowedImageTypes: ['image/jpeg', 'image/jpg', 'image/png']
            }
        };

        // Initialize speech settings directly
        this.speechSettings = {
            speechToText: false,
            textToSpeech: false,
            voice: '',
            speed: '1x',
            sampleText: 'Hi, how can I help you today?'
        };

        // Initialize vision settings directly (for backward compatibility)
        this.visionSettings = {
            imageAnalysis: false,
            maxImageSize: 5 * 1024 * 1024, // 5MB
            allowedImageTypes: ['image/jpeg', 'image/jpg', 'image/png']
        };

        // Ensure config object references work too
        this.config.visionSettings = this.visionSettings;
        this.config.fileUpload = this.config.fileUpload || {
            content: null,
            fileName: null,
            maxSize: 3 * 1024,
            allowedTypes: ['.txt']
        };

        // Vision and speech state
        this.mobileNetModel = null;
        this.isModelDownloading = false;
        this.pendingImage = null;
        this.recognition = null;
        this.isListening = false;

        // Initialize DOM element registry
        this.elements = {};
        this.eventListeners = [];

        // Initialize app
        this.initialize();
    }

    // Constants for error messages and UI text
    static MESSAGES = {
        ERRORS: {
            FILE_TYPE: 'Please select a valid file type',
            FILE_SIZE: 'File too large. Please select a smaller file',
            IMAGE_LOAD: 'Error loading image. Please try a different file',
            IMAGE_PROCESS: 'Error processing image. Please try again',
            MODEL_DOWNLOAD: 'Model is downloading. Please wait...',
            MODEL_NOT_READY: 'Model not ready. Please try enabling again',
            SPEECH_NOT_AVAILABLE: 'Speech recognition not available',
            SPEECH_ERROR: 'Speech recognition error. Please try again',
            VOICE_INPUT_FAILED: 'Could not start voice input. Please try again'
        },
        SUCCESS: {
            FILE_UPLOADED: 'File uploaded successfully',
            FILE_REMOVED: 'File removed',
            IMAGE_READY: 'Image ready to send with next message',
            SYSTEM_MESSAGE_UPDATED: 'System message updated',
            PARAMETERS_RESET: 'Parameters reset to defaults',
            SETTINGS_UPDATED: 'Chat settings updated'
        },
        UI: {
            ADD_DATA_SOURCE: '📁 Add data source',
            REPLACE_DATA_SOURCE: '📁 Replace data source'
        }
    };

    // Centralized initialization
    initialize() {
        this.initializeElements();
        this.attachEventListeners();
        this.initializeParameterControls();
        this.initializeFileUpload();
        this.populateVoices();
        this.setupSpeechToggleListeners();
        this.initializeSpeechRecognition();
        this.initializeModel();
    }
    
    initializeElements() {
        // Define all element selectors in one place for easier maintenance
        const elementSelectors = {
            // Progress elements
            progressContainer: 'progress-container',
            progressFill: 'progress-fill',
            progressText: 'progress-text',
            
            // Model and system elements
            modelSelect: 'model-select',
            systemMessage: 'system-message',
            applyBtn: 'apply-btn',
            
            // Chat elements
            chatMessages: 'chat-messages',
            userInput: 'user-input',
            sendBtn: 'send-btn',
            stopBtn: 'stop-btn',
            attachBtn: 'attach-btn',
            voiceBtn: 'voice-btn',
            
            // File upload elements
            fileInput: 'file-input',
            fileInfo: 'file-info',
            fileName: 'file-name',
            fileSize: 'file-size',
            addDataBtn: 'add-data-btn',
            
            // Speech elements
            speechToTextToggle: 'speech-to-text-toggle',
            textToSpeechToggle: 'text-to-speech-toggle',
            voiceSelect: 'voice-select',
            voiceSpeed: 'voice-speed',
            voiceSampleText: 'voice-sample-text',
            
            // Vision elements
            imageAnalysisToggle: 'image-analysis-toggle',
            visionProgressContainer: 'vision-progress-container',
            visionProgressFill: 'vision-progress-fill',
            visionProgressText: 'vision-progress-text',
            
            // Input image elements
            inputThumbnailContainer: 'input-thumbnail-container',
            inputThumbnail: 'input-thumbnail',
            removeThumbnailBtn: 'remove-thumbnail-btn',
            
            // Modal elements
            chatCapabilitiesModal: 'chat-capabilities-modal',
            saveCapabilitiesBtn: 'save-capabilities-btn'
        };

        // Populate elements object with actual DOM references
        Object.entries(elementSelectors).forEach(([key, id]) => {
            this.elements[key] = document.getElementById(id);
        });

        // Set legacy references for backward compatibility
        this.progressContainer = this.elements.progressContainer;
        this.progressFill = this.elements.progressFill;
        this.progressText = this.elements.progressText;

        this.modelSelect = this.elements.modelSelect;
        this.systemMessage = this.elements.systemMessage;
        this.applyBtn = this.elements.applyBtn;
        this.chatMessages = this.elements.chatMessages;
        this.userInput = this.elements.userInput;
        this.sendBtn = this.elements.sendBtn;
        this.stopBtn = this.elements.stopBtn;
        this.attachBtn = this.elements.attachBtn;
    }

    // Getter for backward compatibility
    get modelParameters() {
        return this.config.modelParameters;
    }

    set modelParameters(value) {
        this.config.modelParameters = value;
    }

    // Utility functions to reduce code duplication
    getElement(id) {
        return this.elements[id] || document.getElementById(id);
    }

    setElementProperty(elementId, property, value) {
        const element = this.getElement(elementId);
        if (element) {
            element[property] = value;
        }
        return element;
    }

    setElementText(elementId, text) {
        return this.setElementProperty(elementId, 'textContent', text);
    }

    setElementStyle(elementId, property, value) {
        const element = this.getElement(elementId);
        if (element) {
            element.style[property] = value;
        }
        return element;
    }

    showElement(elementId) {
        return this.setElementStyle(elementId, 'display', 'block');
    }

    hideElement(elementId) {
        return this.setElementStyle(elementId, 'display', 'none');
    }

    toggleElement(elementId, show = null) {
        const element = this.getElement(elementId);
        if (element) {
            const isVisible = element.style.display !== 'none';
            const shouldShow = show !== null ? show : !isVisible;
            element.style.display = shouldShow ? 'block' : 'none';
        }
        return element;
    }

    addEventListenerTracked(element, event, handler, options = false) {
        if (typeof element === 'string') {
            element = this.getElement(element);
        }
        if (element) {
            element.addEventListener(event, handler, options);
            this.eventListeners.push({ element, event, handler, options });
        }
    }

    // Cleanup method to remove all tracked event listeners
    cleanup() {
        this.eventListeners.forEach(({ element, event, handler, options }) => {
            if (element && element.removeEventListener) {
                element.removeEventListener(event, handler, options);
            }
        });
        this.eventListeners = [];
    }

    updateProgress(containerId, fillId, textId, percentage, text) {
        this.showElement(containerId);
        this.setElementStyle(fillId, 'width', `${percentage}%`);
        this.setElementText(textId, text);
    }

    validateFileType(file, allowedTypes, maxSize = null) {
        if (!allowedTypes.some(type => 
            file.name.toLowerCase().endsWith(type.toLowerCase()) || 
            file.type === type
        )) {
            return { valid: false, error: `Please select a ${allowedTypes.join(', ')} file.` };
        }
        
        if (maxSize && file.size > maxSize) {
            const sizeMB = (maxSize / (1024 * 1024)).toFixed(1);
            return { valid: false, error: `File too large. Maximum size: ${sizeMB}MB` };
        }
        
        return { valid: true };
    }

    initializeParameterControls() {
        // Centralized parameter configuration
        this.parameterConfig = [
            { 
                id: 'temperature-slider', 
                valueId: 'temperature-value', 
                param: 'temperature',
                type: 'float',
                displayName: 'Temperature'
            },
            { 
                id: 'top-p-slider', 
                valueId: 'top-p-value', 
                param: 'top_p',
                type: 'float',
                displayName: 'Top P'
            },
            { 
                id: 'max-tokens-slider', 
                valueId: 'max-tokens-value', 
                param: 'max_tokens',
                type: 'int',
                displayName: 'Max Tokens'
            },
            { 
                id: 'repetition-penalty-slider', 
                valueId: 'repetition-penalty-value', 
                param: 'repetition_penalty',
                type: 'float',
                displayName: 'Repetition Penalty'
            }
        ];
        
        this.parameterConfig.forEach(config => {
            this.initializeSlider(config);
        });
    }

    initializeSlider({ id, valueId, param, type, displayName }) {
        const slider = this.getElement(id);
        const valueDisplay = this.getElement(valueId);
        
        if (!slider || !valueDisplay) return;

        const initialValue = this.config.modelParameters[param];
        
        // Set initial values
        slider.value = initialValue;
        valueDisplay.textContent = initialValue;
        slider.setAttribute('aria-valuetext', initialValue.toString());
        
        // Add event listener
        this.addEventListenerTracked(slider, 'input', (e) => {
            const value = type === 'int' ? parseInt(e.target.value) : parseFloat(e.target.value);
            this.config.modelParameters[param] = value;
            valueDisplay.textContent = value;
            slider.setAttribute('aria-valuetext', value.toString());
            this.showToast(`${displayName}: ${value}`);
        });
    }
    
    formatParameterName(param) {
        const names = {
            'temperature': 'Temperature',
            'top_p': 'Top P',
            'max_tokens': 'Max Tokens',
            'repetition_penalty': 'Repetition Penalty'
        };
        return names[param] || param;
    }
    
    initializeFileUpload() {
        this.addEventListenerTracked('fileInput', 'change', (e) => this.handleFileUpload(e));
    }
    
    handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Use centralized file validation
        const validation = this.validateFileType(
            file, 
            this.config.fileUpload.allowedTypes, 
            this.config.fileUpload.maxSize
        );
        
        if (!validation.valid) {
            alert(validation.error);
            event.target.value = '';
            return;
        }
        
        // Read file content
        const reader = new FileReader();
        reader.onload = (e) => {
            this.config.fileUpload.content = e.target.result;
            this.config.fileUpload.fileName = file.name;
            this.displayFileInfo(file);
            this.showToast(`${ChatPlayground.MESSAGES.SUCCESS.FILE_UPLOADED}: ${file.name}`);
            
            // Restart conversation to apply the new file data to system message
            this.restartConversation('file-upload');
        };
        
        reader.onerror = () => {
            alert('Error reading file');
            event.target.value = '';
        };
        
        reader.readAsText(file);
    }
    
    displayFileInfo(file) {
        this.setElementText('fileName', file.name);
        this.setElementText('fileSize', `${(file.size / 1024).toFixed(1)}KB`);
        this.setElementStyle('fileInfo', 'display', 'flex');
        this.setElementText('addDataBtn', ChatPlayground.MESSAGES.UI.REPLACE_DATA_SOURCE);
    }
    
    removeFile() {
        // Clear file data
        this.config.fileUpload.content = null;
        this.config.fileUpload.fileName = null;
        
        // Update UI using utility functions
        this.hideElement('fileInfo');
        this.setElementProperty('fileInput', 'value', '');
        this.setElementText('addDataBtn', ChatPlayground.MESSAGES.UI.ADD_DATA_SOURCE);
        
        this.showToast(ChatPlayground.MESSAGES.SUCCESS.FILE_REMOVED);
        this.restartConversation('file-remove');
    }
    
    getEffectiveSystemMessage() {
        let systemMessage = this.currentSystemMessage;
        
        // Remove any existing TTS instruction to avoid duplication
        const ttsInstruction = '\n\nImportant: Always answer with a single, concise sentence.';
        systemMessage = systemMessage.replace(ttsInstruction, '');
        
        // Remove any existing file upload content to avoid duplication
        // Use a more specific pattern that doesn't consume the TTS instruction
        const fileDataPattern = /\n\n---\nUse this data to answer questions:\n.*?(?=\n\nImportant:|$)/s;
        systemMessage = systemMessage.replace(fileDataPattern, '');
        
        // Append uploaded file content if available
        if (this.config.fileUpload.content) {
            systemMessage += '\n\n---\nUse this data to answer questions:\n' + this.config.fileUpload.content;
        }
        
        // Add TTS instruction when text-to-speech is enabled
        if (this.speechSettings && this.speechSettings.textToSpeech) {
            systemMessage += ttsInstruction;
        }
        
        return systemMessage;
    }
    
    setupSpeechToggleListeners() {
        // Setup toggle listeners for enabling/disabling controls
        const speechToTextToggle = document.getElementById('speech-to-text-toggle');
        const textToSpeechToggle = document.getElementById('text-to-speech-toggle');
        const voiceBtn = document.getElementById('voice-btn');
        const voiceSelect = document.getElementById('voice-select');
        const voiceSpeed = document.getElementById('voice-speed');
        const playBtn = document.querySelector('.play-btn');
        const voiceSampleText = document.getElementById('voice-sample-text');

        // Handle speech-to-text toggle
        if (speechToTextToggle && voiceBtn) {
            speechToTextToggle.addEventListener('change', (e) => {
                const isEnabled = e.target.checked;
                voiceBtn.disabled = !isEnabled;
                this.speechSettings.speechToText = isEnabled;
            });
            // Initialize disabled state
            voiceBtn.disabled = !speechToTextToggle.checked;
            this.speechSettings.speechToText = speechToTextToggle.checked;
        }

        // Handle text-to-speech toggle
        if (textToSpeechToggle) {
            textToSpeechToggle.addEventListener('change', (e) => {
                const isEnabled = e.target.checked;
                if (voiceSelect) voiceSelect.disabled = !isEnabled;
                if (voiceSpeed) voiceSpeed.disabled = !isEnabled;
                if (playBtn) playBtn.disabled = !isEnabled;
                if (voiceSampleText) voiceSampleText.disabled = !isEnabled;
                
                // Update speech settings
                this.speechSettings.textToSpeech = isEnabled;
                
                // Restart conversation when TTS mode changes
                this.restartConversation();
            });
            
            // Initialize disabled states
            const isEnabled = textToSpeechToggle.checked;
            if (voiceSelect) voiceSelect.disabled = !isEnabled;
            if (voiceSpeed) voiceSpeed.disabled = !isEnabled;
            if (playBtn) playBtn.disabled = !isEnabled;
            if (voiceSampleText) voiceSampleText.disabled = !isEnabled;
        }

        // Handle image analysis toggle
        const imageAnalysisToggle = document.getElementById('image-analysis-toggle');
        if (imageAnalysisToggle) {
            imageAnalysisToggle.addEventListener('change', async (e) => {
                const isEnabled = e.target.checked;
                this.visionSettings.imageAnalysis = isEnabled;
                this.updateAttachButtonState();
                
                // Download model when enabled for the first time
                if (isEnabled && !this.mobileNetModel && !this.isModelDownloading) {
                    this.updateSaveButtonState(); // Disable save button before download
                    await this.downloadMobileNetModel();
                    this.updateSaveButtonState(); // Re-enable save button after download
                }
                
                console.log('Image analysis:', isEnabled ? 'enabled' : 'disabled');
            });
            // Initialize state
            this.visionSettings.imageAnalysis = imageAnalysisToggle.checked;
            this.updateAttachButtonState();
        }
    }

    saveSpeechSettings() {
        // Save current speech settings
        const speechToTextToggle = document.getElementById('speech-to-text-toggle');
        const textToSpeechToggle = document.getElementById('text-to-speech-toggle');
        const voiceSelect = document.getElementById('voice-select');
        const voiceSpeed = document.getElementById('voice-speed');
        const voiceSampleText = document.getElementById('voice-sample-text');

        this.speechSettings = {
            speechToText: speechToTextToggle ? speechToTextToggle.checked : false,
            textToSpeech: textToSpeechToggle ? textToSpeechToggle.checked : false,
            voice: voiceSelect ? voiceSelect.value : 'default',
            speed: voiceSpeed ? voiceSpeed.value : '1x',
            sampleText: voiceSampleText ? voiceSampleText.value : 'Hi, how can I help you today?'
        };
    }

    restoreSpeechSettings() {
        // Restore speech settings to current saved values
        if (!this.speechSettings) {
            // Initialize default settings if none exist
            this.speechSettings = {
                speechToText: false,
                textToSpeech: false,
                voice: '', // Will be set by populateVoices()
                speed: '1x',
                sampleText: 'Hi, how can I help you today?'
            };
        }

        const speechToTextToggle = document.getElementById('speech-to-text-toggle');
        const textToSpeechToggle = document.getElementById('text-to-speech-toggle');
        const voiceSelect = document.getElementById('voice-select');
        const voiceSpeed = document.getElementById('voice-speed');
        const voiceSampleText = document.getElementById('voice-sample-text');

        if (speechToTextToggle) speechToTextToggle.checked = this.speechSettings.speechToText;
        if (textToSpeechToggle) textToSpeechToggle.checked = this.speechSettings.textToSpeech;
        if (voiceSelect && this.speechSettings.voice) voiceSelect.value = this.speechSettings.voice;
        if (voiceSpeed) voiceSpeed.value = this.speechSettings.speed;
        if (voiceSampleText) voiceSampleText.value = this.speechSettings.sampleText;

        // Update UI states
        this.setupSpeechToggleListeners();
    }

    speakResponse(text) {
        // Check if text-to-speech is enabled
        if (!this.speechSettings || !this.speechSettings.textToSpeech) {
            return;
        }

        // Check if speech synthesis is available
        if (!('speechSynthesis' in window)) {
            return;
        }

        // Stop any currently speaking utterance
        speechSynthesis.cancel();

        // Create new utterance
        const utterance = new SpeechSynthesisUtterance(text);

        // Configure voice if selected
        if (this.speechSettings.voice && this.speechSettings.voice !== 'default') {
            const voices = speechSynthesis.getVoices();
            const selectedVoice = voices.find(voice => voice.name === this.speechSettings.voice);
            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }
        }

        // Configure speed
        const speedMap = { '0.5x': 0.5, '1x': 1, '1.5x': 1.5, '2x': 2 };
        utterance.rate = speedMap[this.speechSettings.speed] || 1;

        // Configure other properties for better speech
        utterance.pitch = 1;
        utterance.volume = 1;

        // Track speech state
        this.isSpeaking = true;

        // Handle speech end
        utterance.onend = () => {
            this.isSpeaking = false;
            // Update UI only if typing is also complete
            if (!this.isGenerating) {
                this.updateUIForGeneration(false);
            }
        };

        utterance.onerror = () => {
            this.isSpeaking = false;
            // Update UI only if typing is also complete
            if (!this.isGenerating) {
                this.updateUIForGeneration(false);
            }
        };

        // Speak the response
        speechSynthesis.speak(utterance);
    }

    populateVoices() {
        const voiceSelect = document.getElementById('voice-select');
        if (!voiceSelect) return;

        const loadVoices = () => {
            const voices = speechSynthesis.getVoices();
            const microsoftVoices = voices.filter(voice => 
                voice && voice.name &&
                (voice.name.includes('Microsoft') || 
                voice.name.includes('Cortana') ||
                voice.name.includes('Windows') ||
                (voice.voiceURI && voice.voiceURI.includes('Microsoft')) ||
                (voice.lang && voice.lang.startsWith('en')))
            );

            // Preserve current selection
            const currentSelection = voiceSelect.value;

            // Clear existing options
            voiceSelect.innerHTML = '';

            if (microsoftVoices.length > 0) {
                // Add Microsoft voices
                microsoftVoices.forEach((voice, index) => {
                    if (!voice || !voice.name) return; // Skip invalid voices
                    const option = document.createElement('option');
                    option.value = voice.name;
                    option.textContent = `${voice.name} (${voice.lang})`;
                    
                    // Restore previous selection, or use first voice as default
                    if (currentSelection && voice.name === currentSelection) {
                        option.selected = true;
                        this.speechSettings.voice = voice.name;
                    } else if (!currentSelection && index === 0) {
                        option.selected = true;
                        // Only update speech settings if no voice was previously selected
                        if (!this.speechSettings.voice) {
                            this.speechSettings.voice = voice.name;
                        }
                    }
                    voiceSelect.appendChild(option);
                });
            } else {
                // Fallback to all English voices if no Microsoft voices found
                const englishVoices = voices.filter(voice => voice && voice.lang && voice.lang.startsWith('en'));
                if (englishVoices.length > 0) {
                    englishVoices.forEach((voice, index) => {
                        if (!voice || !voice.name) return; // Skip invalid voices
                        const option = document.createElement('option');
                        option.value = voice.name;
                        option.textContent = `${voice.name} (${voice.lang})`;
                        
                        // Restore previous selection, or use first voice as default
                        if (currentSelection && voice.name === currentSelection) {
                            option.selected = true;
                            this.speechSettings.voice = voice.name;
                        } else if (!currentSelection && index === 0) {
                            option.selected = true;
                            if (!this.speechSettings.voice) {
                                this.speechSettings.voice = voice.name;
                            }
                        }
                        voiceSelect.appendChild(option);
                    });
                } else {
                    // Final fallback
                    const option = document.createElement('option');
                    option.value = 'default';
                    option.textContent = 'Default System Voice';
                    option.selected = true;
                    voiceSelect.appendChild(option);
                    if (!this.speechSettings.voice) {
                        this.speechSettings.voice = 'default';
                    }
                }
            }
        };

        // Load voices immediately if available
        if (speechSynthesis.getVoices().length > 0) {
            loadVoices();
        } else {
            // Wait for voices to be loaded
            speechSynthesis.addEventListener('voiceschanged', loadVoices);
            // Also try after a short delay as fallback
            setTimeout(loadVoices, 100);
        }
    }

    initializeSpeechRecognition() {
        // Check if speech recognition is supported
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn('Speech recognition not supported in this browser.');
            return;
        }

        // Initialize speech recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';
        this.recognition.maxAlternatives = 1;

        // Handle speech recognition events
        this.recognition.onstart = () => {
            console.log('Speech recognition started');
            this.isListening = true;
            this.updateVoiceButtonState();
        };

        this.recognition.onresult = (event) => {
            const result = event.results[0];
            if (result.isFinal) {
                const transcript = result[0].transcript.trim();
                console.log('Speech recognition result:', transcript);
                
                if (transcript) {
                    // Add the transcribed text to the input field
                    this.userInput.value = transcript;
                    this.userInput.style.height = 'auto';
                    this.userInput.style.height = Math.min(this.userInput.scrollHeight, 120) + 'px';
                    
                    // Automatically send the message
                    this.handleSendMessage();
                }
            }
        };

        this.recognition.onend = () => {
            console.log('Speech recognition ended');
            this.isListening = false;
            this.updateVoiceButtonState();
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.isListening = false;
            this.updateVoiceButtonState();
            
            if (event.error === 'no-speech') {
                this.showToast('No speech detected. Please try again.');
            } else if (event.error === 'network') {
                this.showToast('Network error. Please check your connection.');
            } else {
                this.showToast('Speech recognition error. Please try again.');
            }
        };
    }

    updateVoiceButtonState() {
        const voiceBtn = document.getElementById('voice-btn');
        if (voiceBtn) {
            voiceBtn.textContent = this.isListening ? '🔴' : '🎙️';
            voiceBtn.title = this.isListening ? 'Listening...' : 'Voice input';
        }
    }

    playBeep() {
        // Create a short beep sound
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
    }

    startVoiceInput() {
        if (!this.recognition) {
            this.showToast('Speech recognition not available.');
            return;
        }
        
        if (this.isListening) {
            // Stop listening
            this.recognition.stop();
            return;
        }
        
        // Play beep and start listening
        this.playBeep();
        
        // Start speech recognition after a short delay to let the beep play
        setTimeout(() => {
            try {
                this.recognition.start();
            } catch (error) {
                console.error('Error starting speech recognition:', error);
                this.showToast('Could not start voice input. Please try again.');
            }
        }, 300);
    }

    updateAttachButtonState() {
        if (this.attachBtn) {
            this.attachBtn.disabled = !this.visionSettings.imageAnalysis;
        }
    }

    updateSaveButtonState() {
        const saveBtn = document.getElementById('save-capabilities-btn');
        if (saveBtn) {
            const shouldDisable = this.isModelDownloading;
            saveBtn.disabled = shouldDisable;
            
            if (shouldDisable) {
                saveBtn.textContent = 'Downloading Model...';
                saveBtn.style.opacity = '0.6';
                saveBtn.style.cursor = 'not-allowed';
            } else {
                saveBtn.textContent = 'Save';
                saveBtn.style.opacity = '1';
                saveBtn.style.cursor = 'pointer';
            }
        }
    }

    async downloadMobileNetModel() {
        if (this.mobileNetModel || this.isModelDownloading) {
            return;
        }

        this.isModelDownloading = true;
        this.updateSaveButtonState(); // Disable save button
        
        const progressContainer = document.getElementById('vision-progress-container');
        const progressFill = document.getElementById('vision-progress-fill');
        const progressText = document.getElementById('vision-progress-text');

        try {
            // Show progress container
            if (progressContainer) {
                progressContainer.style.display = 'block';
            }

            // Update progress text
            if (progressText) {
                progressText.textContent = 'Initializing TensorFlow.js...';
            }

            // Wait for TensorFlow.js to be ready
            await tf.ready();

            // Update progress
            if (progressFill) progressFill.style.width = '30%';
            if (progressText) progressText.textContent = 'Loading MobileNet model...';

            // Load MobileNet model using the same approach as image-analyzer
            const mobileNetModel = await mobilenet.load({
                version: 2,
                alpha: 1.0,
                modelUrl: undefined,
                inputRange: [0, 1]
            });
            
            // Update progress
            if (progressFill) progressFill.style.width = '90%';
            if (progressText) progressText.textContent = 'Model ready!';

            this.mobileNetModel = mobileNetModel;

            // Complete progress
            if (progressFill) progressFill.style.width = '100%';
            if (progressText) progressText.textContent = 'Model ready!';

            // Hide progress after a short delay
            setTimeout(() => {
                if (progressContainer) {
                    progressContainer.style.display = 'none';
                }
            }, 2000);

            console.log('MobileNet model downloaded and ready');

        } catch (error) {
            console.error('Error downloading MobileNet model:', error);
            let errorMessage = 'Error downloading model: ';
            if (error.message) {
                errorMessage += error.message;
            } else {
                errorMessage += 'Unknown error occurred.';
            }
            
            if (progressText) {
                progressText.textContent = errorMessage;
            }
            
            // Hide progress after error
            setTimeout(() => {
                if (progressContainer) {
                    progressContainer.style.display = 'none';
                }
            }, 5000);
        } finally {
            this.isModelDownloading = false;
            this.updateSaveButtonState(); // Re-enable save button
        }
    }

    handleImageUpload() {
        // Check if image analysis is enabled
        if (!this.visionSettings.imageAnalysis) {
            return;
        }
        
        // Check if model is ready
        if (!this.mobileNetModel) {
            if (this.isModelDownloading) {
                this.showToast('Model is downloading. Please wait...');
            } else {
                this.showToast('Model not ready. Please try enabling image analysis again.');
            }
            return;
        }
        
        // Create a file input element
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.jpg,.jpeg,.png';
        fileInput.style.display = 'none';
        
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.processImageFile(file);
            }
        });
        
        // Trigger file selection
        document.body.appendChild(fileInput);
        fileInput.click();
        document.body.removeChild(fileInput);
    }

    async processImageFile(file) {
        // Use centralized validation for image files
        const validation = this.validateFileType(
            file, 
            this.config.visionSettings.allowedImageTypes, 
            this.config.visionSettings.maxImageSize
        );
        
        if (!validation.valid) {
            this.showToast(validation.error);
            return;
        }
        
        try {
            // Create image element
            const img = new Image();
            const imageUrl = URL.createObjectURL(file);
            
            img.onload = async () => {
                // Store image data for next message
                this.pendingImage = {
                    img: img,
                    fileName: file.name,
                    imageUrl: imageUrl
                };
                
                // Display small thumbnail next to input
                this.displayInputThumbnail(img);
                
                this.showToast(ChatPlayground.MESSAGES.SUCCESS.IMAGE_READY);
            };
            
            img.onerror = () => {
                this.showToast(ChatPlayground.MESSAGES.ERRORS.IMAGE_LOAD);
                URL.revokeObjectURL(imageUrl);
            };
            
            img.src = imageUrl;
            
        } catch (error) {
            console.error('Error processing image:', error);
            this.showToast(ChatPlayground.MESSAGES.ERRORS.IMAGE_PROCESS);
        }
    }

    displayInputThumbnail(img) {
        // Get the input thumbnail container
        const thumbnailContainer = document.getElementById('input-thumbnail-container');
        const thumbnailImg = document.getElementById('input-thumbnail');
        const removeBtn = document.getElementById('remove-thumbnail-btn');
        
        // Set the thumbnail image
        thumbnailImg.src = img.src;
        
        // Show the thumbnail container
        thumbnailContainer.style.display = 'block';
        
        // Add event listener to remove button (remove old listener first)
        const newRemoveBtn = removeBtn.cloneNode(true);
        removeBtn.parentNode.replaceChild(newRemoveBtn, removeBtn);
        
        newRemoveBtn.addEventListener('click', () => {
            this.removePendingImage();
        });
    }
    
    removePendingImage() {
        // Clean up pending image data
        if (this.pendingImage && this.pendingImage.imageUrl) {
            URL.revokeObjectURL(this.pendingImage.imageUrl);
        }
        this.pendingImage = null;
        
        // Hide thumbnail container
        const thumbnailContainer = document.getElementById('input-thumbnail-container');
        thumbnailContainer.style.display = 'none';
    }

    async classifyImage(img) {
        try {
            // Get predictions from MobileNet
            const predictions = await this.mobileNetModel.classify(img);
            return predictions;
        } catch (error) {
            console.error('Error classifying image:', error);
            throw error;
        }
    }

    formatPredictions(predictions) {
        // Format top 3 predictions as text for the model
        const topPredictions = predictions.slice(0, 3);
        return topPredictions.map((prediction, index) => {
            const className = prediction.className.replace(/_/g, ' ');
            const confidence = Math.round(prediction.probability * 100);
            return `${index + 1}. ${className} (${confidence}% confidence)`;
        }).join('\n');
    }

    attachEventListeners() {
        this.sendBtn.addEventListener('click', () => this.handleSendMessage());
        this.userInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSendMessage();
            }
        });
        
        this.applyBtn.addEventListener('click', () => {
            this.currentSystemMessage = this.systemMessage.value;
            this.showToast('System message updated');
            
            // Restart conversation to apply the new system message
            this.restartConversation('system-message');
        });
        
        this.stopBtn.addEventListener('click', () => this.stopGeneration());
        
        // Voice input button
        const voiceBtn = document.getElementById('voice-btn');
        if (voiceBtn) {
            voiceBtn.addEventListener('click', () => this.startVoiceInput());
        }

        // Attach button (image upload)
        if (this.attachBtn) {
            this.attachBtn.addEventListener('click', () => this.handleImageUpload());
        }
        
        // Auto-resize textarea
        this.userInput.addEventListener('input', () => {
            this.userInput.style.height = 'auto';
            this.userInput.style.height = Math.min(this.userInput.scrollHeight, 120) + 'px';
        });
        
        // Voice selection change handler
        const voiceSelect = document.getElementById('voice-select');
        if (voiceSelect) {
            voiceSelect.addEventListener('change', (e) => {
                this.speechSettings.voice = e.target.value;
                console.log('Voice changed to:', e.target.value);
            });
        }
        
        // Voice speed change handler
        const voiceSpeed = document.getElementById('voice-speed');
        if (voiceSpeed) {
            voiceSpeed.addEventListener('change', (e) => {
                this.speechSettings.speed = e.target.value;
                console.log('Voice speed changed to:', e.target.value);
            });
        }
        
        // Clear chat button
        document.querySelector('.chat-controls .icon-btn').addEventListener('click', () => {
            this.clearChat();
        });
    }
    
    async initializeModel() {
        try {
            console.log('initializeModel called - starting model initialization');
            this.updateProgress(0, 'Discovering available models...');
            console.log('Starting WebLLM initialization...');
            console.log('WebLLM object:', webllm);
            console.log('WebLLM.CreateMLCEngine:', typeof webllm?.CreateMLCEngine);
            console.log('WebLLM.prebuiltAppConfig:', typeof webllm?.prebuiltAppConfig);
            
            // Check if WebLLM is available
            if (!webllm || !webllm.CreateMLCEngine || !webllm.prebuiltAppConfig) {
                console.error('WebLLM check failed:', {
                    webllm: !!webllm,
                    CreateMLCEngine: !!webllm?.CreateMLCEngine,
                    prebuiltAppConfig: !!webllm?.prebuiltAppConfig
                });
                throw new Error('WebLLM not properly loaded');
            }
            
            // Get available models from WebLLM
            const models = webllm.prebuiltAppConfig.model_list;
            console.log('All available models:', models.map(m => m.model_id));
            
            // Filter for Phi models first
            let availableModels = models.filter(model => 
                model.model_id.toLowerCase().includes('phi')
            );
            
            // If no Phi models, try other small models
            if (availableModels.length === 0) {
                availableModels = models.filter(model => 
                    model.model_id.toLowerCase().includes('llama-3.2-1b') ||
                    model.model_id.toLowerCase().includes('gemma-2-2b')
                );
            }
            
            if (availableModels.length === 0) {
                throw new Error('No compatible models found');
            }
            
            console.log('Available models for loading:', availableModels.map(m => m.model_id));
            
            this.updateProgress(10, 'Loading model...');
            
            // Try to load the first available model
            let engineCreated = false;
            
            for (const model of availableModels) {
                try {
                    console.log(`Trying to load model: ${model.model_id}`);
                    this.updateProgress(15, `Loading ${model.model_id}...`);
                    
                    this.engine = await webllm.CreateMLCEngine(
                        model.model_id,
                        {
                            initProgressCallback: (progress) => {
                                console.log('Progress:', progress);
                                const percentage = Math.max(15, Math.round(progress.progress * 85) + 15);
                                this.updateProgress(percentage, `Loading ${model.model_id}: ${Math.round(progress.progress * 100)}%`);
                            }
                        }
                    );
                    
                    console.log(`Successfully loaded model: ${model.model_id}`);
                    this.currentModelId = model.model_id;
                    engineCreated = true;
                    break;
                    
                } catch (modelError) {
                    console.error(`Failed to load ${model.model_id}:`, modelError);
                    continue;
                }
            }
            
            if (!engineCreated) {
                throw new Error('Failed to load any available models. Please check your internet connection and try again.');
            }
            
            console.log('WebLLM engine created successfully');
            this.updateProgress(100, 'Model ready!');
            setTimeout(() => {
                this.progressContainer.style.display = 'none';
                this.enableUI();
            }, 1000);
            
        } catch (error) {
            console.error('Failed to initialize WebLLM:', error);
            this.updateProgress(0, `Error: ${error.message}`);
            
            // Don't create mock engine - show error instead
            setTimeout(() => {
                this.updateProgress(0, 'Failed to load AI model. Please refresh the page and check your internet connection.');
            }, 3000);
        }
    }
    
    updateProgress(percentage, text) {
        this.progressFill.style.width = `${percentage}%`;
        this.progressText.textContent = text;
    }
    
    enableUI() {
        this.isModelLoaded = true;
        this.modelSelect.disabled = false;
        this.systemMessage.disabled = false;
        this.applyBtn.disabled = false;
        this.userInput.disabled = false;
        this.sendBtn.disabled = false;
        this.userInput.focus();
        
        // Populate model dropdown with available models
        this.populateModelDropdown();
    }
    
    populateModelDropdown() {
        // Clear existing options
        this.modelSelect.innerHTML = '';
        
        if (!webllm || !webllm.prebuiltAppConfig) {
            this.modelSelect.innerHTML = '<option value="">No models available</option>';
            return;
        }
        
        // Get all available models
        const allModels = webllm.prebuiltAppConfig.model_list;
        
        // Filter for suitable models (smaller ones that work well)
        const suitableModels = allModels.filter(model => {
            const modelId = model.model_id.toLowerCase();
            return modelId.includes('phi') || 
                   modelId.includes('llama-3.2-1b') ||
                   modelId.includes('llama-3.2-3b') ||
                   modelId.includes('gemma-2-2b') ||
                   modelId.includes('qwen2.5-0.5b') ||
                   modelId.includes('qwen2.5-1.5b');
        });
        
        // Sort models by preference (Phi first, then by size)
        suitableModels.sort((a, b) => {
            const aId = a.model_id.toLowerCase();
            const bId = b.model_id.toLowerCase();
            
            // Phi models first
            if (aId.includes('phi') && !bId.includes('phi')) return -1;
            if (!aId.includes('phi') && bId.includes('phi')) return 1;
            
            // Then by model name
            return aId.localeCompare(bId);
        });
        
        // Add models to dropdown
        suitableModels.forEach(model => {
            const option = document.createElement('option');
            option.value = model.model_id;
            option.textContent = this.formatModelName(model.model_id);
            
            // Mark current model as selected
            if (model.model_id === this.currentModelId) {
                option.selected = true;
                option.textContent += ' (Current)';
            }
            
            this.modelSelect.appendChild(option);
        });
        
        // Add event listener for model changes
        this.modelSelect.addEventListener('change', (e) => {
            if (e.target.value && e.target.value !== this.currentModelId) {
                this.switchModel(e.target.value);
            }
        });
    }
    
    formatModelName(modelId) {
        // Convert model ID to friendly display name
        let name = modelId.replace(/-/g, ' ').replace(/_/g, ' ');
        
        // Capitalize each word
        name = name.replace(/\b\w/g, l => l.toUpperCase());
        
        // Clean up common patterns
        name = name.replace(/Mlc$/i, '');
        name = name.replace(/Q4f\d+/i, '');
        name = name.replace(/Instruct/i, '');
        name = name.replace(/\s+/g, ' ').trim();
        
        // Add specific formatting for known models
        if (name.toLowerCase().includes('phi')) {
            name = name.replace(/Phi\s*3/i, 'Microsoft Phi-3');
        } else if (name.toLowerCase().includes('llama')) {
            name = name.replace(/Llama/i, 'Meta Llama');
        } else if (name.toLowerCase().includes('gemma')) {
            name = name.replace(/Gemma/i, 'Google Gemma');
        } else if (name.toLowerCase().includes('qwen')) {
            name = name.replace(/Qwen/i, 'Alibaba Qwen');
        }
        
        return name;
    }
    
    async switchModel(newModelId) {
        if (this.isGenerating) {
            alert('Please wait for the current response to complete before switching models.');
            this.modelSelect.value = this.currentModelId;
            return;
        }
        
        try {
            // Show progress
            this.progressContainer.style.display = 'block';
            this.updateProgress(0, `Switching to ${this.formatModelName(newModelId)}...`);
            
            // Disable UI
            this.modelSelect.disabled = true;
            this.userInput.disabled = true;
            this.sendBtn.disabled = true;
            
            console.log(`Switching to model: ${newModelId}`);
            
            // Create new engine with selected model
            this.engine = await webllm.CreateMLCEngine(
                newModelId,
                {
                    initProgressCallback: (progress) => {
                        console.log('Switch progress:', progress);
                        const percentage = Math.round(progress.progress * 100);
                        this.updateProgress(percentage, `Loading ${this.formatModelName(newModelId)}: ${percentage}%`);
                    }
                }
            );
            
            this.currentModelId = newModelId;
            console.log(`Successfully switched to model: ${newModelId}`);
            
            // Clear conversation history when switching models
            this.clearChat();
            
            this.updateProgress(100, 'Model switched successfully!');
            setTimeout(() => {
                this.progressContainer.style.display = 'none';
                this.enableUI();
                this.showToast(`Switched to ${this.formatModelName(newModelId)} - Conversation restarted`);
            }, 1000);
            
        } catch (error) {
            console.error(`Failed to switch to model ${newModelId}:`, error);
            this.updateProgress(0, `Failed to switch model: ${error.message}`);
            
            // Revert dropdown selection
            this.modelSelect.value = this.currentModelId;
            
            setTimeout(() => {
                this.progressContainer.style.display = 'none';
                this.enableUI();
                alert(`Failed to switch to ${this.formatModelName(newModelId)}. Please try a different model.`);
            }, 3000);
        }
    }
    
    async handleSendMessage() {
        if (!this.isModelLoaded || this.isGenerating) return;
        
        let userMessage = this.userInput.value.trim();
        if (!userMessage && !this.pendingImage) return;
        if (!userMessage) userMessage = ""; // Allow empty message if there's an image
        
        // Process pending image if exists
        let imageAnalysis = '';
        let imageElement = null;
        
        if (this.pendingImage) {
            try {
                // Get image analysis
                const predictions = await this.classifyImage(this.pendingImage.img);
                const formattedPredictions = this.formatPredictions(predictions);
                imageAnalysis = `\n---\nAnswer concisely and base your response on the following image analysis as well as what you can infer from the previous question:\n${formattedPredictions}\nDo not include probability percentages or mention low probability options from the analysis in the response, just indicate what you think the image is based on your interpretation of the analysis and the user's prompt`;
                
                // Create image element for message bubble
                imageElement = document.createElement('img');
                imageElement.src = this.pendingImage.img.src;
                imageElement.className = 'message-image';
                imageElement.alt = this.pendingImage.fileName;
                
            } catch (error) {
                console.error('Error analyzing image:', error);
                this.showToast('Error analyzing image. Sending message without analysis.');
            }
        }
        
        // Stop any ongoing speech
        if ('speechSynthesis' in window) {
            speechSynthesis.cancel();
        }
        this.isSpeaking = false;
        
        // Reset stop state and typing state
        this.stopRequested = false;
        if (this.typingState) {
            this.typingState.isTyping = false;
            this.typingState = null;
        }
        
        // Add user message to chat (with image if available)
        this.addMessage('user', userMessage, imageElement);
        
        // Clean up input and pending image
        this.userInput.value = '';
        this.userInput.style.height = 'auto';
        
        // Clean up pending image
        if (this.pendingImage) {
            this.removePendingImage();
        }
        
        this.isGenerating = true;
        this.updateUIForGeneration(true);
        
        // Show typing indicator
        const typingIndicator = this.addTypingIndicator();
        
        try {
            // Prepare conversation history
            const messages = [
                { role: "system", content: this.getEffectiveSystemMessage() }
            ];
            
            // Add last 10 conversation pairs
            const recentHistory = this.conversationHistory.slice(-20); // 10 pairs = 20 messages
            messages.push(...recentHistory);
            
            // Add user message with image analysis if available
            const finalUserMessage = userMessage + imageAnalysis;
            messages.push({ role: "user", content: finalUserMessage });
            
            // Remove typing indicator
            typingIndicator.remove();
            
            // Add thinking indicator with animated dots
            const thinkingIndicator = this.addThinkingIndicator();
            
            // Check if TTS is enabled to determine mode
            const isTTSEnabled = this.speechSettings && this.speechSettings.textToSpeech;
            
            if (isTTSEnabled) {
                // TTS Mode: Wait for complete response, then type and speak together
                await this.handleTTSMode(messages, thinkingIndicator, userMessage);
            } else {
                // Streaming Mode: Stream and type immediately
                await this.handleStreamingMode(messages, thinkingIndicator, userMessage);
            }
            
        } catch (error) {
            console.error('Error generating response:', error);
            if (typingIndicator.parentNode) {
                typingIndicator.remove();
            }
            // Remove thinking indicator if it exists
            const thinkingIndicator = this.chatMessages.querySelector('.thinking-indicator');
            if (thinkingIndicator) {
                thinkingIndicator.remove();
            }
            
            const errorMessage = 'Sorry, I encountered an error while generating a response. Please try again.';
            const assistantMessageEl = this.addMessage('assistant', '');
            const contentEl = assistantMessageEl.querySelector('.message-content');
            
            // Type out the error message
            await this.typeResponse(contentEl, errorMessage);
            
            // Speak the error message if text-to-speech is enabled
            if (this.speechSettings && this.speechSettings.textToSpeech) {
                this.speakResponse(errorMessage);
            }
        } finally {
            this.isGenerating = false;
            this.updateUIForGeneration(false);
        }
    }

    async handleTTSMode(messages, thinkingIndicator, userMessage) {
        // TTS Mode: Get complete response first, then type and speak together
        let fullResponse = '';
        
        const completion = await this.engine.chat.completions.create({
            messages: messages,
            temperature: this.modelParameters.temperature,
            top_p: this.modelParameters.top_p,
            max_tokens: this.modelParameters.max_tokens,
            repetition_penalty: this.modelParameters.repetition_penalty,
            stream: true
        });
        
        // Collect the entire response
        for await (const chunk of completion) {
            if (!this.isGenerating) return;
            
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
                fullResponse += content;
            }
        }
        
        // Remove thinking indicator
        thinkingIndicator.remove();
        
        if (fullResponse.trim()) {
            // Create message container
            const assistantMessageEl = this.addMessage('assistant', '');
            const contentEl = assistantMessageEl.querySelector('.message-content');
            
            // Start speaking and typing simultaneously
            this.speakResponse(fullResponse);
            await this.typeResponse(contentEl, fullResponse);
            
            // Add to conversation history
            this.conversationHistory.push({ role: "user", content: userMessage });
            this.conversationHistory.push({ role: "assistant", content: fullResponse });
            
            // Update token count
            this.updateTokenCount();
        } else {
            const fallbackMessage = "I apologize, but I couldn't generate a response. Please try again.";
            const assistantMessageEl = this.addMessage('assistant', '');
            const contentEl = assistantMessageEl.querySelector('.message-content');
            await this.typeResponse(contentEl, fallbackMessage);
        }
    }

    async handleStreamingMode(messages, thinkingIndicator, userMessage) {
        // Streaming Mode: Type as soon as we have content
        let fullResponse = '';
        let hasStartedOutput = false;
        const bufferSize = 30; // Start typing after 30 characters
        let assistantMessageEl = null;
        let contentEl = null;
        
        const completion = await this.engine.chat.completions.create({
            messages: messages,
            temperature: this.modelParameters.temperature,
            top_p: this.modelParameters.top_p,
            max_tokens: this.modelParameters.max_tokens,
            repetition_penalty: this.modelParameters.repetition_penalty,
            stream: true
        });
        
        for await (const chunk of completion) {
            if (!this.isGenerating) break;
            
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
                fullResponse += content;
                
                // Start output once we have enough content buffered
                if (!hasStartedOutput && fullResponse.length >= bufferSize) {
                    // Remove thinking indicator
                    thinkingIndicator.remove();
                    
                    // Create message container
                    assistantMessageEl = this.addMessage('assistant', '');
                    contentEl = assistantMessageEl.querySelector('.message-content');
                    
                    // Start typing animation
                    this.startTypingAnimation(contentEl, fullResponse);
                    hasStartedOutput = true;
                } else if (hasStartedOutput && contentEl) {
                    // Update the content for ongoing typing animation
                    this.updateTypingContent(fullResponse);
                }
            }
        }
        
        // Handle case where response is shorter than buffer size
        if (!hasStartedOutput) {
            // Remove thinking indicator
            thinkingIndicator.remove();
            
            if (fullResponse.trim()) {
                // Create message container
                assistantMessageEl = this.addMessage('assistant', '');
                contentEl = assistantMessageEl.querySelector('.message-content');
                
                // Type out the short response
                await this.typeResponse(contentEl, fullResponse);
            } else {
                const fallbackMessage = "I apologize, but I couldn't generate a response. Please try again.";
                assistantMessageEl = this.addMessage('assistant', '');
                contentEl = assistantMessageEl.querySelector('.message-content');
                await this.typeResponse(contentEl, fallbackMessage);
            }
        }
        
        // Add to conversation history
        this.conversationHistory.push({ role: "user", content: userMessage });
        this.conversationHistory.push({ role: "assistant", content: fullResponse });
        
        // Update token count
        this.updateTokenCount();
    }

    addThinkingIndicator() {
        const thinkingDiv = document.createElement('div');
        thinkingDiv.className = 'thinking-indicator';
        thinkingDiv.innerHTML = `
            <div class="thinking-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
        this.chatMessages.appendChild(thinkingDiv);
        
        // Auto-scroll to bottom
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        
        return thinkingDiv;
    }

    async typeResponse(contentEl, text) {
        let currentIndex = 0;
        const typingSpeed = 5; // milliseconds between characters
        
        // Continue typing as long as we haven't been stopped and there's more text
        while (currentIndex < text.length && !this.stopRequested) {
            contentEl.textContent = text.substring(0, currentIndex + 1);
            
            // Auto-scroll to bottom
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
            
            currentIndex++;
            await new Promise(resolve => setTimeout(resolve, typingSpeed));
        }
        
        // Ensure full text is displayed
        contentEl.textContent = text;
        
        // Mark typing as complete but don't update UI if still speaking
        this.isGenerating = false;
        if (!this.isSpeaking) {
            this.updateUIForGeneration(false);
        }
    }

    startTypingAnimation(contentEl, initialText) {
        this.typingState = {
            contentEl: contentEl,
            fullText: initialText,
            currentIndex: 0,
            isTyping: true,
            typingSpeed:5
        };
        
        this.continueTyping();
    }

    updateTypingContent(newText) {
        if (this.typingState) {
            this.typingState.fullText = newText;
        }
    }

    async continueTyping() {
        if (!this.typingState || !this.typingState.isTyping) return;
        
        const { contentEl, typingSpeed } = this.typingState;
        
        while (this.typingState.isTyping && !this.stopRequested) {
            // Use current fullText (which gets updated by streaming)
            const currentFullText = this.typingState.fullText;
            
            // Check if we've typed everything we currently have
            if (this.typingState.currentIndex >= currentFullText.length) {
                // Wait a bit for more content to arrive, but continue if we're not generating anymore
                if (!this.isGenerating) {
                    break; // No more content coming, we're done
                }
                await new Promise(resolve => setTimeout(resolve, 50)); // Wait for more content
                continue;
            }
            
            // Type the next character
            contentEl.textContent = currentFullText.substring(0, this.typingState.currentIndex + 1);
            
            // Auto-scroll to bottom
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
            
            this.typingState.currentIndex++;
            await new Promise(resolve => setTimeout(resolve, typingSpeed));
        }
        
        // Ensure full text is displayed
        if (this.typingState && this.typingState.contentEl) {
            this.typingState.contentEl.textContent = this.typingState.fullText;
        }
        
        // Mark typing as complete but don't update UI if still speaking
        if (this.typingState) {
            this.typingState.isTyping = false;
        }
        
        // Only update UI if not speaking
        if (!this.isSpeaking) {
            this.updateUIForGeneration(false);
        }
    }

    async waitForTypingComplete() {
        while (this.typingState && this.typingState.isTyping) {
            await new Promise(resolve => setTimeout(resolve, 50));
        }
    }
    
    addMessage(role, content, imageElement = null) {
        // Hide welcome message if it exists
        const welcomeMessage = this.chatMessages.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.style.display = 'none';
        }
        
        const messageEl = document.createElement('div');
        messageEl.className = `message ${role}-message`;
        
        const avatar = role === 'user' ? '👤' : '🤖';
        const roleName = role === 'user' ? 'You' : 'Assistant';
        
        messageEl.innerHTML = `
            <div class="message-header">
                <div class="message-avatar ${role}-avatar">${avatar}</div>
                <div class="message-role">${roleName}</div>
            </div>
            <div class="message-content">${content}</div>
        `;
        
        // Add image if provided
        if (imageElement && role === 'user') {
            const messageContent = messageEl.querySelector('.message-content');
            messageContent.insertBefore(imageElement, messageContent.firstChild);
        }
        
        this.chatMessages.appendChild(messageEl);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        
        return messageEl;
    }
    
    addTypingIndicator() {
        const typingEl = document.createElement('div');
        typingEl.className = 'message assistant-message';
        typingEl.innerHTML = `
            <div class="message-header">
                <div class="message-avatar assistant-avatar">🤖</div>
                <div class="message-role">Assistant</div>
            </div>
            <div class="message-content">
                <div class="typing-indicator">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        `;
        
        this.chatMessages.appendChild(typingEl);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        
        return typingEl;
    }
    
    updateUIForGeneration(isGenerating) {
        // Show stop button if either generating or speaking
        const showStopButton = isGenerating || this.isSpeaking;
        
        this.sendBtn.disabled = showStopButton;
        this.userInput.disabled = showStopButton;
        this.stopBtn.style.display = showStopButton ? 'block' : 'none';
        
        if (showStopButton) {
            if (this.isSpeaking && !isGenerating) {
                this.sendBtn.textContent = '🔊'; // Speaking indicator
            } else {
                this.sendBtn.textContent = '⏳'; // Generating indicator
            }
        } else {
            this.sendBtn.textContent = '➤';
        }
    }
    
    stopGeneration() {
        this.isGenerating = false;
        this.isSpeaking = false;
        this.stopRequested = true;
        
        // Stop typing animation
        if (this.typingState) {
            this.typingState.isTyping = false;
        }
        
        // Stop any ongoing speech synthesis
        if ('speechSynthesis' in window) {
            speechSynthesis.cancel();
        }
        
        this.updateUIForGeneration(false);
    }

    restartConversation(reason = 'tts-toggle') {
        // Clear the conversation history and reset the chat UI
        this.clearChat();
        
        // Show a message to the user about the restart
        let restartMessage;
        const ttsStatus = this.speechSettings && this.speechSettings.textToSpeech 
            ? ' (text-to-speech mode enabled)' 
            : '';
            
        switch (reason) {
            case 'system-message':
                restartMessage = `Conversation restarted with updated system message${ttsStatus}.`;
                break;
            case 'file-upload':
                restartMessage = `Conversation restarted with uploaded file data${ttsStatus}.`;
                break;
            case 'file-remove':
                restartMessage = `Conversation restarted with file data removed${ttsStatus}.`;
                break;
            case 'tts-toggle':
            default:
                restartMessage = this.speechSettings && this.speechSettings.textToSpeech 
                    ? 'Conversation restarted with text-to-speech mode enabled.' 
                    : 'Conversation restarted with text-to-speech mode disabled.';
                break;
        }
        
        const systemMessageEl = this.addMessage('system', restartMessage);
        systemMessageEl.classList.add('system-restart-message');
    }

    clearChat() {
        this.conversationHistory = [];
        this.chatMessages.innerHTML = `
            <div class="welcome-message">
                <div class="chat-icon">💬</div>
                <h3>Start with a prompt</h3>
            </div>
        `;
        this.updateTokenCount();
    }
    
    updateTokenCount() {
        // Approximate token count (rough estimate: 1 token ≈ 4 characters)
        const totalChars = this.conversationHistory.reduce((acc, msg) => acc + msg.content.length, 0);
        const approxTokens = Math.ceil(totalChars / 4);
        
        const tokenCountEl = document.querySelector('.token-count');
        if (tokenCountEl) {
            tokenCountEl.textContent = `*${approxTokens}/128000 tokens in thread`;
        }
    }
    
    showToast(message) {
        // Simple toast notification
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #0078d4;
            color: white;
            padding: 12px 16px;
            border-radius: 4px;
            font-size: 14px;
            z-index: 1000;
            animation: slideInRight 0.3s ease-out;
        `;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }
}

// Global functions for UI interactions
window.toggleSetup = function() {
    const setupPanel = document.querySelector('.setup-panel');
    const hideBtn = document.querySelector('.hide-btn');
    
    const isCollapsed = setupPanel.classList.contains('collapsed');
    
    if (isCollapsed) {
        setupPanel.classList.remove('collapsed');
        hideBtn.textContent = '📦 Hide';
        hideBtn.setAttribute('aria-expanded', 'true');
        hideBtn.setAttribute('aria-label', 'Hide setup panel');
    } else {
        setupPanel.classList.add('collapsed');
        hideBtn.textContent = '📦 Show';
        hideBtn.setAttribute('aria-expanded', 'false');
        hideBtn.setAttribute('aria-label', 'Show setup panel');
    }
};

window.toggleSection = function(sectionId) {
    const content = document.getElementById(sectionId);
    const button = content.previousElementSibling;
    
    const isExpanded = content.style.display === 'block';
    
    if (isExpanded) {
        content.style.display = 'none';
        button.textContent = button.textContent.replace('▼', '▶');
        button.setAttribute('aria-expanded', 'false');
    } else {
        content.style.display = 'block';
        button.textContent = button.textContent.replace('▶', '▼');
        button.setAttribute('aria-expanded', 'true');
    }
};

window.resetParameters = function() {
    // Get the app instance (we'll need to store it globally)
    if (window.chatPlaygroundApp) {
        // Reset to default values
        const defaults = {
            temperature: 0.7,
            top_p: 0.9,
            max_tokens: 1000,
            repetition_penalty: 1.1
        };
        
        // Update app parameters
        window.chatPlaygroundApp.modelParameters = { ...defaults };
        
        // Update sliders and displays
        const updates = [
            { slider: 'temperature-slider', value: 'temperature-value', param: 'temperature' },
            { slider: 'top-p-slider', value: 'top-p-value', param: 'top_p' },
            { slider: 'max-tokens-slider', value: 'max-tokens-value', param: 'max_tokens' },
            { slider: 'repetition-penalty-slider', value: 'repetition-penalty-value', param: 'repetition_penalty' }
        ];
        
        updates.forEach(({ slider, value, param }) => {
            const sliderEl = document.getElementById(slider);
            const valueEl = document.getElementById(value);
            if (sliderEl && valueEl) {
                sliderEl.value = defaults[param];
                valueEl.textContent = defaults[param];
                // Update aria-valuetext for screen readers
                sliderEl.setAttribute('aria-valuetext', defaults[param].toString());
            }
        });
        
        window.chatPlaygroundApp.showToast('Parameters reset to defaults');
    }
};

window.triggerFileUpload = function() {
    const fileInput = document.getElementById('file-input');
    if (fileInput) {
        fileInput.click();
    }
};

window.removeFile = function() {
    if (window.chatPlaygroundApp) {
        window.chatPlaygroundApp.removeFile();
    }
};

window.openChatCapabilitiesModal = function() {
    const modal = document.getElementById('chat-capabilities-modal');
    if (modal) {
        // Store the currently focused element to restore later
        window.lastFocusedElement = document.activeElement;
        
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
        
        // Focus the modal for screen readers
        setTimeout(() => {
            const modalTitle = document.getElementById('modal-title');
            if (modalTitle) {
                modalTitle.focus();
            }
        }, 100);
        
        // Restore current settings when modal opens
        if (window.chatPlaygroundApp) {
            window.chatPlaygroundApp.restoreSpeechSettings();
        }
        
        // Add keyboard trap for accessibility
        window.trapFocus(modal);
    }
};

window.closeChatCapabilitiesModal = function() {
    const modal = document.getElementById('chat-capabilities-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto'; // Restore scrolling
        
        // Restore focus to the element that opened the modal
        if (window.lastFocusedElement) {
            window.lastFocusedElement.focus();
            window.lastFocusedElement = null;
        }
        
        // Remove keyboard trap
        window.removeFocusTrap();
        
        // Restore original settings (cancel any unsaved changes)
        if (window.chatPlaygroundApp) {
            window.chatPlaygroundApp.restoreSpeechSettings();
        }
    }
};

window.playVoiceSample = function() {
    // Get the voice sample text from the input field
    const voiceSampleText = document.getElementById('voice-sample-text');
    const sampleText = voiceSampleText ? voiceSampleText.value : 'Hi, how can I help you today?';
    
    // Simulate voice sample playback
    const playBtn = document.querySelector('.play-btn');
    if (playBtn) {
        playBtn.textContent = '⏸️';
        setTimeout(() => {
            playBtn.textContent = '▶';
        }, 2000); // Simulate 2-second sample
    }
    
    // Here you would integrate with actual speech synthesis
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(sampleText);
        const voiceSelect = document.getElementById('voice-select');
        const speedSelect = document.getElementById('voice-speed');
        
        if (voiceSelect && voiceSelect.value && voiceSelect.value !== 'default') {
            const voices = speechSynthesis.getVoices();
            const selectedVoice = voices.find(voice => voice.name === voiceSelect.value);
            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }
        }
        
        const speedMap = { '0.5x': 0.5, '1x': 1, '1.5x': 1.5, '2x': 2 };
        utterance.rate = speedMap[speedSelect.value] || 1;
        
        speechSynthesis.speak(utterance);
    }
};

window.saveChatCapabilities = function() {
    // Save the current settings
    if (window.chatPlaygroundApp) {
        window.chatPlaygroundApp.saveSpeechSettings();
        window.chatPlaygroundApp.showToast('Chat settings updated');
    }
    
    // Close modal
    const modal = document.getElementById('chat-capabilities-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
};

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Focus trap functionality for modal accessibility
window.trapFocus = function(modal) {
    const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];
    
    window.modalKeydownHandler = function(e) {
        if (e.key === 'Tab') {
            if (e.shiftKey) {
                if (document.activeElement === firstFocusable) {
                    lastFocusable.focus();
                    e.preventDefault();
                }
            } else {
                if (document.activeElement === lastFocusable) {
                    firstFocusable.focus();
                    e.preventDefault();
                }
            }
        } else if (e.key === 'Escape') {
            window.closeChatCapabilitiesModal();
        }
    };
    
    document.addEventListener('keydown', window.modalKeydownHandler);
};

window.removeFocusTrap = function() {
    if (window.modalKeydownHandler) {
        document.removeEventListener('keydown', window.modalKeydownHandler);
        window.modalKeydownHandler = null;
    }
};

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.chatPlaygroundApp = new ChatPlayground();
    
    // Add modal click-outside-to-close functionality
    const modal = document.getElementById('chat-capabilities-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                window.closeChatCapabilitiesModal();
            }
        });
    }
    
    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modal = document.getElementById('chat-capabilities-modal');
            if (modal && modal.style.display !== 'none') {
                window.closeChatCapabilitiesModal();
            }
        }
    });
});