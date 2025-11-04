// Text Analyzer Application
// Uses NLP.js library for text analysis where available
// Uses Compromise.js for entity extraction and proper noun detection

let currentMode = 'sentiment';
let nlpManager = null;
let sentimentAnalyzer = null;
let languageGuesser = null;
let ner = null;
let nlp = null; // Compromise.js

// Initialize NLP.js components
async function initializeNLP() {
    try {
        // Wait a bit for all scripts to load
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Initialize Compromise.js
        if (window.nlp) {
            nlp = window.nlp;
            console.log('Compromise.js initialized successfully');
        }
        
        // Import from global window object
        const { containerBootstrap } = window['@nlpjs/core'];
        const { Nlp } = window['@nlpjs/nlp'];
        const { LangEn } = window['@nlpjs/lang-en-min'];
        const { SentimentAnalyzer } = window['@nlpjs/sentiment'];
        const { LanguageGuesser } = window['@nlpjs/language-guesser'];
        const { Ner } = window['@nlpjs/ner'];
        
        // Create container and register plugins
        const container = containerBootstrap();
        container.use(Nlp);
        container.use(LangEn);
        container.use(SentimentAnalyzer);
        container.use(LanguageGuesser);
        container.use(Ner);
        
        // Get NLP Manager
        nlpManager = container.get('nlp');
        nlpManager.settings.autoSave = false;
        nlpManager.addLanguage('en');
        
        // Get other components
        sentimentAnalyzer = container.get('sentiment-analyzer');
        languageGuesser = container.get('language-guesser');
        ner = container.get('ner');
        
        console.log('NLP.js components initialized successfully');
        return true;
    } catch (error) {
        console.warn('Failed to initialize NLP.js, will use fallback methods:', error);
        return false;
    }
}

// Initialize when the page loads
const nlpReady = initializeNLP();

// Get DOM elements
const textInput = document.getElementById('textInput');
const fileInput = document.getElementById('fileInput');
const runBtn = document.getElementById('runBtn');
const resultsContent = document.getElementById('resultsContent');
const charCount = document.querySelector('.char-count');
const optionCards = document.querySelectorAll('.option-card');

// Option card selection
optionCards.forEach(card => {
    card.addEventListener('click', () => {
        selectOption(card);
    });
    
    // Keyboard navigation support
    card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            selectOption(card);
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            const next = card.nextElementSibling || optionCards[0];
            next.focus();
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            const prev = card.previousElementSibling || optionCards[optionCards.length - 1];
            prev.focus();
        }
    });
});

function selectOption(card) {
    optionCards.forEach(c => {
        c.classList.remove('active');
        c.setAttribute('aria-selected', 'false');
        c.setAttribute('tabindex', '-1');
    });
    card.classList.add('active');
    card.setAttribute('aria-selected', 'true');
    card.setAttribute('tabindex', '0');
    currentMode = card.dataset.option;
    
    // Clear results when switching modes
    resultsContent.innerHTML = '<p class="placeholder-text">Your details will appear after you enter or upload some text and press Run.</p>';
}

// Update character count
textInput.addEventListener('input', () => {
    const length = textInput.value.length;
    charCount.textContent = `${length} / 5000`;
    runBtn.disabled = length === 0;
    
    if (length > 5000) {
        textInput.value = textInput.value.substring(0, 5000);
        charCount.textContent = '5000 / 5000';
    }
});

// Handle file upload
fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'text/plain') {
        const text = await file.text();
        textInput.value = text.substring(0, 5000);
        textInput.dispatchEvent(new Event('input'));
    } else if (file) {
        alert('Please upload a .txt file');
    }
});

// Handle run button click
runBtn.addEventListener('click', async () => {
    const text = textInput.value.trim();
    
    if (!text) {
        return;
    }
    
    runBtn.disabled = true;
    const originalText = runBtn.innerHTML;
    runBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><circle cx="8" cy="8" r="1.5"><animateTransform attributeName="transform" type="rotate" from="0 8 8" to="360 8 8" dur="1s" repeatCount="indefinite"/></circle></svg> Running...';
    
    try {
        await analyzeText(text);
    } catch (error) {
        console.error('Analysis error:', error);
        resultsContent.innerHTML = '<p style="color: #d32f2f;">An error occurred during analysis. Please try again.</p>';
    } finally {
        runBtn.disabled = false;
        runBtn.innerHTML = originalText;
    }
});

