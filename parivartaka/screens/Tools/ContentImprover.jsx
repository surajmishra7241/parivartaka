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
import { GENAI_API_KEY,OPENAI_API_KEY, OPENAI_API_URL} from '@env';

const { width } = Dimensions.get('window');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(GENAI_API_KEY);

const ContentImprover = () => {
  const [originalContent, setOriginalContent] = useState('');
  const [improvedContent, setImprovedContent] = useState('');
  const [toneOfVoice, setToneOfVoice] = useState('neutral');
  const [isLoading, setIsLoading] = useState(false);

  const toneOfVoiceOptions = [
    { label: 'Neutral', value: 'neutral' },
    { label: 'Professional', value: 'professional' },
    { label: 'Casual', value: 'casual' },
    { label: 'Enthusiastic', value: 'enthusiastic' },
    { label: 'Humorous', value: 'humorous' },
  ];

  const improveContent = async () => {
    if (!originalContent.trim()) {
      showToast('Please enter some content to improve');
      return;
    }
    setIsLoading(true);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const prompt = `Improve the following content, maintaining its original meaning but enhancing its clarity, flow, and impact. Use a ${toneOfVoice} tone of voice:\n\n${originalContent}`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      if (!text.trim()) {
        throw new Error('No content generated');
      }
      setImprovedContent(text);
    } catch (error) {
      console.error('Error improving content:', error);
      setImprovedContent('An error occurred while improving the content. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyContent = () => {
    if (!improvedContent.trim()) {
      showToast('No improved content to copy');
      return;
    }
    Clipboard.setString(improvedContent);
    showToast('Improved content copied to clipboard');
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

  const downloadContent = async () => {
    if (!improvedContent.trim()) {
      showToast('No improved content to download');
      return;
    }

    const hasPermission = await requestStoragePermission();
    if (!hasPermission) {
      showToast('Storage permission is required to download the content');
      return;
    }

    try {
      const fileName = `ImprovedContent_${new Date().toISOString().replace(/[:.]/g, '_')}.txt`;
      const path = `${RNFS.DocumentDirectoryPath}/${fileName}`;

      await RNFS.writeFile(path, improvedContent, 'utf8');

      const shareOptions = {
        title: 'Download Improved Content',
        message: 'Here is your improved content',
        url: `file://${path}`,
        type: 'text/plain',
      };

      const shareResult = await Share.open(shareOptions);
      
      if (shareResult.success) {
        showToast('Content shared successfully');
      } else {
        showToast('Content download cancelled');
      }
    } catch (error) {
      console.error('Error downloading/sharing content:', error);
      showToast('Failed to download content. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#4a00e0', '#8e2de2']}
        style={styles.gradient}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>AI Content Improver</Text>
          
          <View style={styles.card}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Original Content</Text>
              <TextInput
                style={styles.textarea}
                value={originalContent}
                onChangeText={setOriginalContent}
                placeholder="Enter your content here..."
                placeholderTextColor="#A0AEC0"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.dropdownContainer}>
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

            <TouchableOpacity style={styles.improveButton} onPress={improveContent} disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.buttonText}>Improve Content</Text>
                  <Icon name="auto-fix" size={24} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <View style={styles.outputHeader}>
              <Text style={styles.label}>Improved Content</Text>
              <TouchableOpacity onPress={copyContent} style={styles.copyButton}>
                <Icon name="content-copy" size={24} color="#4a00e0" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.textarea}
              value={improvedContent}
              onChangeText={setImprovedContent}
              multiline
              numberOfLines={8}
              editable
              textAlignVertical="top"
              placeholder="Your improved content will appear here..."
              placeholderTextColor="#A0AEC0"
            />
          </View>

          <TouchableOpacity style={styles.downloadButton} onPress={downloadContent}>
            <Text style={styles.buttonText}>Download Improved Content</Text>
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
    backgroundColor: '#4a00e0',
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4A5568',
    marginBottom: 10,
  },
  textarea: {
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#2D3748',
    minHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dropdownContainer: {
    marginBottom: 20,
  },
  dropdown: {
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dropdownPlaceholder: {
    color: '#A0AEC0',
  },
  dropdownSelectedText: {
    color: '#2D3748',
  },
  improveButton: {
    backgroundColor: '#4a00e0',
    borderRadius: 12,
    padding: 16,
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
    marginBottom: 10,
  },
  copyButton: {
    padding: 5,
  },
  downloadButton: {
    backgroundColor: '#8e2de2',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
});

export default ContentImprover;