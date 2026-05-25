// BUG FIX: CameraView was imported from the internal build path
// "expo-camera/build/CameraView" which is fragile and breaks across SDK
// upgrades. The correct public API is a named export from "expo-camera".
import { Camera, CameraView } from "expo-camera";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface Props {
  visible: boolean;
  onClose: () => void;
  onCapture: (uri: string) => void;
}

export default function CameraCaptureModal({
  visible,
  onClose,
  onCapture,
}: Props) {
  const [permissionStatus, setPermissionStatus] = useState<
    "granted" | "denied" | null
  >(null);
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const cameraRef = useRef<any>(null);
  const [cameraType, setCameraType] = useState<"back" | "front">("back");

  useEffect(() => {
    if (!visible) return;
    // BUG FIX: Added .catch() so a permission API error doesn't cause an
    // UnhandledPromiseRejection (treats the error as denied).
    Camera.requestCameraPermissionsAsync()
      .then(({ status }) => {
        setPermissionStatus(status === "granted" ? "granted" : "denied");
      })
      .catch(() => {
        setPermissionStatus("denied");
      });
  }, [visible]);

  const handleTakePhoto = async () => {
    if (!cameraRef.current) return;
    setLoading(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      setCapturedUri(photo.uri);
    } catch {
      Alert.alert("Camera Error", "Could not capture photo. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUsePhoto = () => {
    if (!capturedUri) return;
    onCapture(capturedUri);
    setCapturedUri(null);
    onClose();
  };

  const handleToggleCamera = () => {
    setCameraType((current) => (current === "back" ? "front" : "back"));
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Take a Profile Photo</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          {permissionStatus === null ? (
            // BUG FIX: permissionStatus starts as null while the permission
            // dialog is pending. Previously the else branch (CameraView) was
            // rendered immediately, mounting the camera before permission was
            // granted or denied. Now we show a loading indicator instead.
            <View style={styles.permissionBox}>
              <ActivityIndicator size="large" color="#C8793A" />
              <Text style={[styles.permissionText, { marginTop: 12 }]}>
                Requesting camera permission…
              </Text>
            </View>
          ) : permissionStatus === "denied" ? (
            <View style={styles.permissionBox}>
              <Text style={styles.permissionText}>
                Camera permission is required to capture your profile photo.
              </Text>
            </View>
          ) : capturedUri ? (
            <View style={styles.previewContainer}>
              <Image
                source={{ uri: capturedUri }}
                style={styles.previewImage}
              />
              <View style={styles.cameraButtons}>
                <TouchableOpacity
                  style={[styles.controlBtn, styles.cancelBtn]}
                  onPress={() => setCapturedUri(null)}
                >
                  <Text style={styles.controlText}>Retake</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.controlBtn, styles.saveBtn]}
                  onPress={handleUsePhoto}
                >
                  <Text style={styles.controlText}>Use Photo</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.cameraWrapper}>
              <CameraView
                style={styles.camera}
                facing={cameraType}
                ref={cameraRef}
              />
              <View style={styles.cameraButtons}>
                <TouchableOpacity
                  style={[styles.controlBtn, styles.toggleBtn]}
                  onPress={handleToggleCamera}
                >
                  <Text style={styles.controlText}>Flip</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.controlBtn, styles.captureBtn]}
                  onPress={handleTakePhoto}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.controlText}>Capture</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  card: {
    borderRadius: 24,
    backgroundColor: "#FDF6EC",
    overflow: "hidden",
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#3E1F0D",
  },
  closeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#E8E2D9",
  },
  closeText: {
    color: "#3E1F0D",
    fontWeight: "700",
  },
  cameraWrapper: {
    height: 420,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  camera: { flex: 1 },
  previewContainer: {
    height: 420,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  previewImage: { width: "100%", height: "100%" },
  cameraButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  controlBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    marginHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  captureBtn: {
    backgroundColor: "#C8793A",
  },
  toggleBtn: {
    backgroundColor: "#F5E6D3",
  },
  saveBtn: {
    backgroundColor: "#3E1F0D",
  },
  cancelBtn: {
    backgroundColor: "#FDECEA",
  },
  controlText: {
    color: "#FFF5E4",
    fontWeight: "700",
  },
  permissionBox: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  permissionText: {
    color: "#8B6355",
    textAlign: "center",
    lineHeight: 22,
  },
});
