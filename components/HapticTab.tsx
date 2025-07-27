import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';
import { Platform, View } from 'react-native';

export function HapticTab({
  children,
  onPress,
  onPressIn,
  onLongPress,
  accessibilityState,
  style,
  ...rest
}: BottomTabBarButtonProps) {
  const isSelected = accessibilityState?.selected ?? false;

  return ( 
    <PlatformPressable
      {...rest}
      accessibilityState={accessibilityState}
      onPress={(e) => {
        if (Platform.OS === 'ios' && !isSelected) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPress?.(e);
      }}
      onPressIn={onPressIn}
      onLongPress={onLongPress}
      style={style}
    >
      <View>{children}</View>
    </PlatformPressable>
  );
}