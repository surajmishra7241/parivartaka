import React, { useState, useEffect } from 'react';
import { SafeAreaView, StyleSheet, View, Text, TouchableOpacity, FlatList, TextInput, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Voice from '@react-native-voice/voice';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Tts from 'react-native-tts';

import { GENAI_API_KEY } from '@env';

const genAI = new GoogleGenerativeAI(GENAI_API_KEY);

const AiTranslator = () => {
    const [isListening, setIsListening] = useState(false);
    const [recognizedText, setRecognizedText] = useState('');
    const [translatedText, setTranslatedText] = useState('');
    let [sourceLanguage, setSourceLanguage] = useState('en');
    const [targetLanguage, setTargetLanguage] = useState('es');
    const [isSelectingLanguage, setIsSelectingLanguage] = useState(false);
    const [selectedLanguageType, setSelectedLanguageType] = useState('');

    const languages = [
        { label: 'English', value: 'en' },
        { label: 'Spanish', value: 'es' },
        { label: 'Hindi', value: 'hi' },
        { label: 'Bengali', value: 'bn' },
        { label: 'Tamil', value: 'ta' },
        { label: 'Telugu', value: 'te' },
        { label: 'Marathi', value: 'mr' },
        { label: 'Gujarati', value: 'gu' },
        { label: 'French', value: 'fr' },
        { label: 'German', value: 'de' },
        { label: 'Italian', value: 'it' },
        { label: 'Japanese', value: 'ja' },
        { label: 'Korean', value: 'ko' },
        { label: 'Chinese', value: 'zh' },
    ];

    useEffect(() => {
        Voice.onSpeechResults = onSpeechResults;
        setupTts();
        return () => {
            Voice.destroy().then(Voice.removeAllListeners);
        };
    }, []);

    // Re-setup TTS when the source language changes
    useEffect(() => {
        setupTts();
    }, [sourceLanguage]);

    useEffect(() => {
        console.log("Target Language updated to:", targetLanguage);
      }, [targetLanguage]); 

    const setupTts = async () => {
        await Tts.setDefaultLanguage(sourceLanguage);
        await Tts.setDefaultVoice('com.apple.ttsbundle.Samantha-compact');
    };

    const onSpeechResults = (e) => {
        setRecognizedText(e.value[0]);
        translateText(e.value[0]);
    };

    const toggleListening = async () => {
        try {
            if (isListening) {
                await Voice.stop();
                setIsListening(false);
            } else {
                await Voice.start(sourceLanguage);
                setIsListening(true);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const translateText = async (text) => {
        console.log("call")
        console.log(sourceLanguage)
        console.log(targetLanguage)
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });
            const prompt = `Translate the following text from ${sourceLanguage} to ${targetLanguage}: "${text}"`;
            const result = await model.generateContent(prompt);
            setTranslatedText(result.response.text());
        } catch (error) {
            console.error('Translation error:', error);
        }
    };

    const speakTranslatedText = () => {
        Tts.speak(translatedText);
    };
    const renderLanguageItem = ({ item }) => (
        <TouchableOpacity
            style={styles.languageItem}
            onPress={() => {
                if (selectedLanguageType === 'source') {
                    setSourceLanguage(item.value);  // Update source language
                } else if (selectedLanguageType === 'target') {
                    console.log("Updating Target Language to:", item.value);  // Debug log
                    setTargetLanguage(item.value);  // Update target language
                }
                setIsSelectingLanguage(false);
            }}
        >
            <Text style={styles.languageItemText}>{item.label}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            {isSelectingLanguage ? (
                <View style={styles.languageSelectionContainer}>
                    <FlatList
                        data={languages}
                        renderItem={renderLanguageItem}
                        keyExtractor={(item) => item.value}
                        style={styles.languageList}
                    />
                </View>
            ) : (
                <>
                    <FlatList
                        data={[
                            { id: '1', text: recognizedText, avatar: 'https://picsum.photos/seed/picsum/200/300' },
                            { id: '2', text: translatedText, avatar: 'https://picsum.photos/seed/picsum/200/300' },
                        ]}
                        renderItem={({ item }) => (
                            <View style={styles.messageContainer}>
                                <Image source={{ uri: item.avatar }} style={styles.avatar} />
                                <View style={styles.messageContent}>
                                    <Text style={styles.messageText}>{item.text}</Text>
                                </View>
                            </View>
                        )}
                        keyExtractor={(item) => item.id}
                        style={styles.messageList}
                    />
                    <View style={styles.footer}>
                        <View style={styles.languageSelector}>
                            {/* Source Language Button */}
                            <TouchableOpacity
                                style={styles.languageButton}
                                onPress={() => {
                                    setIsSelectingLanguage(true);
                                    setSelectedLanguageType('source');
                                }}
                            >
                                <Text style={styles.languageButtonText}>
                                    {languages.find((lang) => lang.value === sourceLanguage)?.label}
                                </Text>
                            </TouchableOpacity>

                            <Icon name="arrow-right" size={24} color="#888" />

                            {/* Target Language Button */}
                            <TouchableOpacity
                                style={styles.languageButton}
                                onPress={() => {
                                    setIsSelectingLanguage(true);
                                    setSelectedLanguageType('target');  // Set to target to update target language
                                }}
                            >
                                <Text style={styles.languageButtonText}>
                                    {languages.find((lang) => lang.value === targetLanguage)?.label}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.controls}>
                            <TouchableOpacity style={styles.controlButton} onPress={toggleListening}>
                                <Icon name={isListening ? "stop" : "microphone"} size={32} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.controlButton} onPress={speakTranslatedText}>
                                <Icon name="volume-high" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f0f0',
    },
    messageList: {
        flex: 1,
        padding: 16,
    },
    messageContainer: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    messageContent: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 12,
    },
    messageText: {
        fontSize: 16,
    },
    footer: {
        backgroundColor: '#fff',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
    },
    languageSelector: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    languageButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: '#f0f0f0',
        borderRadius: 20,
    },
    languageButtonText: {
        fontSize: 16,
        color: '#333',
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    controlButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#6c63ff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    micButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#6c63ff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    languageSelectionContainer: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 16,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: 20,
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 12,
        marginLeft: 8,
        fontSize: 16,
    },
    languageList: {
        flex: 1,
    },
    languageItem: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    languageItemText: {
        fontSize: 16,
        color: '#333',
    },
    selectButton: {
        backgroundColor: '#6c63ff',
        borderRadius: 20,
        paddingVertical: 12,
        alignItems: 'center',
        marginTop: 16,
    },
    selectButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default AiTranslator;