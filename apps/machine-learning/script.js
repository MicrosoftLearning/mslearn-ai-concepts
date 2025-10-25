// ML Lite - Machine Learning Application with PyScript Integration

// Global application state
let appState = {
    currentTab: 0,
    modelType: null,
    data: null,
    headers: [],
    targetColumn: null,
    featureColumns: [],
    trainSplit: 0.7,
    numClusters: 3,
    clusterMethod: 'auto',
    trainedModel: null,
    metrics: {},
    scaler: null,
    encoder: null,
    features: [],
    // Training session state tracking
    lastTrainingSettings: null,
    hasUnsavedChanges: false
};

// Tab management
const tabs = ['model-data', 'training-settings', 'training-process', 'training-results', 'test'];

// Training session state management
function getCurrentTrainingSettings() {
    return {
        modelType: appState.modelType,
        targetColumn: appState.targetColumn,
        featureColumns: [...appState.featureColumns],
        trainSplit: appState.trainSplit,
        numClusters: appState.numClusters,
        clusterMethod: appState.clusterMethod
    };
}

function hasTrainingSettingsChanged() {
    if (!appState.lastTrainingSettings) {
        return false;
    }
    
    const current = getCurrentTrainingSettings();
    const last = appState.lastTrainingSettings;
    
    return (
        current.modelType !== last.modelType ||
        current.targetColumn !== last.targetColumn ||
        JSON.stringify(current.featureColumns) !== JSON.stringify(last.featureColumns) ||
        current.trainSplit !== last.trainSplit ||
        current.numClusters !== last.numClusters ||
        current.clusterMethod !== last.clusterMethod
    );
}

function saveCurrentTrainingSettings() {
    appState.lastTrainingSettings = getCurrentTrainingSettings();
    appState.hasUnsavedChanges = false;
}

function markSettingsChanged() {
    if (appState.trainedModel && appState.lastTrainingSettings) {
        appState.hasUnsavedChanges = hasTrainingSettingsChanged();
        updateTrainingStatus();
    }
}

function invalidateTrainedModel() {
    if (appState.trainedModel && hasTrainingSettingsChanged()) {
        appState.trainedModel = null;
        appState.metrics = {};
        appState.hasUnsavedChanges = true;
        
        // Update UI to reflect that model needs retraining
        updateTrainingStatus();
        updateNextButtonState();
        
        console.log('Trained model invalidated due to settings change');
    }
}

function updateTrainingStatus() {
    const statusContainer = document.getElementById('training-status-message');
    
    if (!statusContainer) {
        // Create status container if it doesn't exist
        const trainingSettings = document.getElementById('training-settings');
        if (trainingSettings) {
            const statusDiv = document.createElement('div');
            statusDiv.id = 'training-status-message';
            statusDiv.className = 'training-status-message';
            trainingSettings.insertBefore(statusDiv, trainingSettings.firstChild);
        }
    }
    
    const statusElement = document.getElementById('training-status-message');
    if (!statusElement) return;
    
    if (appState.trainedModel && !appState.hasUnsavedChanges) {
        // Model is trained and up to date
        statusElement.innerHTML = `
            <div class="status-success">
                <i class="fas fa-check-circle"></i>
                Model trained successfully with current settings
            </div>
        `;
        statusElement.style.display = 'block';
    } else if (appState.lastTrainingSettings && appState.hasUnsavedChanges) {
        // Settings have changed since last training - show subtle info message
        statusElement.innerHTML = `
            <div class="status-info">
                <i class="fas fa-info-circle"></i>
                Settings have been modified. Click "Start Training" to train with updated configuration.
            </div>
        `;
        statusElement.style.display = 'block';
    } else {
        // No previous training or no changes
        statusElement.style.display = 'none';
    }
}

// Initialize the application
function initializeApp() {
    // Initialize model type from HTML default
    const modelTypeSelect = document.getElementById('modelType');
    if (modelTypeSelect && modelTypeSelect.value) {
        appState.modelType = modelTypeSelect.value;
        console.log('Initialized model type from default:', appState.modelType);
    }
    
    setupEventListeners();
    updateTabState();
    
    // Run initial validation
    updateNextButtonState();
    
    // Show PyScript loading status
    showPyScriptLoadingStatus();
}

// Show PyScript loading status
function showPyScriptLoadingStatus() {
    // Disable all UI elements initially
    disableUI(true);
    
    // Get progress elements - check if they exist
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    
    // If progress elements don't exist yet, wait a bit and try again
    if (!progressBar || !progressText) {
        console.log('Progress elements not ready, retrying in 100ms...');
        setTimeout(showPyScriptLoadingStatus, 100);
        return;
    }
    
    // Start progress animation
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += 2;
        if (progress > 90) progress = 90; // Don't complete until actually ready
        if (progressBar) {
            progressBar.style.width = progress + '%';
        }
    }, 100);
    
    // Check if PyScript is ready - check for ML functions
    const checkReady = setInterval(() => {
        // Debug logging
        console.log('Checking PyScript status:', {
            pyTrainModel: typeof window.pyTrainModel,
            pyMakePrediction: typeof window.pyMakePrediction,
            pyScriptReady: window.pyScriptReady
        });
        
        const isPyScriptReady = (
            typeof window.pyTrainModel !== 'undefined' && 
            typeof window.pyMakePrediction !== 'undefined' && 
            window.pyScriptReady === true
        );
        
        if (isPyScriptReady) {
            console.log('PyScript is ready!');
            
            // Complete the progress bar
            clearInterval(progressInterval);
            progressBar.style.width = '100%';
            progressBar.classList.add('complete');
            progressText.textContent = '✅ ML Engine Ready!';
            progressText.style.color = 'var(--success-green)';
            
            // Enable UI but keep progress bar visible
            disableUI(false);
            
            clearInterval(checkReady);
            console.log('ML Engine status updated: Ready!');
        }
    }, 500);
    
    // Remove loading indicator after timeout even if not ready
    setTimeout(() => {
        const isPyScriptReady = (
            typeof window.pyTrainModel !== 'undefined' && 
            typeof window.pyMakePrediction !== 'undefined'
        );
        
        if (!isPyScriptReady) {
            clearInterval(progressInterval);
            progressBar.classList.add('error');
            progressBar.style.width = '100%';
            progressText.textContent = '⚠️ Timeout - refresh page';
            progressText.style.color = 'var(--error-red)';
        }
        clearInterval(checkReady);
    }, 30000); // 30 second timeout
}

// Disable/enable UI elements during loading
function disableUI(disabled) {
    const mainContent = document.querySelector('.main-content');
    const tabButtons = document.querySelectorAll('.tab-button');
    const inputs = document.querySelectorAll('input, select, button:not(#prevButton):not(#nextButton):not(#trainAnotherButton):not(#saveModelButton)');
    
    if (disabled) {
        // Add disabled class if element exists
        if (mainContent) {
            mainContent.classList.add('ui-disabled');
        }
        tabButtons.forEach(btn => {
            if (btn) btn.disabled = true;
        });
        inputs.forEach(input => {
            if (input) input.disabled = true;
        });
    } else {
        // Remove disabled class if element exists
        if (mainContent) {
            mainContent.classList.remove('ui-disabled');
        }
        tabButtons.forEach(btn => {
            if (btn) btn.disabled = false;
        });
        inputs.forEach(input => {
            if (input) input.disabled = false;
        });
        
        // Re-enable proper tab navigation state if function exists
        if (typeof updateTabStates === 'function') {
            updateTabStates();
        }
    }
}

