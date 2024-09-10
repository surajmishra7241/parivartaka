import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { GENAI_API_KEY,OPENAI_API_KEY, OPENAI_API_URL} from '@env';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Tts from 'react-native-tts';

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

  const languages = ['Italian', 'English', 'Spanish', 'French', 'German'];

  useEffect(() => {
    Tts.setDefaultLanguage('en-US');
    Tts.setDefaultVoice('com.apple.ttsbundle.Samantha-compact');
  }, []);

  const handleContinue = () => {
    setScreen('translate');
  };

  const handleTranslate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const prompt = `Translate the following text from ${sourceLanguage} to ${targetLanguage}: "${inputText}"`;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
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
          <Text style={styles.headerTitle}>Translator</Text>
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
          <TouchableOpacity style={styles.translateButton} onPress={handleTranslate}>
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
          <Text style={styles.headerTitle}>Translator</Text>
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
          <View style={styles.waveform}>
            {/* Add waveform visualization here */}
          </View>
          <View style={[styles.card, styles.recordCard]}>
            <Text style={styles.recordText}>Where are you from?</Text>
            <TouchableOpacity style={styles.starButton}>
              <Icon name="star-border" size={24} color="#333" />
            </TouchableOpacity>
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
        <Icon name="edit" size={24} color={activeScreen === 'translate' ? "#fff" : "#333"} />
        <Text style={[styles.buttonText, activeScreen === 'translate' && styles.activeButtonText]}>Write</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, activeScreen === 'record' && styles.activeButton]}
        onPress={() => setScreen('record')}
      >
        <Icon name="mic" size={24} color={activeScreen === 'record' ? "#fff" : "#333"} />
        <Text style={[styles.buttonText, activeScreen === 'record' && styles.activeButtonText]}>Record</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button}>
        <Icon name="camera-alt" size={24} color="#333" />
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
    backgroundColor: '#FFE600',
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
    paddingBottom: 100, // Add extra padding at the bottom for the button container
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
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
    backgroundColor: '#8B4513',
  },
  avatar2: {
    backgroundColor: '#FFD700',
  },
  avatar3: {
    backgroundColor: '#A52A2A',
  },
  avatarText: {
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  continueButton: {
    backgroundColor: '#333',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 18,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    elevation: 3,
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
    backgroundColor: '#F0F0F0',
    padding: 10,
    borderRadius: 20,
    minWidth: 120,
  },
  dropdownText: {
    color: '#333',
    marginRight: 5,
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
    borderBottomColor: '#F0F0F0',
  },
  dropdownItemText: {
    color: '#333',
  },
  input: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  translatedText: {
    color: '#333',
    minHeight: 100,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
  },
  speakerButton: {
    padding: 10,
  },
  translateButton: {
    backgroundColor: '#333',
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 20,
  },
  translateButtonText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#FFD700',
    padding: 15,
    borderRadius: 10,
    minWidth: width / 4,
  },
  activeButton: {
    backgroundColor: '#333',
  },
  buttonText: {
    color: '#333',
    marginTop: 5,
  },
  activeButtonText: {
    color: '#fff',
  },
  waveform: {
    height: 100,
    backgroundColor: '#333',
    marginBottom: 20,
    borderRadius: 10,
  },
  recordText: {
    fontSize: 24,
    textAlign: 'center',
    color: '#333',
  },
  recordCard: {
    minHeight: 150,
  },
});

export default AiTranslator;