// Main analysis function
async function analyzeText(text) {
    let html = '';
    
    switch (currentMode) {
        case 'sentiment':
            const sentiment = await analyzeSentiment(text);
            html = displaySentiment(sentiment);
            break;
        case 'language':
            const language = await detectLanguage(text);
            html = displayLanguage(language);
            break;
        case 'keyphrases':
            const keyPhrases = extractKeyPhrases(text);
            html = displayKeyPhrases(keyPhrases);
            break;
        case 'entities':
            const entities = extractEntities(text);
            html = displayEntities(entities);
            break;
        case 'summarize':
            const summary = summarizeText(text);
            html = displaySummary(summary);
            break;
    }
    
    resultsContent.innerHTML = html;
}

// Sentiment Analysis using NLP.js
async function analyzeSentiment(text) {
    // Try using NLP.js first
    if (sentimentAnalyzer) {
        try {
            const result = await sentimentAnalyzer.process('en', text);
            if (result && result.sentiment) {
                return {
                    score: result.sentiment.score,
                    comparative: result.sentiment.comparative || result.sentiment.score,
                    vote: result.sentiment.vote,
                    numWords: result.sentiment.numWords || text.split(/\s+/).length,
                    numHits: result.sentiment.numHits || 0,
                    type: result.sentiment.vote,
                    language: 'en'
                };
            }
        } catch (error) {
            console.warn('NLP.js sentiment analysis failed, using fallback:', error);
        }
    }
    
    // Fallback to custom implementation
    return simpleSentimentAnalysis(text);
}

function simpleSentimentAnalysis(text) {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'happy', 'best', 'perfect', 'beautiful', 'outstanding', 'superb', 'delightful', 'brilliant', 'positive', 'enjoy', 'enjoyed', 'pleased', 'awesome', 'incredible', 'vibe', 'vibes', 'classic', 'entertaining', 'entertained'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'hate', 'worst', 'poor', 'disappointing', 'sad', 'angry', 'disgusting', 'negative', 'dreadful', 'pathetic', 'useless', 'waste', 'problem', 'fail', 'failed', 'wrong', 'wait', 'waits', 'waiting', 'slow', 'long'];
    
    // Negation words that flip sentiment
    const negations = ['not', 'no', 'never', 'neither', 'nobody', 'nothing', 'nowhere', 'but', 'however'];
    
    // Intensifiers that amplify sentiment
    const intensifiers = ['very', 'really', 'extremely', 'absolutely', 'totally', 'completely', 'such', 'so'];
    
    const lowerText = text.toLowerCase();
    const words = lowerText.split(/\s+/);
    
    let positiveCount = 0;
    let negativeCount = 0;
    let positiveScore = 0;
    let negativeScore = 0;
    
    // Analyze with context
    for (let i = 0; i < words.length; i++) {
        const word = words[i].replace(/[^\w]/g, ''); // Remove punctuation
        let weight = 1.0;
        let isNegated = false;
        
        // Check for intensifiers before this word
        if (i > 0) {
            const prevWord = words[i - 1].replace(/[^\w]/g, '');
            if (intensifiers.includes(prevWord)) {
                weight = 1.5;
            }
        }
        
        // Check for negations before this word (within 3 words)
        for (let j = Math.max(0, i - 3); j < i; j++) {
            const checkWord = words[j].replace(/[^\w]/g, '');
            if (negations.includes(checkWord)) {
                isNegated = true;
                break;
            }
        }
        
        // Check if word is positive or negative
        if (positiveWords.includes(word)) {
            if (isNegated) {
                negativeScore += weight;
                negativeCount++;
            } else {
                positiveScore += weight;
                positiveCount++;
            }
        } else if (negativeWords.includes(word)) {
            if (isNegated) {
                // "not bad" becomes slightly positive
                positiveScore += weight * 0.5;
                positiveCount++;
            } else {
                negativeScore += weight;
                negativeCount++;
            }
        }
    }
    
    // Calculate score with weighted scores
    const totalScore = positiveScore + negativeScore;
    const score = totalScore > 0 ? (positiveScore - negativeScore) / totalScore : 0;
    
    let sentiment = 'neutral';
    if (score > 0.15) sentiment = 'positive';
    else if (score < -0.15) sentiment = 'negative';
    
    return {
        score: score,
        comparative: score,
        vote: sentiment,
        numWords: words.length,
        numHits: positiveCount + negativeCount,
        type: sentiment,
        language: 'en'
    };
}

