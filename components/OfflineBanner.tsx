import { StyleSheet, Text, View } from "react-native";

interface Props {
  isOffline: boolean;
}

export default function OfflineBanner({ isOffline }: Props) {
  if (!isOffline) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>
        Offline mode active. Actions are queued and will sync automatically when
        the connection returns.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    width: "100%",
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#FDECEA",
    borderBottomWidth: 1,
    borderBottomColor: "#F5C6C4",
  },
  text: {
    color: "#A33C2A",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
  },
});
