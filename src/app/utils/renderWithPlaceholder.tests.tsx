import { renderWithWrappers } from "app/tests/renderWithWrappers"
import { Text } from "react-native"
import { renderWithPlaceholder } from "./renderWithPlaceholder"

describe(renderWithPlaceholder, () => {
  it(`renders the placeholder while the graphqls are loading`, () => {
    const { getByText } = renderWithWrappers(
      renderWithPlaceholder({
        Container: () => null,
        renderPlaceholder: () => <Text>this is the placeholder</Text>,
      })({ error: null, props: null, retry: () => null })!
    )

    expect(getByText("this is the placeholder")).toBeTruthy()
  })

  it(`renders the real content when the graphqls are done`, () => {
    const { getByText } = renderWithWrappers(
      renderWithPlaceholder({
        Container: () => <Text>the real content</Text>,
        renderPlaceholder: () => <Text>this is the placeholder</Text>,
      })({ error: null, props: {}, retry: () => null })!
    )

    expect(getByText("the real content")).toBeTruthy()
  })
})