// Language Detection using NLP.js
async function detectLanguage(text) {
    // Try using NLP.js LanguageGuesser first
    if (languageGuesser) {
        try {
            const guesses = languageGuesser.guess(text, null, 1);
            if (guesses && guesses.length > 0) {
                const topGuess = guesses[0];
                return {
                    alpha2: topGuess.alpha2,
                    alpha3: topGuess.alpha3,
                    language: getLanguageName(topGuess.alpha3),
                    score: topGuess.score
                };
            }
        } catch (error) {
            console.warn('NLP.js language detection failed, using fallback:', error);
        }
    }
    
    // Fallback to custom implementation
    return simpleLanguageDetection(text);
}

// Simple language detection fallback
function simpleLanguageDetection(text) {
    const lowerText = text.toLowerCase();
    
    // Check for non-Latin scripts first (these are more definitive)
    
    // Arabic script (U+0600 to U+06FF)
    if (/[\u0600-\u06FF]/.test(text)) {
        return { alpha2: 'ar', alpha3: 'ara', language: 'Arabic', score: 0.95 };
    }
    
    // Chinese characters (U+4E00 to U+9FFF)
    if (/[\u4E00-\u9FFF]/.test(text)) {
        return { alpha2: 'zh', alpha3: 'chi', language: 'Chinese', score: 0.95 };
    }
    
    // Japanese (Hiragana U+3040-U+309F, Katakana U+30A0-U+30FF)
    if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) {
        return { alpha2: 'ja', alpha3: 'jpn', language: 'Japanese', score: 0.95 };
    }
    
    // Korean (Hangul U+AC00-U+D7AF)
    if (/[\uAC00-\uD7AF]/.test(text)) {
        return { alpha2: 'ko', alpha3: 'kor', language: 'Korean', score: 0.95 };
    }
    
    // Devanagari script - Hindi, Sanskrit, Marathi (U+0900-U+097F)
    if (/[\u0900-\u097F]/.test(text)) {
        return { alpha2: 'hi', alpha3: 'hin', language: 'Hindi', score: 0.95 };
    }
    
    // Thai script (U+0E00-U+0E7F)
    if (/[\u0E00-\u0E7F]/.test(text)) {
        return { alpha2: 'th', alpha3: 'tha', language: 'Thai', score: 0.95 };
    }
    
    // Hebrew script (U+0590-U+05FF)
    if (/[\u0590-\u05FF]/.test(text)) {
        return { alpha2: 'he', alpha3: 'heb', language: 'Hebrew', score: 0.95 };
    }
    
    // Bengali script (U+0980-U+09FF)
    if (/[\u0980-\u09FF]/.test(text)) {
        return { alpha2: 'bn', alpha3: 'ben', language: 'Bengali', score: 0.95 };
    }
    
    // Tamil script (U+0B80-U+0BFF)
    if (/[\u0B80-\u0BFF]/.test(text)) {
        return { alpha2: 'ta', alpha3: 'tam', language: 'Tamil', score: 0.95 };
    }
    
    // Telugu script (U+0C00-U+0C7F)
    if (/[\u0C00-\u0C7F]/.test(text)) {
        return { alpha2: 'te', alpha3: 'tel', language: 'Telugu', score: 0.95 };
    }
    
    // Gujarati script (U+0A80-U+0AFF)
    if (/[\u0A80-\u0AFF]/.test(text)) {
        return { alpha2: 'gu', alpha3: 'guj', language: 'Gujarati', score: 0.95 };
    }
    
    // Cyrillic script - Russian, Ukrainian, Bulgarian, etc. (U+0400-U+04FF)
    if (/[\u0400-\u04FF]/.test(text)) {
        // Try to distinguish between Russian and Ukrainian
        if (/[іїєґ]/.test(text)) {
            return { alpha2: 'uk', alpha3: 'ukr', language: 'Ukrainian', score: 0.95 };
        }
        return { alpha2: 'ru', alpha3: 'rus', language: 'Russian', score: 0.90 };
    }
    
    // Greek script (U+0370-U+03FF)
    if (/[\u0370-\u03FF]/.test(text)) {
        return { alpha2: 'el', alpha3: 'ell', language: 'Greek', score: 0.95 };
    }
    
    // For Latin-based scripts, use word-based detection
    
    // French indicators
    const frenchWords = ['le', 'la', 'les', 'de', 'du', 'des', 'et', 'est', 'dans', 'pour', 'avec', 'sur', 'par', 'être', 'avoir', 'vous', 'nous', 'ils', 'elle', 'ce', 'qui', 'que'];
    const frenchChars = ['é', 'è', 'ê', 'à', 'ç', 'ù', 'û', 'ô', 'â', 'î'];
    
    // Spanish indicators
    const spanishWords = ['el', 'la', 'los', 'las', 'de', 'del', 'en', 'por', 'para', 'con', 'es', 'está', 'que', 'como', 'una', 'uno'];
    const spanishChars = ['á', 'é', 'í', 'ó', 'ú', 'ñ', '¿', '¡'];
    
    // German indicators
    const germanWords = ['der', 'die', 'das', 'den', 'dem', 'und', 'ist', 'für', 'mit', 'nicht', 'ein', 'eine', 'ich', 'sie', 'auf'];
    const germanChars = ['ä', 'ö', 'ü', 'ß'];
    
    // Italian indicators
    const italianWords = ['il', 'lo', 'la', 'gli', 'le', 'di', 'da', 'in', 'con', 'per', 'che', 'non', 'una', 'uno', 'sono', 'essere'];
    
    // Portuguese indicators
    const portugueseWords = ['o', 'a', 'os', 'as', 'de', 'do', 'da', 'em', 'para', 'com', 'que', 'não', 'uma', 'um', 'são', 'é'];
    const portugueseChars = ['ã', 'õ', 'ç'];
    
    let scores = {
        french: 0,
        spanish: 0,
        german: 0,
        italian: 0,
        portuguese: 0,
        english: 0
    };
    
    // Check for special characters
    for (let char of frenchChars) {
        if (text.includes(char)) scores.french += 3;
    }
    for (let char of spanishChars) {
        if (text.includes(char)) scores.spanish += 3;
    }
    for (let char of germanChars) {
        if (text.includes(char)) scores.german += 3;
    }
    for (let char of portugueseChars) {
        if (text.includes(char)) scores.portuguese += 3;
    }
    
    // Check for common words
    const words = lowerText.split(/\s+/);
    
    words.forEach(word => {
        if (frenchWords.includes(word)) scores.french++;
        if (spanishWords.includes(word)) scores.spanish++;
        if (germanWords.includes(word)) scores.german++;
        if (italianWords.includes(word)) scores.italian++;
        if (portugueseWords.includes(word)) scores.portuguese++;
    });
    
    // English common words (expanded list)
    const englishWords = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'with', 'from', 'have', 'this', 'that', 'will', 'was', 'been', 'their', 'what', 'when', 'where', 'which', 'who', 'can', 'all', 'would', 'there', 'some', 'other', 'than', 'into', 'could', 'these', 'such'];
    words.forEach(word => {
        if (englishWords.includes(word)) scores.english++;
    });
    
    // Find the language with highest score
    let maxScore = 0;
    let detectedLang = 'en';
    let langName = 'English';
    
    Object.entries(scores).forEach(([lang, score]) => {
        if (score > maxScore) {
            maxScore = score;
            switch(lang) {
                case 'french':
                    detectedLang = 'fr';
                    langName = 'French';
                    break;
                case 'spanish':
                    detectedLang = 'es';
                    langName = 'Spanish';
                    break;
                case 'german':
                    detectedLang = 'de';
                    langName = 'German';
                    break;
                case 'italian':
                    detectedLang = 'it';
                    langName = 'Italian';
                    break;
                case 'portuguese':
                    detectedLang = 'pt';
                    langName = 'Portuguese';
                    break;
                default:
                    detectedLang = 'en';
                    langName = 'English';
            }
        }
    });
    
    // Calculate confidence with better scaling
    let confidence;
    if (maxScore === 0) {
        // No matches, assume English with low confidence
        confidence = 0.3;
    } else {
        // Calculate based on hit rate
        const hitRate = maxScore / Math.max(words.length, 1);
        
        // Scale confidence: 10% hit rate = 60% confidence, 30%+ hit rate = 90%+ confidence
        if (hitRate >= 0.3) {
            confidence = 0.90 + (hitRate - 0.3) * 0.2; // 90-95%
        } else if (hitRate >= 0.15) {
            confidence = 0.75 + (hitRate - 0.15) * 1.0; // 75-90%
        } else if (hitRate >= 0.05) {
            confidence = 0.50 + (hitRate - 0.05) * 2.5; // 50-75%
        } else {
            confidence = 0.30 + hitRate * 4.0; // 30-50%
        }
        
        confidence = Math.min(0.95, confidence);
    }
    
    return {
        alpha2: detectedLang,
        alpha3: detectedLang === 'en' ? 'eng' : detectedLang,
        language: langName,
        score: confidence
    };
}

