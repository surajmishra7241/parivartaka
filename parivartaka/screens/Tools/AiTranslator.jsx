import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Animated,
  Dimensions,
  StatusBar,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Voice from '@react-native-voice/voice';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Dropdown } from 'react-native-element-dropdown';
import LinearGradient from 'react-native-linear-gradient';
import Tts from 'react-native-tts';

import { GENAI_API_KEY } from '@env';

const { width, height } = Dimensions.get('window');
const genAI = new GoogleGenerativeAI(GENAI_API_KEY);

const AiTranslator = () => {
  const [isListening, setIsListening] = useState(false);
  const [chats, setChats] = useState([]);
  const [sourceLanguage, setSourceLanguage] = useState('en');
  const [targetLanguage, setTargetLanguage] = useState('es');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const translateAnim = useRef(new Animated.Value(width)).current;
  const flatListRef = useRef(null);

  const languages = [
    { label: 'English', value: 'en', flag: '🇬🇧' },
    { label: 'Spanish', value: 'es', flag: '🇪🇸' },
    { label: 'French', value: 'fr', flag: '🇫🇷' },
    { label: 'German', value: 'de', flag: '🇩🇪' },
    { label: 'Italian', value: 'it', flag: '🇮🇹' },
    { label: 'Japanese', value: 'ja', flag: '🇯🇵' },
    { label: 'Korean', value: 'ko', flag: '🇰🇷' },
    { label: 'Chinese', value: 'zh', flag: '🇨🇳' },
  ];

  useEffect(() => {
    Voice.onSpeechResults = onSpeechResults;
    setupTts();
    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  useEffect(() => {
    setupTts();
  }, [sourceLanguage, targetLanguage]);

  const setupTts = async () => {
    await Tts.setDefaultLanguage(sourceLanguage);
    await Tts.setDefaultVoice('com.apple.ttsbundle.Moira-compact');
  };

  const onSpeechResults = useCallback((e) => {
    translateText(e.value[0]);
  }, [sourceLanguage, targetLanguage]);

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
      setError("Failed to start voice recognition. Please try again.");
    }
  };

  const translateText = async (text) => {
    setIsLoading(true);
    setError(null);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const prompt = `Translate the following text from ${sourceLanguage} to ${targetLanguage}: "${text}"`;
      const result = await model.generateContent(prompt);
      const translatedText = result.response.text();
      const newChat = { 
        id: Date.now().toString(), 
        original: text, 
        translated: translatedText, 
        isUser: true 
      };
      setChats(prevChats => [...prevChats, newChat]);
      animateNewMessage();
      flatListRef.current?.scrollToEnd({ animated: true });
    } catch (error) {
      console.error('Translation error:', error);
      setError("Failed to translate. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const speakText = (text, lang) => {
    Tts.setDefaultLanguage(lang);
    Tts.speak(text);
  };

  const animateNewMessage = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(translateAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const deleteAllChats = () => {
    Alert.alert(
      "Delete All Chats",
      "Are you sure you want to delete all chats?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", onPress: () => setChats([]), style: "destructive" }
      ]
    );
  };

  const renderMessage = ({ item }) => (
    <Animated.View 
      style={[
        styles.messageContainer, 
        { 
          opacity: fadeAnim,
          transform: [{ translateX: translateAnim }],
        }
      ]}
    >
      <LinearGradient
        colors={item.isUser ? ['#E1F5FE', '#B3E5FC'] : ['#B3E5FC', '#81D4FA']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={[styles.messageContent, item.isUser ? styles.userMessage : styles.aiMessage]}
      >
        <Text style={styles.messageText}>{item.original}</Text>
        <Text style={styles.translatedText}>{item.translated}</Text>
        <TouchableOpacity
          style={styles.speakerButton}
          onPress={() => speakText(item.translated, item.isUser ? targetLanguage : sourceLanguage)}
        >
          <Icon name="volume-high" size={24} color="#FF5252" />
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );

  const renderDropdownItem = (item) => (
    <View style={styles.dropdownItem}>
      <Text style={styles.dropdownFlag}>{item.flag}</Text>
      <Text style={styles.dropdownLabel}>{item.label}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4FC3F7" />
      <LinearGradient colors={['#4FC3F7', '#29B6F6']} style={styles.header}>
        <Dropdown
          style={styles.dropdown}
          containerStyle={styles.dropdownContainer}
          data={languages}
          labelField="label"
          valueField="value"
          value={sourceLanguage}
          onChange={item => setSourceLanguage(item.value)}
          placeholder="From"
          renderItem={renderDropdownItem}
          maxHeight={300}
        />
        <Icon name="swap-horizontal" size={24} color="#FFF" />
        <Dropdown
          style={styles.dropdown}
          containerStyle={styles.dropdownContainer}
          data={languages}
          labelField="label"
          valueField="value"
          value={targetLanguage}
          onChange={item => setTargetLanguage(item.value)}
          placeholder="To"
          renderItem={renderDropdownItem}
          maxHeight={300}
        />
        <TouchableOpacity onPress={deleteAllChats} style={styles.deleteButton}>
          <Icon name="delete" size={24} color="#FFF" />
        </TouchableOpacity>
      </LinearGradient>
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      <FlatList
        ref={flatListRef}
        data={chats}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.chatList}
        contentContainerStyle={styles.chatListContent}
      />
      <View style={styles.footer}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#FF5252" />
        ) : (
          <TouchableOpacity style={styles.micButton} onPress={toggleListening}>
            <LinearGradient
              colors={isListening ? ['#FF5252', '#FF1744'] : ['#FF7043', '#FF5722']}
              style={styles.micButtonGradient}
            >
              <Icon name={isListening ? "stop" : "microphone"} size={32} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E3F2FD',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 16 : 16,
  },
  dropdown: {
    flex: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    marginHorizontal: 8,
    paddingHorizontal: 12,
  },
  dropdownContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginTop: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  dropdownFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  dropdownLabel: {
    fontSize: 16,
    color: '#333',
  },
  deleteButton: {
    marginLeft: 8,
    padding: 8,
  },
  chatList: {
    flex: 1,
  },
  chatListContent: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 16,
  },
  messageContent: {
    borderRadius: 20,
    padding: 16,
    minHeight: 60,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  userMessage: {
    marginLeft: 40,
    borderTopLeftRadius: 4,
  },
  aiMessage: {
    marginRight: 40,
    borderTopRightRadius: 4,
  },
  messageText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  translatedText: {
    fontSize: 14,
    color: '#666',
  },
  speakerButton: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 20,
    padding: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
  micButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  micButtonGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    backgroundColor: '#FFCDD2',
    padding: 12,
    margin: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#D32F2F',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
  },
});

export default AiTranslator;