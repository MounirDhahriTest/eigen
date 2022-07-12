import { SavedSearchAlertsListQuery } from "__generated__/SavedSearchAlertsListQuery.graphql"
import { PageWithSimpleHeader } from "app/Components/PageWithSimpleHeader"
import { getRelayEnvironment } from "app/relay/defaultEnvironment"
import { renderWithPlaceholder } from "app/utils/renderWithPlaceholder"
import { graphql, QueryRenderer } from "react-relay"
import { SavedSearchAlertsListPlaceholder } from "./Components/SavedSearchAlertsListPlaceholder"
import { SavedSearchesListPaginationContainer } from "./Components/SavedSearchesList"
import { SortButton } from "./Components/SortButton"

export const SavedSearchAlertsListQueryRenderer: React.FC = () => {
  return (
    <QueryRenderer<SavedSearchAlertsListQuery>
      environment={getRelayEnvironment()}
      query={graphql`
        query SavedSearchAlertsListQuery {
          me {
            ...SavedSearchesList_me
          }
        }
      `}
      variables={{}}
      cacheConfig={{ force: true }}
      render={renderWithPlaceholder({
        Container: SavedSearchesListPaginationContainer,
        renderPlaceholder: () => (
          <PageWithSimpleHeader title="Saved Alerts" right={<SortButton disabled />}>
            <SavedSearchAlertsListPlaceholder />
          </PageWithSimpleHeader>
        ),
      })}
    />
  )
}
