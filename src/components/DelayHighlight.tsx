import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text } from "react-native";
import { DepartureDelay } from "../domain/value-objects/DepartureDelay";

type Props = {
  delay: DepartureDelay;
};

export function DelayHighlight({ delay }: Props) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!delay.shouldAnimate) {
      pulse.setValue(1);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.45,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => animation.stop();
  }, [delay.shouldAnimate, pulse]);

  const color =
    delay.severity === "MAJOR"
      ? "#DC2626"
      : delay.severity === "MINOR"
        ? "#D97706"
        : "#15803D";

  return (
    <Animated.View
      style={[styles.badge, { backgroundColor: `${color}18`, opacity: pulse }]}
    >
      <Text style={[styles.text, { color }]}>{delay.formattedText}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 14,
    fontWeight: "700",
  },
});