// Set up all event listeners
function setupEventListeners() {
    // Tab navigation
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const tabId = e.currentTarget.dataset.tab;
            const tabIndex = tabs.indexOf(tabId);
            if (tabIndex !== -1 && !e.currentTarget.disabled) {
                switchToTab(tabIndex);
            }
        });
    });

    // Navigation buttons
    document.getElementById('prevButton').addEventListener('click', () => {
        if (appState.currentTab > 0) {
            switchToTab(appState.currentTab - 1);
        }
    });

    // Next button for tabs 0-3
    const nextButton = document.getElementById('nextButton');
    if (nextButton) {
        nextButton.addEventListener('click', () => {
            if (appState.currentTab < tabs.length - 1) {
                switchToTab(appState.currentTab + 1);
            }
        });
    }

    // Train Another Model button
    const trainAnotherButton = document.getElementById('trainAnotherButton');
    if (trainAnotherButton) {
        trainAnotherButton.addEventListener('click', () => {
            resetApplication();
        });
    }

    // Save Model button
    const saveModelButton = document.getElementById('saveModelButton');
    if (saveModelButton) {
        saveModelButton.addEventListener('click', () => {
            saveTrainedModel();
        });
    }

    // Model type selection
    document.getElementById('modelType').addEventListener('change', (e) => {
        appState.modelType = e.target.value;
        invalidateTrainedModel();
        updateNextButtonState();
    });

    // File upload
    document.getElementById('dataFile').addEventListener('change', handleFileUpload);

    // Training split slider
    document.getElementById('trainSplit').addEventListener('input', (e) => {
        appState.trainSplit = parseInt(e.target.value) / 100;
        const trainPercent = parseInt(e.target.value);
        const testPercent = 100 - trainPercent;
        document.getElementById('splitDisplay').textContent = 
            `${trainPercent}% training / ${testPercent}% testing`;
        markSettingsChanged();
    });
    
    // Initialize training split slider to match appState (ensure 70% default position)
    const trainSplitSlider = document.getElementById('trainSplit');
    if (trainSplitSlider) {
        const initialValue = Math.round(appState.trainSplit * 100);
        trainSplitSlider.value = initialValue;
        document.getElementById('splitDisplay').textContent = 
            `${initialValue}% training / ${100 - initialValue}% testing`;
    }

    // Cluster method selection
    document.querySelectorAll('input[name="clusterMethod"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            appState.clusterMethod = e.target.value;
            const numClustersInput = document.getElementById('numClusters');
            const manualClustersContainer = document.getElementById('manual-clusters');
            
            if (e.target.value === 'auto') {
                // Hide manual input when auto is selected
                if (manualClustersContainer) manualClustersContainer.style.display = 'none';
                if (numClustersInput) numClustersInput.disabled = true;
            } else {
                // Show manual input when manual is selected
                if (manualClustersContainer) manualClustersContainer.style.display = 'block';
                if (numClustersInput) numClustersInput.disabled = false;
            }
            
            markSettingsChanged();
            updateNextButtonState();
        });
    });

    // Number of clusters
    document.getElementById('numClusters').addEventListener('change', (e) => {
        appState.numClusters = parseInt(e.target.value);
        markSettingsChanged();
    });

    // Start training button
    document.getElementById('startTraining').addEventListener('click', startTraining);

    // Make prediction button
    document.getElementById('makePrediction').addEventListener('click', makePrediction);
}

// Switch to a specific tab
function switchToTab(tabIndex) {
    console.log('switchToTab called with index:', tabIndex);
    if (tabIndex < 0 || tabIndex >= tabs.length) return;
    
    // Prevent navigation to results/test tabs if no model has ever been trained
    if (tabIndex >= 3 && !appState.lastTrainingSettings) {
        console.log('Cannot navigate to results/test tabs without any previous training');
        return;
    }
    
    appState.currentTab = tabIndex;
    console.log('Updated appState.currentTab to:', appState.currentTab);
    
    // Update tab buttons with ARIA attributes
    document.querySelectorAll('.tab-button').forEach((button, index) => {
        const isActive = index === tabIndex;
        button.classList.toggle('active', isActive);
        button.setAttribute('aria-selected', isActive.toString());
        if (isActive) {
            button.focus();
        }
    });
    
    // Update tab panels with ARIA attributes
    document.querySelectorAll('.tab-panel').forEach((panel, index) => {
        const isActive = index === tabIndex;
        panel.classList.toggle('active', isActive);
        panel.setAttribute('aria-hidden', (!isActive).toString());
        if (isActive) {
            console.log(`Tab ${index} (${panel.id}) set to active, display:`, getComputedStyle(panel).display);
        }
    });
    
    // Update navigation buttons
    updateNavigationButtons();
    
    // Perform tab-specific setup
    switch (tabIndex) {
        case 1: // Training settings
            console.log('Switching to Training Settings tab, calling setupTrainingSettings()');
            setupTrainingSettings();
            // Check if settings have changed and update status
            if (appState.trainedModel) {
                markSettingsChanged();
            }
            break;
        case 2: // Training process
            setupTrainingProcess();
            break;
        case 3: // Training results
            displayTrainingResults();
            break;
        case 4: // Test
            setupTestTab();
            break;
    }
}

// Update navigation button states
function updateNavigationButtons() {
    const prevButton = document.getElementById('prevButton');
    const nextButton = document.getElementById('nextButton');
    
    prevButton.disabled = appState.currentTab === 0;
    
    // Enable next button based on current tab requirements
    updateNextButtonState();
}

// Update next button state based on current tab requirements
function updateNextButtonState() {
    const nextButton = document.getElementById('nextButton');
    const trainAnotherButton = document.getElementById('trainAnotherButton');
    
    // Check if buttons exist
    if (!nextButton) {
        console.error('Next button not found');
        return;
    }
    
    let canProceed = false;
    
    console.log('Updating button state for tab:', appState.currentTab);
    console.log('App state:', {
        modelType: appState.modelType,
        hasData: !!appState.data,
        dataLength: appState.data?.length,
        targetColumn: appState.targetColumn,
        featureColumns: appState.featureColumns.length
    });
    
    switch (appState.currentTab) {
        case 0: // Model type and data
            canProceed = appState.modelType && appState.data && appState.data.length > 0;
            console.log('Tab 0 validation:', { modelType: appState.modelType, hasData: !!appState.data, canProceed });
            break;
        case 1: // Training settings
            if (appState.modelType === 'clustering') {
                canProceed = appState.featureColumns.length > 0;
            } else {
                canProceed = appState.targetColumn && appState.featureColumns.length > 0;
            }
            break;
        case 2: // Training process
            // Can only proceed if model is trained AND settings haven't changed
            canProceed = appState.trainedModel !== null && !appState.hasUnsavedChanges;
            break;
        case 3: // Training results
            canProceed = true;
            break;
        case 4: // Test
            canProceed = false; // Last tab
            break;
    }
    
    console.log('Final canProceed:', canProceed);
    
    // Handle next button for tabs 0-3
    if (nextButton) {
        nextButton.disabled = !canProceed;
    }
    
    // Show/hide appropriate button based on current tab
    const saveModelButton = document.getElementById('saveModelButton');
    if (appState.currentTab === 4) { // Test tab
        if (nextButton) nextButton.style.display = 'none';
        if (trainAnotherButton) trainAnotherButton.style.display = 'inline-block';
    } else {
        if (nextButton) nextButton.style.display = 'inline-block';
        if (trainAnotherButton) trainAnotherButton.style.display = 'none';
    }
    
    // Show Save Model button on Training Process tab after training is complete
    if (appState.currentTab === 2 && appState.trainedModel) { // Training Process tab
        if (saveModelButton) saveModelButton.style.display = 'inline-block';
    } else {
        if (saveModelButton) saveModelButton.style.display = 'none';
    }
    
    // Update tab button states - allow navigation to previously completed tabs
    document.querySelectorAll('.tab-button').forEach((button, index) => {
        let shouldEnable = false;
        
        if (index <= appState.currentTab) {
            // Can always go back to current or previous tabs
            shouldEnable = true;
        } else if (index === appState.currentTab + 1 && canProceed) {
            // Can go to next tab if requirements are met
            shouldEnable = true;
        } else if (appState.lastTrainingSettings && index <= 4) {
            // If we've previously trained a model, allow navigation to all tabs
            // (even if current model is invalidated, user can still view previous results)
            shouldEnable = true;
        }
        
        button.disabled = !shouldEnable;
    });
}