function getLanguageName(alpha3) {
    const languages = {
        'eng': 'English',
        'fra': 'French',
        'fre': 'French',
        'spa': 'Spanish',
        'deu': 'German',
        'ger': 'German',
        'ita': 'Italian',
        'por': 'Portuguese',
        'rus': 'Russian',
        'jpn': 'Japanese',
        'kor': 'Korean',
        'cmn': 'Chinese (Mandarin)',
        'chi': 'Chinese',
        'zho': 'Chinese',
        'ara': 'Arabic',
        'hin': 'Hindi',
        'nld': 'Dutch',
        'dut': 'Dutch',
        'pol': 'Polish',
        'tur': 'Turkish',
        'vie': 'Vietnamese',
        'tha': 'Thai',
        'heb': 'Hebrew',
        'ben': 'Bengali',
        'tam': 'Tamil',
        'tel': 'Telugu',
        'guj': 'Gujarati',
        'ukr': 'Ukrainian',
        'ell': 'Greek',
        'gre': 'Greek',
        'mar': 'Marathi',
        'urd': 'Urdu',
        'ind': 'Indonesian',
        'msa': 'Malay',
        'may': 'Malay',
        'fil': 'Filipino',
        'tgl': 'Tagalog'
    };
    
    return languages[alpha3] || alpha3.toUpperCase();
}

