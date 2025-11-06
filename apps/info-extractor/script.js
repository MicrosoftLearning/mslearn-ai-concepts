import * as webllm from "https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.46/+esm";

class InformationExtractor {
    constructor() {
        this.uploadedImages = [];
        this.selectedImageIndex = -1;
        this.ocrData = null;
        this.extractedFields = null;
        this.engine = null;
        this.isModelLoaded = false;
        this.currentModelId = null;
        
        // Zoom functionality
        this.zoomLevel = 1.0;
        this.minZoom = 0.1;
        this.maxZoom = 5.0;
        this.zoomStep = 0.2;
        
        this.initializeElements();
        this.bindEvents();
        this.showModelLoading();
        this.initializeModel();
    }

    showModelLoading() {
        // Show the model loading overlay
        this.modelLoadingSection.style.display = 'flex';
        
        // Disable the UI
        this.uploadSidebar.classList.add('ui-disabled');
        this.resultsPanel.classList.add('ui-disabled');
        this.analyzeBtn.disabled = true;
        
        // Update loading text and progress
        this.updateModelLoadingProgress(0, 'Initializing model...');
    }

    hideModelLoading() {
        // Hide the model loading overlay
        this.modelLoadingSection.style.display = 'none';
        
        // Enable the UI
        this.uploadSidebar.classList.remove('ui-disabled');
        this.resultsPanel.classList.remove('ui-disabled');
        
        // Enable analyze button if image is selected (OCR still works without model)
        if (this.selectedImageIndex >= 0) {
            this.analyzeBtn.disabled = false;
        }
    }

    updateModelLoadingProgress(percentage, text) {
        this.modelProgressFill.style.width = `${percentage}%`;
        this.modelLoadingText.textContent = text;
        
        // Update ARIA attributes
        const progressBar = this.modelLoadingSection.querySelector('.model-progress-bar');
        progressBar.setAttribute('aria-valuenow', percentage);
        progressBar.setAttribute('aria-valuetext', `${Math.round(percentage)}% - ${text}`);
    }

    initializeElements() {
        // Get all DOM elements
        this.imageInput = document.getElementById('imageInput');
        this.uploadArea = document.getElementById('uploadArea');
        this.thumbnailsContainer = document.getElementById('thumbnailsContainer');
        this.analyzeBtn = document.getElementById('analyzeBtn');
        this.progressSection = document.getElementById('progressSection');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.imageContainer = document.getElementById('imageContainer');
        this.selectedImage = document.getElementById('selectedImage');
        this.annotatedCanvas = document.getElementById('annotatedCanvas');
        this.imagePlaceholder = document.getElementById('imagePlaceholder');
        this.fieldsList = document.getElementById('fieldsList');
        this.fieldsTab = document.getElementById('fieldsTab');
        this.resultTab = document.getElementById('resultTab');
        this.ocrResult = document.getElementById('ocrResult');
        this.resultContent = document.getElementById('resultContent');
        this.errorSection = document.getElementById('errorSection');
        this.errorMessage = document.getElementById('errorMessage');
        this.retryBtn = document.getElementById('retryBtn');
        
        // Model loading elements
        this.modelLoadingSection = document.getElementById('modelLoadingSection');
        this.modelLoadingText = document.getElementById('modelLoadingText');
        this.modelProgressFill = document.getElementById('modelProgressFill');
        
        // Zoom controls
        this.zoomInBtn = document.getElementById('zoomInBtn');
        this.zoomOutBtn = document.getElementById('zoomOutBtn');
        this.resetZoomBtn = document.getElementById('resetZoomBtn');
        this.zoomLevelDisplay = document.getElementById('zoomLevel');
        this.imageViewer = document.querySelector('.image-viewer');
        
        // Tab buttons
        this.tabBtns = document.querySelectorAll('.tab-btn');
        this.tabContents = document.querySelectorAll('.tab-content');
        
        // UI containers for disabling
        this.uploadSidebar = document.querySelector('.upload-sidebar');
        this.resultsPanel = document.querySelector('.results-panel');
    }

    bindEvents() {
        // File input and upload area
        this.uploadArea.addEventListener('click', () => {
            if (!this.uploadArea.classList.contains('disabled')) {
                this.triggerFileInput();
            }
        });
        this.uploadArea.addEventListener('keydown', (e) => {
            if (!this.uploadArea.classList.contains('disabled') && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                this.triggerFileInput();
            }
        });
        this.imageInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Analyze button
        this.analyzeBtn.addEventListener('click', () => this.analyzeCurrentImage());
        
        // Tab switching
        this.tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
        
        // Zoom controls
        this.zoomInBtn.addEventListener('click', () => this.zoomIn());
        this.zoomOutBtn.addEventListener('click', () => this.zoomOut());
        this.resetZoomBtn.addEventListener('click', () => this.resetZoom());
        
        // Mouse wheel zoom
        this.imageViewer.addEventListener('wheel', (e) => this.handleWheelZoom(e));
        
        // Retry button
        this.retryBtn.addEventListener('click', () => this.hideError());
        
        // Drag and drop functionality
        this.setupDragAndDrop();
    }

