import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    StyleSheet,
    Dimensions,
    ScrollView,
    SafeAreaView,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Animated,
    Alert,
    Image,
    Modal,
    FlatList,
    Clipboard,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { GENAI_API_KEY, OPENAI_API_KEY, OPENAI_API_URL } from '@env';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Tts from 'react-native-tts';
import Voice from '@react-native-voice/voice';
import ImagePicker from 'react-native-image-crop-picker';
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ModalMenu from './ModalMenu'; 
const { width, height } = Dimensions.get('window');

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(GENAI_API_KEY);

const AiTranslator = ({ navigation }) => {
    const [screen, setScreen] = useState('welcome');
    const [sourceLanguage, setSourceLanguage] = useState('Italian');
    const [targetLanguage, setTargetLanguage] = useState('English');
    const [inputText, setInputText] = useState('');
    const [translatedText, setTranslatedText] = useState('');
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordedText, setRecordedText] = useState('');
    const [scannedText, setScannedText] = useState('');
    const animatedValue = useRef(new Animated.Value(1)).current;
    const [image, setImage] = useState(null);
    const [showDemo, setShowDemo] = useState(true);
    const [currentDemoStep, setCurrentDemoStep] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [showHistory, setShowHistory] = useState(false);
    const [translationHistory, setTranslationHistory] = useState([]);
    const languages = [
        'Arabic', 'Bengali', 'Chinese', 'Dutch', 'English', 'French', 'German', 'Hindi', 'Italian', 'Japanese',
        'Korean', 'Malay', 'Portuguese', 'Russian', 'Spanish', 'Swahili', 'Thai', 'Turkish', 'Urdu', 'Vietnamese'
    ];

    const storeShowDemoStatus = async (value) => {
        try {
            await AsyncStorage.setItem('@showDemo', JSON.stringify(value));
        } catch (e) {
            console.error('Error saving showDemo status:', e);
        }
    };

    const getShowDemoStatus = async () => {
        try {
            const value = await AsyncStorage.getItem('@showDemo');
            return value !== null ? JSON.parse(value) : true;
        } catch (e) {
            console.error('Error retrieving showDemo status:', e);
            return true;
        }
    };

    useEffect(() => {
        const initializeApp = async () => {
            const demoStatus = await getShowDemoStatus();
            setShowDemo(demoStatus);
        };
        initializeApp();
    }, []);

    const handleDemoFinish = () => {
        setShowDemo(false);
        storeShowDemoStatus(false);
    };

    const filteredLanguages = languages.filter(lang =>
        lang.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        Tts.setDefaultLanguage('en-US');
        Tts.setDefaultVoice('com.apple.ttsbundle.Samantha-compact');

        Voice.onSpeechStart = onSpeechStart;
        Voice.onSpeechEnd = onSpeechEnd;
        Voice.onSpeechResults = onSpeechResults;

        return () => {
            Voice.destroy().then(Voice.removeAllListeners);
        };
    }, []);

    const renderDemoStep = () => {
        const steps = [
            { title: "Welcome to AI Translator!", content: "Let's take a quick tour of the app's features." },
            { title: "Text Translation", content: "Type or paste text to translate between languages." },
            { title: "Voice Translation", content: "Speak and have your words translated instantly." },
            { title: "Image Translation", content: "Take a photo or upload an image to extract and translate text." },
            { title: "You're all set!", content: "Enjoy using AI Translator for all your translation needs!" }
        ];

        return (
            <Modal transparent visible={showDemo} animationType="fade">
                <View style={styles.demoOverlay}>
                    <View style={styles.demoCard}>
                        <Text style={styles.demoTitle}>{steps[currentDemoStep].title}</Text>
                        <Text style={styles.demoContent}>{steps[currentDemoStep].content}</Text>
                        <View style={styles.demoButtonContainer}>
                            <TouchableOpacity
                                style={styles.demoButton}
                                onPress={() => setShowDemo(false)}
                            >
                                <Text style={styles.demoButtonText}>Skip</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.demoButton}
                                onPress={() => {
                                    if (currentDemoStep < steps.length - 1) {
                                        setCurrentDemoStep(currentDemoStep + 1);
                                    } else {
                                        handleDemoFinish();
                                    }
                                }}
                            >
                                <Text style={styles.demoButtonText}>
                                    {currentDemoStep < steps.length - 1 ? "Next" : "Finish"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        );
    };


    const handleContinue = () => {
        setScreen('translate');
    };

    const copyToClipboard = (text) => {
        Clipboard.setString(text);
        Alert.alert('Copied', 'Text copied to clipboard');
    };


    const handleImageResult = async (response) => {
        if (!response || !response.path) {
            console.error('Invalid image picker response.');
            // setObjectInfo({ error: 'Error processing image. Please try again.' });
            return;
        }

        setImage(response.path);
        try {
            const base64 = await RNFS.readFile(response.path, 'base64');
            await extractTextFromImage(base64);
        } catch (error) {
            console.error('Error reading file:', error);
            // setObjectInfo({ error: 'Error reading image file. Please try again.' });
        }
    };


    const extractTextFromImage = async (base64Image) => {
        setIsLoading(true);
        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

            const prompt = "Extract and return only the text visible in this image. If there's no text, respond with 'No text found in the image.'"

            const result = await model.generateContent([
                prompt,
                { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
            ]);

            console.log('Gemini AI response received');

            const extractedText = result.response.text().trim();
            setScannedText(extractedText);
        } catch (error) {
            console.error('Error in extractTextFromImage function:', error);
            setObjectInfo({ error: 'Unexpected error. Please try again.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleTranslate = async (textToTranslate) => {
        setIsLoading(true);
        setError(null);
        try {
            console.log("" + sourceLanguage + " " + targetLanguage + "  " + textToTranslate)
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });
            const prompt = `Translate the following text from ${sourceLanguage} to ${targetLanguage}: "${textToTranslate}"`;
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            console.log(text)
            setTranslatedText(text);
            saveToHistory(textToTranslate, text, 'text');
        } catch (err) {
            console.error('Translation error:', err);
            setError('An error occurred while translating. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageTranslate = async (textToTranslate) => {
        setIsLoading(true);
        setError(null);
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });
            const prompt = `Translate the following text to ${targetLanguage}: "${textToTranslate}"`;
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            console.log(text);
            setTranslatedText(text);
            saveToHistory(textToTranslate, translatedText, 'image');
        } catch (err) {
            console.error('Translation error:', err);
            setError('An error occurred while translating. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleDropdown = (type) => {
        setIsDropdownVisible(!isDropdownVisible);
        setActiveDropdown(type);
    };

    const selectLanguage = (language) => {
        if (activeDropdown === 'source') {
            setSourceLanguage(language);
        } else {
            setTargetLanguage(language);
        }
        setIsDropdownVisible(false);
    };

    const speakTranslatedText = () => {
        Tts.speak(translatedText);
    };

    const onSpeechStart = () => {
        console.log('Speech started');
        setIsRecording(true);
    };

    const onSpeechEnd = () => {
        console.log('Speech ended');
        setIsRecording(false);
        stopAnimation();
    };

    const onSpeechResults = (e) => {
        console.log('Speech results:', e);
        setRecordedText(e.value[0]);
    };

    const toggleRecording = async () => {
        if (isRecording) {
            try {
                await Voice.stop();
                setIsRecording(false);
                stopAnimation();
            } catch (e) {
                console.error(e);
            }
        } else {
            try {
                await Voice.start(sourceLanguage);
                setIsRecording(true);
                startAnimation();
            } catch (e) {
                console.error(e);
            }
        }
    };

    const startAnimation = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(animatedValue, {
                    toValue: 1.2,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.timing(animatedValue, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    };

    const stopAnimation = () => {
        animatedValue.setValue(1);
        animatedValue.stopAnimation();
    };
    const handleImagePick = async (type) => {
        const options = {
            mediaType: 'photo',
            includeBase64: false,
            maxHeight: 2000,
            maxWidth: 2000,
        };

        try {
            const response = type === 'camera'
                ? await ImagePicker.openCamera(options)
                : await ImagePicker.openPicker(options);

            await handleImageResult(response);
        } catch (error) {
            if (error.code === 'E_PICKER_CANCELLED') {
                // User cancelled the picker
                return;
            }
            if (error.code === 'E_NO_CAMERA_PERMISSION') {
                Alert.alert(
                    "Permission Required",
                    "Camera permission is required to take photos. Please enable it in your device settings.",
                    [{ text: "OK", onPress: () => console.log("OK Pressed") }]
                );
                return;
            }
            console.error('ImagePicker Error: ', error);
            Alert.alert("Error", "An error occurred while processing the image. Please try again.");
        }
    };

    const saveToHistory = async (originalText, translatedText, type) => {
        const newEntry = {
            id: Date.now(),
            originalText,
            translatedText,
            type,
            timestamp: new Date().toISOString(),
        };
        const updatedHistory = [newEntry, ...translationHistory];
        setTranslationHistory(updatedHistory);
        try {
            await AsyncStorage.setItem('@translationHistory', JSON.stringify(updatedHistory));
        } catch (e) {
            console.error('Error saving translation history:', e);
        }
    };
    
    const loadTranslationHistory = async () => {
        try {
            const history = await AsyncStorage.getItem('@translationHistory');
            if (history !== null) {
                setTranslationHistory(JSON.parse(history));
            }
        } catch (e) {
            console.error('Error loading translation history:', e);
        }
    };
    
    const clearTranslationHistory = async () => {
        try {
            await AsyncStorage.removeItem('@translationHistory');
            setTranslationHistory([]);
            Alert.alert('History Cleared', 'All translation history has been deleted.');
        } catch (e) {
            console.error('Error clearing translation history:', e);
        }
    };
    
    useEffect(() => {
        loadTranslationHistory();
    }, []);

    const handleMenuPress = (action) => {
        if (action === 'history') {
            setShowHistory(true);
        } else if (action === 'about') {
            // Implement about screen logic here
            Alert.alert(
                "About AI Translator",
                "AI Translator is a powerful tool that helps you translate text, voice, and images across multiple languages. Powered by advanced AI technology, it provides accurate and fast translations for all your needs.",
                [{ text: "OK", onPress: () => console.log("OK Pressed") }]
            );
        }
    };

    const Header = ({ title, onBackPress, onMenuPress }) => {
        const [showMenu, setShowMenu] = useState(false);
    
        const handleMenuPress = (action) => {
            setShowMenu(false);
            onMenuPress(action);
        };
    
        return (
            <SafeAreaView style={styles.headerContainer}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onBackPress}>
                        <Icon name="arrow-back" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{title}</Text>
                    <TouchableOpacity onPress={() => setShowMenu(true)}>
                        <Icon name="more-vert" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
                <ModalMenu
                    visible={showMenu}
                    onClose={() => setShowMenu(false)}
                    onHistoryPress={() => handleMenuPress('history')}
                    onAboutPress={() => handleMenuPress('about')}
                />
            </SafeAreaView>
        );
    };

    const HistoryScreen = ({ onClose }) => {
        return (
            <SafeAreaView style={styles.historyContainer}>
                <Header 
                    title="Translation History" 
                    onBackPress={onClose}
                    onMenuPress={() => {}}
                />
                <FlatList
                    data={translationHistory}
                    renderItem={({ item }) => (
                        <View style={styles.historyItem}>
                            <View style={styles.historyItemHeader}>
                                <Icon name={item.type === 'text' ? 'edit' : item.type === 'voice' ? 'mic' : 'image'} size={24} color="#4A90E2" />
                                <Text style={styles.historyItemDate}>{new Date(item.timestamp).toLocaleString()}</Text>
                            </View>
                            <View style={styles.historyItemContent}>
                                <Text style={styles.historyItemOriginal}>{item.originalText}</Text>
                                <Icon name="arrow-downward" size={24} color="#4A90E2" />
                                <Text style={styles.historyItemTranslated}>{item.translatedText}</Text>
                            </View>
                            <View style={styles.historyItemActions}>
                                <TouchableOpacity onPress={() => copyToClipboard(item.translatedText)}>
                                    <Icon name="content-copy" size={24} color="#4A90E2" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => speakTranslatedText(item.translatedText)}>
                                    <Icon name="volume-up" size={24} color="#4A90E2" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.historyList}
                />
                <TouchableOpacity style={styles.clearHistoryButton} onPress={clearTranslationHistory}>
                    <Icon name="delete" size={24} color="#fff" />
                    <Text style={styles.clearHistoryButtonText}>Clear History</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    };

    const handleBackPress = () => {
        if (showHistory) {
            setShowHistory(false);
        } else {
            navigation.navigate("Dashboard");
        }
    };
    const renderWelcomeScreen = () => (
        <SafeAreaView style={styles.welcomeContainer}>
            <Text style={styles.title}>Translator</Text>
            <Text style={styles.subtitle}>Translate easy and fast into 100+ languages</Text>
            <View style={styles.avatarContainer}>
                <View style={styles.avatarBubble}>
                    <Text style={styles.avatarText}>Hola</Text>
                    <View style={[styles.avatar, styles.avatar1]} />
                </View>
                <View style={styles.avatarBubble}>
                    <Text style={styles.avatarText}>Hello</Text>
                    <View style={[styles.avatar, styles.avatar2]} />
                </View>
                <View style={styles.avatarBubble}>
                    <Text style={styles.avatarText}>Ciao</Text>
                    <View style={[styles.avatar, styles.avatar3]} />
                </View>
            </View>
            <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
                <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );

    const renderTranslateScreen = () => (
        <SafeAreaView style={styles.translateContainer}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardAvoidingView}
            >
                <ScrollView contentContainerStyle={styles.scrollViewContent}>
                    <Text style={styles.headerTitle}>Text Translator</Text>
                    <View style={styles.card}>
                        <View style={styles.languageSelector}>
                            <TouchableOpacity style={styles.dropdown} onPress={() => toggleDropdown('source')}>
                                <Text style={styles.dropdownText}>{sourceLanguage}</Text>
                                <Icon name="arrow-drop-down" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter text"
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                        />
                    </View>
                    <View style={styles.card}>
                        <View style={styles.languageSelector}>
                            <TouchableOpacity style={styles.dropdown} onPress={() => toggleDropdown('target')}>
                                <Text style={styles.dropdownText}>{targetLanguage}</Text>
                                <Icon name="arrow-drop-down" size={24} color="#333" />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.speakerButton} onPress={speakTranslatedText}>
                                <Icon name="volume-up" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        {isLoading ? (
                            <ActivityIndicator size="large" color="#333" />
                        ) : error ? (
                            <Text style={styles.errorText}>{error}</Text>
                        ) : (
                            <Text style={styles.translatedText}>{translatedText || "Translated text will appear here..."}</Text>
                        )}
                    </View>
                    <TouchableOpacity style={styles.translateButton} onPress={e => handleTranslate(inputText)}>
                        <Text style={styles.translateButtonText}>Translate</Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
            {renderBottomButtons('translate')}
            {isDropdownVisible && (
                <View style={styles.dropdownListContainer}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search languages..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    <FlatList
                        data={filteredLanguages}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.dropdownItem}
                                onPress={() => selectLanguage(item)}
                            >
                                <Text style={styles.dropdownItemText}>{item}</Text>
                            </TouchableOpacity>
                        )}
                        keyExtractor={(item) => item}
                    />
                </View>
            )}
        </SafeAreaView>
    );


    const handleVoiceTranslate = async (recordedText) => {
        setIsLoading(true);
        setError(null);
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });
            const prompt = `Translate the following text from ${sourceLanguage} to ${targetLanguage}: "${recordedText}"`;
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const translatedText = response.text();
            setTranslatedText(translatedText);
            saveToHistory(recordedText, translatedText, 'voice');
        } catch (err) {
            console.error('Voice translation error:', err);
            setError('An error occurred while translating. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const renderRecordScreen = () => (
        <SafeAreaView style={styles.recordContainer}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardAvoidingView}
            >
                <ScrollView contentContainerStyle={styles.scrollViewContent}>
                    <View style={styles.card}>
                        <View style={styles.languageSelector}>
                            <TouchableOpacity style={styles.dropdown} onPress={() => toggleDropdown('source')}>
                                <Text style={styles.dropdownText}>{sourceLanguage}</Text>
                                <Icon name="arrow-drop-down" size={24} color="#333" />
                            </TouchableOpacity>
                            <Icon name="compare-arrows" size={24} color="#333" />
                            <TouchableOpacity style={styles.dropdown} onPress={() => toggleDropdown('target')}>
                                <Text style={styles.dropdownText}>{targetLanguage}</Text>
                                <Icon name="arrow-drop-down" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View style={[styles.card, styles.waveformCard]}>
                        <TextInput
                            style={styles.recordedTextInput}
                            value={recordedText}
                            onChangeText={setRecordedText}
                            multiline
                            placeholder="Recorded text will appear here..."
                        />
                        <Animated.View style={[styles.recordButtonContainer, { transform: [{ scale: animatedValue }] }]}>
                            <TouchableOpacity
                                style={[styles.recordButton, isRecording && styles.recordingButton]}
                                onPress={toggleRecording}
                            >
                                <Icon name={isRecording ? "stop" : "mic"} size={24} color="#fff" />
                            </TouchableOpacity>
                        </Animated.View>
                    </View>
                    <TouchableOpacity
                        style={styles.translateButton}
                        onPress={() => handleVoiceTranslate(recordedText)}
                    >
                        <Text style={styles.translateButtonText}>Translate</Text>
                    </TouchableOpacity>
                    <View style={[styles.card, styles.translatedCard]}>
                        {isLoading ? (
                            <ActivityIndicator size="large" color="#4A90E2" />
                        ) : (
                            <>
                                <Text style={styles.translatedText}>{translatedText || "Translated text will appear here..."}</Text>
                                <View style={styles.cardIconsContainer}>
                                    <TouchableOpacity style={styles.cardIcon} onPress={speakTranslatedText}>
                                        <Icon name="volume-up" size={24} color="#4A90E2" />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.cardIcon} onPress={() => copyToClipboard(translatedText)}>
                                        <Icon name="content-copy" size={24} color="#4A90E2" />
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
            {renderBottomButtons('record')}
            {isDropdownVisible && (
                <View style={styles.dropdownListContainer}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search languages..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    <FlatList
                        data={filteredLanguages}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.dropdownItem}
                                onPress={() => selectLanguage(item)}
                            >
                                <Text style={styles.dropdownItemText}>{item}</Text>
                            </TouchableOpacity>
                        )}
                        keyExtractor={(item) => item}
                    />
                </View>
            )}
        </SafeAreaView>
    );


    const renderScanScreen = () => (
        <SafeAreaView style={styles.scanContainer}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardAvoidingView}
            >
                <ScrollView contentContainerStyle={styles.scrollViewContent}>
                    <Text style={styles.headerTitle}>Image Translator</Text>
                    <View style={[styles.card, styles.imagePickerCard]}>
                        <View style={styles.imagePickerCardButton}>
                            <TouchableOpacity style={styles.imagePickerButton} onPress={() => handleImagePick('gallery')}>
                                <Icon name="photo-library" size={40} color="#4A90E2" />
                                <Text style={styles.imagePickerText}>Upload Image</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.imagePickerButton} onPress={() => handleImagePick('camera')}>
                                <Icon name="camera-alt" size={40} color="#4A90E2" />
                                <Text style={styles.imagePickerText}>Take Photo</Text>
                            </TouchableOpacity>
                        </View>
                        {image ? (
                            <Image source={{ uri: image }} style={styles.selectedImage} />
                        ) : (<></>)}
                    </View>
                    <View style={styles.card}>
                        <TextInput
                            style={styles.input}
                            placeholder="Extracted text will appear here..."
                            value={scannedText}
                            onChangeText={setScannedText}
                            multiline
                        />
                    </View>
                    <View style={styles.translationContainer}>
                        <View style={styles.languageSelector}>
                            <TouchableOpacity style={styles.dropdown} onPress={() => toggleDropdown('target')}>
                                <Text style={styles.dropdownText}>{targetLanguage}</Text>
                                <Icon name="arrow-drop-down" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity
                            style={styles.translateButton}
                            onPress={() => handleImageTranslate(scannedText)}
                        >
                            <Text style={styles.translateButtonText}>Translate</Text>
                            <Icon name="translate" size={24} color="#fff" style={styles.translateIcon} />
                        </TouchableOpacity>
                    </View>
                    <View style={[styles.card, styles.translatedCard]}>
                        {isLoading ? (
                            <ActivityIndicator size="large" color="#4A90E2" />
                        ) : (
                            <>
                                <Text style={styles.translatedText}>{translatedText || "Translated text will appear here..."}</Text>
                                <View style={styles.cardIconsContainer}>
                                    <TouchableOpacity style={styles.cardIcon} onPress={speakTranslatedText}>
                                        <Icon name="volume-up" size={24} color="#4A90E2" />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.cardIcon} onPress={() => copyToClipboard(translatedText)}>
                                        <Icon name="content-copy" size={24} color="#4A90E2" />
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
            {renderBottomButtons('scan')}
            {isDropdownVisible && (
                <View style={styles.dropdownListContainer}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search languages..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    <FlatList
                        data={filteredLanguages}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.dropdownItem}
                                onPress={() => selectLanguage(item)}
                            >
                                <Text style={styles.dropdownItemText}>{item}</Text>
                            </TouchableOpacity>
                        )}
                        keyExtractor={(item) => item}
                    />
                </View>
            )}
        </SafeAreaView>
    );


    const renderBottomButtons = (activeScreen) => (
        <View style={styles.buttonContainer}>
            <TouchableOpacity
                style={[styles.button, activeScreen === 'translate' && styles.activeButton]}
                onPress={() => setScreen('translate')}
            >
                <Icon name="edit" size={24} color={activeScreen === 'translate' ? "#fff" : "#4A90E2"} />
                <Text style={[styles.buttonText, activeScreen === 'translate' && styles.activeButtonText]}>Write</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.button, activeScreen === 'record' && styles.activeButton]}
                onPress={() => setScreen('record')}
            >
                <Icon name="mic" size={24} color={activeScreen === 'record' ? "#fff" : "#4A90E2"} />
                <Text style={[styles.buttonText, activeScreen === 'record' && styles.activeButtonText]}>Record</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.button, activeScreen === 'scan' && styles.activeButton]}
                onPress={() => setScreen('scan')}
            >
                <Icon name="camera-alt" size={24} color={activeScreen === 'scan' ? "#fff" : "#4A90E2"} />
                <Text style={[styles.buttonText, activeScreen === 'scan' && styles.activeButtonText]}>Scan</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
        {renderDemoStep()}
        {showHistory ? (
            <HistoryScreen onClose={() => setShowHistory(false)} />
        ) : (
            <>
                <Header
                    title={screen === 'welcome' ? 'Welcome' : 
                           screen === 'translate' ? 'Text Translator' : 
                           screen === 'record' ? 'Voice Translator' : 'Image Translator'}
                    onBackPress={handleBackPress}
                    onMenuPress={handleMenuPress}
                />
                {screen === 'welcome' && renderWelcomeScreen()}
                {screen === 'translate' && renderTranslateScreen()}
                {screen === 'record' && renderRecordScreen()}
                {screen === 'scan' && renderScanScreen()}
            </>
        )}
    </View>
);
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f7f020',
    },
    headerContainer: {
        backgroundColor: '#4A90E2',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 6,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    menuDropdown: {
    position: 'absolute',
    top: 60,
    right: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
    padding: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1000, // Add this line to ensure it's above other elements
  },
    menuItem: {
        padding: 10,
    },
    menuItemText: {
        fontSize: 16,
        color: '#4A90E2',
    },
    historyContainer: {
        flex: 1,
        backgroundColor: '#f7f7f7',
    },
    historyList: {
        padding: 15,
    },
    historyItem: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    historyItemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    historyItemDate: {
        fontSize: 12,
        color: '#888',
    },
    historyItemContent: {
        borderLeftWidth: 2,
        borderLeftColor: '#4A90E2',
        paddingLeft: 10,
    },
    historyItemOriginal: {
        fontSize: 16,
        color: '#333',
        marginBottom: 5,
    },
    historyItemTranslated: {
        fontSize: 16,
        color: '#4A90E2',
        fontWeight: 'bold',
    },
    historyItemActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 10,
    },
    clearHistoryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FF3B30',
        padding: 15,
        borderRadius: 25,
        margin: 20,
    },
    clearHistoryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    cardIconsContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 10,
    },
    cardIcon: {
        padding: 5,
        marginLeft: 10,
    },
    translatedCard: {
        minHeight: 150,
        position: 'relative',
        backgroundColor: '#F0F8FF', // Light blue background for translated text
    },
    translatedText: {
        color: '#333',
        minHeight: 100,
        fontSize: 16,
        lineHeight: 24,
    },
    welcomeContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    translateContainer: {
        flex: 1,
    },
    recordContainer: {
        flex: 1,
    },
    scanContainer: {
        flex: 1,
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    scrollViewContent: {
        flexGrow: 1,
        padding: 20,
        paddingBottom: 100, // Extra padding for bottom buttons
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#4A90E2',
    },
    subtitle: {
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 30,
        color: '#333',
    },
    avatarContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginBottom: 40,
    },
    avatarBubble: {
        alignItems: 'center',
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginTop: 10,
    },
    avatar1: {
        backgroundColor: '#4A90E2',
    },
    avatar2: {
        backgroundColor: '#F5A623',
    },
    avatar3: {
        backgroundColor: '#7ED321',
    },
    avatarText: {
        fontSize: 16,
        color: '#333',
        backgroundColor: '#fff',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 15,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: 'white',
        marginBottom: 20,
        textAlign: 'center',
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 15,
        marginBottom: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    languageSelector: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    dropdown: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E1E8ED',
        padding: 10,
        borderRadius: 20,
        minWidth: 120,
    },
    dropdownText: {
        color: '#4A90E2',
        marginRight: 5,
        fontWeight: '900'
    },
    dropdownList: {
        position: 'absolute',
        top: 120,
        left: 20,
        right: 20,
        backgroundColor: 'white',
        borderRadius: 10,
        maxHeight: 200,
        zIndex: 1,
        elevation: 5,
    },
    dropdownItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#E1E8ED',
    },
    dropdownItemText: {
        color: '#4A90E2',
    },
    input: {
        minHeight: 100,
        textAlignVertical: 'top',
        color: '#333',
    },
    // translatedText: {
    //     color: '#333',
    //     minHeight: 100,
    // },
    errorText: {
        color: '#FF3B30',
        textAlign: 'center',
    },
    speakerButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        padding: 10,
    },
    continueButton: {
        backgroundColor: '#059ffc',
        paddingVertical: 15,
        paddingHorizontal: 80,
        borderRadius: 25,
        marginBottom: 20,
    },
    continueButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '900',
        textAlign: 'center',
    },
    previewImage: {
        width: '100%',
        height: 200,
        resizeMode: 'contain',
        marginBottom: 20,
        borderRadius: 10,
    },
    translateButton: {
        backgroundColor: '#059ffc',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 25,
        marginBottom: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    translateIcon: {
        marginLeft: 10,
    },
    translateButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '900',
        textAlign: 'center',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        backgroundColor: 'white',
        borderRadius: 30,
        padding: 10,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    button: {
        alignItems: 'center',
        padding: 15,
        borderRadius: 25,
        backgroundColor: '#F0F8FF',
    },
    activeButton: {
        backgroundColor: '#4A90E2',
    },
    buttonText: {
        color: '#4A90E2',
        marginTop: 5,
        fontWeight: '900',
        fontSize: 14,
    },
    activeButtonText: {
        color: '#fff',
    },
    waveformCard: {
        backgroundColor: 'white',
        marginBottom: 20,
        borderRadius: 10,
        padding: 15,
        minHeight: 150,
    },
    recordedTextInput: {
        minHeight: 100,
        textAlignVertical: 'top',
        color: '#333',
    },
    recordCard: {
        minHeight: 150,
        position: 'relative',
    },
    recordText: {
        fontSize: 16,
        color: '#333',
    },
    recordButtonContainer: {
        alignSelf: 'center',
        marginTop: 10,
    },
    recordButton: {
        backgroundColor: '#4A90E2',
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    recordingButton: {
        backgroundColor: '#FF3B30',
    },

    imagePickerButton: {
        alignItems: 'center',
        padding: 15,
        borderRadius: 15,
        backgroundColor: '#fff',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    imagePickerText: {
        color: '#4A90E2',
        marginTop: 10,
        fontWeight: '600',
        fontSize: 14,
    },
    translationContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    // translatedCard: {
    //     minHeight: 150,
    //     position: 'relative',
    // },
  imagePickerCard: {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        minHeight: 200,
        backgroundColor: '#F0F8FF',
    },
    imagePickerCardButton: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        width: '100%',
        marginBottom: 20,
    },
    selectedImage: {
        width: '100%',
        height: 200,
        resizeMode: 'contain',
        borderRadius: 10,
    },
    dropdownListContainer: {
        position: 'absolute',
        top: 120,
        left: 20,
        right: 20,
        backgroundColor: 'white',
        borderRadius: 10,
        maxHeight: 300,
        zIndex: 1,
        elevation: 5,
    },
    searchInput: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E1E8ED',
    },
    demoOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    demoCard: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        width: '80%',
        alignItems: 'center',
    },
    demoTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#4A90E2',
    },
    demoContent: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
        color: '#333',
    },
    demoButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    demoButton: {
        backgroundColor: '#4A90E2',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 25,
    },
    demoButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default AiTranslator;