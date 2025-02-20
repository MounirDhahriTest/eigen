import { fireEvent } from "@testing-library/react-native"
import { popToRoot } from "app/navigation/navigate"
import { renderWithWrappers } from "app/tests/renderWithWrappers"
import { ConsignmentInquiryConfirmation } from "./ConsignmentInquiryConfirmation"

describe("ConsignmentInquiryConfirmation", () => {
  it('"Back to Sell with Artsy" Button pops to root screen', () => {
    const { getByTestId } = renderWithWrappers(<ConsignmentInquiryConfirmation />)
    const button = getByTestId("back-to-swa-button")
    fireEvent.press(button)
    expect(popToRoot).toHaveBeenCalled()
  })
})