    setupDragAndDrop() {
        const dropZone = this.uploadArea;
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, this.preventDefaults, false);
        });
        
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                if (!dropZone.classList.contains('disabled')) {
                    dropZone.classList.add('dragover');
                }
            }, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.remove('dragover');
            }, false);
        });
        
        dropZone.addEventListener('drop', (e) => this.handleDrop(e), false);
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    handleDrop(e) {
        if (this.uploadArea.classList.contains('disabled')) {
            return;
        }
        const dt = e.dataTransfer;
        const files = dt.files;
        this.processFiles(files);
    }

    triggerFileInput() {
        this.imageInput.click();
    }

    handleFileSelect(event) {
        const files = event.target.files;
        this.processFiles(files);
    }

    processFiles(files) {
        const validFiles = Array.from(files).filter(file => this.isValidImageFile(file));
        
        if (validFiles.length === 0) {
            this.showError('Please select valid image files (.jpg, .jpeg, or .png)');
            return;
        }
        
        if (this.uploadedImages.length + validFiles.length > 5) {
            this.showError('Maximum 5 images allowed. Please remove some images first.');
            return;
        }
        
        validFiles.forEach(file => this.addImage(file));
    }

    isValidImageFile(file) {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        return validTypes.includes(file.type) && file.size <= 10 * 1024 * 1024; // 10MB limit
    }

    async addImage(file, isSample = false) {
        const imageUrl = URL.createObjectURL(file);
        const imageData = {
            file: file,
            url: imageUrl,
            name: file.name,
            isSample: isSample
        };
        
        this.uploadedImages.push(imageData);
        this.createThumbnail(imageData, this.uploadedImages.length - 1);
        
        // Select the newly uploaded image automatically
        this.selectImage(this.uploadedImages.length - 1);
    }

    createThumbnail(imageData, index) {
        const thumbnailItem = document.createElement('div');
        thumbnailItem.className = 'thumbnail-item';
        thumbnailItem.setAttribute('role', 'listitem');
        thumbnailItem.setAttribute('tabindex', '0');
        const ariaLabel = imageData.isSample 
            ? `Sample receipt image ${index + 1}: ${imageData.name}` 
            : `Receipt image ${index + 1}: ${imageData.name}`;
        thumbnailItem.setAttribute('aria-label', ariaLabel);
        
        const sampleOverlay = imageData.isSample ? '<div class="sample-overlay">[Sample]</div>' : '';
        
        thumbnailItem.innerHTML = `
            <img src="${imageData.url}" alt="Thumbnail of ${imageData.name}" />
            ${sampleOverlay}
            <button class="thumbnail-remove" onclick="app.removeImage(${index})" 
                    aria-label="Remove ${imageData.name}">×</button>
        `;
        
        thumbnailItem.addEventListener('click', (e) => {
            if (!e.target.classList.contains('thumbnail-remove') && !thumbnailItem.classList.contains('disabled')) {
                this.selectImage(index);
            }
        });
        
        // Add keyboard navigation
        thumbnailItem.addEventListener('keydown', (e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !e.target.classList.contains('thumbnail-remove') && !thumbnailItem.classList.contains('disabled')) {
                e.preventDefault();
                this.selectImage(index);
            }
        });
        
        this.thumbnailsContainer.appendChild(thumbnailItem);
    }

    selectImage(index) {
        if (index < 0 || index >= this.uploadedImages.length) return;
        
        // Update selection state
        this.selectedImageIndex = index;
        
        // Update thumbnail selection
        document.querySelectorAll('.thumbnail-item').forEach((item, i) => {
            item.classList.toggle('selected', i === index);
        });
        
        // Display selected image
        const imageData = this.uploadedImages[index];
        this.selectedImage.src = imageData.url;
        this.selectedImage.alt = `Receipt image: ${imageData.name}`;
        this.imageContainer.style.display = 'flex';
        this.imagePlaceholder.style.display = 'none';
        this.annotatedCanvas.style.display = 'none';
        this.selectedImage.style.display = 'block';
        
        // Announce to screen readers
        this.imagePlaceholder.textContent = `Selected image: ${imageData.name}`;
        this.imagePlaceholder.setAttribute('aria-live', 'polite');
        
        // Enable analyze button (OCR works even without AI model)
        this.analyzeBtn.disabled = false;
        
        // Reset zoom level
        this.resetZoom();
        
        // Reset results
        this.resetResults();
    }

    zoomIn() {
        if (this.zoomLevel < this.maxZoom) {
            this.zoomLevel = Math.min(this.zoomLevel + this.zoomStep, this.maxZoom);
            this.updateZoom();
        }
    }

    zoomOut() {
        if (this.zoomLevel > this.minZoom) {
            this.zoomLevel = Math.max(this.zoomLevel - this.zoomStep, this.minZoom);
            this.updateZoom();
        }
    }

    resetZoom() {
        this.zoomLevel = 1.0;
        this.updateZoom();
    }

    updateZoom() {
        const activeImage = this.selectedImage.style.display !== 'none' ? this.selectedImage : this.annotatedCanvas;
        if (activeImage) {
            activeImage.style.transform = `scale(${this.zoomLevel})`;
            this.zoomLevelDisplay.textContent = `${Math.round(this.zoomLevel * 100)}%`;
            
            // Update button states
            this.zoomInBtn.disabled = this.zoomLevel >= this.maxZoom;
            this.zoomOutBtn.disabled = this.zoomLevel <= this.minZoom;
        }
    }

    handleWheelZoom(e) {
        e.preventDefault();
        
        const delta = e.deltaY > 0 ? -1 : 1;
        const zoomChange = delta * 0.1;
        
        const newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoomLevel + zoomChange));
        if (newZoom !== this.zoomLevel) {
            this.zoomLevel = newZoom;
            this.updateZoom();
        }
    }

    removeImage(index) {
        if (index < 0 || index >= this.uploadedImages.length) return;
        
        // Don't allow removal during analysis
        const removeButtons = document.querySelectorAll('.thumbnail-remove');
        if (removeButtons[index] && removeButtons[index].disabled) {
            return;
        }
        
        // Clean up URL
        URL.revokeObjectURL(this.uploadedImages[index].url);
        
        // Remove from array
        this.uploadedImages.splice(index, 1);
        
        // Rebuild thumbnails
        this.thumbnailsContainer.innerHTML = '';
        this.uploadedImages.forEach((imageData, i) => {
            this.createThumbnail(imageData, i);
        });
        
        // Update selection
        if (this.selectedImageIndex === index) {
            if (this.uploadedImages.length > 0) {
                const newIndex = Math.min(index, this.uploadedImages.length - 1);
                this.selectImage(newIndex);
            } else {
                this.selectedImageIndex = -1;
                this.imageContainer.style.display = 'none';
                this.imagePlaceholder.style.display = 'flex';
                this.analyzeBtn.disabled = true;
                this.resetResults();
            }
        } else if (this.selectedImageIndex > index) {
            this.selectedImageIndex--;
        }
    }

    async loadDefaultReceipt() {
        try {
            console.log('Attempting to load default receipt image...');
            // Load the default receipt.png file
            const response = await fetch('./receipt.png');
            if (!response.ok) {
                console.log('Default receipt image not found, status:', response.status);
                return;
            }
            
            console.log('Receipt image fetched successfully, creating file object...');
            const blob = await response.blob();
            const file = new File([blob], 'receipt.png', { type: 'image/png' });
            
            console.log('File object created, adding image to app...');
            // Add the image to the app with sample flag
            await this.addImage(file, true); // true indicates this is a sample image
            console.log('Default receipt image loaded and displayed successfully');
            
        } catch (error) {
            console.log('Could not load default receipt image:', error.message);
            console.error('Full error:', error);
            // Don't show error to user, just log it
        }
    }

    async initializeModel() {
        try {
            console.log('Initializing WebLLM model...');
            this.updateModelLoadingProgress(10, 'Checking WebLLM availability...');
            
            // Check if WebLLM is available
            if (!webllm || !webllm.CreateMLCEngine || !webllm.prebuiltAppConfig) {
                console.error('WebLLM not available:', {
                    webllm: !!webllm,
                    CreateMLCEngine: !!webllm?.CreateMLCEngine,
                    prebuiltAppConfig: !!webllm?.prebuiltAppConfig
                });
                throw new Error('WebLLM not properly loaded');
            }
            
            this.updateModelLoadingProgress(20, 'Loading available models...');
            
            // Get available models from WebLLM
            const models = webllm.prebuiltAppConfig.model_list;
            console.log('Available models:', models.map(m => m.model_id));
            
            // Filter for Phi models first
            let availableModels = models.filter(model => 
                model.model_id.toLowerCase().includes('phi')
            );
            
            // If no Phi models, try other small models
            if (availableModels.length === 0) {
                availableModels = models.filter(model => 
                    model.model_id.toLowerCase().includes('llama-3.2-1b') ||
                    model.model_id.toLowerCase().includes('gemma-2-2b') ||
                    model.model_id.toLowerCase().includes('qwen')
                );
            }
            
            if (availableModels.length === 0) {
                console.error('No compatible models found in:', models.map(m => m.model_id));
                throw new Error('No compatible models found');
            }
            
            console.log('Attempting to load model:', availableModels[0].model_id);
            this.updateModelLoadingProgress(30, `Loading ${availableModels[0].model_id}...`);
            
            // Load the first available model
            this.engine = await webllm.CreateMLCEngine(
                availableModels[0].model_id,
                {
                    initProgressCallback: (progress) => {
                        const percentage = 30 + Math.round(progress.progress * 70); // 30-100%
                        const progressText = `Loading ${availableModels[0].model_id}: ${Math.round(progress.progress * 100)}%`;
                        this.updateModelLoadingProgress(percentage, progressText);
                        console.log('Model loading progress:', Math.round(progress.progress * 100) + '%');
                    }
                }
            );
            
            this.currentModelId = availableModels[0].model_id;
            this.isModelLoaded = true;
            this.updateModelLoadingProgress(100, 'Model ready!');
            console.log('Model loaded successfully:', this.currentModelId);
            
            // Hide loading screen after a brief delay
            setTimeout(() => {
                this.hideModelLoading();
                // Load the default receipt image
                this.loadDefaultReceipt();
            }, 1000);
            
        } catch (error) {
            console.error('Failed to initialize model:', error);
            console.error('Error details:', error.message);
            console.error('Error stack:', error.stack);
            this.isModelLoaded = false;
            
            // Show error in loading screen
            this.updateModelLoadingProgress(0, `Failed to load model: ${error.message}`);
            
            // Hide loading screen and show error after delay
            setTimeout(() => {
                this.hideModelLoading();
                this.showError(`The AI model could not be loaded in this browser.\nThe app will use a fallback mode to extract fields using OCR and pattern-matching.`, 'Fallback mode activated');
                // Still load the default receipt even if model fails
                this.loadDefaultReceipt();
            }, 3000);
        }
    }

    async analyzeCurrentImage() {
        if (this.selectedImageIndex < 0 || !this.uploadedImages[this.selectedImageIndex]) {
            this.showError('Please select an image first');
            return;
        }
        
        try {
            this.showProgress();
            this.disableUploadAndSelection();
            const imageData = this.uploadedImages[this.selectedImageIndex];
            
            // Step 1: OCR with Tesseract
            this.updateProgress(10, 'Extracting text with OCR...');
            await this.performOCR(imageData.file);
            
            // Step 2: Extract fields with LLM (only if model is loaded)
            if (this.isModelLoaded && this.engine) {
                console.log('Model is loaded, proceeding with field extraction');
                this.updateProgress(60, 'Extracting field information...');
                await this.extractFields();
            } else {
                console.log('AI model not loaded, using heuristic field extraction. isModelLoaded:', this.isModelLoaded, 'engine:', !!this.engine);
                this.updateProgress(60, 'Extracting fields using pattern matching...');
                this.extractFieldsHeuristic();
            }
            
            // Step 3: Display results
            this.updateProgress(90, 'Preparing results...');
            this.displayResults();
            
            this.updateProgress(100, 'Analysis complete!');
            setTimeout(() => {
                this.hideProgress();
                this.enableUploadAndSelection();
            }, 1000);
            
        } catch (error) {
            console.error('Analysis error details:', error);
            console.error('Error stack:', error.stack);
            let errorMessage = 'Failed to analyze the image. Please try again.';
            
            // Provide more specific error messages
            if (error.message.includes('AI model not loaded')) {
                errorMessage = 'AI model is still loading. Please wait a moment and try again.';
            } else if (error.message.includes('No text extracted')) {
                errorMessage = 'No text could be extracted from this image. Please try a clearer image.';
            } else if (error.message.includes('OCR')) {
                errorMessage = 'Failed to read text from the image. Please try a different image.';
            } else if (error.message.includes('WebLLM') || error.message.includes('engine')) {
                errorMessage = 'AI model error. Please refresh the page and try again.';
            }
            
            this.showError(errorMessage);
            this.hideProgress();
            this.enableUploadAndSelection();
        }
    }

    async performOCR(file) {
        try {
            console.log('Starting OCR for file:', file.name, 'Size:', file.size);
            
            // Initialize Tesseract with progress tracking
            const worker = await Tesseract.createWorker('eng', 1, {
                logger: m => {
                    console.log('Tesseract log:', m);
                    if (m.status === 'recognizing text') {
                        const ocrProgress = Math.round(m.progress * 40); // OCR takes 40% of total progress
                        this.updateProgress(10 + ocrProgress, `OCR: ${Math.round(m.progress * 100)}%`);
                    }
                }
            });

            // Perform OCR
            console.log('Performing OCR recognition...');
            const result = await worker.recognize(file);
            this.ocrData = result.data;
            
            console.log('OCR completed. Text length:', this.ocrData.text?.length || 0);
            console.log('OCR text preview:', this.ocrData.text?.substring(0, 200) || 'No text');
            
            // Clean up
            await worker.terminate();
            
            if (!this.ocrData.text || this.ocrData.text.trim().length === 0) {
                throw new Error('No text extracted from image');
            }
            
        } catch (error) {
            console.error('OCR Error details:', error);
            throw new Error('Failed to extract text from image: ' + error.message);
        }
    }

    async extractFields() {
        if (!this.isModelLoaded || !this.engine) {
            console.error('Model not loaded. Model loaded:', this.isModelLoaded, 'Engine:', !!this.engine);
            throw new Error('AI model not loaded. Please wait and try again.');
        }
        
        if (!this.ocrData || !this.ocrData.text.trim()) {
            throw new Error('No text extracted from image');
        }
        
        try {
            const prompt = `The following text was extracted from a scanned receipt:
---
${this.ocrData.text}
---
Please identify the most likely values for these fields:
- Vendor
- Vendor-Address
- Vendor-Phone
- Receipt-Date
- Receipt-Time
- Total-spent

Date fields should be formatted as mm/dd/yyyy

Respond as a list of fields with their values.`;

            console.log('Sending prompt to LLM. Model ID:', this.currentModelId);
            console.log('Prompt length:', prompt.length);
            
            const response = await this.engine.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: "You are a helpful assistant that extracts structured information from receipt text. Always respond with a clear list of field names and their values."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: 500,
                temperature: 0.1
            });
            
            if (!response || !response.choices || !response.choices[0] || !response.choices[0].message) {
                console.error('Invalid response from LLM:', response);
                throw new Error('Invalid response from AI model');
            }
            
            const result = response.choices[0].message.content;
            console.log('LLM response received. Length:', result?.length || 0);
            console.log('LLM response:', result);
            
            if (!result || result.trim().length === 0) {
                throw new Error('Empty response from AI model');
            }
            
            this.extractedFields = this.parseFieldsFromResponse(result);
            console.log('Parsed fields:', this.extractedFields);
            
        } catch (error) {
            console.error('LLM Error details:', error);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            throw new Error('Failed to extract field information: ' + error.message);
        }
    }

    parseFieldsFromResponse(response) {
        // Parse the LLM response to extract field values
        const fields = {
            'Vendor': '',
            'Vendor-Address': '',
            'Vendor-Phone': '',
            'Receipt-Date': '',
            'Receipt-Time': '',
            'Total-spent': ''
        };
        
        const lines = response.split('\n');
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;
            
            // Try to match patterns like "- Vendor: Value" or "Vendor: Value"
            // Process in order of specificity to avoid partial matches
            const fieldOrder = ['Vendor-Address', 'Vendor-Phone', 'Receipt-Date', 'Receipt-Time', 'Total-spent', 'Vendor'];
            
            for (const fieldName of fieldOrder) {
                if (fields[fieldName]) continue; // Skip if already found
                
                const patterns = [
                    new RegExp(`^\\s*-\\s*${fieldName}\\s*:?\\s*(.+)`, 'i'),
                    new RegExp(`^\\s*\\*\\s*${fieldName}\\s*:?\\s*(.+)`, 'i'),
                    new RegExp(`^\\s*\\d+\\.\\s*${fieldName}\\s*:?\\s*(.+)`, 'i'),
                    new RegExp(`^\\s*${fieldName}\\s*:?\\s*(.+)`, 'i')
                ];
                
                for (const pattern of patterns) {
                    const match = trimmedLine.match(pattern);
                    if (match && match[1]) {
                        const value = match[1].trim();
                        // Make sure we didn't capture another field name
                        if (!fieldOrder.some(otherField => otherField !== fieldName && value.toLowerCase().includes(otherField.toLowerCase()))) {
                            fields[fieldName] = value;
                            break;
                        }
                    }
                }
                
                if (fields[fieldName]) break; // Found this field, move to next line
            }
        }
        
        return fields;
    }

    extractFieldsHeuristic() {
        if (!this.ocrData || !this.ocrData.text.trim()) {
            this.extractedFields = null;
            return;
        }

        console.log('Using heuristic field extraction');
        const text = this.ocrData.text;
        const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        const allWords = text.split(/\s+/).map(word => word.trim()).filter(word => word.length > 0);

        const fields = {
            'Vendor': '',
            'Vendor-Address': '',
            'Vendor-Phone': '',
            'Receipt-Date': '',
            'Receipt-Time': '',
            'Total-spent': ''
        };

        // Vendor: probably the first meaningful text value
        if (lines.length > 0) {
            // Skip lines that look like addresses or phone numbers for vendor name
            for (const line of lines) {
                if (line.length > 2 && 
                    !this.isPhoneNumber(line) && 
                    !this.isDate(line) && 
                    !line.match(/^\d+/) && // Skip lines starting with numbers
                    !line.match(/^(st|ave|blvd|rd|street|avenue|boulevard|road)/i)) { // Skip address-like lines
                    fields['Vendor'] = line;
                    break;
                }
            }
        }

        // Phone: first value matching phone pattern (check individual words and combinations)
        for (let i = 0; i < allWords.length; i++) {
            // Check single word
            if (this.isPhoneNumber(allWords[i])) {
                fields['Vendor-Phone'] = allWords[i];
                break;
            }
            // Check combinations of 2-4 consecutive words for patterns like "123 456 7890" or "(555) 123-4567"
            for (let j = 2; j <= 4 && i + j <= allWords.length; j++) {
                const words = allWords.slice(i, i + j);
                
                // Try space-separated combination (most common)
                const spaceCombination = words.join(' ');
                if (this.isPhoneNumber(spaceCombination)) {
                    fields['Vendor-Phone'] = spaceCombination;
                    break;
                }
                
                // Try dash-separated combination for cases like "123" "456" "7890" → "123-456-7890"
                const dashCombination = words.join('-');
                if (this.isPhoneNumber(dashCombination)) {
                    fields['Vendor-Phone'] = dashCombination;
                    break;
                }
                
                // Try direct concatenation for cases like "(555)" "1234567" → "(555)1234567"
                const directCombination = words.join('');
                if (this.isPhoneNumber(directCombination)) {
                    fields['Vendor-Phone'] = directCombination;
                    break;
                }
            }
            if (fields['Vendor-Phone']) break;
        }

        // Date: first value matching date pattern (check individual words and combinations)
        for (let i = 0; i < allWords.length; i++) {
            // Check single word
            if (this.isDate(allWords[i])) {
                fields['Receipt-Date'] = allWords[i];
                break;
            }
            // Check combinations of 2-4 consecutive words for patterns like "Aug 25, 2025"
            for (let j = 2; j <= 4 && i + j <= allWords.length; j++) {
                const wordCombination = allWords.slice(i, i + j).join(' ');
                if (this.isDate(wordCombination)) {
                    fields['Receipt-Date'] = wordCombination;
                    break;
                }
            }
            if (fields['Receipt-Date']) break;
        }

        // Time: first value matching time pattern (check individual words and combinations)
        for (let i = 0; i < allWords.length; i++) {
            // Check single word
            if (this.isTime(allWords[i])) {
                fields['Receipt-Time'] = allWords[i];
                break;
            }
            // Check combinations of 2 consecutive words for patterns like "10:30 AM"
            if (i + 1 < allWords.length) {
                const wordCombination = allWords.slice(i, i + 2).join(' ');
                if (this.isTime(wordCombination)) {
                    fields['Receipt-Time'] = wordCombination;
                    break;
                }
            }
            if (fields['Receipt-Time']) break;
        }

        // Total: largest monetary value in the document
        let largestValue = 0;
        let largestValueText = '';
        for (const word of allWords) {
            if (this.isMonetaryValue(word)) {
                const numericValue = parseFloat(word.replace(/[$,]/g, ''));
                if (numericValue > largestValue) {
                    largestValue = numericValue;
                    largestValueText = word;
                }
            }
        }
        if (largestValueText) {
            fields['Total-spent'] = largestValueText;
        }

        this.extractedFields = fields;
        console.log('Heuristic extraction results:', fields);
    }

    isPhoneNumber(text) {
        // Match various phone number formats including international
        const phonePatterns = [
            // US formats
            /^\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/, // (123) 456-7890, 123-456-7890, 123.456.7890
            /^\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/, // +1 123 456 7890
            /^\d{10}$/, // 1234567890
            /^\d{3}\s+\d{3}\s+\d{4}$/, // 123 456 7890
            /^\(\d{3}\)\s+\d{3}\s+\d{4}$/, // (123) 456 7890
            /^\(\d{3}\)\d{7}$/, // (555)1234567
            /^\(\d{3}\)\d{3}-?\d{4}$/, // (555)123-4567 or (555)1234567
            
            // International formats
            /^\+\d{1,4}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/, // +44 20 1234 5678, +33 1 23 45 67 89
            /^\d{3}[-.\s]?\d{4}[-.\s]?\d{6}$/, // 123 4567 123456
            /^\d{3}[-.\s]?\d{3,4}[-.\s]?\d{4,6}$/, // 123 456 7890 or 123 4567 123456
            /^\(\d{2,4}\)[-.\s]?\d{3,4}[-.\s]?\d{4,6}$/, // (44) 20 1234 5678
            /^\+?\d{8,15}$/, // Simple 8-15 digit number with optional +
            /^\d{2,4}[-.\s]\d{3,4}[-.\s]\d{4,8}$/ // General international: 44 20 12345678
        ];
        const normalizedText = text.replace(/\s+/g, ' ').trim();
        
        // Additional validation: must contain at least 7 digits total
        const digitCount = (normalizedText.match(/\d/g) || []).length;
        if (digitCount < 7 || digitCount > 15) {
            return false;
        }
        
        return phonePatterns.some(pattern => pattern.test(normalizedText));
    }

    isTime(text) {
        // Match various time formats
        const timePatterns = [
            /^\d{1,2}:\d{2}$/, // H:MM or HH:MM (basic format)
            /^\d{1,2}:\d{2}\s?(am|pm)$/i, // H:MM AM/PM or HH:MM AM/PM
            /^\d{1,2}:\d{2}:\d{2}$/, // H:MM:SS or HH:MM:SS
            /^\d{1,2}:\d{2}:\d{2}\s?(am|pm)$/i // H:MM:SS AM/PM or HH:MM:SS AM/PM
        ];
        const normalizedText = text.trim().toLowerCase();
        
        // Additional validation: check if it's a reasonable time
        if (timePatterns.some(pattern => pattern.test(normalizedText))) {
            // Extract hours and minutes for validation
            const timeParts = normalizedText.split(':');
            const hours = parseInt(timeParts[0]);
            const minutes = parseInt(timeParts[1]);
            
            // Validate ranges: hours 0-23 (or 1-12 for AM/PM), minutes 0-59
            const hasAmPm = /\s?(am|pm)$/i.test(normalizedText);
            const validHours = hasAmPm ? (hours >= 1 && hours <= 12) : (hours >= 0 && hours <= 23);
            const validMinutes = minutes >= 0 && minutes <= 59;
            
            return validHours && validMinutes;
        }
        
        return false;
    }

    isDate(text) {
        // Match various date formats
        const datePatterns = [
            /^\d{1,2}\/\d{1,2}\/\d{2,4}$/, // MM/DD/YYYY, M/D/YY
            /^\d{1,2}-\d{1,2}-\d{2,4}$/, // MM-DD-YYYY, M-D-YY
            /^\d{1,2}\.\d{1,2}\.\d{2,4}$/, // MM.DD.YYYY
            /^\d{4}\/\d{1,2}\/\d{1,2}$/, // YYYY/MM/DD
            /^\d{4}-\d{1,2}-\d{1,2}$/, // YYYY-MM-DD
            /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2},?\s+\d{2,4}$/i, // Month DD, YYYY or Month DD YYYY
            /^(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{2,4}$/i // Full month names
        ];
        const normalizedText = text.trim().toLowerCase();
        return datePatterns.some(pattern => pattern.test(normalizedText));
    }

    isMonetaryValue(text) {
        // Match monetary values that include exactly two decimal places
        const moneyPatterns = [
            /^\$?\d+\.\d{2}$/, // $12.34, 12.34
            /^\$?\d{1,3}(,\d{3})*\.\d{2}$/ // $1,234.56, 1,234.56
        ];
        return moneyPatterns.some(pattern => pattern.test(text.trim())) && parseFloat(text.replace(/[$,]/g, '')) > 0;
    }

    displayResults() {
        // Show annotated image with bounding boxes
        this.createAnnotatedImage();
        
        // Display extracted fields
        this.displayFields();
        
        // Display full OCR result
        this.displayOCRResult();
        
        // Switch to fields tab
        this.switchTab('fields');
    }

    createAnnotatedImage() {
        const canvas = this.annotatedCanvas;
        const ctx = canvas.getContext('2d');
        const img = this.selectedImage;
        
        // Set canvas size to match image
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        
        // Draw the original image
        ctx.drawImage(img, 0, 0);
        
        // Draw bounding boxes for words
        if (this.ocrData && this.ocrData.words) {
            ctx.strokeStyle = '#4A90E2';
            ctx.lineWidth = 2;
            ctx.fillStyle = 'rgba(74, 144, 226, 0.1)';
            
            this.ocrData.words.forEach(word => {
                if (word.confidence > 30) {
                    const { x0, y0, x1, y1 } = word.bbox;
                    const margin = 3; // Small margin in pixels
                    const width = (x1 - x0) + (margin * 2);
                    const height = (y1 - y0) + (margin * 2);
                    const x = x0 - margin;
                    const y = y0 - margin;
                    
                    ctx.strokeRect(x, y, width, height);
                    ctx.fillRect(x, y, width, height);
                }
            });
        }
        
        // Switch to annotated view
        this.selectedImage.style.display = 'none';
        this.annotatedCanvas.style.display = 'block';
        
        // Apply current zoom level to canvas
        this.updateZoom();
    }

    displayFields() {
        const fieldsContainer = this.fieldsList;
        fieldsContainer.innerHTML = '';
        
        console.log('displayFields called. extractedFields:', this.extractedFields, 'isModelLoaded:', this.isModelLoaded);
        
        if (!this.extractedFields) {
            // Show message that AI extraction is not available only if model wasn't loaded
            if (!this.isModelLoaded) {
                console.log('Showing AI model not available message');
                const messageDiv = document.createElement('div');
                messageDiv.className = 'field-message';
                messageDiv.innerHTML = `
                    <p><strong>AI Model Not Available</strong></p>
                    <p>Field extraction requires the AI model, which could not be loaded. The extracted text is still available in the Result tab.</p>
                `;
                fieldsContainer.appendChild(messageDiv);
                this.fieldsList.style.display = 'flex';
                this.fieldsTab.querySelector('.results-placeholder').style.display = 'none';
            }
            // If model IS loaded but no fields extracted, just return (keep placeholder visible)
            return;
        }

        // Show heuristic extraction notice if model wasn't loaded but we have fields
        if (!this.isModelLoaded) {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'field-message';
            messageDiv.style.backgroundColor = '#d1ecf1';
            messageDiv.style.borderColor = '#bee5eb';
            messageDiv.style.color = '#0c5460';
            messageDiv.innerHTML = `
                <p><strong>Pattern-Based Extraction</strong></p>
                <p>Fields extracted using pattern matching. Results may be less accurate than AI extraction.</p>
            `;
            fieldsContainer.appendChild(messageDiv);
        }
        
        console.log('Displaying extracted fields:', Object.keys(this.extractedFields).length, 'fields');
        Object.entries(this.extractedFields).forEach(([fieldName, fieldValue]) => {
            const fieldItem = document.createElement('div');
            fieldItem.className = 'field-item';
            fieldItem.setAttribute('role', 'listitem');
            
            const label = document.createElement('div');
            label.className = 'field-label';
            label.textContent = fieldName.replace('-', ' ');
            label.id = `label-${fieldName}`;
            
            const value = document.createElement('div');
            value.className = `field-value ${fieldValue ? '' : 'empty'}`;
            value.textContent = fieldValue || 'Not found';
            value.setAttribute('aria-labelledby', `label-${fieldName}`);
            value.setAttribute('aria-description', fieldValue ? `${fieldName.replace('-', ' ')}: ${fieldValue}` : `${fieldName.replace('-', ' ')}: Not found in receipt`);
            
            fieldItem.appendChild(label);
            fieldItem.appendChild(value);
            fieldsContainer.appendChild(fieldItem);
        });
        
        // Show fields list and hide placeholder
        this.fieldsList.style.display = 'flex';
        this.fieldsTab.querySelector('.results-placeholder').style.display = 'none';
        
        // Announce completion to screen readers
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.className = 'sr-only';
        announcement.textContent = `Analysis complete. ${Object.keys(this.extractedFields).length} fields extracted from receipt.`;
        document.body.appendChild(announcement);
        setTimeout(() => document.body.removeChild(announcement), 1000);
    }

    displayOCRResult() {
        if (!this.ocrData) return;
        
        // Just display the extracted text, not the full JSON
        this.ocrResult.textContent = this.ocrData.text || 'No text extracted';
        
        // Show result content and hide placeholder
        this.resultContent.style.display = 'block';
        this.resultTab.querySelector('.results-placeholder').style.display = 'none';
    }

    switchTab(tabName) {
        // Update tab buttons
        this.tabBtns.forEach(btn => {
            btn.classList.remove('active');
            btn.setAttribute('aria-selected', 'false');
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active');
                btn.setAttribute('aria-selected', 'true');
            }
        });

        // Update tab content
        this.tabContents.forEach(content => {
            content.classList.remove('active');
        });

        if (tabName === 'fields') {
            this.fieldsTab.classList.add('active');
        } else if (tabName === 'result') {
            this.resultTab.classList.add('active');
        }
        
        // Announce tab change to screen readers
        const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeTab) {
            activeTab.focus();
        }
    }

    resetResults() {
        // Reset extracted data
        this.ocrData = null;
        this.extractedFields = null;
        
        // Hide results and show placeholders
        this.fieldsList.style.display = 'none';
        this.fieldsTab.querySelector('.results-placeholder').style.display = 'block';
        this.resultContent.style.display = 'none';
        this.resultTab.querySelector('.results-placeholder').style.display = 'block';
        
        // Reset to original image view
        this.selectedImage.style.display = 'block';
        this.annotatedCanvas.style.display = 'none';
        
        // Reset zoom
        this.updateZoom();
        
        // Switch back to fields tab
        this.switchTab('fields');
    }

    showProgress() {
        this.progressSection.style.display = 'block';
        this.progressFill.style.width = '0%';
        this.progressText.textContent = 'Starting analysis...';
        this.analyzeBtn.disabled = true;
    }

    updateProgress(percentage, text) {
        this.progressFill.style.width = `${percentage}%`;
        this.progressText.textContent = text;
        
        // Update ARIA attributes
        const progressBar = this.progressSection.querySelector('.progress-bar');
        progressBar.setAttribute('aria-valuenow', percentage);
        progressBar.setAttribute('aria-valuetext', `${Math.round(percentage)}% - ${text}`);
    }

    hideProgress() {
        this.progressSection.style.display = 'none';
        this.analyzeBtn.disabled = false;
    }

    disableUploadAndSelection() {
        // Disable file upload area
        this.uploadArea.classList.add('disabled');
        this.uploadArea.setAttribute('tabindex', '-1');
        this.uploadArea.setAttribute('aria-disabled', 'true');
        this.imageInput.disabled = true;
        
        // Disable all thumbnail selection
        const thumbnails = document.querySelectorAll('.thumbnail-item');
        thumbnails.forEach(thumbnail => {
            thumbnail.classList.add('disabled');
            thumbnail.setAttribute('tabindex', '-1');
            thumbnail.setAttribute('aria-disabled', 'true');
        });
        
        // Disable remove buttons
        const removeButtons = document.querySelectorAll('.thumbnail-remove');
        removeButtons.forEach(button => {
            button.disabled = true;
            button.setAttribute('aria-disabled', 'true');
        });
    }

    enableUploadAndSelection() {
        // Enable file upload area
        this.uploadArea.classList.remove('disabled');
        this.uploadArea.setAttribute('tabindex', '0');
        this.uploadArea.setAttribute('aria-disabled', 'false');
        this.imageInput.disabled = false;
        
        // Enable all thumbnail selection
        const thumbnails = document.querySelectorAll('.thumbnail-item');
        thumbnails.forEach(thumbnail => {
            thumbnail.classList.remove('disabled');
            thumbnail.setAttribute('tabindex', '0');
            thumbnail.setAttribute('aria-disabled', 'false');
        });
        
        // Enable remove buttons
        const removeButtons = document.querySelectorAll('.thumbnail-remove');
        removeButtons.forEach(button => {
            button.disabled = false;
            button.setAttribute('aria-disabled', 'false');
        });
    }

    showError(message, title = 'Error') {
        // Update the heading
        const errorHeading = this.errorSection.querySelector('h2');
        errorHeading.textContent = title;
        
        // Handle newlines in the message
        this.errorMessage.innerHTML = message.replace(/\n/g, '<br>');
        
        // Force styling for fallback mode
        if (title === 'Fallback mode activated') {
            this.errorSection.style.borderColor = '#007acc';
            this.errorSection.style.color = '#333';
            errorHeading.style.color = '#333';
            this.errorMessage.style.color = '#333';
        }
        
        this.errorSection.style.display = 'block';
        this.hideProgress();
    }

    hideError() {
        this.errorSection.style.display = 'none';
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new InformationExtractor();
});

// Handle any uncaught errors
window.addEventListener('error', (event) => {
    console.error('Uncaught error:', event.error);
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    event.preventDefault();
});