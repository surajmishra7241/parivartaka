import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  StatusBar,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import LiveAudioStream from 'react-native-live-audio-stream';
import { GoogleGenerativeAI } from '@google/generative-ai';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';

const { width, height } = Dimensions.get('window');

const InterviewAssistant = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcripts, setTranscripts] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [audioData, setAudioData] = useState([]);
  const scrollViewRef = useRef();

  const genAI = new GoogleGenerativeAI('YOUR_API_KEY');

  useEffect(() => {
    requestAudioPermission();
    setupAudioStream();
  }, []);

  const requestAudioPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: "Interview Assistant Audio Permission",
            message: "Interview Assistant needs access to your microphone to record audio.",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK"
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert("Permission Denied", "You need to grant audio permission to use the recording feature.");
        }
      } catch (err) {
        console.warn(err);
        Alert.alert("Error", "Failed to request audio permission.");
      }
    }
  };

  const setupAudioStream = () => {
    if (LiveAudioStream) {
      const options = {
        sampleRate: 32000,
        channels: 1,
        bitsPerSample: 16,
        audioSource: 6,
        bufferSize: 4096
      };

      LiveAudioStream.init(options);
      LiveAudioStream.on('data', data => {
        setAudioData(prevData => [...prevData, data]);
      });
    } else {
      console.error('LiveAudioStream is not available');
      Alert.alert('Error', 'Audio recording is not available on this device.');
    }
  };

  const startRecording = async () => {
    if (LiveAudioStream) {
      try {
        await LiveAudioStream.start();
        setIsRecording(true);
        setAudioData([]);
      } catch (error) {
        console.error('Error starting recording:', error);
        Alert.alert('Error', 'Failed to start recording. Please try again.');
      }
    } else {
      Alert.alert('Error', 'Audio recording is not available on this device.');
    }
  };

  const stopRecording = async () => {
    if (LiveAudioStream) {
      try {
        await LiveAudioStream.stop();
        setIsRecording(false);
        generateAnswer();
      } catch (error) {
        console.error('Error stopping recording:', error);
        Alert.alert('Error', 'Failed to stop recording. Please try again.');
      }
    }
  };

  const generateAnswer = async () => {
    try {
      // Here you would typically send the audio data to a speech-to-text service
      // For this example, we'll use the raw audio data to simulate speech-to-text
      const audioText = audioData.join('').slice(0, 100); // Simulate converting audio to text
      
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const prompt = `Given the following audio transcript from a job interview, please provide a suitable answer: "${audioText}"`;
      const result = await model.generateContent(prompt);
      const answer = result.response.text();
      
      setCurrentAnswer(answer);
      setTranscripts(prev => [...prev, { question: audioText, answer }]);
    } catch (error) {
      console.error('Error generating answer:', error);
      Alert.alert('Error', 'Failed to generate an answer. Please try again.');
    }
  };

  const saveAndShare = async () => {
    try {
      const fileName = `interview_transcript_${Date.now()}.txt`;
      const path = `${RNFS.DocumentDirectoryPath}/${fileName}`;
      
      let content = transcripts.map((item, index) => 
        `Q${index + 1}: ${item.question}\nA: ${item.answer}\n\n`
      ).join('');
      
      await RNFS.writeFile(path, content, 'utf8');
      
      const shareOptions = {
        title: 'Interview Transcript',
        url: `file://${path}`,
        type: 'text/plain',
      };
      
      await Share.open(shareOptions);
    } catch (error) {
      console.error('Error saving or sharing file:', error);
      Alert.alert('Error', 'Failed to save or share the transcript.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#4A0E4E" />
      <LinearGradient colors={['#4A0E4E', '#7B1FA2']} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Interview Genius</Text>
          <TouchableOpacity onPress={saveAndShare} style={styles.shareButton}>
            <Icon name="share-variant" size={28} color="#FFF" />
          </TouchableOpacity>
        </View>
        
        <ScrollView
          style={styles.transcriptContainer}
          ref={scrollViewRef}
          onContentSizeChange={() => scrollViewRef.current.scrollToEnd({ animated: true })}
        >
          {transcripts.map((item, index) => (
            <View key={index} style={styles.transcriptItem}>
              <Text style={styles.questionText}>Q: {item.question}</Text>
              <Text style={styles.answerText}>A: {item.answer}</Text>
            </View>
          ))}
          {currentAnswer && (
            <View style={styles.currentAnswerContainer}>
              <Text style={styles.currentAnswerText}>{currentAnswer}</Text>
            </View>
          )}
        </ScrollView>
        
        <TouchableOpacity
          style={[styles.recordButton, isRecording && styles.recordingButton]}
          onPressIn={startRecording}
          onPressOut={stopRecording}
        >
          <Icon name="microphone" size={36} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#4A0E4E',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Roboto-Bold',
  },
  shareButton: {
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  transcriptContainer: {
    flex: 1,
    marginBottom: 20,
  },
  transcriptItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  questionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A0E4E',
    marginBottom: 10,
    fontFamily: 'Roboto-Bold',
  },
  answerText: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'Roboto-Regular',
  },
  currentAnswerContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
  },
  currentAnswerText: {
    fontSize: 16,
    color: '#4A0E4E',
    fontStyle: 'italic',
    fontFamily: 'Roboto-Italic',
  },
  recordButton: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF4081',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
  },
  recordingButton: {
    backgroundColor: '#F50057',
    transform: [{ scale: 1.1 }],
  },
});

export default InterviewAssistant;