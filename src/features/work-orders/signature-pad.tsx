import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { AppText } from '@/components/ui/app-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useT } from '@/providers/preferences-provider';

const INK = '#101828';
const STROKE_WIDTH = 3;

export type SignaturePadHandle = {
  clear: () => void;
  isEmpty: () => boolean;
  /** Returns the signature as a standalone SVG document (vector, tiny, crisp at any size). */
  toSvg: () => string;
};

type Props = {
  height?: number;
  /** Lets the parent disable its ScrollView while the user is drawing. */
  onDrawingChange?: (drawing: boolean) => void;
  onChange?: (hasInk: boolean) => void;
};

/**
 * Signature capture built on react-native-svg + PanResponder — no WebView, works on iOS,
 * Android and web. Each stroke is an SVG path, exported as an .svg file to Storage.
 */
export const SignaturePad = forwardRef<SignaturePadHandle, Props>(function SignaturePad(
  { height = 220, onDrawingChange, onChange },
  ref,
) {
  const theme = useTheme();
  const t = useT();
  const [strokes, setStrokes] = useState<string[]>([]);
  const [current, setCurrent] = useState('');
  const currentRef = useRef('');
  const size = useRef({ width: 0, height });

  // Callbacks may change between renders; read the latest ones from a ref inside the responder.
  const callbacks = useRef({ onDrawingChange, onChange });
  useEffect(() => {
    callbacks.current = { onDrawingChange, onChange };
  });

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (e) => {
          const { locationX: x, locationY: y } = e.nativeEvent;
          currentRef.current = `M${x.toFixed(1)} ${y.toFixed(1)}`;
          setCurrent(currentRef.current);
          callbacks.current.onDrawingChange?.(true);
        },
        onPanResponderMove: (e) => {
          const { locationX: x, locationY: y } = e.nativeEvent;
          currentRef.current += ` L${x.toFixed(1)} ${y.toFixed(1)}`;
          setCurrent(currentRef.current);
        },
        onPanResponderRelease: () => {
          // A single tap becomes a dot (a zero-length line with round caps).
          const finished = currentRef.current.includes('L')
            ? currentRef.current
            : `${currentRef.current} l0.1 0`;
          setStrokes((s) => [...s, finished]);
          currentRef.current = '';
          setCurrent('');
          callbacks.current.onDrawingChange?.(false);
          callbacks.current.onChange?.(true);
        },
      }),
    [],
  );

  useImperativeHandle(
    ref,
    () => ({
      clear: () => {
        setStrokes([]);
        onChange?.(false);
      },
      isEmpty: () => strokes.length === 0,
      toSvg: () => {
        const { width: w, height: h } = size.current;
        const paths = strokes
          .map(
            (d) =>
              `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${STROKE_WIDTH}" stroke-linecap="round" stroke-linejoin="round"/>`,
          )
          .join('');
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="#FFFFFF"/>${paths}</svg>`;
      },
    }),
    [strokes, onChange],
  );

  function onLayout(e: LayoutChangeEvent) {
    size.current = { width: Math.round(e.nativeEvent.layout.width), height: Math.round(e.nativeEvent.layout.height) };
  }

  const empty = strokes.length === 0 && !current;

  return (
    <View
      onLayout={onLayout}
      style={[styles.pad, { height, borderColor: theme.border }]}
      accessibilityLabel="Signature area. Draw the customer's signature with your finger."
      {...responder.panHandlers}>
      {/* Paper is always white so the signature looks the same as the exported file. */}
      <Svg width="100%" height="100%" pointerEvents="none">
        {strokes.map((d, i) => (
          <Path key={i} d={d} fill="none" stroke={INK} strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" />
        ))}
        {current ? (
          <Path d={current} fill="none" stroke={INK} strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" />
        ) : null}
      </Svg>
      <View pointerEvents="none" style={styles.baseline}>
        <AppText variant="caption" style={styles.cross}>
          ✕
        </AppText>
        <View style={styles.line} />
      </View>
      {empty ? (
        <View pointerEvents="none" style={styles.placeholder}>
          <AppText variant="caption" style={styles.placeholderText}>
            {t('complete.signHere')}
          </AppText>
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  pad: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  baseline: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    bottom: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  cross: { color: '#98A2B3' },
  line: { flex: 1, height: 1, backgroundColor: '#D0D5DD', marginBottom: 4 },
  placeholder: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: '#98A2B3' },
});
