import { ProductCategory, useCafe } from "@/context/CafeContext";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Card background options per category
const DRINK_COLORS = [
  "#FFF0E0",
  "#F3E5D8",
  "#E8F5E9",
  "#E3F2FD",
  "#F3E5F5",
  "#FFF8E1",
];
const SNACK_COLORS = [
  "#F5E6D3",
  "#FFF8E1",
  "#F1F8E9",
  "#E3F2FD",
  "#FFF0E0",
  "#F3E5D8",
];

interface Props {
  visible: boolean;
  defaultCategory?: ProductCategory;
  onClose: () => void;
}

export default function AddProductModal({
  visible,
  defaultCategory = "drinks",
  onClose,
}: Props) {
  const { addProduct } = useCafe();

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState<ProductCategory>(defaultCategory);
  const [selectedColor, setSelectedColor] = useState(
    defaultCategory === "drinks" ? DRINK_COLORS[0] : SNACK_COLORS[0],
  );
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  // Sub-tag: lets the filter chips in Snacks/Drinks actually work
  const [subTag, setSubTag] = useState<string>(
    defaultCategory === "drinks" ? "Hot" : "Cake",
  );

  const DRINK_TAGS = ["Hot", "Iced", "Classic"];
  const SNACK_TAGS = ["Cake", "Sandwich", "Cookies"];

  const colors = category === "drinks" ? DRINK_COLORS : SNACK_COLORS;

  const handleCategorySwitch = (cat: ProductCategory) => {
    setCategory(cat);
    setSelectedColor(cat === "drinks" ? DRINK_COLORS[0] : SNACK_COLORS[0]);
    setSubTag(cat === "drinks" ? "Hot" : "Cake");
  };

  // ── Image picker ──────────────────────────────────────────────────────────
  const handlePickImage = async () => {
    // Request permission first
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please allow access to your photo library in Settings to upload a product image.",
        [{ text: "OK" }],
      );
      return;
    }

    setImageLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        // Only allow photos (JPG / PNG — no videos)
        // BUG FIX: MediaTypeOptions is deprecated in expo-image-picker 16.x (SDK 52).
        // Use the new string-array API instead.
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1], // square crop for consistent card display
        quality: 0.8, // compress slightly to keep memory low
      });

      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];

        // Validate file type from URI extension (extra safety check)
        const uri = asset.uri.toLowerCase();
        const isValidType =
          uri.includes(".jpg") ||
          uri.includes(".jpeg") ||
          uri.includes(".png") ||
          // On Android the URI often has no extension — allow those through
          // since mediaTypes filter already restricted to images
          (!uri.includes(".gif") &&
            !uri.includes(".webp") &&
            !uri.includes(".bmp"));

        if (!isValidType) {
          Alert.alert(
            "Unsupported Format",
            "Please choose a JPG or PNG image.",
          );
          return;
        }

        // Validate file size — warn if > 5 MB
        if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
          Alert.alert(
            "Image Too Large",
            "Please choose an image smaller than 5 MB for best performance.",
          );
          return;
        }

        setImageUri(asset.uri);
      }
    } catch {
      Alert.alert("Upload Error", "Could not load image. Please try again.");
    } finally {
      setImageLoading(false);
    }
  };

  // Remove selected image
  const handleRemoveImage = () => {
    setImageUri(null);
  };

  // Reset modal fields whenever it opens or the default category changes.
  // This ensures Drinks and Snacks screens both open the modal with the right state.
  useEffect(() => {
    if (!visible) return;
    setName("");
    setPrice("");
    setImageUri(null);
    setCategory(defaultCategory);
    setSelectedColor(
      defaultCategory === "drinks" ? DRINK_COLORS[0] : SNACK_COLORS[0],
    );
    setSubTag(defaultCategory === "drinks" ? "Hot" : "Cake");
  }, [visible, defaultCategory]);

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert("Missing Name", "Please enter a product name.");
      return;
    }
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      Alert.alert(
        "Invalid Price",
        "Please enter a valid price greater than 0.",
      );
      return;
    }

    addProduct({
      name: name.trim(),
      price: parsedPrice,
      category,
      emoji: category === "drinks" ? "☕" : "🍪", // fallback if no image
      imageUri: imageUri ?? undefined,
      bg: selectedColor,
      tag: subTag,
    });

    // Reset all fields
    setName("");
    setPrice("");
    setImageUri(null);
    setSubTag(category === "drinks" ? "Hot" : "Cake");
    onClose();
  };

  // Also reset on backdrop close
  const handleClose = () => {
    setName("");
    setPrice("");
    setImageUri(null);
    setSubTag(category === "drinks" ? "Hot" : "Cake");
    onClose();
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Tap outside to close */}
        <TouchableOpacity
          style={styles.backdrop}
          onPress={handleClose}
          activeOpacity={1}
        />

        <View style={styles.sheet}>
          {/* Drag handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Add New Product</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Feather name="x" size={20} color="#3E1F0D" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* ── Category toggle ── */}
            <View style={styles.categoryRow}>
              <TouchableOpacity
                style={[
                  styles.catBtn,
                  category === "drinks" && styles.catBtnActive,
                ]}
                onPress={() => handleCategorySwitch("drinks")}
              >
                <Text style={styles.catBtnEmoji}>☕</Text>
                <Text
                  style={[
                    styles.catBtnText,
                    category === "drinks" && styles.catBtnTextActive,
                  ]}
                >
                  Drink
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.catBtn,
                  category === "snacks" && styles.catBtnActive,
                ]}
                onPress={() => handleCategorySwitch("snacks")}
              >
                <Text style={styles.catBtnEmoji}>🍪</Text>
                <Text
                  style={[
                    styles.catBtnText,
                    category === "snacks" && styles.catBtnTextActive,
                  ]}
                >
                  Snack
                </Text>
              </TouchableOpacity>
            </View>

            {/* ── Sub-tag selector (fixes filter chips in Snacks/Drinks screens) ── */}
            <Text style={styles.label}>
              {category === "drinks" ? "Drink Type" : "Snack Type"}
            </Text>
            <View style={styles.tagRow}>
              {(category === "drinks" ? DRINK_TAGS : SNACK_TAGS).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.tagChip, subTag === t && styles.tagChipActive]}
                  onPress={() => setSubTag(t)}
                >
                  <Text
                    style={[
                      styles.tagChipText,
                      subTag === t && styles.tagChipTextActive,
                    ]}
                  >
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* ── Image Upload (replaces emoji picker) ── */}
            <Text style={styles.label}>Product Photo</Text>
            {imageUri ? (
              // Show selected image with a remove button
              <View style={styles.imagePreviewContainer}>
                <Image
                  source={{ uri: imageUri }}
                  style={styles.imagePreview}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={styles.removeImageBtn}
                  onPress={handleRemoveImage}
                >
                  <Feather name="trash-2" size={16} color="#fff" />
                  <Text style={styles.removeImageText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              // Upload placeholder
              <TouchableOpacity
                style={styles.uploadBox}
                onPress={handlePickImage}
                activeOpacity={0.75}
                disabled={imageLoading}
              >
                <View style={styles.uploadIcon}>
                  <Feather
                    name={imageLoading ? "loader" : "camera"}
                    size={28}
                    color="#C4A882"
                  />
                </View>
                <Text style={styles.uploadTitle}>
                  {imageLoading ? "Loading…" : "Tap to upload photo"}
                </Text>
                <Text style={styles.uploadHint}>JPG or PNG · Max 5 MB</Text>
              </TouchableOpacity>
            )}

            {/* ── Card Color ── */}
            <Text style={[styles.label, { marginTop: 18 }]}>Card Color</Text>
            <View style={styles.colorRow}>
              {colors.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.colorDot,
                    { backgroundColor: c },
                    selectedColor === c && styles.colorDotActive,
                  ]}
                  onPress={() => setSelectedColor(c)}
                />
              ))}
            </View>

            {/* ── Live Preview ── */}
            <Text style={styles.label}>Preview</Text>
            <View
              style={[styles.previewCard, { backgroundColor: selectedColor }]}
            >
              {imageUri ? (
                <Image
                  source={{ uri: imageUri }}
                  style={styles.previewImage}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.previewEmoji}>
                  {category === "drinks" ? "☕" : "🍪"}
                </Text>
              )}
              <Text style={styles.previewName}>{name || "Product Name"}</Text>
              <Text style={styles.previewPrice}>₱{price || "0"}</Text>
            </View>

            {/* ── Fields ── */}
            <Text style={styles.label}>Product Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Iced Mocha"
              placeholderTextColor="#C4A882"
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Price (₱)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 120"
              placeholderTextColor="#C4A882"
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
            />

            {/* ── Submit ── */}
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmit}
              activeOpacity={0.85}
            >
              <Feather name="plus-circle" size={18} color="#FFF5E4" />
              <Text style={styles.submitText}>Add Product</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { flex: 1 },
  sheet: {
    backgroundColor: "#FDF6EC",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: "92%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#D2B48C",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  title: { fontSize: 20, fontWeight: "800", color: "#3E1F0D" },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#F5E6D3",
    alignItems: "center",
    justifyContent: "center",
  },
  categoryRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
  catBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "#F5E6D3",
    borderWidth: 2,
    borderColor: "transparent",
  },
  catBtnActive: { backgroundColor: "#3E1F0D", borderColor: "#3E1F0D" },
  catBtnEmoji: { fontSize: 18 },
  catBtnText: { fontSize: 14, fontWeight: "700", color: "#8B6355" },
  catBtnTextActive: { color: "#FFF5E4" },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#8B6355",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 10,
  },

  // Image upload area
  uploadBox: {
    borderWidth: 2,
    borderColor: "#D2B48C",
    borderStyle: "dashed",
    borderRadius: 18,
    paddingVertical: 28,
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FDFAF6",
  },
  uploadIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: "#F5E6D3",
    alignItems: "center",
    justifyContent: "center",
  },
  uploadTitle: { fontSize: 14, fontWeight: "700", color: "#8B6355" },
  uploadHint: { fontSize: 12, color: "#C4A882" },

  // Selected image preview
  imagePreviewContainer: {
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 4,
  },
  imagePreview: { width: "100%", height: 180 },
  removeImageBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#C0392B",
    paddingVertical: 10,
  },
  removeImageText: { fontSize: 13, fontWeight: "700", color: "#fff" },

  colorRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
    flexWrap: "wrap",
  },
  colorDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: "transparent",
  },
  colorDotActive: {
    borderColor: "#3E1F0D",
    shadowColor: "#3E1F0D",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },

  // Sub-tag selector
  tagRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
    flexWrap: "wrap",
  },
  tagChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 100,
    backgroundColor: "#F5E6D3",
    borderWidth: 2,
    borderColor: "transparent",
  },
  tagChipActive: {
    backgroundColor: "#3E1F0D",
    borderColor: "#3E1F0D",
  },
  tagChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#8B6355",
  },
  tagChipTextActive: {
    color: "#FFF5E4",
  },

  // Preview card
  previewCard: {
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#3E1F0D",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
    gap: 6,
  },
  previewImage: { width: 100, height: 100, borderRadius: 14, marginBottom: 4 },
  previewEmoji: { fontSize: 44, marginBottom: 4 },
  previewName: { fontSize: 16, fontWeight: "800", color: "#3E1F0D" },
  previewPrice: { fontSize: 14, fontWeight: "700", color: "#8B4513" },

  input: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#3E1F0D",
    marginBottom: 14,
    fontWeight: "500",
    borderWidth: 1.5,
    borderColor: "#F0DEC8",
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#3E1F0D",
    borderRadius: 18,
    paddingVertical: 16,
    marginTop: 4,
    shadowColor: "#3E1F0D",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  submitText: { fontSize: 16, fontWeight: "800", color: "#FFF5E4" },
});
