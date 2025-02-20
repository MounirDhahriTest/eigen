import { OwnerType } from "@artsy/cohesion"
import { MyProfileHeaderMyCollectionAndSavedWorks_me$data } from "__generated__/MyProfileHeaderMyCollectionAndSavedWorks_me.graphql"
import { MyProfileHeaderMyCollectionAndSavedWorksQuery } from "__generated__/MyProfileHeaderMyCollectionAndSavedWorksQuery.graphql"
import { StickyTabPage } from "app/Components/StickyTabPage/StickyTabPage"
import { defaultEnvironment } from "app/relay/createEnvironment"
import { renderWithPlaceholder } from "app/utils/renderWithPlaceholder"
import { ProvideScreenTrackingWithCohesionSchema } from "app/utils/track"
import { screen } from "app/utils/track/helpers"
import { compact } from "lodash"
import { VisualClueDot, VisualClueText } from "palette/elements/VisualClue"
import React from "react"
import { createRefetchContainer, QueryRenderer } from "react-relay"
import { graphql } from "relay-runtime"
import { FavoriteArtworksQueryRenderer } from "../Favorites/FavoriteArtworks"
import { MyCollectionPlaceholder, MyCollectionQueryRenderer } from "../MyCollection/MyCollection"
import { MyCollectionInsightsQR } from "../MyCollection/Screens/Insights/MyCollectionInsights"
import { MyProfileHeader } from "./MyProfileHeader"

export enum Tab {
  collection = "My Collection",
  savedWorks = "Saves",
  insights = "Insights",
}

export const MyProfileHeaderMyCollectionAndSavedWorks: React.FC<{
  me: MyProfileHeaderMyCollectionAndSavedWorks_me$data
}> = ({ me }) => {
  return (
    <StickyTabPage
      disableBackButtonUpdate
      tabs={compact([
        {
          title: Tab.collection,
          content: <MyCollectionQueryRenderer />,
          initial: true,
        },
        {
          title: Tab.insights,
          content: <MyCollectionInsightsQR />,
          visualClues: [
            {
              jsx: (
                <VisualClueDot style={{ marginLeft: 5, alignSelf: "flex-start", marginTop: 1 }} />
              ),
              visualClueName: "AddedArtworkWithInsightsVisualClueDot",
            },
            {
              jsx: <VisualClueText />,
              visualClueName: "MyCollectionInsights",
            },
          ],
        },
        {
          title: Tab.savedWorks,
          content: <FavoriteArtworksQueryRenderer />,
        },
      ])}
      staticHeaderContent={<MyProfileHeader me={me} />}
    />
  )
}

export const LOCAL_PROFILE_ICON_PATH_KEY = "LOCAL_PROFILE_ICON_PATH_KEY"

export const MyProfileHeaderMyCollectionAndSavedWorksFragmentContainer = createRefetchContainer(
  MyProfileHeaderMyCollectionAndSavedWorks,
  {
    me: graphql`
      fragment MyProfileHeaderMyCollectionAndSavedWorks_me on Me {
        ...MyProfileHeader_me
        ...AuctionResultsForArtistsYouCollectRail_me
      }
    `,
  },
  graphql`
    query MyProfileHeaderMyCollectionAndSavedWorksRefetchQuery {
      me {
        ...MyProfileHeaderMyCollectionAndSavedWorks_me
      }
    }
  `
)

export const MyProfileHeaderMyCollectionAndSavedWorksScreenQuery = graphql`
  query MyProfileHeaderMyCollectionAndSavedWorksQuery {
    me @optionalField {
      ...MyProfileHeaderMyCollectionAndSavedWorks_me
    }
  }
`

export const MyProfileHeaderMyCollectionAndSavedWorksQueryRenderer: React.FC = () => {
  return (
    <ProvideScreenTrackingWithCohesionSchema
      info={screen({ context_screen_owner_type: OwnerType.profile })}
    >
      <QueryRenderer<MyProfileHeaderMyCollectionAndSavedWorksQuery>
        environment={defaultEnvironment}
        query={MyProfileHeaderMyCollectionAndSavedWorksScreenQuery}
        render={renderWithPlaceholder({
          Container: MyProfileHeaderMyCollectionAndSavedWorksFragmentContainer,
          renderPlaceholder: () => <MyCollectionPlaceholder />,
        })}
        variables={{}}
      />
    </ProvideScreenTrackingWithCohesionSchema>
  )
}
