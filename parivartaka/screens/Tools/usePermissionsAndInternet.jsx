import React, { useState, useEffect } from 'react';
import { Alert, Modal, Text, View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { check, PERMISSIONS, RESULTS, request } from 'react-native-permissions';
import NetInfo from '@react-native-community/netinfo';

const PermissionAlert = ({ visible, message, onRequestPermission, onCancel }) => (
  <Modal
    animationType="fade"
    transparent={true}
    visible={visible}
  >
    <View style={styles.centeredView}>
      <View style={styles.modalView}>
        <Text style={styles.modalTitle}>Permissions Required</Text>
        <Text style={styles.modalText}>{message}</Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={[styles.button, styles.buttonCancel]} onPress={onCancel}>
            <Text style={styles.textStyle}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.buttonConfirm]} onPress={onRequestPermission}>
            <Text style={styles.textStyle}>Grant</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

const NetworkModal = ({ visible }) => (
  <Modal
    animationType="fade"
    transparent={true}
    visible={visible}
  >
    <View style={styles.centeredView}>
      <View style={styles.modalView}>
        <ActivityIndicator size="large" color="#4CD964" />
        <Text style={styles.modalText}>Waiting for network connection...</Text>
      </View>
    </View>
  </Modal>
);

const usePermissionsAndInternet = () => {
  const [permissionAlertVisible, setPermissionAlertVisible] = useState(false);
  const [networkModalVisible, setNetworkModalVisible] = useState(false);
  const [permissionMessage, setPermissionMessage] = useState('');
  const [missingPermissions, setMissingPermissions] = useState([]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        setNetworkModalVisible(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const checkPermissions = async () => {
    const permissions = [
      PERMISSIONS.ANDROID.RECORD_AUDIO,
      PERMISSIONS.ANDROID.CAMERA,
      // PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
    ];

    let missing = [];

    for (const permission of permissions) {
      const result = await check(permission);
      if (result !== RESULTS.GRANTED) {
        missing.push(permission);
      }
    }

    return missing;
  };

  const verifyPermissionsAndInternet = async () => {
    const netInfo = await NetInfo.fetch();

    if (!netInfo.isConnected) {
      setNetworkModalVisible(true);
      return false;
    }

    const missingPerms = await checkPermissions();

    if (missingPerms.length > 0) {
      setMissingPermissions(missingPerms);
      setPermissionMessage(`The app needs access to ${missingPerms.map(p => p.split('.').pop().toLowerCase()).join(', ')} to function properly.`);
      setPermissionAlertVisible(true);
      return false;
    }

    return true;
  };

  const handleRequestPermission = async () => {
    setPermissionAlertVisible(false);
    let allGranted = true;

    for (const permission of missingPermissions) {
      const result = await request(permission);
      if (result !== RESULTS.GRANTED) {
        allGranted = false;
        break;
      }
    }

    if (!allGranted) {
      Alert.alert(
        "Permissions Required",
        "Some permissions were denied. The app may not function correctly without them.",
        [{ text: "OK" }]
      );
    }
  };

  return {
    verifyPermissionsAndInternet,
    PermissionAlert: (
      <PermissionAlert
        visible={permissionAlertVisible}
        message={permissionMessage}
        onRequestPermission={handleRequestPermission}
        onCancel={() => setPermissionAlertVisible(false)}
      />
    ),
    NetworkModal: <NetworkModal visible={networkModalVisible} />,
  };
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    width: '100%',
  },
  button: {
    borderRadius: 10,
    padding: 12,
    elevation: 2,
    width: '45%',
  },
  buttonCancel: {
    backgroundColor: '#FF3B30',
  },
  buttonConfirm: {
    backgroundColor: '#4CD964',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    lineHeight: 24,
  },
});

export default usePermissionsAndInternet;