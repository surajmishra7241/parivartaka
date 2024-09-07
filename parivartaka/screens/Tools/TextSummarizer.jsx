import React, { useState, useCallback } from 'react';
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
  Modal,
  Animated,
  StatusBar,
} from 'react-native';
import { GoogleGenerativeAI } from '@google/generative-ai';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { GENAI_API_KEY,OPENAI_API_KEY, OPENAI_API_URL} from '@env';

const API_KEY = GENAI_API_KEY; // Replace with your actual Gemini API key
const genAI = new GoogleGenerativeAI(API_KEY);

const { width, height } = Dimensions.get('window');

const CustomAlert = ({ visible, message, type, onClose }) => {
  const [fadeAnim] = useState(new Animated.Value(0));

  React.useEffect(() => {
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

const TextSummarizer = ({ navigation }) => {
  const [inputText, setInputText] = useState('');
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState({ visible: false, message: '', type: 'success' });

  const showAlert = (type, message) => {
    setAlert({ visible: true, type, message });
  };

  const hideAlert = () => {
    setAlert({ ...alert, visible: false });
  };

  const generateSummary = useCallback(async () => {
    if (!inputText.trim()) {
      showAlert('error', 'Please enter some text to summarize');
      return;
    }

    setIsLoading(true);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const prompt = `Summarize the following text concisely:\n\n${inputText}`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const generatedSummary = response.text();
      
      setSummary(generatedSummary);
      showAlert('success', 'Summary generated successfully');
    } catch (error) {
      console.error('Error generating summary:', error);
      showAlert('error', 'Unable to generate summary. Please try again.');
    }
    setIsLoading(false);
  }, [inputText]);

  const downloadSummary = useCallback(async () => {
    const path = `${RNFS.DocumentDirectoryPath}/summary_${Date.now()}.txt`;
    try {
      await RNFS.writeFile(path, summary, 'utf8');
      showAlert('success', 'Summary saved successfully');
    } catch (error) {
      console.error('Error downloading summary:', error);
      showAlert('error', 'Unable to save summary. Please check app permissions.');
    }
  }, [summary]);

  const shareSummary = useCallback(async () => {
    try {
      await Share.open({
        title: 'Text Summary',
        message: summary,
        type: 'text/plain',
      });
    } catch (error) {
      console.error('Error sharing summary:', error);
      if (error.message !== 'User did not share') {
        showAlert('error', 'Unable to share summary. Please try again.');
      }
    }
  }, [summary]);

  const copySummary = useCallback(() => {
    Clipboard.setString(summary);
    showAlert('success', 'Summary copied to clipboard');
  }, [summary]);

  return (
    <>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <LinearGradient colors={['#F0E6FF', '#E6F0FF']} style={styles.container}>
          {/* <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color="#4A4A4A" />
          </TouchableOpacity> */}
          <Text style={styles.title}>Text Summarizer</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter text to summarize"
              value={inputText}
              onChangeText={setInputText}
              multiline
              numberOfLines={6}
              placeholderTextColor="#999"
            />
          </View>
          <TouchableOpacity
            onPress={generateSummary}
            disabled={isLoading}
          >
            <LinearGradient
              colors={['#6A5ACD', '#483D8B']}
              style={[styles.button, isLoading && styles.disabledButton]}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Icon name="auto-fix" size={20} color="#FFF" />
                  <Text style={styles.buttonText}>Generate Summary</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
          {summary !== '' && (
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryTitle}>Summary:</Text>
              <ScrollView style={styles.summaryScroll}>
                <Text style={styles.summaryText}>{summary}</Text>
              </ScrollView>
            </View>
          )}
          {summary !== '' && (
            <View style={styles.actionButtons}>
              <TouchableOpacity onPress={downloadSummary}>
                <LinearGradient colors={['#34C759', '#2EAF4D']} style={styles.actionButton}>
                  <Icon name="download" size={20} color="#FFF" />
                  <Text style={styles.buttonText}>Save</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity onPress={shareSummary}>
                <LinearGradient colors={['#FF9500', '#E68600']} style={styles.actionButton}>
                  <Icon name="share-variant" size={20} color="#FFF" />
                  <Text style={styles.buttonText}>Share</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity onPress={copySummary}>
                <LinearGradient colors={['#5856D6', '#4F4CC7']} style={styles.actionButton}>
                  <Icon name="content-copy" size={20} color="#FFF" />
                  <Text style={styles.buttonText}>Copy</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </LinearGradient>
      </ScrollView>
      <CustomAlert
        visible={alert.visible}
        message={alert.message}
        type={alert.type}
        onClose={hideAlert}
      />
    </>
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
    minHeight: height,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 60,
    marginBottom: 30,
    color: '#4A4A4A',
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  input: {
    minHeight: 120,
    fontSize: 16,
    color: '#333',
    textAlignVertical: 'top',
    padding: 15,
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
  summaryContainer: {
    marginTop: 30,
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    padding: 15,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#4A4A4A',
  },
  summaryScroll: {
    maxHeight: 200,
  },
  summaryText: {
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

export default TextSummarizer;