// Handle file upload
async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    document.getElementById('fileName').textContent = file.name;
    
    // Use FileReader instead of file.text() to avoid potential caching issues
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            parseCSVData(e.target.result);
            document.getElementById('data-preview').style.display = 'block';
            displayDataPreview();
            updateNextButtonState();
        } catch (error) {
            console.error('Error reading file:', error);
            alert('Error reading file. Please make sure it\'s a valid CSV file.');
        }
    };
    
    reader.onerror = function(e) {
        console.error('FileReader error:', e);
        alert('Error reading file. Please try again.');
    };
    
    reader.readAsText(file);
}

// Parse CSV data
function parseCSVData(csvText) {
    const lines = csvText.trim().split('\n');
    const data = lines.map(line => line.split(',').map(cell => cell.trim()));
    
    // Check if this is the same data (avoid unnecessary resets)
    const isSameData = appState.data && 
                      appState.data.length === data.length - 1 && 
                      JSON.stringify(appState.headers) === JSON.stringify(data[0]);
    
    // Always assume first row contains headers
    if (data.length > 0) {
        appState.headers = data[0];
        appState.data = data.slice(1);
    } else {
        appState.headers = [];
        appState.data = [];
    }
    
    // Only invalidate training state if this is actually new/different data
    if (!isSameData) {
        // New data means previous training is no longer valid
        if (appState.trainedModel) {
            appState.trainedModel = null;
            appState.metrics = {};
            appState.lastTrainingSettings = null;
            appState.hasUnsavedChanges = false;
            console.log('Trained model invalidated due to new data upload');
        }
        
        // Reset training-related state since we have new data
        appState.targetColumn = null;
        appState.featureColumns = [];
    }
    
    updateTabState();
    
    // If we're currently on the training settings tab, refresh it
    if (appState.currentTab === 1) {
        setupTrainingSettings();
    }
}

// Display data preview
function displayDataPreview() {
    const table = document.getElementById('dataTable');
    const dataPreview = document.getElementById('data-preview');
    
    // Check if table exists before proceeding
    if (!table) {
        console.error('Required DOM elements not found:', { 
            table: !!table,
            dataPreview: !!dataPreview 
        });
        
        // Try to recreate the missing elements or show a fallback
        if (dataPreview && !table) {
            console.log('Recreating dataTable element');
            dataPreview.innerHTML = `
                <h3>Data Preview <span style="font-size: 0.8em; color: #666; font-weight: normal;">(showing first 3 rows)</span></h3>
                <p style="color: #666; font-size: 0.9em; margin-bottom: 15px;">Note: First row must contain column headers</p>

                <div class="table-container">
                    <table id="dataTable">
                        <!-- Data will be populated here -->
                    </table>
                </div>
                
                <p id="dataInfo">No data uploaded yet.</p>
            `;
            
            // Retry the function now that elements should exist
            return displayDataPreview();
        }
        return;
    }
    
    // Clear existing content
    table.innerHTML = '';
    
    if (!appState.data || appState.data.length === 0) return;
    
    // Create table header (headers always come from first row)
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    appState.headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Create table body (first 3 rows)
    const tbody = document.createElement('tbody');
    const rowsToShow = Math.min(3, appState.data.length);
    
    for (let i = 0; i < rowsToShow; i++) {
        const row = document.createElement('tr');
        appState.data[i].forEach(cell => {
            const td = document.createElement('td');
            td.textContent = cell;
            row.appendChild(td);
        });
        tbody.appendChild(row);
    }
    table.appendChild(tbody);
    
    // Update data info
    const dataInfo = document.getElementById('dataInfo');
    if (dataInfo) {
        const totalRows = appState.data.length;
        const totalCols = appState.headers.length;
        dataInfo.textContent = `Dataset: ${totalRows} rows, ${totalCols} columns`;
    }
}

