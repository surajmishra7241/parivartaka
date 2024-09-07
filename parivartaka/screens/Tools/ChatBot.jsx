import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  Dimensions,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { GoogleGenerativeAI } from '@google/generative-ai';
import LinearGradient from 'react-native-linear-gradient';
import { GENAI_API_KEY,OPENAI_API_KEY, OPENAI_API_URL} from '@env';
const { width, height } = Dimensions.get('window');
const genAI = new GoogleGenerativeAI(GENAI_API_KEY);

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [botGender, setBotGender] = useState('');
  const [botRole, setBotRole] = useState('');
  const [botName, setBotName] = useState('');
  const [userName, setUserName] = useState('');
  const [botActive, setBotActive] = useState(true);
  const [stage, setStage] = useState('gender');
  const [modalVisible, setModalVisible] = useState(false);
  const [language, setLanguage] = useState('english');

  const flatListRef = useRef(null);

  const maleRoles = ['friend', 'husband', 'boyfriend', 'brother', 'father', 'teacher'];
  const femaleRoles = ['friend', 'wife', 'girlfriend', 'sister', 'mother', 'teacher'];

  useEffect(() => {
    loadChatHistory();
  }, []);

  const loadChatHistory = async () => {
    try {
      const storedMessages = await AsyncStorage.getItem('chatHistory');
      if (storedMessages) {
        setMessages(JSON.parse(storedMessages));
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const saveChatHistory = async (newMessages) => {
    try {
      await AsyncStorage.setItem('chatHistory', JSON.stringify(newMessages));
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  };

  const handleGenderSelection = (gender) => {
    setBotGender(gender);
    setStage('role');
  };

  const handleRoleSelection = (role) => {
    setBotRole(role);
    setStage('botName');
    addBotMessage("Great! What would you like to call me?");
  };

  const handleBotNameInput = () => {
    if (inputText.trim() === '') return;
    setBotName(inputText);
    setStage('userName');
    addBotMessage(`Nice to meet you! I'm ${inputText}. What's your name?`);
    setInputText('');
  };

  const handleUserNameInput = () => {
    if (inputText.trim() === '') return;
    setUserName(inputText);
    setStage('chat');
    addBotMessage(`It's great to meet you, ${inputText}! How can I help you today?`);
    setInputText('');
  };

  const handleSend = async () => {
    if (inputText.trim() === '') return;

    const newMessages = [
      ...messages,
      { id: Date.now().toString(), text: inputText, sender: 'user', status: 'sent' },
    ];
    setMessages(newMessages);
    setInputText('');
    saveChatHistory(newMessages);

    if (stage === 'botName') {
      handleBotNameInput();
    } else if (stage === 'userName') {
      handleUserNameInput();
    } else if (stage === 'chat') {
      await generateBotResponse(inputText, newMessages);
    }
  };

  const addBotMessage = (text) => {
    const newMessage = { id: Date.now().toString(), text, sender: 'bot', status: 'sent' };
    setMessages(prevMessages => {
      const updatedMessages = [...prevMessages, newMessage];
      saveChatHistory(updatedMessages);
      return updatedMessages;
    });
  };

  const detectLanguage = (text) => {
    const hindiPattern = /[\u0900-\u097F]/;
    return hindiPattern.test(text) ? 'hindi' : 'english';
  };

  const generateBotResponse = async (userInput, currentMessages) => {
    setBotActive(true);
    try {
      const detectedLanguage = detectLanguage(userInput);
      setLanguage(detectedLanguage);

      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const prompt = `You are ${botName}, a ${botGender} ${botRole}. You're talking to ${userName}. Respond to the following message in ${detectedLanguage}, as a ${botRole} would speak. Be empathetic, use appropriate terms of endearment, and maintain the personality of a ${botRole}. If asked about your personal life or experiences, create realistic and consistent responses. Avoid any content that might be considered unsafe or inappropriate. Message: "${userInput}"`;
      
      const result = await model.generateContent(prompt);
      const botResponse = result.response.text();
      
      const newMessage = { id: Date.now().toString(), text: botResponse, sender: 'bot', status: 'sent' };
      const updatedMessages = [...currentMessages, newMessage];
      setMessages(updatedMessages);
      saveChatHistory(updatedMessages);
    } catch (error) {
      console.error('Error generating bot response:', error);
      
      // Default message based on the detected language
      const defaultMessage = language === 'hindi' 
        ? "मुझे माफ़ करें, मैं आपकी बात समझ नहीं पाया। क्या आप दूसरे शब्दों में अपनी बात रख सकते हैं?"
        : "I'm sorry, I didn't understand that. Could you please rephrase your message?";
      
      const newMessage = { id: Date.now().toString(), text: defaultMessage, sender: 'bot', status: 'sent' };
      const updatedMessages = [...currentMessages, newMessage];
      setMessages(updatedMessages);
      saveChatHistory(updatedMessages);
    } finally {
      setBotActive(false);
    }
  };

  const renderMessage = ({ item, index }) => (
    <View style={[
      styles.messageBubble,
      item.sender === 'user' ? styles.userBubble : styles.botBubble,
      index === 0 && styles.firstMessage,
      index === messages.length - 1 && styles.lastMessage,
    ]}>
      {item.sender === 'bot' && (
        <View style={styles.botAvatarContainer}>
          <Icon name="robot" size={24} color="#4A4A4A" />
        </View>
      )}
      <View style={styles.messageContent}>
        <Text style={[
          styles.messageText,
          item.sender === 'user' ? styles.userMessageText : styles.botMessageText
        ]}>{item.text}</Text>
        {item.sender === 'user' && (
          <Icon
            name={item.status === 'read' ? 'check-all' : 'check'}
            size={16}
            color="#7986CB"
            style={styles.statusIcon}
          />
        )}
      </View>
    </View>
  );

  const renderSelectionButton = (text, onPress) => (
    <TouchableOpacity key={text} style={styles.selectionButton} onPress={onPress}>
      <Text style={styles.buttonText}>{text}</Text>
    </TouchableOpacity>
  );

  const deleteConversation = async () => {
    try {
      await AsyncStorage.removeItem('chatHistory');
      setMessages([]);
      setStage('gender');
      setBotGender('');
      setBotRole('');
      setBotName('');
      setUserName('');
      setModalVisible(false);
    } catch (error) {
      console.error('Error deleting conversation:', error);
      Alert.alert('Error', 'Failed to delete the conversation. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5E6D3" />
      <View style={styles.container}>
        <LinearGradient colors={['#F5E6D3', '#E6D0B3']} style={styles.header}>
          <Text style={styles.headerText}>Chat with {botName || 'Bot'}</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.iconButton}>
              <Icon name="delete-outline" size={24} color="#4A4A4A" />
            </TouchableOpacity>
            <View style={styles.botStatusContainer}>
              <Icon name={botActive ? 'circle' : 'circle-outline'} size={12} color={botActive ? '#4CAF50' : '#9E9E9E'} />
              <Text style={styles.botStatusText}>{botActive ? 'Active' : 'Idle'}</Text>
            </View>
          </View>
        </LinearGradient>
        
        {stage === 'gender' && (
          <View style={styles.selectionContainer}>
            <Text style={styles.selectionTitle}>Choose Bot Gender:</Text>
            <View style={styles.buttonContainer}>
              {renderSelectionButton('Male', () => handleGenderSelection('male'))}
              {renderSelectionButton('Female', () => handleGenderSelection('female'))}
            </View>
          </View>
        )}

        {stage === 'role' && (
          <View style={styles.selectionContainer}>
            <Text style={styles.selectionTitle}>Choose Bot Role:</Text>
            <View style={styles.buttonContainer}>
              {(botGender === 'male' ? maleRoles : femaleRoles).map((role) => (
                renderSelectionButton(role, () => handleRoleSelection(role))
              ))}
            </View>
          </View>
        )}

        {(stage !== 'gender' && stage !== 'role') && (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() => flatListRef.current.scrollToEnd({ animated: true })}
          />
        )}
        
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
          style={styles.inputContainer}
        >
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder={
              stage === 'botName' ? "Enter bot's name" :
              stage === 'userName' ? "Enter your name" :
              "Type a message..."
            }
            placeholderTextColor="#9E9E9E"
          />
          <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
            <Icon name="send" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </KeyboardAvoidingView>

        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(!modalVisible)}
        >
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <Text style={styles.modalText}>Are you sure you want to delete this conversation?</Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.buttonCancel]}
                  onPress={() => setModalVisible(!modalVisible)}
                >
                  <Text style={styles.textStyle}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.buttonDelete]}
                  onPress={deleteConversation}
                >
                  <Text style={styles.textStyle}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5E6D3',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFF9F0',
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E6D0B3',
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4A4A4A',
    fontFamily: 'Roboto-Bold',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginRight: 16,
    padding: 8,
  },
  botStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  botStatusText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#4A4A4A',
    fontFamily: 'Roboto-Regular',
  },
  selectionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFF9F0',
  },
  selectionTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#4A4A4A',
    marginBottom: 24,
    fontFamily: 'Roboto-Bold',
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  selectionButton: {
    backgroundColor: '#E6D0B3',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 25,
    margin: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonText: {
    color: '#4A4A4A',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Roboto-Medium',
  },
  messageList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    marginVertical: 4,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  userBubble: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  botBubble: {
    alignSelf: 'flex-start',
  },
  firstMessage: {
    marginTop: 20,
  },
  lastMessage: {
    marginBottom: 20,
  },
  botAvatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E6D0B3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  messageContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    fontFamily: 'Roboto-Regular',
  },
  userMessageText: {
    color: '#4A4A4A',
  },
  botMessageText: {
    color: '#4A4A4A',
  },
  statusIcon: {
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#F5E6D3',
    borderTopWidth: 1,
    borderTopColor: '#E6D0B3',
  },
  input: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 10,
    fontSize: 16,
    color: '#4A4A4A',
    fontFamily: 'Roboto-Regular',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sendButton: {
    marginLeft: 12,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4A4A4A',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  modalText: {
    marginBottom: 20,
    textAlign: "center",
    color: "#4A4A4A",
    fontSize: 18,
    fontFamily: 'Roboto-Medium',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  button: {
    borderRadius: 20,
    padding: 12,
    elevation: 2,
    minWidth: 100,
  },
  buttonCancel: {
    backgroundColor: "#E0E0E0",
  },
  buttonDelete: {
    backgroundColor: "#FF3B30",
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    fontFamily: 'Roboto-Bold',
  },
});

export default Chatbot;