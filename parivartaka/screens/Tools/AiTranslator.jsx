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
} from 'react-native';
import { GENAI_API_KEY, OPENAI_API_KEY, OPENAI_API_URL } from '@env';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Tts from 'react-native-tts';
import Voice from '@react-native-voice/voice';

const { width, height } = Dimensions.get('window');

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(GENAI_API_KEY);

const AiTranslator = () => {
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
    const animatedValue = useRef(new Animated.Value(1)).current;
    const languages = ['Italian', 'English', 'Spanish', 'French', 'German'];
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

    const handleContinue = () => {
        setScreen('translate');
    };

    const handleTranslate = async (textToTranslate) => {
        setIsLoading(true);
        setError(null);
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });
            const prompt = `Translate the following text from ${sourceLanguage} to ${targetLanguage}: "${textToTranslate}"`;
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            console.log(text)
            setTranslatedText(text);
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
                            <Text style={styles.translatedText}>{translatedText}</Text>
                        )}
                    </View>
                    <TouchableOpacity style={styles.translateButton} onPress={e => handleTranslate(inputText)}>
                        <Text style={styles.translateButtonText}>Translate</Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
            {renderBottomButtons('translate')}
            {isDropdownVisible && (
                <ScrollView style={styles.dropdownList}>
                    {languages.map((lang) => (
                        <TouchableOpacity key={lang} style={styles.dropdownItem} onPress={() => selectLanguage(lang)}>
                            <Text style={styles.dropdownItemText}>{lang}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}
        </SafeAreaView>
    );


    const renderRecordScreen = () => (
        <SafeAreaView style={styles.recordContainer}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardAvoidingView}
            >
                <ScrollView contentContainerStyle={styles.scrollViewContent}>
                    <Text style={styles.headerTitle}>Voice Translator</Text>
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
                        onPress={() => handleTranslate(recordedText)}
                    >
                        <Text style={styles.translateButtonText}>Translate</Text>
                    </TouchableOpacity>
                    <View style={[styles.card, styles.recordCard]}>
                        {isLoading ? (
                            <ActivityIndicator size="large" color="#4A90E2" />
                        ) : (
                            <>
                                <Text style={styles.recordText}>{translatedText || "Translated text will appear here..."}</Text>
                                <TouchableOpacity style={styles.speakerButton} onPress={speakTranslatedText}>
                                    <Icon name="volume-up" size={24} color="#4A90E2" />
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
            {renderBottomButtons('record')}
            {isDropdownVisible && (
                <ScrollView style={styles.dropdownList}>
                    {languages.map((lang) => (
                        <TouchableOpacity key={lang} style={styles.dropdownItem} onPress={() => selectLanguage(lang)}>
                            <Text style={styles.dropdownItemText}>{lang}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
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
            <TouchableOpacity style={styles.button}>
                <Icon name="camera-alt" size={24} color="#4A90E2" />
                <Text style={styles.buttonText}>Scan</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            {screen === 'welcome' && renderWelcomeScreen()}
            {screen === 'translate' && renderTranslateScreen()}
            {screen === 'record' && renderRecordScreen()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f7f020',
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
    translatedText: {
        color: '#333',
        minHeight: 100,
    },
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
        paddingHorizontal:80,
        borderRadius: 25,
        marginBottom: 20,
    },
    continueButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '900',
        textAlign: 'center',
    },
    translateButton: {
        backgroundColor: '#059ffc',
        paddingVertical: 15,
        borderRadius: 25,
        marginBottom: 20,
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
        padding: 10,
        borderRadius: 20,
    },
    activeButton: {
        backgroundColor: '#4A90E2',
    },
    buttonText: {
        color: '#4A90E2',
        marginTop: 5,
        fontWeight: '900'
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
});

export default AiTranslator;