// Setup training settings tab
function setupTrainingSettings() {
    console.log('=== setupTrainingSettings called ===');
    console.log('appState.data exists:', !!appState.data);
    console.log('appState.data length:', appState.data ? appState.data.length : 'N/A');
    console.log('appState.headers:', appState.headers);
    console.log('appState.headers length:', appState.headers ? appState.headers.length : 'N/A');
    console.log('appState.modelType:', appState.modelType);
    console.log('appState.currentTab:', appState.currentTab);
    
    if (!appState.data || !appState.headers || appState.headers.length === 0) {
        console.log('Missing data or headers, returning early');
        // Hide training settings if no data
        const supervisedSettings = document.getElementById('supervised-settings');
        const clusteringSettings = document.getElementById('clustering-settings');
        if (supervisedSettings) supervisedSettings.style.display = 'none';
        if (clusteringSettings) clusteringSettings.style.display = 'none';
        return;
    }
    
    const isClustering = appState.modelType === 'clustering';
    console.log('isClustering:', isClustering);
    
    // Show/hide appropriate sections
    const supervisedSettings = document.getElementById('supervised-settings');
    const clusteringSettings = document.getElementById('clustering-settings');
    
    console.log('supervisedSettings element:', !!supervisedSettings);
    console.log('clusteringSettings element:', !!clusteringSettings);
    
    if (supervisedSettings) {
        supervisedSettings.style.display = isClustering ? 'none' : 'block';
    }
    if (clusteringSettings) {
        clusteringSettings.style.display = isClustering ? 'block' : 'none';
    }
    
    // Force clear and rebuild all training settings
    if (!isClustering) {
        // Clear and rebuild target column dropdown
        const targetSelect = document.getElementById('targetColumn');
        if (targetSelect) {
            console.log('Setting up target column dropdown');
            targetSelect.innerHTML = '<option value="">Select target column...</option>';
            appState.headers.forEach(header => {
                const option = document.createElement('option');
                option.value = header;
                option.textContent = header;
                targetSelect.appendChild(option);
            });
            
            // Preserve existing selection if it's still valid
            if (appState.targetColumn && appState.headers.includes(appState.targetColumn)) {
                targetSelect.value = appState.targetColumn;
            } else {
                targetSelect.value = '';
                appState.targetColumn = null;
            }
            
            // Remove any existing event listeners and add fresh one
            targetSelect.removeEventListener('change', handleTargetChange);
            targetSelect.addEventListener('change', handleTargetChange);
            console.log('Target column dropdown set up with', appState.headers.length, 'options');
        }
        
        // Clear and rebuild feature columns
        const featureContainer = document.getElementById('featureColumns');
        if (featureContainer) {
            console.log('Setting up feature columns container');
            featureContainer.innerHTML = '';
            // Don't clear appState.featureColumns - preserve user's selections
            updateFeatureColumns();
            featureContainer.style.display = 'block';
        }
    } else {
        // Clear and rebuild clustering features
        const clusteringContainer = document.getElementById('clusteringFeatures');
        if (clusteringContainer) {
            console.log('Setting up clustering features container');
            clusteringContainer.innerHTML = '';
            // Don't clear appState.featureColumns - preserve user's selections
            updateClusteringFeatures();
        }
        
        // Initialize manual clusters container visibility based on current selection
        const manualClustersContainer = document.getElementById('manual-clusters');
        
        // Preserve cluster method radio button selection
        const clusterMethodRadios = document.querySelectorAll('input[name="clusterMethod"]');
        clusterMethodRadios.forEach(radio => {
            radio.checked = (radio.value === appState.clusterMethod);
        });
        
        // Preserve number of clusters input value
        const numClustersInput = document.getElementById('numClusters');
        if (numClustersInput) {
            numClustersInput.value = appState.numClusters;
        }
        
        // Update manual clusters container visibility based on preserved selection
        if (manualClustersContainer) {
            if (appState.clusterMethod === 'manual') {
                manualClustersContainer.style.display = 'block';
                if (numClustersInput) numClustersInput.disabled = false;
            } else {
                manualClustersContainer.style.display = 'none';
                if (numClustersInput) numClustersInput.disabled = true;
            }
        }
    }
    
    // Don't force show training settings - let tab switching handle visibility
    
    // Debug: Check if elements are actually visible after setup
    setTimeout(() => {
        console.log('=== POST-SETUP DEBUG CHECK ===');
        const targetSelect = document.getElementById('targetColumn');
        const featureContainer = document.getElementById('featureColumns');
        const supervisedSettings = document.getElementById('supervised-settings');
        const trainingSettingsTab = document.getElementById('training-settings');
        
        console.log('targetSelect exists:', !!targetSelect);
        console.log('targetSelect visible:', targetSelect ? targetSelect.style.display !== 'none' : 'N/A');
        console.log('targetSelect options count:', targetSelect ? targetSelect.options.length : 'N/A');
        
        console.log('featureContainer exists:', !!featureContainer);
        console.log('featureContainer visible:', featureContainer ? featureContainer.style.display !== 'none' : 'N/A');
        console.log('featureContainer innerHTML length:', featureContainer ? featureContainer.innerHTML.length : 'N/A');
        
        console.log('supervisedSettings exists:', !!supervisedSettings);
        console.log('supervisedSettings visible:', supervisedSettings ? supervisedSettings.style.display !== 'none' : 'N/A');
        console.log('supervisedSettings innerHTML length:', supervisedSettings ? supervisedSettings.innerHTML.length : 'N/A');
        
        console.log('trainingSettingsTab exists:', !!trainingSettingsTab);
        console.log('trainingSettingsTab has active class:', trainingSettingsTab ? trainingSettingsTab.classList.contains('active') : 'N/A');
        console.log('trainingSettingsTab display style:', trainingSettingsTab ? getComputedStyle(trainingSettingsTab).display : 'none');
        console.log('trainingSettingsTab inline style:', trainingSettingsTab ? trainingSettingsTab.style.display : 'none');
        console.log('trainingSettingsTab offsetHeight:', trainingSettingsTab ? trainingSettingsTab.offsetHeight : 0);
        
        // Check all CSS rules affecting this element
        if (trainingSettingsTab) {
            const allRules = window.getMatchedCSSRules ? window.getMatchedCSSRules(trainingSettingsTab) : 'Not supported';
            console.log('CSS rules affecting trainingSettingsTab:', allRules);
        }
    }, 100);
    
    // Update training status after setup
    updateTrainingStatus();
    
    console.log('setupTrainingSettings completed');
}

// Handle target column selection change
function handleTargetChange(e) {
    const previousTarget = appState.targetColumn;
    appState.targetColumn = e.target.value;
    
    // Only clear feature columns if target actually changed and we had features selected for the previous target
    if (previousTarget !== appState.targetColumn && previousTarget) {
        // Remove the old target from feature columns if it was selected
        appState.featureColumns = appState.featureColumns.filter(col => col !== previousTarget);
    }
    
    updateFeatureColumns();
    markSettingsChanged();
    updateNextButtonState();
}

// Update feature columns checkboxes (for supervised learning)
function updateFeatureColumns() {
    const container = document.getElementById('featureColumns');
    const featureSection = container.closest('.setting-group');
    
    // If no target column is selected, show instruction message
    if (!appState.targetColumn) {
        featureSection.style.display = 'block'; // Always show the section
        container.innerHTML = `
            <div class="instruction-message" style="padding: 15px; background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 4px; color: #6c757d; font-style: italic; margin-top: 10px;">
                <i class="fas fa-info-circle" style="margin-right: 8px;"></i>
                Select a target column above to choose your feature columns
            </div>
        `;
        appState.featureColumns = [];
        updateNextButtonState();
        return;
    }
    
    // Show feature section and populate with remaining columns
    featureSection.style.display = 'block';
    container.innerHTML = '';
    
    // Get all columns except the target column
    const availableFeatures = appState.headers.filter(header => header !== appState.targetColumn);
    
    // Only auto-select all features if none are currently selected AND this is a fresh setup
    // (not when navigating back to a previously configured state)
    if (appState.featureColumns.length === 0 && !appState.lastTrainingSettings) {
        appState.featureColumns = [...availableFeatures];
    } else {
        // When navigating back, filter out any features that are no longer available
        appState.featureColumns = appState.featureColumns.filter(col => availableFeatures.includes(col));
    }
    
    availableFeatures.forEach(header => {
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = header;
        checkbox.checked = appState.featureColumns.includes(header);
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                appState.featureColumns.push(header);
            } else {
                appState.featureColumns = appState.featureColumns.filter(col => col !== header);
            }
            markSettingsChanged();
            updateNextButtonState();
        });
        
        const span = document.createElement('span');
        span.textContent = header;
        
        label.appendChild(checkbox);
        label.appendChild(span);
        container.appendChild(label);
    });
    
    updateNextButtonState();
}

// Update clustering feature columns
function updateClusteringFeatures() {
    const container = document.getElementById('clusteringFeatures');
    container.innerHTML = '';
    
    appState.headers.forEach(header => {
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = header;
        checkbox.checked = appState.featureColumns.includes(header);
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                appState.featureColumns.push(header);
            } else {
                appState.featureColumns = appState.featureColumns.filter(col => col !== header);
            }
            markSettingsChanged();
            updateNextButtonState();
        });
        
        const span = document.createElement('span');
        span.textContent = header;
        
        label.appendChild(checkbox);
        label.appendChild(span);
        container.appendChild(label);
    });
}