// Key Phrase Extraction - uses Compromise.js if available, otherwise custom implementation
function extractKeyPhrases(text) {
    // Try using Compromise.js first
    if (nlp) {
        try {
            const doc = nlp(text);
            const phrases = [];
            
            // Extract noun phrases
            const nounPhrases = doc.nouns().out('array');
            phrases.push(...nounPhrases.slice(0, 5));
            
            // Extract topic terms (nouns and adjectives)
            const topics = doc.topics().out('array');
            phrases.push(...topics.slice(0, 3));
            
            // Extract important verbs
            const verbs = doc.verbs().out('array');
            phrases.push(...verbs.slice(0, 2));
            
            // Get unique phrases
            const uniquePhrases = [...new Set(phrases)]
                .filter(phrase => phrase.length > 3)
                .slice(0, 10);
            
            if (uniquePhrases.length > 0) {
                return uniquePhrases;
            }
        } catch (error) {
            console.warn('Compromise.js key phrase extraction failed, using fallback:', error);
        }
    }
    
    // Fallback to custom implementation
    const words = text.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 4); // Words longer than 4 characters
    
    // Remove common stop words
    const stopWords = ['about', 'after', 'before', 'being', 'could', 'during', 'every', 'first', 'found', 'going', 'great', 'having', 'include', 'other', 'should', 'their', 'there', 'these', 'those', 'through', 'using', 'where', 'which', 'would'];
    const filteredWords = words.filter(word => !stopWords.includes(word));
    
    // Count word frequency
    const wordCount = {};
    filteredWords.forEach(word => {
        wordCount[word] = (wordCount[word] || 0) + 1;
    });
    
    // Extract phrases (2-3 word combinations)
    const sentences = text.split(/[.!?]+/);
    const phrases = [];
    
    sentences.forEach(sentence => {
        const sentenceWords = sentence.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 3);
        
        // Extract 2-word phrases
        for (let i = 0; i < sentenceWords.length - 1; i++) {
            if (!stopWords.includes(sentenceWords[i]) && !stopWords.includes(sentenceWords[i + 1])) {
                phrases.push(sentenceWords[i] + ' ' + sentenceWords[i + 1]);
            }
        }
    });
    
    // Get unique phrases and sort by importance
    const uniquePhrases = [...new Set(phrases)];
    const topPhrases = uniquePhrases.slice(0, 10);
    
    // Combine with single important words
    const sortedWords = Object.entries(wordCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([word]) => word);
    
    return [...topPhrases, ...sortedWords].slice(0, 10);
}

