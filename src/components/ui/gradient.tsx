import { useId, type PropsWithChildren } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';

/**
 * Brand gradient surface (navy → electric blue) with soft glow orbs.
 * Drawn with react-native-svg, which we already ship, so no extra gradient dependency.
 */
export function BrandGradient({ style, children }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  // Gradient ids must be unique per instance: on web, two screens in the stack share one DOM,
  // and a url(#id) pointing into a hidden screen's <svg> renders nothing.
  const uid = useId().replace(/:/g, '');
  const id = (name: string) => `${name}-${uid}`;
  return (
    <View style={[styles.container, style]}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id={id('bg')} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#0B1220" />
            <Stop offset="0.55" stopColor="#1A3A9E" />
            <Stop offset="1" stopColor="#2F6BFF" />
          </LinearGradient>
          <RadialGradient id={id('glowA')} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#5B8CFF" stopOpacity="0.55" />
            <Stop offset="1" stopColor="#5B8CFF" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id={id('glowB')} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#8B5CF6" stopOpacity="0.45" />
            <Stop offset="1" stopColor="#8B5CF6" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${id('bg')})`} />
        <Circle cx="88%" cy="8%" r="160" fill={`url(#${id('glowA')})`} />
        <Circle cx="5%" cy="95%" r="140" fill={`url(#${id('glowB')})`} />
      </Svg>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: 'hidden' },
});
