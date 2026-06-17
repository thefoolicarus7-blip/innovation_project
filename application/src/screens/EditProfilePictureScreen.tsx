import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Image,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { Button } from '../components/Button';
import { mediaService, authService } from '../services/api';
import { useAuth } from '../auth/AuthContext';

export const EditProfilePictureScreen = ({ navigation }: any) => {
  const { user, refreshProfile } = useAuth();
  const [photoFile, setPhotoFile] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  const takePhoto = async () => {
    if (Platform.OS === 'android') {
      try {
        const hasCameraPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
        if (!hasCameraPermission) {
          await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
        }
      } catch (err) {
        console.warn(err);
      }
    }

    Alert.alert(
      'Profile Photo',
      'Take a new photo or choose from gallery',
      [
        {
          text: 'Camera',
          onPress: () => {
            if (typeof launchCamera !== 'function') {
              Alert.alert('Camera Error', 'The camera module is not available.');
              return;
            }
            try {
              launchCamera({ mediaType: 'photo', quality: 0.8 }, (response) => {
                if (response.didCancel) return;
                if (response.errorCode) {
                  Alert.alert('Camera Error', response.errorMessage || 'Could not open camera');
                  return;
                }
                if (response.assets && response.assets.length > 0) {
                  const asset = response.assets[0];
                  setPhotoFile({
                    uri: asset.uri,
                    type: asset.type,
                    name: asset.fileName || 'profile.jpg',
                  });
                }
              });
            } catch (e) {
              console.error('Camera launch failed', e);
            }
          },
        },
        {
          text: 'Gallery',
          onPress: () => {
            try {
              launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, (response) => {
                if (response.didCancel) return;
                if (response.assets && response.assets.length > 0) {
                  const asset = response.assets[0];
                  setPhotoFile({
                    uri: asset.uri,
                    type: asset.type,
                    name: asset.fileName || 'profile.jpg',
                  });
                }
              });
            } catch (e) {
              console.error('Gallery launch failed', e);
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleUpload = async () => {
    if (!photoFile) {
      Alert.alert('No Photo Selected', 'Please take or select a photo first.');
      return;
    }

    setUploading(true);
    try {
      const res = await mediaService.upload(photoFile);
      const profileImageUrl = res.file.secureUrl;

      await authService.updateDocuments({ profileImageUrl });
      await refreshProfile();

      Alert.alert('Success', 'Profile picture updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      Alert.alert('Upload Failed', error.response?.data?.message || 'Something went wrong');
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={styles.safeArea}>
      <StatusBar backgroundColor="#FAF9FB" barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={Colors.on_surface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile Picture</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.imageSection}>
          <View style={styles.imageContainer}>
            {photoFile || user?.profileImageUrl ? (
              <Image 
                source={{ uri: photoFile ? photoFile.uri : user?.profileImageUrl }} 
                style={styles.profileImage} 
              />
            ) : (
              <View style={styles.placeholderImage}>
                <Icon name="account" size={80} color={Colors.outline_variant} />
              </View>
            )}
            
            <TouchableOpacity style={styles.editButton} onPress={takePhoto}>
              <Icon name="camera" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.instructionText}>
            Tap the camera icon to change your profile picture.
          </Text>
        </View>

        <View style={styles.footer}>
          <Button
            title={uploading ? "Updating..." : "Save Picture"}
            onPress={handleUpload}
            disabled={uploading || !photoFile}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF9FB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    ...Typography.titleLg,
    fontWeight: 'bold',
    color: Colors.on_surface,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  imageSection: {
    alignItems: 'center',
    marginTop: 40,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  profileImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#F0F0F0',
  },
  placeholderImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#EBEBEF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FAF9FB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  instructionText: {
    ...Typography.bodyLg,
    color: Colors.outline,
    textAlign: 'center',
  },
  footer: {
    marginTop: 40,
  },
});
