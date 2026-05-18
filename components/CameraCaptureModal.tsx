import { Camera } from "expo-camera";
import CameraView from "expo-camera/build/CameraView";
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
    Camera.requestCameraPermissionsAsync().then(({ status }) => {
      setPermissionStatus(status === "granted" ? "granted" : "denied");
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
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Take a Profile Photo</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          {permissionStatus === "denied" ? (
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
