import React, { useState, useEffect ,useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, SafeAreaView, Dimensions, KeyboardAvoidingView, Platform, Keyboard ,Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Voice from '@react-native-voice/voice';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Dropdown } from 'react-native-element-dropdown';
import LinearGradient from 'react-native-linear-gradient';
import { GENAI_API_KEY,OPENAI_API_KEY, OPENAI_API_URL} from '@env';

const genAI = new GoogleGenerativeAI(GENAI_API_KEY);

const languages = [
    { label: 'English', value: 'en', flag: '🇬🇧' },
    { label: 'Hindi', value: 'hi', flag: '🇮🇳' },
    { label: 'Bengali', value: 'bn', flag: '🇮🇳' },
    { label: 'Telugu', value: 'te', flag: '🇮🇳' },
    { label: 'Marathi', value: 'mr', flag: '🇮🇳' },
    { label: 'Tamil', value: 'ta', flag: '🇮🇳' },
    { label: 'Urdu', value: 'ur', flag: '🇮🇳' },
    { label: 'Gujarati', value: 'gu', flag: '🇮🇳' },
    { label: 'Kannada', value: 'kn', flag: '🇮🇳' },
    { label: 'Odia', value: 'or', flag: '🇮🇳' },
    { label: 'Punjabi', value: 'pa', flag: '🇮🇳' },
    { label: 'Malayalam', value: 'ml', flag: '🇮🇳' },
    { label: 'Assamese', value: 'as', flag: '🇮🇳' },
    { label: 'Sanskrit', value: 'sa', flag: '🇮🇳' },
    { label: 'Spanish', value: 'es', flag: '🇪🇸' },
    { label: 'French', value: 'fr', flag: '🇫🇷' },
    { label: 'German', value: 'de', flag: '🇩🇪' },
    { label: 'Italian', value: 'it', flag: '🇮🇹' },
    { label: 'Japanese', value: 'ja', flag: '🇯🇵' },
    { label: 'Korean', value: 'ko', flag: '🇰🇷' },
    { label: 'Chinese', value: 'zh', flag: '🇨🇳' },
    { label: 'Russian', value: 'ru', flag: '🇷🇺' },
];

