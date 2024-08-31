import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Text, TouchableOpacity } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Buffer } from 'buffer';

const Base64Converter = () => {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');

  const handleEncode = () => {
    try {
      const encodedText = Buffer.from(inputText).toString('base64');
      setOutputText(encodedText);
    } catch (error) {
      setOutputText('Error encoding text');
    }
  };

  const handleDecode = () => {
    try {
      const decodedText = Buffer.from(inputText, 'base64').toString('utf-8');
      setOutputText(decodedText);
    } catch (error) {
      setOutputText('Error decoding text');
    }
  };

  const handleCopyToClipboard = () => {
    Clipboard.setString(outputText);
    alert('Copied to clipboard');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Base64 Converter</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter text here"
        value={inputText}
        onChangeText={setInputText}
      />
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleEncode}>
          <Text style={styles.buttonText}>Encode</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleDecode}>
          <Text style={styles.buttonText}>Decode</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.outputContainer}>
        <Text style={styles.outputText}>{outputText}</Text>
        {outputText !== '' && (
          <TouchableOpacity onPress={handleCopyToClipboard}>
            <Icon name="copy" size={24} color="#4CAF50" style={styles.copyIcon} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 60,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  outputContainer: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  outputText: {
    flex: 1,
    fontSize: 16,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    borderColor: '#ddd',
    borderWidth: 1,
  },
  copyIcon: {
    marginLeft: 10,
  },
});

export default Base64Converter;