// Entity Extraction - uses Compromise.js if available, otherwise custom implementation
function extractEntities(text) {
    const entities = [];
    
    // Try using Compromise.js first
    if (nlp) {
        try {
            const doc = nlp(text);
            
            // Extract people
            const people = doc.people().out('array');
            people.forEach(person => {
                entities.push({ type: 'Person', value: person });
            });
            
            // Extract places
            const places = doc.places().out('array');
            places.forEach(place => {
                entities.push({ type: 'Place', value: place });
            });
            
            // Extract organizations
            const orgs = doc.organizations().out('array');
            orgs.forEach(org => {
                entities.push({ type: 'Organization', value: org });
            });
            
            // Extract dates
            const dates = doc.dates().out('array');
            dates.forEach(date => {
                entities.push({ type: 'Date', value: date });
            });
            
            // Extract money/values
            const money = doc.money().out('array');
            money.forEach(m => {
                entities.push({ type: 'Money', value: m });
            });
            
            // Extract emails
            const emails = doc.emails().out('array');
            emails.forEach(email => {
                entities.push({ type: 'Email', value: email });
            });
            
            // If we got good results from Compromise, return them
            if (entities.length > 0) {
                return entities.slice(0, 15);
            }
        } catch (error) {
            console.warn('Compromise.js entity extraction failed, using fallback:', error);
        }
    }
    
    // Fallback to custom implementation if Compromise didn't find anything or failed
    return extractEntitiesCustom(text);
}

