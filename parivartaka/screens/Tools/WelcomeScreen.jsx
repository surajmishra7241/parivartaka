import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  PanResponder,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';

const { width, height } = Dimensions.get('window');

const WelcomeScreen = ({ onContinue }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const buttonTranslateX = useRef(new Animated.Value(0)).current;

  const [swipeComplete, setSwipeComplete] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx > 0 && gestureState.dx <= width * 0.7) {
          buttonTranslateX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > width * 0.6) {
          Animated.timing(buttonTranslateX, {
            toValue: width * 0.7,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            setSwipeComplete(true);
            onContinue();
          });
        } else {
          Animated.spring(buttonTranslateX, {
            toValue: 0,
            friction: 5,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 8000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ),
    ]).start();
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const renderAvatar = (color, text, iconName, delay) => (
    <Animated.View
      style={[
        styles.avatarBubble,
        {
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={styles.avatarTextContainer}>
        <Text style={styles.avatarText}>{text}</Text>
      </View>
      <Animated.View
        style={[
          styles.avatar,
          { backgroundColor: color, transform: [{ rotate: spin }] },
        ]}
      >
        <Icon name={iconName} size={30} color="#fff" />
      </Animated.View>
    </Animated.View>
  );

  const buttonBackgroundColor = buttonTranslateX.interpolate({
    inputRange: [0, width * 0.7],
    outputRange: ['rgba(74, 144, 226, 0.7)', 'rgba(69, 230, 69, 0.7)'],
  });

  return (
    <LinearGradient
      colors={['#061A40', '#0B3068', '#104593']}
      style={styles.container}
    >
      <Animated.Text
        style={[
          styles.title,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              {
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-50, 0],
                }),
              },
            ],
          },
        ]}
      >
        Translator
      </Animated.Text>
      <Animated.Text
        style={[
          styles.subtitle,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
            ],
          },
        ]}
      >
        Translate easy and fast into 100+ languages
      </Animated.Text>
      <View style={styles.avatarContainer}>
        {renderAvatar('#4A90E2', 'Hola', 'language', 0)}
        {renderAvatar('#F5A623', 'Hello', 'translate', 200)}
        {renderAvatar('#7ED321', 'Ciao', 'chat', 400)}
      </View>
      <Animated.View
        style={[
          styles.swipeContainer,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              {
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.swipeBackground}>
          <Animated.View
            style={[
              styles.swipeButton,
              {
                transform: [{ translateX: buttonTranslateX }],
                backgroundColor: buttonBackgroundColor,
              },
            ]}
            {...panResponder.panHandlers}
          >
            <Icon name="chevron-right" size={30} color="#FFFFFF" />
          </Animated.View>
          <Text style={styles.swipeText}>Swipe to start</Text>
        </View>
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#4A90E2',
    textShadowColor: 'rgba(74, 144, 226, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 40,
    color: '#B3E5FC',
  },
  avatarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 60,
  },
  avatarBubble: {
    alignItems: 'center',
  },
  avatarTextContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 8,
    marginBottom: 15,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  avatarText: {
    fontSize: 18,
    color: '#FFFFFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  swipeContainer: {
    width: width * 0.8,
    height: 70,
    borderRadius: 35,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  swipeBackground: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  swipeButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  swipeText: {
    color: '#FFFFFF',
    fontSize: 18,
    marginLeft: 20,
    fontWeight: '500',
  },
});

export default WelcomeScreen;