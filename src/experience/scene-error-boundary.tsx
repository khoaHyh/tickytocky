import { Component, type ReactNode } from "react"

type SceneErrorBoundaryProps = Readonly<{
  children: ReactNode
  fallback: ReactNode
}>

type SceneErrorBoundaryState = Readonly<{
  failed: boolean
}>

/** Preserves the semantic lesson when lazy scene code or the watch asset fails. */
export class SceneErrorBoundary extends Component<SceneErrorBoundaryProps, SceneErrorBoundaryState> {
  state: SceneErrorBoundaryState = { failed: false }

  static getDerivedStateFromError(): SceneErrorBoundaryState {
    return { failed: true }
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}
