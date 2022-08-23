import { renderWithRelayWrappers } from "app/tests/renderWithWrappers"
import Metadata from "./Metadata"

it("renders properly", () => {
  const show = {
    kind: "solo",
    name: "Expansive Exhibition",
    exhibition_period: "Jan 1 - March 1",
    status_update: "Closing in 2 days",
    status: "running",
    partner: {
      name: "Gallery",
    },
    location: {
      city: "Berlin",
    },
  }

  renderWithRelayWrappers(<Metadata show={show as any} />)
})