const AiTranslator = () => {
    const [mode, setMode] = useState('single');
    const [sourceLanguage, setSourceLanguage] = useState(languages[0]);
    const [targetLanguage, setTargetLanguage] = useState(languages[1]);
    const [user1Language, setUser1Language] = useState(languages[0]);
    const [user2Language, setUser2Language] = useState(languages[1]);
    const [singleInput, setSingleInput] = useState('');
    const [user1Input, setUser1Input] = useState('');
    const [user2Input, setUser2Input] = useState('');
    const [singleTranslated, setSingleTranslated] = useState('');
    const [user1Translated, setUser1Translated] = useState('');
    const [user2Translated, setUser2Translated] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [isListening1, setIsListening1] = useState(false);
    const [isListening2, setIsListening2] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [history, setHistory] = useState([]);
    const [orientation, setOrientation] = useState('portrait');
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const [isVoiceAvailable, setIsVoiceAvailable] = useState(false);


    const initVoice = useCallback(async () => {
        try {
            if (Voice && typeof Voice.isAvailable === 'function') {
                const available = await Voice.isAvailable();
                setIsVoiceAvailable(available);
                if (available) {
                    Voice.onSpeechResults = onSpeechResults;
                    Voice.onSpeechError = onSpeechError;
                }
            } else {
                console.error('Voice module is not properly initialized');
                setIsVoiceAvailable(false);
            }
        } catch (e) {
            console.error('Error checking voice availability:', e);
            setIsVoiceAvailable(false);
        }
    }, []);

    useEffect(() => {
        const updateLayout = () => {
            const { width, height } = Dimensions.get('window');
            setOrientation(width > height ? 'landscape' : 'portrait');
        };

        const dimensionsListener = Dimensions.addEventListener('change', updateLayout);
        updateLayout();

        const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
        const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));

        initVoice();

        return () => {
            dimensionsListener.remove();
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
            if (Voice) {
                Voice.destroy().then(Voice.removeAllListeners);
            }
        };
    }, [initVoice]);

    const onSpeechResults = (e) => {
        if (mode === 'single') {
            setSingleInput(e.value[0]);
        } else {
            if (isListening1) {
                setUser1Input(e.value[0]);
            } else if (isListening2) {
                setUser2Input(e.value[0]);
            }
        }
    };

    const onSpeechError = (e) => {
        console.error('Speech recognition error:', e);
        Alert.alert('Speech Recognition Error', 'An error occurred during speech recognition. Please try again.');
        stopListening();
    };

    const startListening = async (user = null) => {
        if (!isVoiceAvailable) {
            Alert.alert('Voice Recognition Unavailable', 'Voice recognition is not available on this device.');
            return;
        }

        try {
            if (mode === 'single') {
                await Voice.start(sourceLanguage.value);
                setIsListening(true);
            } else {
                if (user === 1) {
                    await Voice.start(user1Language.value);
                    setIsListening1(true);
                } else {
                    await Voice.start(user2Language.value);
                    setIsListening2(true);
                }
            }
        } catch (e) {
            console.error('Error starting voice recognition:', e);
            Alert.alert('Error', 'Failed to start voice recognition. Please try again.');
        }
    };
    const stopListening = async (user = null) => {
        try {
            if (Voice && typeof Voice.stop === 'function') {
                await Voice.stop();
                if (mode === 'single') {
                    setIsListening(false);
                } else {
                    if (user === 1) {
                        setIsListening1(false);
                    } else {
                        setIsListening2(false);
                    }
                }
            }
        } catch (e) {
            console.error('Error stopping voice recognition:', e);
        }
    };

    const translateText = async () => {
        setIsLoading(true);
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });
            if (mode === 'single') {
                const prompt = `Translate the following text from ${sourceLanguage.label} to ${targetLanguage.label}: "${singleInput}"`;
                const result = await model.generateContent(prompt);
                const response = await result.response;
                setSingleTranslated(response.text());
                setHistory([{ source: singleInput, target: response.text() }, ...history.slice(0, 4)]);
            } else {
                const prompt1 = `Translate the following text from ${user1Language.label} to ${user2Language.label}: "${user1Input}"`;
                const prompt2 = `Translate the following text from ${user2Language.label} to ${user1Language.label}: "${user2Input}"`;

                const [result1, result2] = await Promise.all([
                    model.generateContent(prompt1),
                    model.generateContent(prompt2)
                ]);

                const response1 = await result1.response;
                const response2 = await result2.response;

                setUser1Translated(response2.text());
                setUser2Translated(response1.text());
            }
        } catch (error) {
            console.error('Translation error:', error);
            Alert.alert('Translation Error', 'An error occurred during translation. Please try again.');
            if (mode === 'single') {
                setSingleTranslated('Error translating text');
            } else {
                setUser1Translated('Error translating text');
                setUser2Translated('Error translating text');
            }
        }
        setIsLoading(false);
    };


    const swapLanguages = () => {
        if (mode === 'single') {
            const temp = sourceLanguage;
            setSourceLanguage(targetLanguage);
            setTargetLanguage(temp);
        } else {
            const temp = user1Language;
            setUser1Language(user2Language);
            setUser2Language(temp);
        }
    };

    const renderLanguageSelector = (language, setLanguage, label) => (
        <View style={[styles.dropdownContainer, orientation === 'landscape' && styles.dropdownContainerLandscape]}>
            <Text style={styles.dropdownLabel}>{label}</Text>
            <Dropdown
                style={[styles.dropdown, orientation === 'landscape' && styles.dropdownLandscape]}
                data={languages}
                search
                maxHeight={300}
                labelField="label"
                valueField="value"
                placeholder={`Select ${label}`}
                searchPlaceholder="Search..."
                value={language.value}
                onChange={item => setLanguage(item)}
                renderLeftIcon={() => (
                    <Text style={styles.flagIcon}>{language.flag}</Text>
                )}
                renderItem={item => (
                    <View style={styles.dropdownItem}>
                        <Text style={styles.dropdownItemText}>{item.flag} {item.label}</Text>
                    </View>
                )}
                selectedTextStyle={styles.selectedTextStyle}
            />
        </View>
    );

    const renderSingleUserMode = () => (
        <View style={orientation === 'landscape' ? styles.landscapeContainer : {}}>
            <View style={[styles.languageSelector, orientation === 'landscape' && styles.languageSelectorLandscape]}>
                {renderLanguageSelector(sourceLanguage, setSourceLanguage, 'From')}
                <TouchableOpacity onPress={swapLanguages} style={styles.swapButton}>
                    <Icon name="swap-horizontal" size={24} color="#00ffff" />
                </TouchableOpacity>
                {renderLanguageSelector(targetLanguage, setTargetLanguage, 'To')}
            </View>

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    value={singleInput}
                    onChangeText={setSingleInput}
                    placeholder="Enter text to translate..."
                    placeholderTextColor="#6c7693"
                    multiline
                />
                <TouchableOpacity
                    style={styles.micButton}
                    onPress={isListening ? () => stopListening() : () => startListening()}
                >
                    <Icon name={isListening ? "stop" : "microphone"} size={24} color="#00ffff" />
                </TouchableOpacity>
            </View>

            {singleTranslated && (
                <View style={styles.translationContainer}>
                    <Text style={styles.translatedText}>{singleTranslated}</Text>
                </View>
            )}

            <ScrollView style={styles.historyContainer}>
                <Text style={styles.historyTitle}>History</Text>
                {history.map((item, index) => (
                    <View key={index} style={styles.historyItem}>
                        <Text style={styles.historyItemText}>{item.source}</Text>
                        <Text style={styles.historyItemText}>{item.target}</Text>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
    const renderMultiUserMode = () => (
        <View>
            <View style={styles.userContainer}>
                <Text style={styles.userTitle}>User 1</Text>
                {renderLanguageSelector(user1Language, setUser1Language, 'Language')}
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        value={user1Input}
                        onChangeText={setUser1Input}
                        placeholder="Enter text..."
                        placeholderTextColor="#6c7693"
                        multiline
                    />
                    <TouchableOpacity
                        style={styles.micButton}
                        onPress={() => isListening1 ? stopListening(1) : startListening(1)}
                    >
                        <Icon name={isListening1 ? "stop" : "microphone"} size={24} color="#00ffff" />
                    </TouchableOpacity>
                </View>
                {user1Translated && (
                    <View style={styles.translationContainer}>
                        <Text style={styles.translatedText}>{user1Translated}</Text>
                    </View>
                )}
            </View>

            <View style={styles.userContainer}>
                <Text style={styles.userTitle}>User 2</Text>
                {renderLanguageSelector(user2Language, setUser2Language, 'Language')}
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        value={user2Input}
                        onChangeText={setUser2Input}
                        placeholder="Enter text..."
                        placeholderTextColor="#6c7693"
                        multiline
                    />
                    <TouchableOpacity
                        style={styles.micButton}
                        onPress={() => isListening2 ? stopListening(2) : startListening(2)}
                    >
                        <Icon name={isListening2 ? "stop" : "microphone"} size={24} color="#00ffff" />
                    </TouchableOpacity>
                </View>
                {user2Translated && (
                    <View style={styles.translationContainer}>
                        <Text style={styles.translatedText}>{user2Translated}</Text>
                    </View>
                )}
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <LinearGradient colors={['#1a2a6c', '#b21f1f', '#fdbb2d']} style={styles.gradient}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.keyboardAvoidingView}
                >
                    <ScrollView
                        style={styles.container}
                        contentContainerStyle={styles.scrollViewContent}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={styles.header}>
                            <Text style={styles.title}>AI TRANSLATOR</Text>
                            <TouchableOpacity onPress={() => setMode(mode === 'single' ? 'multi' : 'single')}>
                                <Icon name={mode === 'single' ? 'account' : 'account-group'} size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        {mode === 'single' ? renderSingleUserMode() : renderMultiUserMode()}

                        <TouchableOpacity style={styles.translateButton} onPress={translateText}>
                            <Text style={styles.buttonText}>Translate</Text>
                        </TouchableOpacity>

                        {isLoading && <ActivityIndicator size="large" color="#00ffff" style={styles.loader} />}
                    </ScrollView>
                </KeyboardAvoidingView>
            </LinearGradient>
        </SafeAreaView>
    );
};

const { width, height } = Dimensions.get('window');
const isSmallDevice = width < 375;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    gradient: {
        flex: 1,
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    scrollViewContent: {
        padding: isSmallDevice ? 10 : 20,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: isSmallDevice ? 20 : 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    languageSelector: {
        flexDirection: 'column',
        marginBottom: 20,
    },
    languageSelectorLandscape: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dropdownContainer: {
        marginBottom: 10,
    },
    dropdownContainerLandscape: {
        flex: 1,
        marginHorizontal: 5,
    },
    dropdownLabel: {
        color: '#fff',
        marginBottom: 5,
        fontSize: isSmallDevice ? 12 : 14,
    },
    dropdown: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    dropdownLandscape: {
        width: '100%',
    },
    dropdownItem: {
        padding: 10,
    },
    dropdownItemText: {
        color: '#fff',
        fontSize: isSmallDevice ? 12 : 14,
    },
    selectedTextStyle: {
        color: '#fff',
        fontSize: isSmallDevice ? 12 : 14,
    },
    flagIcon: {
        fontSize: isSmallDevice ? 16 : 20,
        marginRight: 10,
    },
    swapButton: {
        padding: 10,
        alignSelf: 'center',
        marginVertical: 10,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    input: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 8,
        padding: 10,
        color: '#fff',
        minHeight: 100,
        textAlignVertical: 'top',
        fontSize: isSmallDevice ? 12 : 14,
    },
    micButton: {
        marginLeft: 10,
        padding: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 25,
    },
    translationContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 8,
        padding: 10,
        marginBottom: 20,
    },
    translatedText: {
        color: '#fff',
        fontSize: isSmallDevice ? 12 : 14,
    },
    historyContainer: {
        marginTop: 20,
        maxHeight: height * 0.3,
    },
    historyTitle: {
        fontSize: isSmallDevice ? 16 : 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 10,
    },
    historyItem: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 8,
        padding: 10,
        marginBottom: 10,
    },
    historyItemText: {
        color: '#fff',
        fontSize: isSmallDevice ? 11 : 13,
    },
    userContainer: {
        marginBottom: 20,
    },
    userTitle: {
        fontSize: isSmallDevice ? 16 : 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 10,
    },
    translateButton: {
        backgroundColor: '#00ffff',
        borderRadius: 8,
        padding: isSmallDevice ? 12 : 15,
        alignItems: 'center',
        marginTop: 20,
    },
    buttonText: {
        color: '#1a2a6c',
        fontWeight: 'bold',
        fontSize: isSmallDevice ? 14 : 16,
    },
    loader: {
        marginTop: 20,
    },
    landscapeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
});



export default AiTranslator;