import {
  NavigationAction,
  NavigationContainerRef,
  NavigationState,
  StackActions,
  TabActions,
} from "@react-navigation/native"
import { ViewDescriptor } from "app/navigation/navigate"
import { BottomTabType } from "app/Scenes/BottomTabs/BottomTabType"
import immer from "immer-peasy"
import { last } from "lodash"
import { InteractionManager, NativeModules, StatusBar } from "react-native"
/**
 * Here we maintain references to all the navigators in the main app navigation hierarchy, which are:
 * - tab nav stacks
 *   i.e. what you see whe you switch to a particular tab
 * - the main modal stack
 *   i.e. the place where global modals are presented (excluding FancyModal)
 * - modal nav stacks
 *   i.e. the navigation stack _within_ a presented modal.
 *   These are unique in that they are created and destroyed, while all the others are only created once
 */

// tslint:disable-next-line:variable-name
export const __unsafe_mainModalStackRef = { current: null as NavigationContainerRef<any> | null }

type Mutable<T> = T extends object
  ? {
      -readonly [P in keyof T]: Mutable<T[P]>
    }
  : T extends Array<infer E>
  ? Array<Mutable<E>>
  : T extends ReadonlyArray<infer E2>
  ? Array<Mutable<E2>>
  : T

function updateNavigationState(updater: (draft: Mutable<NavigationState>) => void) {
  const currentState = __unsafe_mainModalStackRef.current?.getRootState()
  const nextState = immer(currentState, updater)
  __unsafe_mainModalStackRef.current?.resetRoot(nextState)
}
function updateTabStackState(
  tab: BottomTabType,
  updater: (draft: Mutable<NavigationState>) => void
) {
  updateNavigationState((state) => {
    if (!state) {
      return
    }
    const tabs = state.routes[0].state?.routes
    const tabState = (
      tabs as Array<{ name: BottomTabType; state: Mutable<NavigationState> }>
    )?.find((x) => x.name === tab)?.state
    if (!tabState) {
      console.error("unable to find tab state for tab", tab, state)
      return
    }
    updater(tabState)
  })
}

// If the user is looking at a modal, return the nav stack ref for that modal, otherwise return null.
function getCurrentlyPresentedModalNavStackKey() {
  const mainModalStackRoutes = __unsafe_mainModalStackRef.current?.getRootState().routes

  if (!mainModalStackRoutes || mainModalStackRoutes.length <= 1) {
    // the user is not looking at a modal.
    return null
  }

  const key = last(mainModalStackRoutes)?.key
  if (!key) {
    throw new Error("Couldn't get modal key")
  }

  return key
}

// When coming from a killed state our nav stack may not be
// set up yet, we check and wait for animations to finish
// to more reliably navigate
function dispatchNavAction(action: NavigationAction) {
  if (!__unsafe_mainModalStackRef.current) {
    InteractionManager.runAfterInteractions(() => {
      __unsafe_mainModalStackRef.current?.dispatch(action)
    })
  } else {
    __unsafe_mainModalStackRef.current?.dispatch(action)
  }
}

export const ARScreenPresenterModule: typeof NativeModules["ARScreenPresenterModule"] = {
  switchTab(tab: BottomTabType) {
    dispatchNavAction(TabActions.jumpTo(tab))
  },
  presentModal(viewDescriptor: ViewDescriptor) {
    if (viewDescriptor.replace) {
      dispatchNavAction(
        StackActions.replace("modal", {
          rootModuleName: viewDescriptor.moduleName,
          rootModuleProps: viewDescriptor.props,
        })
      )
    } else {
      dispatchNavAction(
        StackActions.push("modal", {
          rootModuleName: viewDescriptor.moduleName,
          rootModuleProps: viewDescriptor.props,
        })
      )
    }
  },
  async popToRootAndScrollToTop(selectedTab: BottomTabType) {
    updateTabStackState(selectedTab, (state) => {
      state.routes = [state.routes[0]]
      state.index = 0
    })
    if (__DEV__) {
      // TODO: scroll to top
      console.warn("TODO: scroll to top")
    }
  },
  popToRootOrScrollToTop(selectedTab: BottomTabType) {
    updateTabStackState(selectedTab, (state) => {
      if (state.routes.length > 1) {
        state.routes = [state.routes[0]]
        state.index = 0
      } else {
        if (__DEV__) {
          // TODO: scroll to top
          console.warn("TODO: scroll to top")
        }
      }
    })
  },
  pushView(selectedTab: BottomTabType, viewDescriptor: ViewDescriptor) {
    const stackKey = getCurrentlyPresentedModalNavStackKey() ?? selectedTab
    dispatchNavAction(
      StackActions.push("screen:" + stackKey, {
        moduleName: viewDescriptor.moduleName,
        props: viewDescriptor.props,
      })
    )
  },
  popStack(selectedTab: BottomTabType) {
    updateTabStackState(selectedTab, (state) => {
      state.routes.pop()
      state.index -= 1
    })
  },
  goBack(_selectedTab: BottomTabType) {
    __unsafe_mainModalStackRef.current?.goBack()
  },
  dismissModal(..._args: any[]) {
    StatusBar.setBarStyle("dark-content", true)
    updateNavigationState((state) => {
      if (state.routes.length === 1) {
        return
      }
      state.routes.pop()
      state.index -= 1
    })
  },
  updateShouldHideBackButton: () => {
    console.warn("updateShouldHideBackButton not yet supported")
  },
}