// Setup training process tab
function setupTrainingProcess() {
    displayConfigurationSummary();
    
    const startButton = document.getElementById('startTraining');
    const retrainButton = document.getElementById('retrainButton');
    const saveModelButton = document.getElementById('saveModelButton');
    const trainingProgress = document.getElementById('training-progress');
    const progressLog = document.getElementById('progressLog');
    
    // Remove retrain button if it exists (we'll use Start Training instead)
    if (retrainButton) {
        retrainButton.remove();
    }
    
    if (appState.hasUnsavedChanges || !appState.trainedModel) {
        // Settings have changed or no model - need to (re)train
        
        // Show Start Training button
        if (startButton) {
            startButton.style.display = 'inline-block';
            startButton.textContent = appState.lastTrainingSettings ? 'Start Training' : 'Start Training';
        }
        
        // Hide save model button
        if (saveModelButton) {
            saveModelButton.style.display = 'none';
        }
        
        // Clear previous training progress/logs
        if (trainingProgress) {
            trainingProgress.style.display = 'none';
        }
        if (progressLog) {
            progressLog.textContent = '';
        }
        
        // Reset progress bar
        const progressBar = document.getElementById('trainingProgressBar');
        const progressText = document.getElementById('progressText');
        const progressPercentage = document.getElementById('progressPercentage');
        if (progressBar) {
            progressBar.style.width = '0%';
            progressBar.classList.remove('animation-stopped');
            progressBar.style.removeProperty('animation');
        }
        if (progressText) progressText.textContent = 'Initializing...';
        if (progressPercentage) progressPercentage.textContent = '0%';
        
        // Reset training log to collapsed state
        const logContent = document.getElementById('logContent');
        const toggleBtn = document.getElementById('toggleLogBtn');
        if (logContent && toggleBtn) {
            logContent.classList.remove('expanded');
            logContent.classList.add('collapsed');
            toggleBtn.innerHTML = '<span id="logToggleIcon">▼</span> Show Details';
        }
        
    } else {
        // Model is trained and up to date - hide training button, show save button
        if (startButton) {
            startButton.style.display = 'none';
        }
        if (saveModelButton) {
            saveModelButton.style.display = 'inline-block';
        }
    }
}

// Display configuration summary
function displayConfigurationSummary() {
    const container = document.getElementById('configSummary');
    const items = [
        { label: 'Model Type', value: appState.modelType.charAt(0).toUpperCase() + appState.modelType.slice(1) },
        { label: 'Data Rows', value: appState.data.length.toString() },
        { label: 'Features', value: appState.featureColumns.join(', ') }
    ];
    
    if (appState.modelType !== 'clustering') {
        items.push(
            { label: 'Target Column', value: appState.targetColumn },
            { label: 'Train/Validation Split', value: `${Math.round(appState.trainSplit * 100)}% / ${Math.round((1 - appState.trainSplit) * 100)}%` }
        );
    } else {
        const clusterInfo = appState.clusterMethod === 'auto' ? 'Auto-detect optimal' : appState.numClusters.toString();
        items.push({ label: 'Number of Clusters', value: clusterInfo });
    }
    
    container.innerHTML = items.map(item => `
        <div class="config-item">
            <span class="config-label">${item.label}:</span>
            <span class="config-value">${item.value}</span>
        </div>
    `).join('');
}

// Start training process
async function startTraining() {
    document.getElementById('startTraining').style.display = 'none';
    document.getElementById('training-progress').style.display = 'block';
    
    // Initialize progress bar and re-enable animations
    const progressBar = document.getElementById('trainingProgressBar');
    if (progressBar) {
        progressBar.classList.remove('animation-stopped');
        progressBar.style.removeProperty('animation');
    }
    updateProgressBar(0, 'Initializing training...');
    
    try {
        await runTrainingWithPyScript();
        // Don't automatically switch tabs - let user click Next
        logProgress('Training completed! Click Next to view results.');
    } catch (error) {
        console.error('Training failed:', error);
        updateProgressBar(0, 'Training failed');
        logProgress('Error: Training failed - ' + error.message);
    }
}

// Update tab state helper
function updateTabState() {
    updateNextButtonState();
    
    // If we have data and headers, and we're on the training settings tab, set it up
    if (appState.data && appState.headers && appState.currentTab === 1) {
        setupTrainingSettings();
    }
}

// Setup test tab
function setupTestTab() {
    console.log('setupTestTab called');
    console.log('appState.featureColumns:', appState.featureColumns);
    console.log('appState.trainedModel:', appState.trainedModel);
    console.log('appState.modelType:', appState.modelType);
    
    // Check if we have the necessary data to show the prediction interface
    if (!appState.featureColumns.length) {
        console.log('No feature columns, showing no model message');
        // Hide prediction interface and show no model message
        const predictionInterface = document.getElementById('prediction-interface');
        const noModelMessage = document.getElementById('no-model-message');
        
        if (predictionInterface) {
            predictionInterface.style.display = 'none';
        }
        if (noModelMessage) {
            noModelMessage.style.display = 'block';
        }
        return;
    }
    
    console.log('Feature columns exist, showing prediction interface');
    // Show prediction interface and hide no model message
    const predictionInterface = document.getElementById('prediction-interface');
    const noModelMessage = document.getElementById('no-model-message');
    
    if (predictionInterface) {
        predictionInterface.style.display = 'block';
    }
    if (noModelMessage) {
        noModelMessage.style.display = 'none';
    }
    
    const container = document.getElementById('prediction-inputs');
    if (!container) {
        console.error('prediction-inputs element not found');
        return;
    }
    
    container.innerHTML = '';
    
    appState.featureColumns.forEach(feature => {
        const label = document.createElement('label');
        label.textContent = feature;
        label.setAttribute('for', `test-${feature}`);
        label.className = 'prediction-label';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.id = `test-${feature}`;
        input.placeholder = `Enter ${feature}`;
        input.className = 'prediction-input';
        
        // Pre-populate with sample value from training data
        if (appState.data && appState.data.length > 0) {
            const featureIndex = appState.headers.indexOf(feature);
            if (featureIndex !== -1 && appState.data[0] && appState.data[0][featureIndex]) {
                input.value = appState.data[0][featureIndex];
            }
        }
        
        container.appendChild(label);
        container.appendChild(input);
    });
}

// Make prediction
async function makePrediction() {
    const inputs = {};
    let hasValidInputs = true;
    
    appState.featureColumns.forEach(feature => {
        const input = document.getElementById(`test-${feature}`);
        const value = input.value.trim();
        if (!value) {
            hasValidInputs = false;
            return;
        }
        inputs[feature] = value;
    });
    
    if (!hasValidInputs) {
        alert('Please fill in all feature values.');
        return;
    }
    
    try {
        console.log('Inputs to be sent to PyScript:', inputs);
        console.log('Feature columns:', appState.featureColumns);
        const result = await predictWithPyScript(inputs);
        displayPredictionResult(result);
        document.getElementById('prediction-result').style.display = 'block';
    } catch (error) {
        console.error('Prediction failed:', error);
        alert('Prediction failed: ' + error.message);
    }
}

// Display prediction result
function displayPredictionResult(result) {
    const container = document.getElementById('prediction-output');
    if (!container) {
        console.error('prediction-output element not found');
        return;
    }
    
    if (appState.modelType === 'clustering') {
        container.innerHTML = `
            <div class="prediction-value">Cluster ${result}</div>
            <div class="prediction-label">Predicted cluster assignment</div>
        `;
    } else {
        container.innerHTML = `
            <div class="prediction-value">${result}</div>
            <div class="prediction-label">Predicted ${appState.targetColumn}</div>
        `;
    }
}

// Log progress messages
function logProgress(message) {
    const log = document.getElementById('progressLog');
    log.innerHTML += `${new Date().toLocaleTimeString()}: ${message}\n`;
    log.scrollTop = log.scrollHeight;
}

