import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { Backdrop } from './components/Backdrop';
import { Glass } from './components/Glass';
import { type Recipe, recipes } from './recipes';
import { theme } from './theme';

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  fills: { flex: 1 },

  list: { paddingHorizontal: 16, paddingBottom: 32 },
  intro: { paddingHorizontal: 8, paddingTop: 16, paddingBottom: 20 },
  eyebrow: {
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: theme.accent,
  },
  introTitle: { marginTop: 8, fontSize: 30, fontWeight: '700', color: theme.ink },
  introText: { marginTop: 10, fontSize: 14, lineHeight: 21, color: theme.inkMuted },

  row: { marginBottom: 12 },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  rowPressed: { backgroundColor: theme.glassPressed },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 16, fontWeight: '600', color: theme.ink },
  rowBlurb: { marginTop: 4, fontSize: 13, lineHeight: 18, color: theme.inkMuted },
  chevron: { fontSize: 22, lineHeight: 24, color: theme.inkFaint },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  back: { borderRadius: 999 },
  backPressed: { backgroundColor: theme.glassPressed },
  backInner: { paddingHorizontal: 14, paddingVertical: 8 },
  backText: { fontSize: 14, fontWeight: '600', color: theme.accent },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '600', color: theme.ink },

  page: { paddingHorizontal: 16, paddingBottom: 40 },
  blurb: {
    paddingHorizontal: 8,
    paddingBottom: 14,
    fontSize: 13,
    lineHeight: 19,
    color: theme.inkMuted,
  },
  // The room the carousels are given at their left and right edges. It sits on
  // a wrapper rather than on the `Carousel` itself on purpose: the carousel
  // measures its own outer view, and `onLayout` reports a padded view at its
  // full width — so padding passed to `style` would be room the slide widths
  // were computed as if they still had.
  stage: { paddingVertical: 22, paddingHorizontal: 16 },
  // A full-screen recipe brings its own light chrome, so it gets a surface to
  // be light against instead of a pane of glass.
  screen: {
    flex: 1,
    margin: 16,
    borderRadius: 28,
    backgroundColor: theme.screen,
    overflow: 'hidden',
  },
});

/** The list of recipes. */
const Menu = ({ onOpen }: { onOpen: (recipe: Recipe) => void }) => (
  <ScrollView contentContainerStyle={styles.list} contentInsetAdjustmentBehavior="automatic">
    <View style={styles.intro}>
      <Text style={styles.eyebrow}>@real-native/carousel</Text>
      <Text style={styles.introTitle}>Carousel recipes</Text>
      <Text style={styles.introText}>
        The same recipes the Storybook renders on react-native-web, running against the library's
        TypeScript source on this device. Edit anything under src/ and this app reloads.
      </Text>
    </View>
    {recipes.map((recipe) => (
      <Pressable
        key={recipe.id}
        accessibilityRole="button"
        onPress={() => onOpen(recipe)}
        style={styles.row}
      >
        {({ pressed }) => (
          <Glass style={pressed ? styles.rowPressed : undefined}>
            <View style={styles.rowInner}>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{recipe.title}</Text>
                <Text style={styles.rowBlurb}>{recipe.blurb}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </View>
          </Glass>
        )}
      </Pressable>
    ))}
  </ScrollView>
);

/** One recipe, under a bar that goes back to the menu. */
const RecipeScreen = ({ recipe, onBack }: { recipe: Recipe; onBack: () => void }) => {
  const { Screen } = recipe;

  return (
    <View style={styles.fills}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.back}>
          {({ pressed }) => (
            <Glass style={[styles.back, pressed && styles.backPressed]} intensity={24}>
              <View style={styles.backInner}>
                <Text style={styles.backText}>‹ Recipes</Text>
              </View>
            </Glass>
          )}
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {recipe.title}
        </Text>
      </View>
      {recipe.fills ? (
        // Sized by `flex`, so it must not sit inside a scroll view — the
        // carousel would be handed an unbounded height and measure to nothing.
        <View style={styles.screen}>
          <Screen />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.page}>
          <Text style={styles.blurb}>{recipe.blurb}</Text>
          <Glass style={styles.stage}>
            <Screen />
          </Glass>
        </ScrollView>
      )}
    </View>
  );
};

/**
 * The example app.
 *
 * One screen at a time, held in state rather than by a router: the app exists
 * to put the carousel on a device, and a navigation library would be one more
 * thing between a swipe and the component under test.
 */
export const App = () => {
  const [open, setOpen] = useState<Recipe | null>(null);

  return (
    <SafeAreaProvider>
      <Backdrop>
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
          {open ? (
            <RecipeScreen recipe={open} onBack={() => setOpen(null)} />
          ) : (
            <Menu onOpen={setOpen} />
          )}
        </SafeAreaView>
      </Backdrop>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
};
