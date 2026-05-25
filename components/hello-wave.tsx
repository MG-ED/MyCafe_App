import { useEffect } from "react";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from "react-native-reanimated";

export function HelloWave() {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
  }, [rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: `${(rotation.value * 10 - 5).toFixed(2)}deg`,
      },
    ],
  }));

  return (
    <Animated.Text
      style={[
        {
          fontSize: 28,
          lineHeight: 32,
          marginTop: -6,
        },
        animatedStyle,
      ]}
    >
      👋
    </Animated.Text>
  );
}
