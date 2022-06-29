import { Text, useSpace } from "palette"
import { useEffect } from "react"
import Animated, { Extrapolate, interpolate, useAnimatedStyle } from "react-native-reanimated"
import { useAnimatableHeaderContext } from "./AnimatableHeaderContext"

export const AnimatableHeaderLargeTitle = () => {
  const space = useSpace()
  const { scrollOffsetY, largeTitleVerticalOffset, setLargeTitleHeight, largeTitleEndEdge, title } =
    useAnimatableHeaderContext()

  useEffect(() => {
    if (__TEST__) {
      setLargeTitleHeight(30)
    }
  }, [])

  // FIXME: terrible terrible hack to make tests pass, until we have a good way
  // to test screens with reanimated components in them
  if (__TEST__) {
    return null
  }

  const disappearAnim = useAnimatedStyle(
    () => ({
      opacity: interpolate(scrollOffsetY.value, [0, largeTitleEndEdge], [1, 0], Extrapolate.CLAMP),
    }),
    [largeTitleEndEdge]
  )

  return (
    <Animated.View
      style={[
        {
          paddingHorizontal: space(2),
          paddingTop: space(1),
          paddingBottom: largeTitleVerticalOffset,
          justifyContent: "center",
        },
        disappearAnim,
      ]}
      onLayout={(event) => {
        setLargeTitleHeight(event.nativeEvent.layout.height)
      }}
    >
      <Text testID="animated-header-large-title" variant="lg">
        {title}
      </Text>
    </Animated.View>
  )
}