// Update progress bar
function updateProgressBar(percentage, text) {
    const progressBar = document.getElementById('trainingProgressBar');
    const progressText = document.getElementById('progressText');
    const progressPercentage = document.getElementById('progressPercentage');
    const progressContainer = document.querySelector('.progress-bar-wrapper[role="progressbar"]');
    
    if (progressBar) {
        progressBar.style.width = `${percentage}%`;
    }
    if (progressText) {
        progressText.textContent = text;
    }
    if (progressPercentage) {
        progressPercentage.textContent = `${percentage}%`;
    }
    
    // Update ARIA attributes for progress bar
    if (progressContainer) {
        progressContainer.setAttribute('aria-valuenow', percentage);
        progressContainer.setAttribute('aria-valuetext', `${percentage}% - ${text}`);
    }
    
    // Stop animation 2 seconds after training completes
    if (percentage >= 100) {
        setTimeout(() => {
            const progressBarFill = document.getElementById('trainingProgressBar');
            if (progressBarFill && progressBarFill.style.width === '100%') {
                progressBarFill.style.setProperty('animation', 'none', 'important');
                // Also stop animation on the ::after pseudo-element by adding a class
                progressBarFill.classList.add('animation-stopped');
            }
        }, 2000);
    }
}

// PyScript integration functions
async function runTrainingWithPyScript() {
    try {
        // Wait for PyScript to be ready - no fallback, must work
        if (typeof window.pyTrainModel === 'undefined') {
            updateProgressBar(10, 'Initializing PyScript and ML libraries...');
            logProgress('Initializing PyScript and ML libraries...');
            await waitForPyScript();
        }
        
        // Check if PyScript function is now available
        if (typeof window.pyTrainModel === 'undefined') {
            throw new Error('PyScript function pyTrainModel is not available after initialization');
        }
        
        console.log('PyScript function available:', typeof window.pyTrainModel);
        
        updateProgressBar(25, 'Loading and validating data...');
        
        // Get CSV data as text
        const csvText = getCsvText();
        if (!csvText) {
            throw new Error('No CSV data available');
        }
        
        console.log('CSV data length:', csvText.length);
        
        updateProgressBar(40, 'Starting machine learning training...');
        logProgress('Starting real machine learning training...');
        
        // Call Python training function
        console.log('Calling pyTrainModel...');
        console.log('Training parameters:', {
            csvLength: csvText.length,
            hasHeaders: true,
            modelType: appState.modelType,
            targetColumn: appState.targetColumn,
            featureColumns: appState.featureColumns,
            trainSplit: appState.trainSplit,
            availableHeaders: appState.headers
        });
        updateProgressBar(60, 'Training model with your data...');
        
        let result;
        try {
            // For clustering, pass additional parameters
            if (appState.modelType === 'clustering') {
                result = await window.pyTrainModel(
                    csvText,
                    true, // Always true since we now require headers in first row
                    appState.modelType,
                    null, // No target column for clustering
                    appState.featureColumns,
                    appState.trainSplit,
                    appState.clusterMethod, // 'auto' or 'manual'
                    appState.numClusters    // Number of clusters for manual mode
                );
            } else {
                result = await window.pyTrainModel(
                    csvText,
                    true, // Always true since we now require headers in first row
                    appState.modelType,
                    appState.targetColumn,
                    appState.featureColumns,
                    appState.trainSplit
                );
            }
        } catch (pyError) {
            console.error('PyScript function call failed:', pyError);
            throw new Error(`PyScript function call failed: ${pyError.message || pyError}`);
        }
        
        updateProgressBar(80, 'Processing training results...');
        
        // Parse JSON string result
        let parsedResult = result;
        if (typeof result === 'string') {
            try {
                parsedResult = JSON.parse(result);
            } catch (parseError) {
                console.error('Failed to parse result as JSON:', parseError);
                throw new Error(`Invalid JSON response from PyScript: ${result}`);
            }
        }
        
        if (parsedResult && parsedResult.success) {
            updateProgressBar(100, 'Training completed successfully!');
            logProgress('Real ML training completed successfully!');
            appState.trainedModel = { type: appState.modelType };
            
            // Store the metrics from PyScript
            if (parsedResult.metrics) {
                appState.metrics = parsedResult.metrics;
                logProgress(`Metrics calculated: ${Object.keys(parsedResult.metrics).join(', ')}`);
            }
            
            // Save the current training settings as the baseline
            saveCurrentTrainingSettings();
            
            updateNextButtonState();
        } else {
            // Provide more detailed error information
            let errorMsg = 'Real ML training failed';
            if (parsedResult && parsedResult.error) {
                errorMsg += `: ${parsedResult.error}`;
            } else if (parsedResult) {
                errorMsg += `: ${JSON.stringify(parsedResult)}`;
            } else {
                errorMsg += ': No result returned from PyScript function';
            }
            throw new Error(errorMsg);
        }
        
    } catch (error) {
        logProgress(`Training failed: ${error.message}`);
        console.error('Training failed:', error);
        
        // Show helpful error message to user
        alert(`Training failed: ${error.message}\n\nPlease:\n1. Refresh the page to reinitialize PyScript\n2. Check your CSV data format\n3. Ensure you have a stable internet connection for PyScript libraries`);
        throw error;
    }
}

// Wait for PyScript to be ready
async function waitForPyScript() {
    let attempts = 0;
    const maxAttempts = 300; // 60 seconds for real ML libraries to load
    
    updateProgressBar(5, 'Loading PyScript and ML libraries...');
    logProgress('Loading PyScript and ML libraries (numpy, pandas, scikit-learn, matplotlib)...');
    logProgress('⚠️ First-time loading may take 1-2 minutes as ML libraries are downloaded');
    logProgress('Please be patient - this enables REAL machine learning training!');
    
    while (attempts < maxAttempts) {
        // Check if PyScript functions are available AND ready signal is set
        if (typeof window.pyTrainModel !== 'undefined' && 
            typeof window.pyMakePrediction !== 'undefined' && 
            window.pyScriptReady === true) {
            break;
        }
        
        await simulateDelay(200);
        attempts++;
        
        // Update progress bar during loading
        const loadingProgress = 5 + Math.floor((attempts / maxAttempts) * 5); // 5% to 10%
        if (attempts % 10 === 0) {
            updateProgressBar(loadingProgress, 'Loading ML libraries...');
        }
        
        // Log progress every 10 seconds
        if (attempts % 50 === 0) {
            const seconds = Math.floor(attempts * 200 / 1000);
            logProgress(`Still loading ML libraries... (${seconds}s) - Don't refresh, libraries are downloading`);
        }
    }
    
    if (typeof window.pyTrainModel === 'undefined' || !window.pyScriptReady) {
        throw new Error('Failed to load PyScript and ML libraries after 60 seconds. Please check your internet connection and refresh the page. The app requires numpy, pandas, scikit-learn, and matplotlib to function.');
    }
    
    logProgress('✅ PyScript and ML libraries loaded! Ready for REAL machine learning training.');
}

// Get CSV data as text for PyScript
function getCsvText() {
    if (!appState.data || !appState.headers) {
        return null;
    }
    
    let csvText = '';
    
    // Always add headers (since we now require them)
    csvText += appState.headers.join(',') + '\n';
    
    // Add data rows
    appState.data.forEach(row => {
        csvText += row.join(',') + '\n';
    });
    
    return csvText.trim();
}

