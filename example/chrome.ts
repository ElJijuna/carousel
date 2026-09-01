/**
 * The chrome and the sample data the recipes draw with.
 *
 * Re-exported from the Storybook's mocks rather than written again here, and
 * that is deliberate: this app exists to check that what the Storybook renders
 * on react-native-web behaves the same way on a real device. Two separate
 * implementations of the arrows, dots and slides would compare nothing.
 *
 * It is the one import that reaches out of `example/` into the repo, so it is
 * also the one place Metro's `watchFolders` has to cover — everything else
 * goes through the package name.
 */
export * from '../src/stories/mocks';