function extractEntitiesCustom(text) {
    const entities = [];
    
    // Extract numbers (potential quantities or dates)
    const numberPattern = /\$?\d+(?:,\d{3})*(?:\.\d{2})?/g;
    const numbers = text.match(numberPattern);
    if (numbers) {
        numbers.forEach(num => {
            if (num.startsWith('$')) {
                entities.push({ type: 'Money', value: num });
            } else {
                entities.push({ type: 'Number', value: num });
            }
        });
    }
    
    // Extract capitalized words (potential proper nouns)
    // Split into sentences first to avoid sentence-initial caps
    const sentences = text.split(/[.!?]+\s*/);
    const properNounCandidates = [];
    
    sentences.forEach(sentence => {
        const trimmedSentence = sentence.trim();
        if (!trimmedSentence) return;
        
        // Extract all capitalized words/phrases from the sentence
        const capsPattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g;
        const matches = trimmedSentence.match(capsPattern);
        
        if (matches) {
            matches.forEach((match, index) => {
                // Skip if it's the first word of the sentence (likely sentence-initial capitalization)
                const matchStart = trimmedSentence.indexOf(match);
                const beforeMatch = trimmedSentence.substring(0, matchStart).trim();
                
                // Only include if:
                // 1. It's not at the start of the sentence, OR
                // 2. It appears multiple times in the text (likely a proper noun), OR
                // 3. It's a multi-word phrase (likely a proper noun)
                const isMultiWord = match.includes(' ');
                const occurrences = (text.match(new RegExp('\\b' + match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'g')) || []).length;
                
                if (beforeMatch.length > 0 || occurrences > 1 || isMultiWord) {
                    properNounCandidates.push(match);
                }
            });
        }
    });
    
    // Common words that are often capitalized but aren't proper nouns
    const commonWords = ['The', 'This', 'That', 'These', 'Those', 'A', 'An', 'To', 'From', 'For', 'With', 'And', 'But', 'Or', 'If', 'When', 'Where', 'How', 'Why', 'What', 'Maximum'];
    
    if (properNounCandidates.length > 0) {
        const uniqueNouns = [...new Set(properNounCandidates)];
        uniqueNouns.forEach(noun => {
            // Skip common sentence starters and generic words
            if (!commonWords.includes(noun) && !commonWords.includes(noun.split(' ')[0])) {
                entities.push({ type: 'Proper Noun', value: noun });
            }
        });
    }
    
    // Extract email addresses
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emails = text.match(emailPattern);
    if (emails) {
        emails.forEach(email => {
            entities.push({ type: 'Email', value: email });
        });
    }
    
    // Extract dates
    const datePattern = /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b/gi;
    const dates = text.match(datePattern);
    if (dates) {
        dates.forEach(date => {
            entities.push({ type: 'Date', value: date });
        });
    }
    
    // Extract common categories based on keywords
    const categories = {
        'Location': ['hotel', 'hotels', 'city', 'country', 'airport'],
        'Transportation': ['flight', 'flights', 'taxi', 'taxis', 'rideshare', 'rideshares'],
        'Food': ['meal', 'meals', 'breakfast', 'lunch', 'dinner']
    };
    
    Object.entries(categories).forEach(([category, keywords]) => {
        keywords.forEach(keyword => {
            const regex = new RegExp('\\b' + keyword + '\\b', 'gi');
            const matches = text.match(regex);
            if (matches) {
                entities.push({ type: category, value: keyword });
            }
        });
    });
    
    return entities.slice(0, 15); // Limit to 15 entities
}// Text Summarization
function summarizeText(text) {
    // Split into sentences
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    
    if (sentences.length <= 3) {
        return {
            summary: text,
            sentences: sentences,
            originalLength: text.length,
            summaryLength: text.length,
            reduction: 0
        };
    }
    
    // Score sentences based on:
    // 1. Position (first and last sentences are often important)
    // 2. Length (very short sentences are less important)
    // 3. Keyword frequency
    
    // Extract important words
    const words = text.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 4);
    
    const stopWords = ['about', 'after', 'before', 'being', 'could', 'during', 'every', 'first', 'found', 'going', 'great', 'having', 'include', 'other', 'should', 'their', 'there', 'these', 'those', 'through', 'using', 'where', 'which', 'would'];
    const filteredWords = words.filter(word => !stopWords.includes(word));
    
    // Count word frequency
    const wordFreq = {};
    filteredWords.forEach(word => {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
    });
    
    // Score each sentence
    const scoredSentences = sentences.map((sentence, index) => {
        let score = 0;
        
        // Position score (first and last sentences are important)
        if (index === 0) score += 3;
        if (index === sentences.length - 1) score += 2;
        
        // Length score (prefer medium length sentences)
        const wordCount = sentence.split(/\s+/).length;
        if (wordCount >= 8 && wordCount <= 25) score += 2;
        if (wordCount < 5) score -= 1;
        
        // Keyword score
        const sentenceLower = sentence.toLowerCase();
        Object.keys(wordFreq).forEach(word => {
            if (sentenceLower.includes(word)) {
                score += wordFreq[word];
            }
        });
        
        return { sentence: sentence.trim(), score, index };
    });
    
    // Sort by score and take top sentences (aim for ~30% of original)
    const summaryLength = Math.max(2, Math.ceil(sentences.length * 0.3));
    const topSentences = scoredSentences
        .sort((a, b) => b.score - a.score)
        .slice(0, summaryLength)
        .sort((a, b) => a.index - b.index) // Restore original order
        .map(item => item.sentence);
    
    const summary = topSentences.join(' ');
    
    return {
        summary: summary,
        sentences: topSentences,
        originalLength: text.length,
        summaryLength: summary.length,
        reduction: Math.round((1 - summary.length / text.length) * 100)
    };
}