// Display training results
function displayTrainingResults() {
    const resultsContent = document.getElementById('results-content');
    const metricsContainer = document.getElementById('metrics-display');
    
    if (!resultsContent || !metricsContainer) {
        console.log('Results elements not found');
        return;
    }
    
    // Show the results content
    resultsContent.style.display = 'block';
    console.log('Training results displayed, resultsContent display:', resultsContent.style.display);
    
    // Display basic training information
    let metricsHTML = `
        <div class="metric-card">
            <div class="metric-value">${appState.modelType}</div>
            <div class="metric-label">Model Type</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">${appState.data ? appState.data.length : 0}</div>
            <div class="metric-label">Training Samples</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">${appState.featureColumns ? appState.featureColumns.length : 0}</div>
            <div class="metric-label">Features Used</div>
        </div>
    `;
    
    // Add model-specific metrics if available
    if (appState.metrics && Object.keys(appState.metrics).length > 0) {
        Object.entries(appState.metrics).forEach(([key, value]) => {
            const label = formatMetricLabel(key);
            metricsHTML += `
                <div class="metric-card">
                    <div class="metric-value">${value}</div>
                    <div class="metric-label">${label}</div>
                </div>
            `;
        });
    } else {
        // If no metrics available, show training completed message
        metricsHTML += `
            <div class="metric-card">
                <div class="metric-value">✓</div>
                <div class="metric-label">Training Completed</div>
            </div>
        `;
    }
    
    metricsContainer.innerHTML = metricsHTML;
    
    console.log('Training results displayed');
}

// Format metric labels
function formatMetricLabel(key) {
    const labels = {
        mae: 'Mean Absolute Error',
        mse: 'Mean Squared Error',
        rmse: 'Root Mean Squared Error',
        r2: 'R² Score',
        accuracy: 'Accuracy',
        precision: 'Precision',
        recall: 'Recall',
        f1: 'F1 Score',
        clusters: 'Number of Clusters',
        silhouette: 'Silhouette Score',
        intraClusterDistance: 'Avg Intra-cluster Distance',
        interClusterDistance: 'Avg Inter-cluster Distance'
    };
    return labels[key] || key;
}

// Get visualization description
function getVisualizationDescription() {
    switch (appState.modelType) {
        case 'regression':
            return 'Scatter plot: Predicted vs Actual values with ideal prediction line';
        case 'classification':
            return 'Confusion matrix with color-coded cells (white to Microsoft Blue)';
        case 'clustering':
            return '2D scatter plot showing clustered data points with color coding';
        default:
            return 'Data visualization';
    }
}

// Simulate async operations
function simulateDelay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// PyScript prediction function - REAL predictions only
async function predictWithPyScript(inputs) {
    try {
        // Ensure PyScript is ready
        if (typeof window.pyMakePrediction === 'undefined') {
            throw new Error('PyScript not initialized. Please refresh the page and try training first.');
        }
        
        // Convert inputs to the format expected by Python - pass as JSON string
        const featureValues = {};
        appState.featureColumns.forEach(feature => {
            const value = inputs[feature];
            // Try to parse as number, otherwise keep as string
            featureValues[feature] = isNaN(value) ? value : parseFloat(value);
        });
        
        console.log('Feature values to send:', featureValues);
        
        // Call Python prediction function - pass as JSON string to avoid object conversion issues
        const result = await window.pyMakePrediction(JSON.stringify(featureValues));
        
        // Parse JSON response
        let parsedResult = result;
        if (typeof result === 'string') {
            try {
                parsedResult = JSON.parse(result);
            } catch (parseError) {
                console.error('Failed to parse prediction result as JSON:', parseError);
                throw new Error(`Invalid JSON response from prediction function: ${result}`);
            }
        }
        
        if (parsedResult.success) {
            return parsedResult.prediction;
        } else {
            throw new Error(parsedResult.error || 'Prediction failed');
        }
        
    } catch (error) {
        console.error('Prediction failed:', error);
        throw new Error(`Prediction failed: ${error.message}. Please ensure the model is trained first.`);
    }
}

// Reset application state and return to first tab
function resetApplication() {
    console.log('Starting application reset...');
    
    // Reset all application state
    appState = {
        currentTab: 0,
        modelType: null,
        data: null,
        headers: [],
        targetColumn: null,
        featureColumns: [],
        trainSplit: 0.7,
        numClusters: 3,
        clusterMethod: 'auto',
        trainedModel: null,
        metrics: {},
        scaler: null,
        encoder: null,
        features: [],
        // Training session state tracking
        lastTrainingSettings: null,
        hasUnsavedChanges: false
    };
    
    console.log('Application state reset');
    
    // Reset form elements but preserve defaults
    const modelTypeSelect = document.getElementById('modelType');
    if (modelTypeSelect) {
        // Reset to first option (regression) which is the default
        modelTypeSelect.selectedIndex = 0;
        appState.modelType = modelTypeSelect.value;
    }
    
    const dataFileInput = document.getElementById('dataFile');
    if (dataFileInput) {
        // Remove event listener temporarily
        dataFileInput.removeEventListener('change', handleFileUpload);
        // Clear all file-related properties
        dataFileInput.value = '';
        dataFileInput.files = null;
        // Clear any cached data by forcing a form reset
        const form = dataFileInput.closest('form');
        if (form) {
            form.reset();
        }
        // Add a small delay then re-attach listener
        setTimeout(() => {
            dataFileInput.addEventListener('change', handleFileUpload);
        }, 10);
    }
    
    // Reset file name display
    const fileName = document.getElementById('fileName');
    if (fileName) {
        fileName.textContent = 'No file chosen';
    }
    
    // Clear and reset data preview completely
    const dataPreview = document.getElementById('data-preview');
    if (dataPreview) {
        // Reset to initial structure instead of just text
        dataPreview.innerHTML = `
            <h3>Data Preview</h3>
            <div id="header-inputs"></div>
            <table id="dataTable" class="data-table"></table>
            <p id="dataInfo">No data uploaded yet.</p>
        `;
        dataPreview.style.display = 'none';
    }
    
    // Clear data table completely
    const dataTable = document.getElementById('dataTable');
    if (dataTable) {
        dataTable.innerHTML = '';
    }
    
    // Clear header inputs
    const headerInputs = document.getElementById('header-inputs');
    if (headerInputs) {
        headerInputs.innerHTML = '';
    }
    
    // Clear training settings (don't set display style - let CSS handle tab visibility)
    const trainingSettings = document.getElementById('training-settings');
    if (trainingSettings) {
        // Remove any inline display style that might override CSS classes
        trainingSettings.style.removeProperty('display');
    }
    
    // Clear and reset target column dropdown
    const targetColumnSelect = document.getElementById('targetColumn');
    if (targetColumnSelect) {
        targetColumnSelect.innerHTML = '<option value="">Select target column</option>';
        targetColumnSelect.value = '';
        targetColumnSelect.selectedIndex = 0;
    }
    
    // Clear feature columns completely
    const featureColumnsContainer = document.getElementById('featureColumns');
    if (featureColumnsContainer) {
        featureColumnsContainer.innerHTML = '';
        featureColumnsContainer.style.display = 'none';
    }
    
    // Clear clustering settings
    const clusteringSettings = document.getElementById('clustering-settings');
    if (clusteringSettings) {
        clusteringSettings.style.display = 'none';
    }
    
    // Clear training status message
    const trainingStatusMessage = document.getElementById('training-status-message');
    if (trainingStatusMessage) {
        trainingStatusMessage.innerHTML = '';
        trainingStatusMessage.style.display = 'none';
    }
    
    // Remove retrain button if it exists (we don't use it anymore)
    const retrainButton = document.getElementById('retrainButton');
    if (retrainButton) {
        retrainButton.remove();
    }
    
    // Reset all sliders to default values
    const trainSplitSlider = document.getElementById('trainSplit');
    if (trainSplitSlider) {
        trainSplitSlider.value = 70;
    }
    const splitDisplay = document.getElementById('splitDisplay');
    if (splitDisplay) {
        splitDisplay.textContent = '70% training / 30% testing';
    }
    
    // Reset Start Training button visibility
    const startTrainingButton = document.getElementById('startTraining');
    if (startTrainingButton) {
        startTrainingButton.style.removeProperty('display'); // Let CSS handle visibility
    }
    
    // Clear training progress log
    const progressLog = document.getElementById('progressLog');
    if (progressLog) {
        progressLog.textContent = '';
    }
    
    // Reset training log to collapsed state
    const logContent = document.getElementById('logContent');
    const toggleBtn = document.getElementById('toggleLogBtn');
    if (logContent && toggleBtn) {
        logContent.classList.remove('expanded');
        logContent.classList.add('collapsed');
        toggleBtn.innerHTML = '<span id="logToggleIcon">▼</span> Show Details';
    }
    
    // Reset progress bar
    const resetProgressBar = document.getElementById('trainingProgressBar');
    const resetProgressText = document.getElementById('progressText');
    const resetProgressPercentage = document.getElementById('progressPercentage');
    if (resetProgressBar) {
        resetProgressBar.style.width = '0%';
        // Re-enable animations by removing the stopped class and clearing inline styles
        resetProgressBar.classList.remove('animation-stopped');
        resetProgressBar.style.removeProperty('animation');
    }
    if (resetProgressText) resetProgressText.textContent = 'Initializing...';
    if (resetProgressPercentage) resetProgressPercentage.textContent = '0%';
    
    // Clear training-progress and prediction-interface, but handle results-content separately
    ['training-progress', 'prediction-interface'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = 'none';
            // Clear any content in these sections
            const content = element.querySelector('.section, .metrics-display, #training-chart, #prediction-inputs');
            if (content) {
                content.innerHTML = '';
            }
        }
    });
    
    // For results-content, remove inline display style and let CSS handle it
    const resultsContent = document.getElementById('results-content');
    if (resultsContent) {
        resultsContent.style.removeProperty('display'); // Remove any inline display style
    }
    
    // Specifically clear results content elements
    const metricsDisplay = document.getElementById('metrics-display');
    const trainingChart = document.getElementById('training-chart');
    if (metricsDisplay) metricsDisplay.innerHTML = '';
    if (trainingChart) trainingChart.innerHTML = '';
    
    // Thoroughly clear Test tab elements
    const predictionInputs = document.getElementById('prediction-inputs');
    const predictionOutput = document.getElementById('prediction-output');
    const predictionResult = document.getElementById('prediction-result');
    const predictionInterface = document.getElementById('prediction-interface');
    
    if (predictionInputs) {
        predictionInputs.innerHTML = '';
        console.log('Cleared prediction inputs');
    }
    if (predictionOutput) {
        predictionOutput.innerHTML = '';
        console.log('Cleared prediction output');
    }
    if (predictionResult) {
        predictionResult.style.display = 'none';
        console.log('Hidden prediction result');
    }
    if (predictionInterface) {
        predictionInterface.style.display = 'none';
        console.log('Hidden prediction interface');
    }
    
    // Show no model message
    const noModelMessage = document.getElementById('no-model-message');
    if (noModelMessage) {
        noModelMessage.style.display = 'block';
    }
    
    // Reset progress bar if visible
    const progressBar = document.getElementById('trainingProgressBar');
    if (progressBar) {
        progressBar.style.width = '0%';
    }
    const progressText = document.getElementById('progressText');
    if (progressText) {
        progressText.textContent = 'Initializing...';
    }
    const progressPercentage = document.getElementById('progressPercentage');
    if (progressPercentage) {
        progressPercentage.textContent = '0%';
    }
    
    // Clear any cached DOM elements or computed values
    if (window.pyScriptReady) {
        console.log('PyScript still ready for reuse');
    }
    
    // Switch to first tab
    switchToTab(0);
    
    // Force a complete re-render of the tab state
    updateTabState();
    
    // Update button states
    updateNextButtonState();
    
    console.log('Application reset completed successfully');
}

