import { myCollectionDeleteArtworkMutation } from "__generated__/myCollectionDeleteArtworkMutation.graphql"
import { getRelayEnvironment } from "app/relay/defaultEnvironment"
import { commitMutation, graphql } from "react-relay"

export function myCollectionDeleteArtwork(artworkId: string) {
  return new Promise<myCollectionDeleteArtworkMutation["response"]>((resolve, reject) => {
    commitMutation<myCollectionDeleteArtworkMutation>(getRelayEnvironment(), {
      mutation: graphql`
        mutation myCollectionDeleteArtworkMutation($input: MyCollectionDeleteArtworkInput!) {
          myCollectionDeleteArtwork(input: $input) {
            artworkOrError {
              ... on MyCollectionArtworkMutationDeleteSuccess {
                success
              }
              ... on MyCollectionArtworkMutationFailure {
                mutationError {
                  message
                }
              }
            }
          }
        }
      `,
      variables: {
        input: {
          artworkId,
        },
      },
      onCompleted: (response, errors) => {
        if (errors?.length) {
          reject(errors)
        } else if (response.myCollectionDeleteArtwork?.artworkOrError?.mutationError) {
          reject(response.myCollectionDeleteArtwork?.artworkOrError?.mutationError.message)
        } else {
          resolve(response)
        }
      },
      onError: reject,
    })
  })
}
