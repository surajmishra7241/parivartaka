import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  StatusBar,
  PermissionsAndroid,
  Platform,
  ActivityIndicator,
  Animated,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import Voice from '@react-native-voice/voice';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GENAI_API_KEY } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from '@react-native-community/blur';

const { width, height } = Dimensions.get('window');
const genAI = new GoogleGenerativeAI(GENAI_API_KEY);

const CustomAlert = ({ visible, message, onClose }) => {
  if (!visible) return null;

  return (
    <BlurView style={styles.alertOverlay} blurType="light" blurAmount={10}>
      <View style={styles.alertContainer}>
        <Text style={styles.alertText}>{message}</Text>
        <TouchableOpacity style={styles.alertButton} onPress={onClose}>
          <Text style={styles.alertButtonText}>OK</Text>
        </TouchableOpacity>
      </View>
    </BlurView>
  );
};

const InterviewAssistant = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [textInput, setTextInput] = useState('');
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const flatListRef = useRef();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    setupVoiceRecognition();
    loadCachedMessages();
    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  const setupVoiceRecognition = () => {
    Voice.onSpeechResults = (e) => {
      if (e.value && e.value.length > 0) {
        setTranscript(e.value[0]);
      }
    };
    Voice.onSpeechEnd = () => {
      setIsRecording(false);
      if (transcript) {
        generateAnswer(transcript);
      }
    };
    Voice.onSpeechError = (e) => {
      console.error('Speech recognition error:', e);
      setAlertMessage('Speech recognition failed. Please try again.');
      setAlertVisible(true);
      setIsRecording(false);
    };
  };

  const loadCachedMessages = async () => {
    try {
      const cachedMessages = await AsyncStorage.getItem('interviewMessages');
      if (cachedMessages) {
        setMessages(JSON.parse(cachedMessages));
      }
    } catch (error) {
      console.error('Error loading cached messages:', error);
    }
  };

  const cacheMessages = async (newMessages) => {
    try {
      await AsyncStorage.setItem('interviewMessages', JSON.stringify(newMessages));
    } catch (error) {
      console.error('Error caching messages:', error);
    }
  };

  const requestAudioPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: "Interview Assistant Audio Permission",
            message: "Interview Assistant needs access to your microphone.",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK"
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        setAlertMessage("Failed to request audio permission.");
        setAlertVisible(true);
        return false;
      }
    }
    return true;
  };

  const startRecording = async () => {
    const hasPermission = await requestAudioPermission();
    if (!hasPermission) return;

    try {
      await Voice.start('en-US');
      setIsRecording(true);
      setTranscript('');
    } catch (error) {
      console.error('Error starting recording:', error);
      setAlertMessage('Failed to start recording. Please try again.');
      setAlertVisible(true);
    }
  };

  const stopRecording = async () => {
    try {
      await Voice.stop();
    } catch (error) {
      console.error('Error stopping recording:', error);
      setAlertMessage('Failed to stop recording. Please try again.');
      setAlertVisible(true);
    }
  };

  const handleSendMessage = () => {
    if (textInput.trim()) {
      generateAnswer(textInput.trim());
      setTextInput('');
    }
  };

  const generateAnswer = async (question) => {
    if (!question) return;
    
    setIsLoading(true);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const prompt = `Given the following question from a job interview, please provide a suitable answer: "${question}"`;
      
      const result = await model.generateContent(prompt);
      const answer = result.response.text();
      
      const newMessages = [
        ...messages,
        { type: 'user', content: question },
        { type: 'assistant', content: answer }
      ];
      setMessages(newMessages);
      cacheMessages(newMessages);
    } catch (error) {
      console.error('Error generating answer:', error);
      setAlertMessage('Failed to generate an answer. Please try again.');
      setAlertVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  const saveAndShare = async () => {
    try {
      const fileName = `interview_transcript_${Date.now()}.txt`;
      const path = `${RNFS.DocumentDirectoryPath}/${fileName}`;
      let content = messages
        .map((item) => `${item.type === 'user' ? 'Q' : 'A'}: ${item.content}\n\n`)
        .join('');

      await RNFS.writeFile(path, content, 'utf8');
      const shareOptions = {
        title: 'Interview Transcript',
        url: `file://${path}`,
        type: 'text/plain',
      };
      await Share.open(shareOptions);
    } catch (error) {
      console.error('Error saving or sharing file:', error);
      setAlertMessage('Failed to save or share the transcript.');
      setAlertVisible(true);
    }
  };

  const renderMessage = ({ item }) => (
    <View style={[styles.messageBubble, item.type === 'user' ? styles.userBubble : styles.assistantBubble]}>
      <Text style={styles.messageText}>{item.content}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#1A237E" />
      <LinearGradient colors={['#1A237E', '#3F51B5']} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Interview Genius</Text>
          <TouchableOpacity onPress={saveAndShare} style={styles.shareButton}>
            <Icon name="share-variant" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item, index) => index.toString()}
          style={styles.messageList}
          contentContainerStyle={styles.messageListContent}
          onContentSizeChange={() => flatListRef.current.scrollToEnd({ animated: true })}
        />

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#FFFFFF" />
          </View>
        )}

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.inputContainer}
        >
          <TextInput
            style={styles.textInput}
            value={textInput}
            onChangeText={setTextInput}
            placeholder="Type your question..."
            placeholderTextColor="#999"
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
            <Icon name="send" size={24} color="#FFF" />
          </TouchableOpacity>
          <Animated.View style={[styles.recordButtonContainer, { transform: [{ scale: pulseAnim }] }]}>
            <TouchableOpacity
              style={[styles.recordButton, isRecording && styles.recordingButton]}
              onPressIn={startRecording}
              onPressOut={stopRecording}
              activeOpacity={0.7}
            >
              <Icon name={isRecording ? "stop" : "microphone"} size={32} color="#FFFFFF" />
            </TouchableOpacity>
          </Animated.View>
        </KeyboardAvoidingView>

        <CustomAlert
          visible={alertVisible}
          message={alertMessage}
          onClose={() => setAlertVisible(false)}
        />
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1A237E',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Roboto-Bold',
  },
  shareButton: {
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 24,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    paddingBottom: 24,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#E3F2FD',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 24,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 24,
    padding: 12,
    marginRight: 8,
  },
  recordButtonContainer: {
    marginLeft: 8,
  },
  recordButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF4081',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  recordingButton: {
    backgroundColor: '#F50057',
  },
  alertOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  alertText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  alertButton: {
    backgroundColor: '#3F51B5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  alertButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default InterviewAssistant;