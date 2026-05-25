import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface TermsAndPrivacyModalProps {
  visible: boolean;
  onAccept: () => void;
  onReject: () => void;
  loading?: boolean;
}

export default function TermsAndPrivacyModal({
  visible,
  onAccept,
  onReject,
  loading = false,
}: TermsAndPrivacyModalProps) {
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (!visible) setAccepted(false);
  }, [visible]);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onReject}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Terms & Privacy Policy</Text>
            <Text style={styles.subtitle}>
              Please read and accept our terms before proceeding
            </Text>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
          >
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Terms and Conditions - MyCAFE
              </Text>
              <Text style={styles.sectionText}>
                Welcome to MyCAFE. By accessing or using the MyCAFE mobile
                application, you agree to comply with and be bound by the
                following Terms and Conditions. Please read them carefully
                before using the application.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.subText}>1. Acceptance of Terms</Text>
              <Text style={styles.sectionText}>
                By creating an account or using MyCAFE, you confirm that you
                accept these Terms and Conditions and agree to follow all
                applicable laws and regulations.
              </Text>

              <Text style={styles.subText}>2. Purpose of the Application</Text>
              <Text style={styles.sectionText}>
                MyCAFE is designed to provide users with cafe-related services
                such as browsing products, placing orders, viewing menus,
                managing profiles, and accessing other cafe management features.
              </Text>

              <Text style={styles.subText}>3. User Accounts</Text>
              <Text style={styles.sectionText}>
                Users may be required to register an account to access certain
                features of the app.
              </Text>
              <Text style={styles.sectionText}>You agree to:</Text>
              <Text style={styles.bulletPoint}>
                - Provide accurate and complete information.
              </Text>
              <Text style={styles.bulletPoint}>
                - Keep your login credentials secure.
              </Text>
              <Text style={styles.bulletPoint}>
                - Be responsible for all activities under your account.
              </Text>
              <Text style={styles.bulletPoint}>
                - Notify the app administrators immediately of any unauthorized
                access.
              </Text>
              <Text style={styles.sectionText}>
                MyCAFE reserves the right to suspend or terminate accounts that
                violate these terms.
              </Text>

              <Text style={styles.subText}>4. Orders and Payments</Text>
              <Text style={styles.bulletPoint}>
                - All orders placed through MyCAFE are subject to availability
                and confirmation.
              </Text>
              <Text style={styles.bulletPoint}>
                - Prices displayed in the app may change without prior notice.
              </Text>
              <Text style={styles.bulletPoint}>
                - Users must provide valid payment information when required.
              </Text>
              <Text style={styles.bulletPoint}>
                - Fraudulent transactions are strictly prohibited.
              </Text>

              <Text style={styles.subText}>5. User Conduct</Text>
              <Text style={styles.sectionText}>Users agree not to:</Text>
              <Text style={styles.bulletPoint}>
                - Use the app for illegal activities.
              </Text>
              <Text style={styles.bulletPoint}>
                - Attempt to hack, disrupt, or damage the system.
              </Text>
              <Text style={styles.bulletPoint}>
                - Upload harmful, offensive, or inappropriate content.
              </Text>
              <Text style={styles.bulletPoint}>
                - Misuse other users{"'"} information.
              </Text>
              <Text style={styles.sectionText}>
                Violation of these rules may result in account suspension or
                permanent removal.
              </Text>

              <Text style={styles.subText}>6. Intellectual Property</Text>
              <Text style={styles.sectionText}>
                All content, logos, designs, graphics, and features within
                MyCAFE are owned by the application developers unless otherwise
                stated. Unauthorized copying or distribution is prohibited.
              </Text>

              <Text style={styles.subText}>7. Limitation of Liability</Text>
              <Text style={styles.sectionText}>
                MyCAFE is provided {'"'}as is{'"'} without warranties of any
                kind. The developers are not responsible for:
              </Text>
              <Text style={styles.bulletPoint}>
                - Temporary service interruptions
              </Text>
              <Text style={styles.bulletPoint}>
                - Data loss caused by technical issues
              </Text>
              <Text style={styles.bulletPoint}>
                - Unauthorized access due to user negligence
              </Text>
              <Text style={styles.bulletPoint}>
                - Damages resulting from misuse of the application
              </Text>

              <Text style={styles.subText}>8. Privacy</Text>
              <Text style={styles.sectionText}>
                User information is handled according to the MyCAFE Privacy
                Policy. By using the app, you consent to the collection and use
                of information as described in the policy.
              </Text>

              <Text style={styles.subText}>9. Changes to Terms</Text>
              <Text style={styles.sectionText}>
                MyCAFE reserves the right to update or modify these Terms and
                Conditions at any time. Continued use of the app after changes
                means you accept the updated terms.
              </Text>

              <Text style={styles.subText}>10. Contact Information</Text>
              <Text style={styles.sectionText}>
                For questions or concerns regarding these Terms and Conditions,
                users may contact the MyCAFE support team through the
                application.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Privacy Policy - MyCAFE</Text>
              <Text style={styles.sectionText}>
                MyCAFE values your privacy and is committed to protecting your
                personal information. This Privacy Policy explains how
                information is collected, used, and protected when using the
                MyCAFE application.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.subText}>1. Information We Collect</Text>
              <Text style={styles.sectionText}>
                MyCAFE may collect the following information:
              </Text>
              <Text style={styles.bulletPoint}>- Name and email address</Text>
              <Text style={styles.bulletPoint}>- Contact details</Text>
              <Text style={styles.bulletPoint}>- User profile information</Text>
              <Text style={styles.bulletPoint}>
                - Order and transaction history
              </Text>
              <Text style={styles.bulletPoint}>
                - Device and usage information
              </Text>
              <Text style={styles.bulletPoint}>- Uploaded images or files</Text>

              <Text style={styles.subText}>2. How We Use Your Information</Text>
              <Text style={styles.sectionText}>
                The collected information is used to:
              </Text>
              <Text style={styles.bulletPoint}>
                - Provide and improve app services
              </Text>
              <Text style={styles.bulletPoint}>
                - Process orders and transactions
              </Text>
              <Text style={styles.bulletPoint}>
                - Personalize user experience
              </Text>
              <Text style={styles.bulletPoint}>
                - Send notifications and updates
              </Text>
              <Text style={styles.bulletPoint}>
                - Maintain security and prevent fraud
              </Text>
              <Text style={styles.bulletPoint}>
                - Improve system performance and analytics
              </Text>

              <Text style={styles.subText}>3. Data Protection</Text>
              <Text style={styles.sectionText}>
                MyCAFE implements reasonable security measures to protect user
                information from unauthorized access, disclosure, or misuse.
                However, no online system is completely secure.
              </Text>

              <Text style={styles.subText}>4. Sharing of Information</Text>
              <Text style={styles.sectionText}>
                MyCAFE does not sell personal information to third parties.
                Information may only be shared:
              </Text>
              <Text style={styles.bulletPoint}>- When required by law</Text>
              <Text style={styles.bulletPoint}>
                - To protect user safety and security
              </Text>
              <Text style={styles.bulletPoint}>
                - With trusted service providers necessary for app operations
              </Text>

              <Text style={styles.subText}>5. User Rights</Text>
              <Text style={styles.sectionText}>Users may:</Text>
              <Text style={styles.bulletPoint}>
                - Access their personal information
              </Text>
              <Text style={styles.bulletPoint}>
                - Request corrections to inaccurate data
              </Text>
              <Text style={styles.bulletPoint}>
                - Request account deletion when applicable
              </Text>
              <Text style={styles.bulletPoint}>
                - Withdraw consent for certain data processing activities
              </Text>

              <Text style={styles.subText}>6. Cookies and Analytics</Text>
              <Text style={styles.sectionText}>
                The app may use cookies, analytics tools, or similar
                technologies to improve user experience and monitor app
                performance.
              </Text>

              <Text style={styles.subText}>7. Third-Party Services</Text>
              <Text style={styles.sectionText}>
                MyCAFE may integrate with third-party services such as payment
                gateways, cloud storage, or authentication providers. These
                services may have their own privacy policies.
              </Text>

              <Text style={styles.subText}>8. Children{"'"}s Privacy</Text>
              <Text style={styles.sectionText}>
                MyCAFE is not intended for children under 13 years old. The
                application does not knowingly collect personal information from
                children.
              </Text>

              <Text style={styles.subText}>
                9. Changes to This Privacy Policy
              </Text>
              <Text style={styles.sectionText}>
                This Privacy Policy may be updated periodically. Users will be
                notified of significant changes through the app or other
                communication channels.
              </Text>

              <Text style={styles.subText}>10. Contact Us</Text>
              <Text style={styles.sectionText}>
                If you have questions about this Privacy Policy or your personal
                data, please contact the MyCAFE support team through the
                application.
              </Text>
            </View>
          </ScrollView>

          <View style={styles.checkboxSection}>
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => setAccepted(!accepted)}
              activeOpacity={0.7}
            >
              {accepted ? (
                <Feather name="check-square" size={20} color="#3E1F0D" />
              ) : (
                <Feather name="square" size={20} color="#C4A882" />
              )}
              <Text style={styles.checkboxLabel}>
                I accept the Terms & Privacy Policy
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.btn, styles.rejectBtn]}
              onPress={onReject}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={styles.rejectText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.btn,
                styles.acceptBtn,
                (!accepted || loading) && styles.acceptBtnDisabled,
              ]}
              onPress={onAccept}
              disabled={!accepted || loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#FFF5E4" />
              ) : (
                <Text style={styles.acceptText}>Accept & Continue</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  card: {
    backgroundColor: "#FDF6EC",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "90%",
    display: "flex",
    flexDirection: "column",
    paddingBottom: 24,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0DEC8",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#3E1F0D",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: "#8B6355",
    lineHeight: 18,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 14,
  },
  section: {
    backgroundColor: "#FFF8F0",
    borderRadius: 16,
    padding: 14,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#3E1F0D",
    marginBottom: 4,
  },
  sectionText: {
    fontSize: 13,
    color: "#5D4037",
    lineHeight: 20,
  },
  subText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6D4C41",
    marginTop: 8,
  },
  bulletPoint: {
    fontSize: 12,
    color: "#6D4C41",
    marginLeft: 8,
    lineHeight: 18,
  },
  checkboxSection: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#F0DEC8",
    borderBottomWidth: 1,
    borderBottomColor: "#F0DEC8",
  },
  checkbox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  checkboxLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#3E1F0D",
    flex: 1,
  },
  buttons: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 14,
  },
  btn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  rejectBtn: {
    backgroundColor: "#F5E6D3",
  },
  rejectText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#3E1F0D",
  },
  acceptBtn: {
    backgroundColor: "#3E1F0D",
  },
  acceptBtnDisabled: {
    backgroundColor: "#C4A882",
    opacity: 0.7,
  },
  acceptText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFF5E4",
  },
});
