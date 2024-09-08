import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  PermissionsAndroid,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Animated,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Voice from '@react-native-voice/voice';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GENAI_API_KEY,OPENAI_API_KEY, OPENAI_API_URL} from '@env';
const InterviewAssistant = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);

  const genAI = new GoogleGenerativeAI(GENAI_API_KEY); // Replace with your actual API key

  useEffect(() => {
    const setupVoice = async () => {
      await requestMicrophonePermission();
      Voice.onSpeechStart = onSpeechStart;
      Voice.onSpeechEnd = onSpeechEnd;
      Voice.onSpeechResults = onSpeechResults;
    };

    setupVoice();
    loadMessages();

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const requestMicrophonePermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: "Microphone Permission",
          message: "This app needs access to your microphone to record your answers.",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK"
        }
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        console.log("Microphone permission denied");
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const loadMessages = async () => {
    try {
      const savedMessages = await AsyncStorage.getItem('messages');
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const saveMessages = async (newMessages) => {
    try {
      await AsyncStorage.setItem('messages', JSON.stringify(newMessages));
    } catch (error) {
      console.error('Error saving messages:', error);
    }
  };

  const onSpeechStart = () => {
    console.log("Voice recording started");
    setIsListening(true);
    startTimer();
  };

  const onSpeechEnd = () => {
    console.log("Voice recording ended");
    setIsListening(false);
    stopTimer();
  };

  const onSpeechResults = async (e) => {
    console.log("Recording Result:", e);
    const text = e.value[0];
    setInputText(text);
    await handleSend(text);
  };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setRecordingTime(0);
    timerRef.current = setInterval(() => {
      setRecordingTime((prevTime) => prevTime + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const toggleListening = async () => {
    try {
      if (isListening) {
        await Voice.stop();
        setIsListening(false);
        stopTimer();
      } else {
        await Voice.start('en-US');
        setIsListening(true);
        startTimer();
      }
    } catch (error) {
      console.error('Error toggling voice recognition:', error);
    }
  };

  const handleSend = async (text = inputText) => {
    if (text.trim()) {
      setIsLoading(true);
      const newMessages = [...messages, { text, sender: 'user' }];
      setMessages(newMessages);
      saveMessages(newMessages);
      setInputText('');
      await generateBotResponse(text);
      setIsLoading(false);
    }
  };

  const generateBotResponse = async (userInput) => {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const prompt = `As an applicant, respond to the following question from an interviewer: "${userInput}". Your response should be clear, professional, and well-structured. Highlight relevant skills, experiences, and knowledge to showcase your qualifications, and provide specific examples where possible. End the response with a brief statement that invites further discussion or clarification.`;

      
      const result = await model.generateContent(prompt);
      const botResponse = result.response.text();
      
      const newMessages = [...messages, { text: userInput, sender: 'user' }, { text: botResponse, sender: 'bot' }];
      setMessages(newMessages);
      saveMessages(newMessages);
    } catch (error) {
      console.error('Error generating bot response:', error);
      const errorMessage = "I'm sorry, I couldn't generate a response. Please try again.";
      const newMessages = [...messages, { text: userInput, sender: 'user' }, { text: errorMessage, sender: 'bot' }];
      setMessages(newMessages);
      saveMessages(newMessages);
    }
  };

  const clearChatHistory = () => {
    setMessages([]);
    saveMessages([]);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F4E3" />
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Interview Assistant</Text>
          <TouchableOpacity onPress={clearChatHistory} style={styles.clearButton}>
            <Icon name="delete-sweep" size={24} color="#6B4D41" />
          </TouchableOpacity>
        </View>
        <ScrollView
          style={styles.messagesContainer}
          ref={scrollViewRef}
          onContentSizeChange={() => scrollViewRef.current.scrollToEnd({ animated: true })}
        >
          {messages.map((message, index) => (
            <Animated.View
              key={index}
              entering={Animated.FadeInUp?.duration(300).delay(index * 100)}
              style={[
                styles.messageBubble,
                message.sender === 'user' ? styles.userBubble : styles.botBubble
              ]}
            >
              <Text style={[
                styles.messageText,
                message.sender === 'user' ? styles.userText : styles.botText
              ]}>{message.text}</Text>
            </Animated.View>
          ))}
        </ScrollView>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type your answer..."
            placeholderTextColor="#9B8579"
          />
          <TouchableOpacity onPress={toggleListening} style={styles.micButton}>
            <Icon name={isListening ? 'stop' : 'mic'} size={24} color="#F8F4E3" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleSend()} style={styles.sendButton}>
            <Icon name="send" size={24} color="#F8F4E3" />
          </TouchableOpacity>
        </View>
        {isListening && (
          <Text style={styles.recordingTime}>Recording: {formatTime(recordingTime)}</Text>
        )}
        {isLoading && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#6B4D41" />
          </View>
        )}
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F4E3',
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F8F4E3',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6B4D41',
  },
  clearButton: {
    padding: 8,
  },
  messagesContainer: {
    flex: 1,
    marginBottom: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 20,
    marginBottom: 8,
    elevation: 3,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#D2B48C',
  },
  botBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#E6D7C3',
  },
  messageText: {
    fontSize: 16,
  },
  userText: {
    color: '#4A3728',
  },
  botText: {
    color: '#4A3728',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#E6D7C3',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: '#4A3728',
    marginRight: 8,
  },
  micButton: {
    backgroundColor: '#6B4D41',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#6B4D41',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingTime: {
    color: '#FF4136',
    textAlign: 'center',
    marginTop: 8,
  },
  loaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(248, 244, 227, 0.7)',
  },
});

export default InterviewAssistant;