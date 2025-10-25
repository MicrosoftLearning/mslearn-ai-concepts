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
        
        // Enable analyze button only if image is selected and model is loaded
        if (this.selectedImageIndex >= 0 && this.isModelLoaded) {
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

    async addImage(file) {
        const imageUrl = URL.createObjectURL(file);
        const imageData = {
            file: file,
            url: imageUrl,
            name: file.name
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
        thumbnailItem.setAttribute('aria-label', `Receipt image ${index + 1}: ${imageData.name}`);
        thumbnailItem.innerHTML = `
            <img src="${imageData.url}" alt="Thumbnail of ${imageData.name}" />
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
        
        // Enable analyze button
        this.analyzeBtn.disabled = !this.isModelLoaded;
        
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
                        const percentage = 30 + Math.round(progress.progress * 60); // 30-90%
                        const progressText = `Loading ${availableModels[0].model_id}: ${Math.round(progress.progress * 100)}%`;
                        this.updateModelLoadingProgress(percentage, progressText);
                        console.log('Model loading progress:', Math.round(progress.progress * 100) + '%');
                    }
                }
            );
            
            this.currentModelId = availableModels[0].model_id;
            this.updateModelLoadingProgress(90, 'Testing model...');
            
            // Test the model with a simple prompt
            try {
                console.log('Testing model with simple prompt...');
                const testResponse = await this.engine.chat.completions.create({
                    messages: [{ role: "user", content: "Hello, can you respond with 'Model is working'?" }],
                    max_tokens: 10,
                    temperature: 0.1
                });
                console.log('Model test response:', testResponse.choices[0].message.content);
                
                this.isModelLoaded = true;
                this.updateModelLoadingProgress(100, 'Model ready!');
                console.log('Model loaded successfully:', this.currentModelId);
                
                // Hide loading screen after a brief delay
                setTimeout(() => {
                    this.hideModelLoading();
                }, 1000);
                
            } catch (testError) {
                console.error('Model test failed:', testError);
                this.isModelLoaded = false;
                throw new Error('Model loaded but not responding correctly');
            }
            
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
                this.showError(`Failed to load AI model: ${error.message}. Please refresh the page and try again.`);
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
            
            // Step 2: Extract fields with LLM
            this.updateProgress(60, 'Extracting field information...');
            await this.extractFields();
            
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
        if (!this.extractedFields) return;
        
        const fieldsContainer = this.fieldsList;
        fieldsContainer.innerHTML = '';
        
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

    showError(message) {
        this.errorMessage.textContent = message;
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