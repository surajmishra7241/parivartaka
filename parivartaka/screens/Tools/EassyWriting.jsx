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
  PermissionsAndroid
} from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { GoogleGenerativeAI } from '@google/generative-ai';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI('AIzaSyA1jkVXDoTzbVn6cJHDNHGXeI55MtbNufw');

const EassyWriting = () => {
  const [topic, setTopic] = useState('');
  const [essayContent, setEssayContent] = useState('');
  const [wordCount, setWordCount] = useState(100);
  const [educationLevel, setEducationLevel] = useState('high_school');
  const [isLoading, setIsLoading] = useState(false);

  const wordCountOptions = [
    { label: '100 words', value: 100 },
    { label: '200 words', value: 200 },
    { label: '300 words', value: 300 },
    { label: '400 words', value: 400 },
    { label: '500 words', value: 500 },
  ];

  const educationLevelOptions = [
    { label: 'High School', value: 'high_school' },
    { label: 'College', value: 'college' },
    { label: 'Graduate', value: 'graduate' },
  ];

  const generateEssay = async () => {
    if (!topic.trim()) {
      showToast('Please enter an essay topic');
      return;
    }
    setIsLoading(true);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const prompt = `Write a ${wordCount}-word essay on the topic "${topic}" for ${educationLevel} level. The essay should be well-structured, informative, and engaging.`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      if (!text.trim()) {
        throw new Error('No content generated');
      }
      setEssayContent(text);
    } catch (error) {
      console.error('Error generating essay:', error);
      if (error.message.includes('No content generated')) {
        setEssayContent('Unable to generate an essay on this topic. Please try a different topic or rephrase your request.');
      } else {
        setEssayContent('An error occurred while generating the essay. Please check your internet connection and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const copyEssay = () => {
    if (!essayContent.trim()) {
      showToast('No essay content to copy');
      return;
    }
    Clipboard.setString(essayContent);
    showToast('Essay copied to clipboard');
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

  const downloadEssay = async () => {
    if (!essayContent.trim()) {
      showToast('No essay to download');
      return;
    }

    const hasPermission = await requestStoragePermission();
    if (!hasPermission) {
      showToast('Storage permission is required to download the essay');
      return;
    }

    try {
      const fileName = `Essay_${new Date().toISOString().replace(/[:.]/g, '_')}.txt`;
      const path = `${RNFS.DocumentDirectoryPath}/${fileName}`;

      await RNFS.writeFile(path, essayContent, 'utf8');

      const shareOptions = {
        title: 'Download Essay',
        message: 'Here is your essay',
        url: `file://${path}`,
        type: 'text/plain',
      };

      const shareResult = await Share.open(shareOptions);
      
      if (shareResult.success) {
        showToast('Essay shared successfully');
      } else {
        // The share dialog was dismissed without error
        showToast('Essay download cancelled');
      }
    } catch (error) {
      console.error('Error downloading/sharing essay:', error);
      if (error.message.includes('User did not share')) {
        showToast('Essay download cancelled');
      } else {
        showToast('Failed to download essay. Please try again.');
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>AI Essay Writer</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Essay Topic</Text>
          <TextInput
            style={styles.input}
            value={topic}
            onChangeText={setTopic}
            placeholder="Enter essay topic"
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
            />
          </View>

          <View style={styles.dropdownWrapper}>
            <Text style={styles.label}>Education Level</Text>
            <Dropdown
              style={styles.dropdown}
              data={educationLevelOptions}
              maxHeight={300}
              labelField="label"
              valueField="value"
              placeholder="Select education level"
              value={educationLevel}
              onChange={item => setEducationLevel(item.value)}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.generateButton} onPress={generateEssay} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.buttonText}>Generate Essay</Text>
              <Icon name="pencil" size={24} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>

        <View style={styles.outputContainer}>
          <View style={styles.outputHeader}>
            <Text style={styles.label}>Generated Essay</Text>
            <TouchableOpacity onPress={copyEssay} style={styles.copyButton}>
              <Icon name="content-copy" size={24} color="#3498DB" />
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.essayOutput}
            value={essayContent}
            onChangeText={setEssayContent}
            multiline
            numberOfLines={10}
            editable
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity style={styles.downloadButton} onPress={downloadEssay}>
          <Text style={styles.buttonText}>Download Essay</Text>
          <Icon name="download" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34495E',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#BDC3C7',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BDC3C7',
  },
  generateButton: {
    backgroundColor: '#3498DB',
    borderRadius: 8,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 10,
  },
  outputContainer: {
    marginBottom: 20,
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
  essayOutput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#BDC3C7',
    minHeight: 200,
    textAlignVertical: 'top',
  },
  downloadButton: {
    backgroundColor: '#2ECC71',
    borderRadius: 8,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default EassyWriting;