// Display functions
function displaySentiment(sentiment) {
    const sentimentType = sentiment.vote || sentiment.type || 'neutral';
    const score = sentiment.score || sentiment.comparative || 0;
    
    let badgeClass = 'sentiment-neutral';
    let sentimentText = 'Neutral';
    
    if (sentimentType === 'positive' || score > 0.2) {
        badgeClass = 'sentiment-positive';
        sentimentText = 'Positive';
    } else if (sentimentType === 'negative' || score < -0.2) {
        badgeClass = 'sentiment-negative';
        sentimentText = 'Negative';
    }
    
    return `
        <span class="sentiment-badge ${badgeClass}">${sentimentText}</span>
        <p style="margin-top: 10px; font-size: 0.9em;">Sentiment Score: ${score.toFixed(3)}</p>
    `;
}

function displayLanguage(language) {
    const languageName = language.language || 'English';
    const confidence = (language.score * 100).toFixed(1);
    
    return `
        <p style="font-size: 1em; font-weight: 500;">${languageName}</p>
        <p style="font-size: 0.9em; color: #666; margin-top: 5px;">Confidence: ${confidence}%</p>
    `;
}

function displayKeyPhrases(phrases) {
    if (phrases.length === 0) {
        return '<p style="font-size: 0.9em; color: #999;">No key phrases detected</p>';
    }
    
    const phrasesHTML = phrases.map(phrase => 
        `<span class="key-phrase-tag">${phrase}</span>`
    ).join('');
    
    return `<div>${phrasesHTML}</div>`;
}

function displayEntities(entities) {
    if (entities.length === 0) {
        return '<p style="font-size: 0.9em; color: #999;">No entities detected</p>';
    }
    
    // Group entities by type
    const groupedEntities = {};
    entities.forEach(entity => {
        if (!groupedEntities[entity.type]) {
            groupedEntities[entity.type] = [];
        }
        if (!groupedEntities[entity.type].includes(entity.value)) {
            groupedEntities[entity.type].push(entity.value);
        }
    });
    
    const entitiesHTML = Object.entries(groupedEntities).map(([type, values]) => 
        `<div class="entity-item">
            <span class="entity-type">${type}:</span>
            <span>${values.join(', ')}</span>
        </div>`
    ).join('');
    
    return entitiesHTML;
}

function displaySummary(summaryData) {
    return `
        <div class="summary-stats">
            <p style="font-size: 0.9em; color: #666; margin-bottom: 15px;">
                <strong>Original:</strong> ${summaryData.originalLength} characters | 
                <strong>Summary:</strong> ${summaryData.summaryLength} characters | 
                <strong>Reduction:</strong> ${summaryData.reduction}%
            </p>
        </div>
        <div class="summary-content" style="background: #f5f5f5; padding: 15px; border-radius: 6px; line-height: 1.6;">
            <p style="font-size: 0.95em; color: #333;">${summaryData.summary}</p>
        </div>
        <div style="margin-top: 15px;">
            <p style="font-size: 0.85em; color: #999; font-style: italic;">
                Summary contains ${summaryData.sentences.length} sentence${summaryData.sentences.length !== 1 ? 's' : ''} from the original text.
            </p>
        </div>
    `;
}
