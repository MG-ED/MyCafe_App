/**
 * LoadingButton.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Drop-in replacement for TouchableOpacity that:
 *   • Automatically disables itself when `loading` is true
 *   • Shows an inline spinner so users know the tap registered
 *   • Prevents accidental double-taps
 *   • Matches the MyCafe brand palette
 *
 * Usage:
 *   <LoadingButton
 *     loading={isLoading}
 *     onPress={handleLogin}
 *     label="Sign In"
 *   />
 */

import React, { useEffect, useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  Easing,
  ViewStyle,
  TextStyle,
} from 'react-native';

// ─── Brand palette ────────────────────────────────────────────────────────
const C = {
  caramel:   '#C8793A',
  caramelDim:'#A0612E',
  cream:     '#FAF3E0',
  disabled:  '#D4C4B0',
  espresso:  '#2C1A0E',
};

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface LoadingButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: ButtonVariant;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  fullWidth?: boolean;
}

export default function LoadingButton({
  label,
  onPress,
  loading  = false,
  disabled = false,
  variant  = 'primary',
  style,
  labelStyle,
  fullWidth = false,
}: LoadingButtonProps) {
  const spinValue = useRef(new Animated.Value(0)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;

  const spin = spinValue.interpolate({
    inputRange:  [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1, duration: 800, easing: Easing.linear, useNativeDriver: true,
        })
      ).start();
    } else {
      spinValue.stopAnimation();
      spinValue.setValue(0);
    }
  }, [loading, spinValue]);

  const handlePressIn = () =>
    Animated.spring(pressAnim, { toValue: 0.96, useNativeDriver: true }).start();

  const handlePressOut = () =>
    Animated.spring(pressAnim, { toValue: 1, useNativeDriver: true }).start();

  const isDisabled = disabled || loading;

  const variantStyles: Record<ButtonVariant, { container: ViewStyle; label: TextStyle }> = {
    primary: {
      container: { backgroundColor: isDisabled ? C.disabled : C.caramel },
      label:     { color: C.cream },
    },
    secondary: {
      container: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: isDisabled ? C.disabled : C.caramel,
      },
      label: { color: isDisabled ? C.disabled : C.caramel },
    },
    ghost: {
      container: { backgroundColor: 'transparent' },
      label:     { color: isDisabled ? C.disabled : C.caramel },
    },
    danger: {
      container: { backgroundColor: isDisabled ? C.disabled : '#C0392B' },
      label:     { color: C.cream },
    },
  };

  return (
    <Animated.View
      style={[
        fullWidth && styles.fullWidth,
        { transform: [{ scale: pressAnim }] },
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        activeOpacity={0.9}
        style={[
          styles.button,
          variantStyles[variant].container,
          fullWidth && styles.fullWidth,
          style,
        ]}
      >
        {loading && (
          <Animated.View style={[styles.spinner, { transform: [{ rotate: spin }] }]} />
        )}
        <Text
          style={[
            styles.label,
            variantStyles[variant].label,
            loading && styles.labelWithSpinner,
            labelStyle,
          ]}
        >
          {loading ? label : label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    gap: 8,
    shadowColor: C.espresso,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  fullWidth: {
    width: '100%',
  },
  spinner: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.3)',
    borderTopColor: '#fff',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  labelWithSpinner: {
    opacity: 0.85,
  },
});
