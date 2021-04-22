import { SafeAreaInsets } from "lib/types/SafeAreaInsets"
import { useSafeAreaFrame, useSafeAreaInsets } from "react-native-safe-area-context"

export type ScreenOrientation = "landscape" | "portrait"

export interface ScreenDimensions {
  width: number
  height: number
  orientation: ScreenOrientation
}

export interface ScreenDimensionsWithSafeAreas extends ScreenDimensions {
  safeAreaInsets: SafeAreaInsets
  fullWidth: number
  fullHeight: number
}

/**
 * Call during render to be notified whenever `screenDimensions` changes
 */
export const useScreenDimensions = (): ScreenDimensionsWithSafeAreas => {
  const insets = useSafeAreaInsets()
  const frame = useSafeAreaFrame()

  return {
    safeAreaInsets: insets,
    safeAreaWidth: frame.width,
    safeAreaHeight: frame.height,

    get width() {
      return this.safeAreaWidth + this.safeAreaInsets.left + this.safeAreaInsets.right
    },
    get height() {
      return this.safeAreaHeight + this.safeAreaInsets.top + this.safeAreaInsets.bottom
    },
    get orientation() {
      return this.fullWidth > this.fullHeight ? "landscape" : "portrait"
    },
  }
}
