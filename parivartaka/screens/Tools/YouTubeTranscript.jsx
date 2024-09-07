import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Clipboard,
  Platform,
  Modal,
  Animated,
} from 'react-native';
import { GoogleGenerativeAI } from '@google/generative-ai';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import LinearGradient from 'react-native-linear-gradient';
import { GENAI_API_KEY,OPENAI_API_KEY, OPENAI_API_URL} from '@env';
const API_KEY = GENAI_API_KEY; // Replace with your actual Gemini API key
const genAI = new GoogleGenerativeAI(API_KEY);

const { width } = Dimensions.get('window');

const CustomAlert = ({ visible, message, type, onClose }) => {
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, fadeAnim]);

  if (!visible) return null;

  const backgroundColor = type === 'success' ? '#4CAF50' : '#F44336';
  const icon = type === 'success' ? 'check-circle' : 'alert-circle';

  return (
    <Modal transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.alertOverlay}>
        <Animated.View style={[styles.alertContainer, { opacity: fadeAnim, backgroundColor }]}>
          <Icon name={icon} size={24} color="#FFFFFF" />
          <Text style={styles.alertText}>{message}</Text>
          <TouchableOpacity onPress={onClose}>
            <Icon name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const YouTubeTranscriptGenerator = () => {
  const [youtubeLink, setYoutubeLink] = useState('');
  const [transcript, setTranscript] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState({ visible: false, message: '', type: 'success' });

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    if (Platform.OS === 'android') {
      const result = await check(PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE);
      if (result !== RESULTS.GRANTED) {
        const requestResult = await request(PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE);
        if (requestResult !== RESULTS.GRANTED) {
          showAlert('error', 'Unable to save files without storage permission');
        }
      }
    }
  };

  const showAlert = (type, message) => {
    setAlert({ visible: true, type, message });
  };

  const hideAlert = () => {
    setAlert({ ...alert, visible: false });
  };

  const generateTranscript = useCallback(async () => {
    if (!youtubeLink) {
      showAlert('error', 'Please enter a YouTube link');
      return;
    }

    setIsLoading(true);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const prompt = `Generate a transcript with timestamps for the YouTube video with the following link: ${youtubeLink}. Please provide the transcript in a clear, readable format with timestamps for each section.`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const generatedTranscript = response.text();
      
      setTranscript(generatedTranscript);
      showAlert('success', 'Transcript generated successfully');
    } catch (error) {
      console.error('Error generating transcript:', error);
      showAlert('error', 'Unable to generate transcript. Please try again.');
    }
    setIsLoading(false);
  }, [youtubeLink]);

  const downloadTranscript = useCallback(async () => {
    const path = `${RNFS.DocumentDirectoryPath}/youtube_transcript_${Date.now()}.txt`;
    try {
      await RNFS.writeFile(path, transcript, 'utf8');
      showAlert('success', 'Transcript saved successfully');
    } catch (error) {
      console.error('Error downloading transcript:', error);
      showAlert('error', 'Unable to save transcript. Please check app permissions.');
    }
  }, [transcript]);

  const shareTranscript = useCallback(async () => {
    try {
      await Share.open({
        title: 'YouTube Transcript',
        message: transcript,
        type: 'text/plain',
      });
    } catch (error) {
      console.error('Error sharing transcript:', error);
      if (error.message !== 'User did not share') {
        showAlert('error', 'Unable to share transcript. Please try again.');
      }
    }
  }, [transcript]);

  const copyTranscript = useCallback(() => {
    Clipboard.setString(transcript);
    showAlert('success', 'Transcript copied to clipboard');
  }, [transcript]);

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <LinearGradient colors={['#FFF5E6', '#FFE0B2']} style={styles.container}>
        <Text style={styles.title}>YouTube Transcript Generator</Text>
        <View style={styles.inputContainer}>
          <Icon name="youtube" size={24} color="#FF0000" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Enter YouTube link"
            value={youtubeLink}
            onChangeText={setYoutubeLink}
            placeholderTextColor="#999"
          />
        </View>
        <TouchableOpacity
          onPress={generateTranscript}
          disabled={isLoading}
        >
          <LinearGradient
            colors={['#4A90E2', '#357ABD']}
            style={[styles.button, isLoading && styles.disabledButton]}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Icon name="text-to-speech" size={20} color="#FFF" />
                <Text style={styles.buttonText}>Generate Transcript</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
        {transcript !== '' && (
          <View style={styles.transcriptContainer}>
            <ScrollView style={styles.transcriptScroll}>
              <Text style={styles.transcriptText}>{transcript}</Text>
            </ScrollView>
          </View>
        )}
        {transcript !== '' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity onPress={downloadTranscript}>
              <LinearGradient colors={['#34C759', '#2EAF4D']} style={styles.actionButton}>
                <Icon name="download" size={20} color="#FFF" />
                <Text style={styles.buttonText}>Save</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity onPress={shareTranscript}>
              <LinearGradient colors={['#FF9500', '#E68600']} style={styles.actionButton}>
                <Icon name="share-variant" size={20} color="#FFF" />
                <Text style={styles.buttonText}>Share</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity onPress={copyTranscript}>
              <LinearGradient colors={['#5856D6', '#4F4CC7']} style={styles.actionButton}>
                <Icon name="content-copy" size={20} color="#FFF" />
                <Text style={styles.buttonText}>Copy</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>
      <CustomAlert
        visible={alert.visible}
        message={alert.message}
        type={alert.type}
        onClose={hideAlert}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#4A4A4A',
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 20,
    paddingHorizontal: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  button: {
    flexDirection: 'row',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 10,
  },
  transcriptContainer: {
    marginTop: 30,
    width: '100%',
    height: 300,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  transcriptScroll: {
    padding: 15,
  },
  transcriptText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 30,
    width: '100%',
  },
  actionButton: {
    flexDirection: 'row',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: width * 0.28,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  alertOverlay: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  alertContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginTop: 40,
    marginHorizontal: 20,
  },
  alertText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginHorizontal: 10,
    flex: 1,
  },
});

export default YouTubeTranscriptGenerator;