// Export functions for potential PyScript integration
window.MLLite = {
    appState,
    switchToTab,
    updateNextButtonState,
    logProgress,
    updateProgressBar,
    displayTrainingResults,
    resetApplication
};

// Training Log Toggle Functionality
function toggleTrainingLog() {
    const logContent = document.getElementById('logContent');
    const toggleBtn = document.getElementById('toggleLogBtn');
    const toggleIcon = document.getElementById('logToggleIcon');
    
    if (logContent && toggleBtn && toggleIcon) {
        const isCollapsed = logContent.classList.contains('collapsed');
        
        if (isCollapsed) {
            // Expand
            logContent.classList.remove('collapsed');
            logContent.classList.add('expanded');
            toggleIcon.textContent = '▲';
            toggleBtn.innerHTML = '<span id="logToggleIcon" aria-hidden="true">▲</span> Hide Details';
            toggleBtn.setAttribute('aria-expanded', 'true');
        } else {
            // Collapse
            logContent.classList.remove('expanded');
            logContent.classList.add('collapsed');
            toggleIcon.textContent = '▼';
            toggleBtn.innerHTML = '<span id="logToggleIcon" aria-hidden="true">▼</span> Show Details';
            toggleBtn.setAttribute('aria-expanded', 'false');
        }
    }
}

// Save Trained Model Function
async function saveTrainedModel() {
    if (!appState.trainedModel) {
        alert('No trained model available to save.');
        return;
    }

    // Check if PyScript is ready
    if (typeof window.pySaveModel === 'undefined') {
        alert('PyScript is not ready yet. Please wait a moment and try again.');
        return;
    }

    try {
        // Call PyScript function to serialize and return the model
        const result = await window.pySaveModel();
        const modelData = JSON.parse(result);
        
        if (modelData.success) {
            // Convert base64 back to bytes and create download
            const modelBytes = atob(modelData.model_data);
            const modelArray = new Uint8Array(modelBytes.length);
            for (let i = 0; i < modelBytes.length; i++) {
                modelArray[i] = modelBytes.charCodeAt(i);
            }
            
            const blob = new Blob([modelArray], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            
            // Create timestamp for filenames
            const timestamp = new Date().toISOString().slice(0,19).replace(/:/g, '-');
            
            // Create download link for model
            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.download = `ml_model_${appState.modelType}_${timestamp}.pkl`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            
            // Clean up
            URL.revokeObjectURL(url);
            
            // Log usage instructions to the training log
            const usageInstructions = `
Model saved successfully! Usage instructions:

1. Load the model in Python:
   import pickle
   with open('ml_model_${appState.modelType}_${timestamp}.pkl', 'rb') as f:
       model_package = pickle.load(f)

2. Extract components:
   model = model_package['model']
   scaler = model_package['scaler']  # May be None for supervised learning
   model_info = model_package['model_info']  # Training metadata

3. Make predictions:
   # prediction = model.predict(your_data)

Model details:
- Type: ${appState.modelType}
- Features: ${appState.featureColumns.join(', ')}
${appState.targetColumn ? `- Target: ${appState.targetColumn}` : ''}
- Train/Test split: ${Math.round(appState.trainSplit * 100)}%/${Math.round((1-appState.trainSplit) * 100)}%
            `.trim();
            
            logProgress(usageInstructions);
        } else {
            throw new Error(modelData.error);
        }
    } catch (error) {
        console.error('Error saving model:', error);
        alert(`Error saving model: ${error.message}`);
        logProgress(`Error saving model: ${error.message}`);
    }
}

// Make functions globally available
window.toggleTrainingLog = toggleTrainingLog;
window.saveTrainedModel = saveTrainedModel;