import { act, fireEvent, RenderAPI, screen, waitFor } from "@testing-library/react-native"
import { RecentSearch } from "app/Scenes/Search/SearchModel"
import { __globalStoreTestUtils__ } from "app/store/GlobalStore"
import { mockTrackEvent } from "app/tests/globallyMockedStuff"
import { renderWithRelayWrappers } from "app/tests/renderWithWrappers"
import { resolveMostRecentRelayOperation } from "app/tests/resolveMostRecentRelayOperation"
import { waitForSuspenseToBeRemoved } from "app/tests/waitForSupenseToBeRemoved"
import { useExperimentFlag } from "app/utils/experiments/hooks"
import { isPad } from "app/utils/hardware"
import { Pill } from "palette"
import { Keyboard } from "react-native"
import { SearchScreen } from "./Search"

const banksy: RecentSearch = {
  type: "AUTOSUGGEST_RESULT_TAPPED",
  props: {
    displayLabel: "Banksy",
    displayType: "Artist",
    href: "https://artsy.com/artist/banksy",
    imageUrl: "https://org-name.my-cloud-provider.com/bucket-hash/content-hash.jpg",
    __typename: "Artist",
  },
}

jest.mock("app/utils/hardware", () => ({
  isPad: jest.fn(),
}))
jest.mock("app/utils/useSearchInsightsConfig", () => ({
  useSearchInsightsConfig: () => true,
}))
jest.mock("app/utils/useAlgoliaIndices", () => ({
  useAlgoliaIndices: () => ({
    indicesInfo: {
      Artist_staging: { hasResults: true },
      Sale_staging: { hasResults: false },
      Fair_staging: { hasResults: false },
      Gallery_staging: { hasResults: true },
    },
    updateIndicesInfo: jest.fn(),
  }),
}))
jest.mock("lodash", () => ({
  ...jest.requireActual("lodash"),
  throttle: (fn: any) => {
    fn.flush = jest.fn()

    return fn
  },
}))

jest.mock("app/utils/experiments/hooks", () => ({
  ...jest.requireActual("app/utils/experiments/hooks"),
  useExperimentFlag: jest.fn(),
}))

