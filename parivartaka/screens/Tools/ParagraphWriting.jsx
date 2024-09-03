// App.js
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Clipboard,
  ToastAndroid,
  Platform,
  Alert,
  PermissionsAndroid,
  StatusBar,
  Dimensions
} from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { GoogleGenerativeAI } from '@google/generative-ai';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI('AIzaSyA1jkVXDoTzbVn6cJHDNHGXeI55MtbNufw');

const ParagraphWriting = () => {
  const [topic, setTopic] = useState('');
  const [paragraphContent, setParagraphContent] = useState('');
  const [wordCount, setWordCount] = useState(50);
  const [toneOfVoice, setToneOfVoice] = useState('neutral');
  const [isLoading, setIsLoading] = useState(false);

  const wordCountOptions = [
    { label: '50 words', value: 50 },
    { label: '100 words', value: 100 },
    { label: '150 words', value: 150 },
    { label: '200 words', value: 200 },
  ];

  const toneOfVoiceOptions = [
    { label: 'Neutral', value: 'neutral' },
    { label: 'Professional', value: 'professional' },
    { label: 'Casual', value: 'casual' },
    { label: 'Enthusiastic', value: 'enthusiastic' },
    { label: 'Humorous', value: 'humorous' },
  ];

  const generateParagraph = async () => {
    if (!topic.trim()) {
      showToast('Please enter a paragraph topic');
      return;
    }
    setIsLoading(true);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const prompt = `Write a ${wordCount}-word paragraph on the topic "${topic}" with a ${toneOfVoice} tone of voice. The paragraph should be well-structured and engaging.`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      if (!text.trim()) {
        throw new Error('No content generated');
      }
      setParagraphContent(text);
    } catch (error) {
      console.error('Error generating paragraph:', error);
      if (error.message.includes('No content generated')) {
        setParagraphContent('Unable to generate a paragraph on this topic. Please try a different topic or rephrase your request.');
      } else {
        setParagraphContent('An error occurred while generating the paragraph. Please check your internet connection and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const copyParagraph = () => {
    if (!paragraphContent.trim()) {
      showToast('No paragraph content to copy');
      return;
    }
    Clipboard.setString(paragraphContent);
    showToast('Paragraph copied to clipboard');
  };

  const showToast = (message) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert('', message);
    }
  };

  const requestStoragePermission = async () => {
    if (Platform.OS !== 'android') return true;
    
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.error('Failed to request storage permission:', err);
      return false;
    }
  };

  const downloadParagraph = async () => {
    if (!paragraphContent.trim()) {
      showToast('No paragraph to download');
      return;
    }

    const hasPermission = await requestStoragePermission();
    if (!hasPermission) {
      showToast('Storage permission is required to download the paragraph');
      return;
    }

    try {
      const fileName = `Paragraph_${new Date().toISOString().replace(/[:.]/g, '_')}.txt`;
      const path = `${RNFS.DocumentDirectoryPath}/${fileName}`;

      await RNFS.writeFile(path, paragraphContent, 'utf8');

      const shareOptions = {
        title: 'Download Paragraph',
        message: 'Here is your paragraph',
        url: `file://${path}`,
        type: 'text/plain',
      };

      const shareResult = await Share.open(shareOptions);
      
      if (shareResult.success) {
        showToast('Paragraph shared successfully');
      } else {
        showToast('Paragraph download cancelled');
      }
    } catch (error) {
      console.error('Error downloading/sharing paragraph:', error);
      if (error.message.includes('User did not share')) {
        showToast('Paragraph download cancelled');
      } else {
        showToast('Failed to download paragraph. Please try again.');
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#6a11cb', '#2575fc']}
        style={styles.gradient}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>AI Paragraph Writer</Text>
          
          <View style={styles.card}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Paragraph Topic</Text>
              <TextInput
                style={styles.input}
                value={topic}
                onChangeText={setTopic}
                placeholder="Enter paragraph topic"
                placeholderTextColor="#A0AEC0"
              />
            </View>

            <View style={styles.dropdownContainer}>
              <View style={styles.dropdownWrapper}>
                <Text style={styles.label}>Word Count</Text>
                <Dropdown
                  style={styles.dropdown}
                  data={wordCountOptions}
                  maxHeight={300}
                  labelField="label"
                  valueField="value"
                  placeholder="Select word count"
                  value={wordCount}
                  onChange={item => setWordCount(item.value)}
                  placeholderStyle={styles.dropdownPlaceholder}
                  selectedTextStyle={styles.dropdownSelectedText}
                />
              </View>

              <View style={styles.dropdownWrapper}>
                <Text style={styles.label}>Tone of Voice</Text>
                <Dropdown
                  style={styles.dropdown}
                  data={toneOfVoiceOptions}
                  maxHeight={300}
                  labelField="label"
                  valueField="value"
                  placeholder="Select tone"
                  value={toneOfVoice}
                  onChange={item => setToneOfVoice(item.value)}
                  placeholderStyle={styles.dropdownPlaceholder}
                  selectedTextStyle={styles.dropdownSelectedText}
                />
              </View>
            </View>

            <TouchableOpacity style={styles.generateButton} onPress={generateParagraph} disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.buttonText}>Generate Paragraph</Text>
                  <Icon name="pencil" size={24} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <View style={styles.outputHeader}>
              <Text style={styles.label}>Generated Paragraph</Text>
              <TouchableOpacity onPress={copyParagraph} style={styles.copyButton}>
                <Icon name="content-copy" size={24} color="#6a11cb" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.paragraphOutput}
              value={paragraphContent}
              onChangeText={setParagraphContent}
              multiline
              numberOfLines={8}
              editable
              textAlignVertical="top"
              placeholder="Your generated paragraph will appear here..."
              placeholderTextColor="#A0AEC0"
            />
          </View>

          <TouchableOpacity style={styles.downloadButton} onPress={downloadParagraph}>
            <Text style={styles.buttonText}>Download Paragraph</Text>
            <Icon name="download" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#6a11cb',
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A5568',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#EDF2F7',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#2D3748',
  },
  dropdownContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dropdownWrapper: {
    flex: 1,
    marginRight: 10,
  },
  dropdown: {
    backgroundColor: '#EDF2F7',
    borderRadius: 8,
    padding: 12,
  },
  dropdownPlaceholder: {
    color: '#A0AEC0',
  },
  dropdownSelectedText: {
    color: '#2D3748',
  },
  generateButton: {
    backgroundColor: '#6a11cb',
    borderRadius: 8,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 10,
  },
  outputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  copyButton: {
    padding: 5,
  },
  paragraphOutput: {
    backgroundColor: '#EDF2F7',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#2D3748',
    minHeight: 150,
    textAlignVertical: 'top',
  },
  downloadButton: {
    backgroundColor: '#2575fc',
    borderRadius: 8,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
});

export default ParagraphWriting;