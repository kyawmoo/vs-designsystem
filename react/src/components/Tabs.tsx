import { SegmentedControl } from './SegmentedControl';
import type { SegmentedControlItem, SegmentedControlProps } from './SegmentedControl';

/*
 * Deprecated aliases (2026-10-06). The component formerly exported as `Tabs` is a segmented control and is
 * now `SegmentedControl`. These aliases keep existing imports working, with identical output, until consumers
 * switch; the name `Tabs` will then be reused for real underline tabs (issue #27), with different props.
 */

/** @deprecated Use `SegmentedControl` — same component, same output. `Tabs` will become underline tabs. */
export const Tabs = SegmentedControl;

/** @deprecated Use `SegmentedControlProps`. */
export type TabsProps = SegmentedControlProps;

/** @deprecated Use `SegmentedControlItem`. */
export type TabItem = SegmentedControlItem;