describe("Search Screen", () => {
  it("should render a text input with placeholder", async () => {
    renderWithRelayWrappers(<SearchScreen />)

    resolveMostRecentRelayOperation({
      Query: () => ({
        system: {
          algolia: {
            appID: "",
            apiKey: "",
            indices: [{ name: "Artist_staging", displayName: "Artists", key: "artist" }],
          },
        },
      }),
    })
    await waitForSuspenseToBeRemoved("search-placeholder")

    const searchInput = screen.getByPlaceholderText("Search artists, artworks, galleries, etc")

    // Pill should not be visible
    expect(screen.queryByText("Artists")).toBeFalsy()

    // should show City Guide
    expect(screen.getByText("City Guide")).toBeTruthy()
    expect(screen.getByText("Recent Searches")).toBeTruthy()

    fireEvent.changeText(searchInput, "Ba")

    // Pills should be visible
    screen.getByText("Artworks")
    screen.getByText("Artists")
  })

  it("does not show city guide entrance when on iPad", async () => {
    const isPadMock = isPad as jest.Mock
    isPadMock.mockImplementationOnce(() => true)
    const { queryByText } = renderWithRelayWrappers(<SearchScreen />)

    resolveMostRecentRelayOperation({
      Query: () => ({
        system: {
          algolia: {
            appID: "",
            apiKey: "",
            indices: [{ name: "Artist_staging", displayName: "Artists", key: "artist" }],
          },
        },
      }),
    })
    await waitForSuspenseToBeRemoved("search-placeholder")

    expect(queryByText("City Guide")).toBeFalsy()
  })

  it("shows city guide entrance when there are recent searches", async () => {
    __globalStoreTestUtils__?.injectState({
      search: {
        recentSearches: [banksy],
      },
    })
    const isPadMock = isPad as jest.Mock
    isPadMock.mockImplementationOnce(() => false)
    const { getByText } = renderWithRelayWrappers(<SearchScreen />)
    resolveMostRecentRelayOperation({
      Query: () => ({
        system: {
          algolia: {
            appID: "",
            apiKey: "",
            indices: [{ name: "Artist_staging", displayName: "Artists", key: "artist" }],
          },
        },
      }),
    })
    await waitForSuspenseToBeRemoved("search-placeholder")

    expect(getByText("City Guide")).toBeTruthy()
  })

  it('the "Top" pill should be selected by default', async () => {
    const { getByA11yState, getByPlaceholderText } = renderWithRelayWrappers(<SearchScreen />)
    resolveMostRecentRelayOperation({
      Query: () => ({
        system: {
          algolia: {
            appID: "",
            apiKey: "",
            indices: [{ name: "Artist_staging", displayName: "Artists", key: "artist" }],
          },
        },
      }),
    })
    await waitForSuspenseToBeRemoved("search-placeholder")

    const searchInput = getByPlaceholderText("Search artists, artworks, galleries, etc")

    fireEvent.changeText(searchInput, "text")

    expect(getByA11yState({ selected: true })).toHaveTextContent("Top")
  })

  it("should not be able to untoggle the same pill", async () => {
    const { getByPlaceholderText, getByText, getByA11yState } = renderWithRelayWrappers(
      <SearchScreen />
    )

    resolveMostRecentRelayOperation({
      Query: () => ({
        system: {
          algolia: {
            appID: "",
            apiKey: "",
            indices: [
              {
                name: "Artist_staging",
                displayName: "Artists",
                key: "artist",
              },
              {
                name: "Gallery_staging",
                displayName: "Gallery",
                key: "partner_gallery",
              },
            ],
          },
        },
      }),
    })
    await waitForSuspenseToBeRemoved("search-placeholder")

    const searchInput = getByPlaceholderText("Search artists, artworks, galleries, etc")
    fireEvent(searchInput, "changeText", "prev value")
    fireEvent(getByText("Artists"), "press")

    expect(getByA11yState({ selected: true })).toHaveTextContent("Artists")
  })

  describe("search pills", () => {
    describe("when improved search pills are enabled", () => {
      const mockUseExperimentFlag = useExperimentFlag as jest.Mock

      beforeEach(() => {
        mockUseExperimentFlag.mockImplementation(() => true)
      })

      it("are displayed when the user has typed the minimum allowed number of characters", async () => {
        const { getByPlaceholderText, queryByText } = renderWithRelayWrappers(<SearchScreen />)

        resolveMostRecentRelayOperation({
          Query: () => ({
            system: {
              algolia: {
                appID: "",
                apiKey: "",
                indices: INDICES,
              },
            },
          }),
        })
        await waitForSuspenseToBeRemoved("search-placeholder")

        expect(queryByText("Top")).toBeFalsy()
        expect(queryByText("Artist")).toBeFalsy()
        expect(queryByText("Auction")).toBeFalsy()
        expect(queryByText("Gallery")).toBeFalsy()
        expect(queryByText("Fair")).toBeFalsy()

        const searchInput = getByPlaceholderText("Search artists, artworks, galleries, etc")
        fireEvent(searchInput, "changeText", "Ba")

        expect(queryByText("Top")).toBeTruthy()
        expect(queryByText("Artist")).toBeTruthy()
        expect(queryByText("Auction")).toBeTruthy()
        expect(queryByText("Gallery")).toBeTruthy()
        expect(queryByText("Fair")).toBeTruthy()
      })

      it("have top pill selected and disabled at the same time", async () => {
        const { getByPlaceholderText, getByA11yState } = renderWithRelayWrappers(<SearchScreen />)

        resolveMostRecentRelayOperation({
          Query: () => ({
            system: {
              algolia: {
                appID: "",
                apiKey: "",
                indices: INDICES,
              },
            },
          }),
        })
        await waitForSuspenseToBeRemoved("search-placeholder")

        const searchInput = getByPlaceholderText("Search artists, artworks, galleries, etc")
        fireEvent(searchInput, "changeText", "Ba")
        const topPill = getByA11yState({ selected: true, disabled: true })
        expect(topPill).toHaveTextContent("Top")
      })

      it("are enabled when they have results", async () => {
        const { getByPlaceholderText, UNSAFE_getAllByType } = renderWithRelayWrappers(
          <SearchScreen />
        )
        resolveMostRecentRelayOperation({
          Query: () => ({
            system: {
              algolia: {
                appID: "",
                apiKey: "",
                indices: INDICES,
              },
            },
          }),
        })
        await waitForSuspenseToBeRemoved("search-placeholder")

        const searchInput = getByPlaceholderText("Search artists, artworks, galleries, etc")
        fireEvent(searchInput, "changeText", "Ba")
        const enabledPills = UNSAFE_getAllByType(Pill).filter(
          (pill) => pill.props.disabled === false
        )
        expect(enabledPills).toHaveLength(3)
        expect(enabledPills[0]).toHaveTextContent("Artworks")
        expect(enabledPills[1]).toHaveTextContent("Artist")
        expect(enabledPills[2]).toHaveTextContent("Gallery")
      })
    })

    it("are displayed when the user has typed the minimum allowed number of characters", async () => {
      const { getByPlaceholderText, queryByText } = renderWithRelayWrappers(<SearchScreen />)
      resolveMostRecentRelayOperation({
        Query: () => ({
          system: {
            algolia: {
              appID: "",
              apiKey: "",
              indices: INDICES,
            },
          },
        }),
      })
      await waitForSuspenseToBeRemoved("search-placeholder")

      const searchInput = getByPlaceholderText("Search artists, artworks, galleries, etc")

      expect(queryByText("Top")).toBeFalsy()
      expect(queryByText("Artist")).toBeFalsy()
      expect(queryByText("Auction")).toBeFalsy()
      expect(queryByText("Gallery")).toBeFalsy()
      expect(queryByText("Fair")).toBeFalsy()

      fireEvent(searchInput, "changeText", "Ba")

      expect(queryByText("Top")).toBeTruthy()
      expect(queryByText("Artist")).toBeTruthy()
      expect(queryByText("Auction")).toBeTruthy()
      expect(queryByText("Gallery")).toBeTruthy()
      expect(queryByText("Fair")).toBeTruthy()
    })

    it("hide keyboard when selecting other pill", async () => {
      const { getByText, getByPlaceholderText } = renderWithRelayWrappers(<SearchScreen />)

      resolveMostRecentRelayOperation({
        Query: () => ({
          system: {
            algolia: {
              appID: "",
              apiKey: "",
              indices: [{ name: "Artist_staging", displayName: "Artist", key: "artist" }],
            },
          },
        }),
      })
      await waitForSuspenseToBeRemoved("search-placeholder")

      const searchInput = getByPlaceholderText("Search artists, artworks, galleries, etc")
      const keyboardDismissSpy = jest.spyOn(Keyboard, "dismiss")
      fireEvent(searchInput, "changeText", "Ba")
      fireEvent(getByText("Artist"), "press")
      expect(keyboardDismissSpy).toHaveBeenCalled()
    })

    it("should track event when a pill is tapped", async () => {
      const { getByText, getByPlaceholderText } = renderWithRelayWrappers(<SearchScreen />)

      resolveMostRecentRelayOperation({
        Query: () => ({
          system: {
            algolia: {
              appID: "",
              apiKey: "",
              indices: [{ name: "Artist_staging", displayName: "Artist", key: "artist" }],
            },
          },
        }),
      })
      await waitForSuspenseToBeRemoved("search-placeholder")

      const searchInput = getByPlaceholderText("Search artists, artworks, galleries, etc")
      fireEvent(searchInput, "changeText", "text")

      fireEvent(getByText("Artist"), "press")
      expect(mockTrackEvent.mock.calls[1]).toMatchInlineSnapshot(`
        Array [
          Object {
            "action": "tappedNavigationTab",
            "context_module": "topTab",
            "context_screen": "Search",
            "context_screen_owner_type": "search",
            "query": "text",
            "subject": "Artist",
          },
        ]
      `)
    })

    it("should correctly track the previously applied pill context module", async () => {
      const { getByText, getByPlaceholderText } = renderWithRelayWrappers(<SearchScreen />)

      resolveMostRecentRelayOperation({
        Query: () => ({
          system: {
            algolia: {
              appID: "",
              apiKey: "",
              indices: [{ name: "Artist_staging", displayName: "Artist", key: "artist" }],
            },
          },
        }),
      })
      await waitForSuspenseToBeRemoved("search-placeholder")

      const searchInput = getByPlaceholderText("Search artists, artworks, galleries, etc")
      fireEvent(searchInput, "changeText", "text")

      fireEvent(getByText("Artist"), "press")
      expect(mockTrackEvent.mock.calls[1]).toMatchInlineSnapshot(`
        Array [
          Object {
            "action": "tappedNavigationTab",
            "context_module": "topTab",
            "context_screen": "Search",
            "context_screen_owner_type": "search",
            "query": "text",
            "subject": "Artist",
          },
        ]
      `)

      fireEvent(getByText("Artworks"), "press")
      expect(mockTrackEvent.mock.calls[2]).toMatchInlineSnapshot(`
        Array [
          Object {
            "action": "tappedNavigationTab",
            "context_module": "artistsTab",
            "context_screen": "Search",
            "context_screen_owner_type": "search",
            "query": "text",
            "subject": "Artworks",
          },
        ]
      `)
    })

    it("should render all allowed algolia indices", async () => {
      const { getByPlaceholderText, getByText } = renderWithRelayWrappers(<SearchScreen />)

      resolveMostRecentRelayOperation({
        Query: () => ({
          system: {
            algolia: {
              appID: "",
              apiKey: "",
              indices: [
                {
                  displayName: "Artist",
                  key: "artist",
                  name: "Artist_staging",
                },
                {
                  displayName: "Article",
                  key: "article",
                  name: "Article_staging",
                },
                {
                  displayName: "Auction",
                  key: "sale",
                  name: "Sale_staging",
                },
                {
                  displayName: "Artist Series",
                  key: "artist_series",
                  name: "ArtistSeries_staging",
                },
                {
                  displayName: "Collection",
                  key: "marketing_collection",
                  name: "MarketingCollection_staging",
                },
                {
                  displayName: "Fair",
                  key: "fair",
                  name: "Fair_staging",
                },
                {
                  displayName: "Show",
                  key: "partner_show",
                  name: "PartnerShow_staging",
                },
                {
                  displayName: "Gallery",
                  key: "partner_gallery",
                  name: "PartnerGallery_staging",
                },
              ],
            },
          },
        }),
      })
      await waitForSuspenseToBeRemoved("search-placeholder")

      const searchInput = getByPlaceholderText("Search artists, artworks, galleries, etc")
      act(() => fireEvent(searchInput, "changeText", "value"))

      expect(getByText("Artist")).toBeTruthy()
      expect(getByText("Article")).toBeTruthy()
      expect(getByText("Auction")).toBeTruthy()
      expect(getByText("Artist Series")).toBeTruthy()
      expect(getByText("Collection")).toBeTruthy()
      expect(getByText("Fair")).toBeTruthy()
      expect(getByText("Show")).toBeTruthy()
      expect(getByText("Gallery")).toBeTruthy()
    })

    it("should render only allowed algolia indices", async () => {
      const { getByPlaceholderText, getByText, queryByText } = renderWithRelayWrappers(
        <SearchScreen />
      )

      resolveMostRecentRelayOperation({
        Query: () => ({
          system: {
            algolia: {
              appID: "",
              apiKey: "",
              indices: [
                {
                  name: "Artist_staging",
                  displayName: "Artist",
                  key: "artist",
                },
                {
                  name: "Gallery_staging",
                  displayName: "Gallery",
                  key: "partner_gallery",
                },
                {
                  name: "Denied_staging",
                  displayName: "Denied",
                  key: "denied",
                },
              ],
            },
          },
        }),
      })
      await waitForSuspenseToBeRemoved("search-placeholder")

      const searchInput = getByPlaceholderText("Search artists, artworks, galleries, etc")
      fireEvent(searchInput, "changeText", "value")

      expect(getByText("Artist")).toBeTruthy()
      expect(getByText("Gallery")).toBeTruthy()
      expect(queryByText("Denied")).toBeFalsy()
    })
  })

  describe("the top pill is selected by default", () => {
    let tree: RenderAPI

    beforeEach(async () => {
      tree = renderWithRelayWrappers(<SearchScreen />)

      resolveMostRecentRelayOperation({
        Algolia: () => ({
          appID: "",
          apiKey: "",
          indices: [
            {
              name: "Artist_staging",
              displayName: "Artists",
              key: "artist",
            },
          ],
        }),
      })
      await waitForSuspenseToBeRemoved("search-placeholder")
    })

    it("when search query is empty", () => {
      const { queryByA11yState, getByPlaceholderText, getByText } = tree
      const searchInput = getByPlaceholderText("Search artists, artworks, galleries, etc")

      fireEvent(searchInput, "changeText", "prev value")
      fireEvent(getByText("Artists"), "press")
      fireEvent(searchInput, "changeText", "")
      fireEvent(searchInput, "changeText", "new value")

      expect(queryByA11yState({ selected: true })).toHaveTextContent("Top")
    })

    it("when the query is changed", () => {
      const { queryByA11yState, getByPlaceholderText, getByText } = tree
      const searchInput = getByPlaceholderText("Search artists, artworks, galleries, etc")

      fireEvent(searchInput, "changeText", "12")
      fireEvent(getByText("Artists"), "press")
      fireEvent(searchInput, "changeText", "123")

      expect(queryByA11yState({ selected: true })).toHaveTextContent("Top")
    })

    it("when clear button is pressed", () => {
      const { queryByA11yState, getByPlaceholderText, getByText, getByLabelText } = tree
      const searchInput = getByPlaceholderText("Search artists, artworks, galleries, etc")

      fireEvent(searchInput, "changeText", "prev value")
      fireEvent(getByText("Artists"), "press")
      fireEvent(getByLabelText("Clear input button"), "press")
      fireEvent(searchInput, "changeText", "new value")

      expect(queryByA11yState({ selected: true })).toHaveTextContent("Top")
    })

    it("when cancel button is pressed", () => {
      const { queryByA11yState, getByPlaceholderText, getByText } = tree
      const searchInput = getByPlaceholderText("Search artists, artworks, galleries, etc")

      fireEvent(searchInput, "changeText", "prev value")
      fireEvent(getByText("Artists"), "press")
      fireEvent(searchInput, "focus")
      fireEvent(getByText("Cancel"), "press")
      fireEvent(searchInput, "changeText", "new value")

      expect(queryByA11yState({ selected: true })).toHaveTextContent("Top")
    })
  })

  it("should track event when a search result is pressed", async () => {
    const { getByPlaceholderText, getByText } = renderWithRelayWrappers(<SearchScreen />)

    resolveMostRecentRelayOperation({
      Query: () => ({
        system: {
          algolia: {
            appID: "",
            apiKey: "",
            indices: [{ name: "Artist_staging", displayName: "Artist", key: "artist" }],
          },
        },
      }),
    })
    await waitForSuspenseToBeRemoved("search-placeholder")

    const searchInput = getByPlaceholderText("Search artists, artworks, galleries, etc")
    act(() => fireEvent(searchInput, "changeText", "text"))

    resolveMostRecentRelayOperation({
      SearchableConnection: () => ({
        edges: [
          {
            node: {
              displayLabel: "Banksy",
            },
          },
        ],
      }),
    })
    await waitFor(() => getByText("Banksy"))

    act(() => fireEvent.press(getByText("Banksy")))

    expect(mockTrackEvent.mock.calls[1]).toMatchInlineSnapshot(`
      Array [
        Object {
          "action": "selectedResultFromSearchScreen",
          "context_module": "topTab",
          "context_screen": "Search",
          "context_screen_owner_type": "Search",
          "position": 0,
          "query": "text",
          "selected_object_slug": "slug-1",
          "selected_object_type": "displayType-1",
        },
      ]
    `)
  })
})

const INDICES = [
  { name: "Artist_staging", displayName: "Artist", key: "artist" },
  { name: "Sale_staging", displayName: "Auction", key: "sale" },
  { name: "Gallery_staging", displayName: "Gallery", key: "partner_gallery" },
  { name: "Fair_staging", displayName: "Fair", key: "fair" },
]
