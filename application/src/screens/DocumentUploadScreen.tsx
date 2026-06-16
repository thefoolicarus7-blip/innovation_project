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
import DocumentPicker from 'react-native-document-picker';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { Button } from '../components/Button';
import { mediaService, authService } from '../services/api';
import { useAuth } from '../auth/AuthContext';

export const DocumentUploadScreen = ({ navigation }: any) => {
  const [cvFile, setCvFile] = useState<any>(null);
  const [idFile, setIdFile] = useState<any>(null);
  const [selfieFile, setSelfieFile] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const { user, refreshProfile } = useAuth();

  const pickCV = async () => {
    try {
      const res = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.pdf, DocumentPicker.types.images],
      });
      setCvFile(res);
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        console.error(err);
      }
    }
  };

  const pickID = async () => {
    try {
      const res = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.images],
      });
      setIdFile(res);
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        console.error(err);
      }
    }
  };

  const takeSelfie = async () => {
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
      'Take a selfie or choose from gallery',
      [
        {
          text: 'Camera',
          onPress: () => {
            if (typeof launchCamera !== 'function') {
              Alert.alert(
                'Camera Error',
                'The camera module is not available. Please rebuild the app (npx react-native run-android).'
              );
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
                  setSelfieFile({
                    uri: asset.uri,
                    type: asset.type,
                    name: asset.fileName || 'selfie.jpg',
                  });
                }
              });
            } catch (e) {
              console.error('Camera launch failed', e);
              Alert.alert(
                'Camera Unavailable',
                'Failed to launch camera. If you just installed the app, please rebuild it. You can also try choosing from your gallery instead.'
              );
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
                  setSelfieFile({
                    uri: asset.uri,
                    type: asset.type,
                    name: asset.fileName || 'selfie.jpg',
                  });
                }
              });
            } catch (e) {
              console.error('Gallery launch failed', e);
              Alert.alert('Error', 'Could not open image gallery.');
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleContinue = async () => {
    if (!cvFile && !user?.cvUrl) {
      Alert.alert('Missing CV', 'Please upload your CV/Resume');
      return;
    }
    if (!idFile && !user?.idUrl) {
      Alert.alert('Missing ID', 'Please upload your ID document');
      return;
    }
    if (!selfieFile && !user?.profileImageUrl) {
      Alert.alert('Missing Selfie', 'Please take a selfie for your profile');
      return;
    }

    setUploading(true);
    try {
      let cvUrl = user?.cvUrl;
      let idUrl = user?.idUrl;
      let profileImageUrl = user?.profileImageUrl;

      if (cvFile) {
        const cvRes = await mediaService.upload(cvFile);
        cvUrl = cvRes.file.secureUrl;
      }

      if (idFile) {
        const idRes = await mediaService.upload(idFile);
        idUrl = idRes.file.secureUrl;
      }

      if (selfieFile) {
        const selfieRes = await mediaService.upload(selfieFile);
        profileImageUrl = selfieRes.file.secureUrl;
      }

      await authService.updateDocuments({ cvUrl, idUrl, profileImageUrl });
      await refreshProfile();
      
      Alert.alert(
        'Success',
        'Verification documents submitted! Your profile is now being reviewed.',
        [{ text: 'OK', onPress: () => navigation.navigate('SwipeGuide') }]
      );
    } catch (error: any) {
      Alert.alert('Upload Failed', error.response?.data?.message || 'Something went wrong');
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView
      edges={['top', 'bottom', 'left', 'right']}
      style={styles.safeArea}
    >
      <StatusBar backgroundColor="#FAF9FB" barStyle="dark-content" />
      <View style={styles.container}>
        <View style={styles.brandHeader}>
          <Text style={styles.brandText}>SWIPE2WORK</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.subHeader}>
            <Text style={styles.eyebrow}>STEP 2/2 • PROFILE VERIFICATION</Text>
            <Text style={styles.pageTitle}>Let's get you verified</Text>
            <Text style={styles.subTitle}>
              Upload your documents and a selfie to unlock high-priority job matches and
              interviews.
            </Text>
          </View>

          {/* Selfie Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Take a Selfie</Text>
            <TouchableOpacity
              style={[styles.uploadBox, (selfieFile || user?.profileImageUrl) && styles.uploadBoxActive, { height: 200 }]}
              onPress={takeSelfie}
            >
              {(selfieFile || user?.profileImageUrl) ? (
                <Image 
                  source={{ uri: selfieFile ? selfieFile.uri : user?.profileImageUrl }} 
                  style={styles.previewImage} 
                />
              ) : (
                <>
                  <Icon
                    name="camera-account"
                    size={48}
                    color={Colors.outline_variant}
                  />
                  <Text style={styles.uploadText}>Tap to take selfie</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* CV Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>CV / Resume</Text>
            <TouchableOpacity
              style={[styles.uploadBox, (cvFile || user?.cvUrl) && styles.uploadBoxActive]}
              onPress={pickCV}
            >
              <Icon
                name={(cvFile || user?.cvUrl) ? 'check-circle' : 'file-document-outline'}
                size={48}
                color={(cvFile || user?.cvUrl) ? '#2E7D32' : Colors.outline_variant}
              />
              <Text style={styles.uploadText}>
                {cvFile ? cvFile.name : (user?.cvUrl ? 'CV Uploaded' : 'Tap to upload CV')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* ID Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              ID Document (Citizenship/ID/License)
            </Text>
            <TouchableOpacity
              style={[styles.uploadBox, (idFile || user?.idUrl) && styles.uploadBoxActive]}
              onPress={pickID}
            >
              <Icon
                name={
                  (idFile || user?.idUrl) ? 'check-circle' : 'card-account-details-outline'
                }
                size={48}
                color={(idFile || user?.idUrl) ? '#2E7D32' : Colors.outline_variant}
              />
              <Text style={styles.uploadText}>
                {idFile ? idFile.name : (user?.idUrl ? 'ID Uploaded' : 'Tap to upload ID')}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title={uploading ? "Uploading..." : "Submit Verification"}
            onPress={handleContinue}
            disabled={uploading}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF9FB',
  },
  container: {
    flex: 1,
  },
  brandHeader: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
    alignItems: 'center',
  },
  brandText: {
    ...Typography.titleMd,
    color: Colors.primary,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },
  subHeader: {
    marginBottom: 40,
  },
  eyebrow: {
    ...Typography.labelSm,
    color: Colors.primary,
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: 1,
  },
  pageTitle: {
    ...Typography.displaySm,
    color: Colors.on_surface,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  subTitle: {
    ...Typography.bodyMd,
    color: Colors.outline,
    lineHeight: 22,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    ...Typography.titleMd,
    color: Colors.on_surface,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  uploadBox: {
    width: '100%',
    height: 140,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: Colors.outline_variant,
    borderStyle: 'dashed',
    backgroundColor: 'rgba(0,0,0,0.02)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  uploadBoxActive: {
    borderColor: '#C8E6C9',
    backgroundColor: 'rgba(130, 245, 193, 0.05)',
    borderStyle: 'solid',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  uploadText: {
    ...Typography.labelLg,
    color: Colors.outline,
    marginTop: 12,
  },
  footer: {
    padding: 24,
    backgroundColor: '#FAF9FB',
  },
});
