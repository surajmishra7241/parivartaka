import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, StyleSheet, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import axios from 'axios';
import { GENAI_API_KEY,OPENAI_API_KEY, OPENAI_API_URL} from '@env';
// Simulate Generative AI background selection
const simulateGenerativeAIImage = (type) => {
  switch (type) {
    case 'cartoon':
      return 'https://picsum.photos/seed/picsum/200/300'; // Replace with actual URLs
    case 'marvel':
      return 'https://picsum.photos/seed/picsum/200/100';
    case 'wallpaper':
      return 'https://picsum.photos/seed/picsum/200/200';
    default:
      return null;
  }
};

const QRGenerator = () => {
  const [qrData, setQrData] = useState(''); // Store user input (URL, etc.)
  const [qrCode, setQrCode] = useState(''); // Store the generated QR code URL
  const [selectedBackground, setSelectedBackground] = useState(null); // Selected background image

  // Generate QR Code using qrserver.com API
  const generateQRCode = async () => {
    if (qrData) {
      const response = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${qrData}`;
      setQrCode(response); // Set the generated QR code
    }
  };

  // Add colorful background (simulated)
  const addBackgroundToQRCode = (type) => {
    const bgImage = simulateGenerativeAIImage(type);
    setSelectedBackground(bgImage);
  };

  // Download QR Code Image
  const downloadQRCode = async () => {
    if (!qrCode) {
      Alert.alert('No QR Code', 'Please generate a QR code first');
      return;
    }

    try {
      const fileName = `QRCode_${new Date().toISOString().replace(/[:.]/g, '_')}.png`;
      const path = `${RNFS.DocumentDirectoryPath}/${fileName}`;
      
      const response = await axios.get(qrCode, { responseType: 'arraybuffer' });
      await RNFS.writeFile(path, response.data, 'base64');
      
      Alert.alert('Success', `QR Code saved to ${path}`);

      const shareOptions = {
        title: 'Share QR Code',
        message: 'Here is your QR code',
        url: `file://${path}`,
        type: 'image/png',
      };

      await Share.open(shareOptions);
    } catch (error) {
      console.error('Error downloading/sharing QR Code:', error);
      Alert.alert('Error', 'Failed to download or share QR Code. Please try again.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create a QR Code</Text>

      {/* Input Section for QR data */}
      <View style={styles.inputSection}>
        <TextInput
          placeholder="Enter URL, Phone, Email, etc."
          placeholderTextColor="#aaa"
          style={styles.input}
          onChangeText={(text) => setQrData(text)}
          value={qrData}
        />
        <TouchableOpacity style={styles.generateButton} onPress={generateQRCode}>
          <Text style={styles.generateButtonText}>Get your QR Code</Text>
        </TouchableOpacity>
      </View>

      {/* Display the QR code and background */}
      <View style={styles.qrContainer}>
        {selectedBackground && (
          <Image source={{ uri: selectedBackground }} style={styles.backgroundImage} />
        )}
        {qrCode ? (
          <Image source={{ uri: qrCode }} style={styles.qrImage} />
        ) : (
          <Text style={styles.qrPlaceholder}>Your QR Code will appear here</Text>
        )}
      </View>

      {/* Colorful Background Selection */}
      <View style={styles.cartoonSection}>
        <Text style={styles.cartoonTitle}>Add Colorful Backgrounds</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity style={styles.cartoonItem} onPress={() => addBackgroundToQRCode('cartoon')}>
            <Image source={{ uri: 'https://picsum.photos/seed/picsum/200/300' }} style={styles.cartoonImage} />
            <Text style={styles.cartoonText}>Cartoon</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cartoonItem} onPress={() => addBackgroundToQRCode('marvel')}>
            <Image source={{ uri: 'https://picsum.photos/seed/picsum/200/100' }} style={styles.cartoonImage} />
            <Text style={styles.cartoonText}>Marvel</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cartoonItem} onPress={() => addBackgroundToQRCode('wallpaper')}>
            <Image source={{ uri: 'https://picsum.photos/seed/picsum/200/200' }} style={styles.cartoonImage} />
            <Text style={styles.cartoonText}>Wallpaper</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Download and Share Button */}
      <TouchableOpacity style={styles.shareButton} onPress={downloadQRCode}>
        <Text style={styles.shareButtonText}>Download & Share QR Code</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  title: {
    fontSize: 24,
    color: '#fff',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  inputSection: {
    width: '100%',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#333',
    color: '#fff',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  generateButton: {
    backgroundColor: '#007bff',
    borderRadius: 5,
    padding: 10,
    alignItems: 'center',
  },
  generateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  qrContainer: {
    marginTop: 20,
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  qrImage: {
    width: 150,
    height: 150,
    position: 'absolute',
  },
  qrPlaceholder: {
    color: '#ccc',
    marginTop: 20,
  },
  backgroundImage: {
    width: 150,
    height: 150,
    position: 'absolute',
    zIndex: -1,
    borderRadius: 10,
  },
  cartoonSection: {
    marginTop: 30,
    width: '100%',
  },
  cartoonTitle: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 10,
  },
  cartoonItem: {
    alignItems: 'center',
    marginRight: 10,
  },
  cartoonImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  cartoonText: {
    color: '#fff',
    marginTop: 5,
  },
  shareButton: {
    backgroundColor: '#28a745',
    borderRadius: 5,
    padding: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  shareButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default QRGenerator;
