import CameraCaptureModal from "@/components/CameraCaptureModal";
import OfflineBanner from "@/components/OfflineBanner";
import { auth } from "@/constants/firebase";
import { useCafe } from "@/context/CafeContext";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";

export default function ProfileScreen() {
  const router = useRouter();
  const {
    orders,
    products,
    isOffline,
    uploadProfilePhoto,
    userProfile,
    isNewProduct,
  } = useCafe();
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, setUser);
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut(auth);
      router.replace("/(auth)/welcome");
    } catch {
      Alert.alert("Logout Failed", "Could not log out. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  };

  useEffect(() => {
    const loadLocation = async () => {
      setLoadingLocation(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          return;
        }
        const current = await Location.getCurrentPositionAsync({});
        setLocation(current);
      } catch {
        // Keep map hidden if location cannot be obtained.
      } finally {
        setLoadingLocation(false);
      }
    };

    loadLocation();
  }, []);

  const totalOrders = orders.length;
  const completedOrders = orders.filter(
    (order) => order.status === "Done",
  ).length;
  const pendingOrders = orders.filter(
    (order) => order.status !== "Done",
  ).length;
  const uploadedItems = products.length;

  const profileName =
    userProfile?.fullName || user?.displayName || "Cafe Owner";
  const profileEmail =
    userProfile?.gmail || userProfile?.email || user?.email || "Not available";
  const profilePic =
    userProfile?.profilePic || userProfile?.photoURL || user?.photoURL;
  const profileInitials = useMemo(() => {
    const source =
      profileName !== "Cafe Owner" ? profileName : profileEmail.split("@")[0];
    const parts = source.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return (parts[0]?.slice(0, 2) || "MC").toUpperCase();
  }, [profileEmail, profileName]);
  const [profilePicError, setProfilePicError] = useState(false);

  const nearbyPlaces = useMemo(() => {
    if (!location || products.length === 0) return [];
    return products.slice(0, 4).map((product, idx) => ({
      id: product.id,
      title: product.name,
      description: product.category,
      latitude: location.coords.latitude + (idx % 2 === 0 ? 0.0023 : -0.0023),
      longitude: location.coords.longitude + (idx < 2 ? 0.0022 : -0.0022),
    }));
  }, [location, products]);

  const recommendationItems = useMemo(() => {
    const itemCounts = orders
      .flatMap((order) => order.items)
      .reduce<Record<string, number>>((acc, item) => {
        acc[item.product.id] = (acc[item.product.id] || 0) + item.quantity;
        return acc;
      }, {});

    const hour = new Date().getHours();
    return products
      .map((product) => {
        const base = itemCounts[product.id] ?? 0;
        const timeBoost =
          hour < 12
            ? product.category === "drinks"
              ? 2
              : 0
            : hour >= 18
              ? product.category === "drinks"
                ? 2
                : 1
              : 1;
        return {
          product,
          score: base * 3 + timeBoost + (isNewProduct(product) ? 1 : 0),
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((item) => item.product);
    // BUG FIX: isNewProduct was used inside the memo but missing from the deps array.
  }, [orders, products, isNewProduct]);

  useEffect(() => {
    setProfilePicError(false);
  }, [profilePic]);

  const handlePhotoCapture = async (uri: string) => {
    try {
      setProfilePicError(false); // Optimistically clear error before upload
      await uploadProfilePhoto(uri);
      Alert.alert("Profile Updated", "Your profile picture has been uploaded.");
    } catch {
      Alert.alert(
        "Upload Failed",
        "Could not save profile photo. Please try again.",
      );
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please allow photo library access to upload a profile picture.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      // BUG FIX: MediaTypeOptions is deprecated in expo-image-picker 16.x (SDK 52).
      // Use the new string-array API instead.
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      await handlePhotoCapture(result.assets[0].uri);
    }
  };

  return (
    <View style={styles.safe}>
      <OfflineBanner isOffline={isOffline} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View style={styles.userInfo}>
            <View style={styles.avatarWrap}>
              {profilePic && !profilePicError ? (
                <Image
                  source={{ uri: profilePic }}
                  style={styles.avatar}
                  onError={() => setProfilePicError(true)}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitials}>{profileInitials}</Text>
                </View>
              )}
            </View>
            <View style={styles.nameBlock}>
              <Text style={styles.name}>{profileName}</Text>
              <Text style={styles.email}>{profileEmail}</Text>
              <Text style={styles.uid}>UID: {user?.uid ?? "—"}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.logoutBtn, loggingOut && styles.logoutBtnDisabled]}
            onPress={handleLogout}
            activeOpacity={0.85}
            disabled={loggingOut}
          >
            <Feather name="log-out" size={18} color="#C0392B" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          {[
            { label: "Total Orders", value: totalOrders },
            { label: "Completed", value: completedOrders },
            { label: "Pending", value: pendingOrders },
            { label: "Items", value: uploadedItems },
          ].map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Actions</Text>
          <Text style={styles.sectionSubtitle}>
            Capture a photo and keep your account secure with an updated
            profile.
          </Text>

          <View style={styles.actionRow}>
            {Platform.OS !== "web" && (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => setShowCamera(true)}
                activeOpacity={0.85}
              >
                <Feather name="camera" size={18} color="#FFF5E4" />
                <Text style={styles.actionText}>Take Photo</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.actionBtnOutline}
              onPress={handlePickImage}
              activeOpacity={0.85}
            >
              <Feather name="upload" size={18} color="#3E1F0D" />
              <Text style={styles.actionTextOutline}>Upload</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nearby Cafes</Text>
          <Text style={styles.sectionSubtitle}>
            Using your current location to show popular nearby items.
          </Text>
          <View style={styles.mapCard}>
            {loadingLocation ? (
              <ActivityIndicator size="small" color="#3E1F0D" />
            ) : location ? (
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                  latitudeDelta: 0.02,
                  longitudeDelta: 0.02,
                }}
              >
                <Marker
                  coordinate={{
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                  }}
                  title="You"
                  description="Current location"
                />
                {nearbyPlaces.map((place) => (
                  <Marker
                    key={place.id}
                    coordinate={{
                      latitude: place.latitude,
                      longitude: place.longitude,
                    }}
                    title={place.title}
                    description={place.description}
                  />
                ))}
              </MapView>
            ) : (
              <Text style={styles.mapHint}>
                Location not available. Allow location access to show nearby
                items.
              </Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommended Today</Text>
          <Text style={styles.sectionSubtitle}>
            Personalized suggestions based on your orders and time of day.
          </Text>
          <View style={styles.recommendList}>
            {recommendationItems.map((item) => (
              <View key={item.id} style={styles.recommendCard}>
                <Text style={styles.recommendEmoji}>{item.emoji}</Text>
                <View style={styles.recommendText}>
                  <Text style={styles.recommendName}>{item.name}</Text>
                  <Text style={styles.recommendMeta}>{item.category}</Text>
                </View>
              </View>
            ))}
            {recommendationItems.length === 0 && (
              <Text style={styles.emptyText}>
                Add products and place orders to improve recommendations.
              </Text>
            )}
          </View>
        </View>
      </ScrollView>

      <CameraCaptureModal
        visible={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={handlePhotoCapture}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FDF6EC" },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  userInfo: { flexDirection: "row", gap: 14, alignItems: "center", flex: 1 },
  avatarWrap: {
    width: 92,
    height: 92,
    borderRadius: 26,
    overflow: "hidden",
    backgroundColor: "#F5E6D3",
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: { width: "100%", height: "100%" },
  avatarPlaceholder: {
    width: 84,
    height: 84,
    borderRadius: 20,
    backgroundColor: "#3E1F0D",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: { color: "#FFF5E4", fontSize: 24, fontWeight: "800" },
  nameBlock: { flex: 1 },
  name: { fontSize: 20, fontWeight: "800", color: "#3E1F0D" },
  email: { fontSize: 13, color: "#8B6355", marginTop: 4 },
  uid: { fontSize: 12, color: "#C4A882", marginTop: 2 },
  logoutBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#FDECEA",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutBtnDisabled: {
    opacity: 0.6,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 20,
    marginBottom: 18,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#FFF8F0",
    borderRadius: 18,
    padding: 16,
  },
  statValue: { fontSize: 22, fontWeight: "800", color: "#3E1F0D" },
  statLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#8B6355",
    marginTop: 8,
  },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#3E1F0D" },
  sectionSubtitle: {
    fontSize: 12,
    color: "#8B6355",
    marginTop: 6,
    lineHeight: 18,
  },
  actionRow: { flexDirection: "row", gap: 12, marginTop: 16 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: "#3E1F0D",
  },
  actionText: { color: "#FFF5E4", fontWeight: "700" },
  actionBtnOutline: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: "#F5E6D3",
  },
  actionTextOutline: { color: "#3E1F0D", fontWeight: "700" },
  mapCard: {
    borderRadius: 24,
    overflow: "hidden",
    marginTop: 16,
    backgroundColor: "#F5E6D3",
    minHeight: 240,
    justifyContent: "center",
    alignItems: "center",
  },
  map: { width: "100%", height: 240 },
  mapHint: {
    color: "#8B6355",
    padding: 18,
    textAlign: "center",
    lineHeight: 20,
  },
  recommendList: {
    marginTop: 14,
    gap: 12,
  },
  recommendCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8F0",
    padding: 14,
    borderRadius: 18,
    gap: 12,
  },
  recommendEmoji: { fontSize: 26 },
  recommendText: { flex: 1 },
  recommendName: { fontSize: 15, fontWeight: "800", color: "#3E1F0D" },
  recommendMeta: { fontSize: 12, color: "#8B6355", marginTop: 2 },
  emptyText: { marginTop: 14, color: "#8B6355" },
});
