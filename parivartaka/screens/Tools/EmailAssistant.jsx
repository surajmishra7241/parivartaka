// App.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Clipboard,StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Icon from 'react-native-vector-icons/MaterialIcons';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import { GENAI_API_KEY,OPENAI_API_KEY, OPENAI_API_URL} from '@env';
const genAI = new GoogleGenerativeAI(GENAI_API_KEY);

const EmailAssistant = () => {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const generateEmail = async () => {
    setLoading(true);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent(`Generate an email about: ${input}`);
      setResponse(result.response.text());
    } catch (error) {
      console.error('Error generating email:', error);
      setResponse('An error occurred while generating the email.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    Clipboard.setString(response);
  };

  const shareEmail = async () => {
    try {
      await Share.open({
        message: response,
        title: 'Generated Email',
      });
    } catch (error) {
      console.error('Error sharing email:', error);
    }
  };

  const downloadEmail = async () => {
    try {
      const path = `${RNFS.DocumentDirectoryPath}/generated_email_${Date.now()}.txt`;
      await RNFS.writeFile(path, response, 'utf8');
      console.log('Email saved to:', path);
    } catch (error) {
      console.error('Error downloading email:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Icon name="email" size={40} color="#4A90E2" />
        <Text style={styles.title}>Email Assistant</Text>
      </View>
      <View style={styles.card}>
        <TextInput
          style={styles.input}
          placeholder="Enter email topic..."
          value={input}
          onChangeText={setInput}
        />
        <TouchableOpacity style={styles.button} onPress={generateEmail} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Generate Email</Text>
          )}
        </TouchableOpacity>
      </View>
      {response ? (
        <View style={styles.responseCard}>
          <Text style={styles.responseTitle}>Generated Email:</Text>
          <Text style={styles.responseText}>{response}</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.iconButton} onPress={copyToClipboard}>
              <Icon name="content-copy" size={24} color="#4A90E2" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={shareEmail}>
              <Icon name="share" size={24} color="#4CAF50" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={downloadEmail}>
              <Icon name="file-download" size={24} color="#FF9800" />
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F8FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#333',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  input: {
    height: 50,
    borderColor: '#E0E0E0',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#4A90E2',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  responseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  responseTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  responseText: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 15,
  },
  iconButton: {
    padding: 10,
    marginLeft: 10,
  },
});

export default EmailAssistant;