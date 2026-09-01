import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { palette } from './chrome';
import { type Recipe, recipes } from './recipes';

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.surface },
  safeArea: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: palette.track,
  },
  back: { paddingHorizontal: 8, paddingVertical: 4 },
  backText: { fontSize: 16, color: palette.accent },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '600', color: palette.ink },

  intro: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  introTitle: { fontSize: 24, fontWeight: '700', color: palette.ink },
  introText: { marginTop: 6, fontSize: 14, lineHeight: 20, color: palette.caption },

  row: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: palette.track,
  },
  rowPressed: { backgroundColor: palette.slideBg },
  rowTitle: { fontSize: 16, fontWeight: '600', color: palette.ink },
  rowBlurb: { marginTop: 3, fontSize: 13, lineHeight: 18, color: palette.caption },

  page: { paddingVertical: 20 },
  pageBlurb: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    fontSize: 13,
    lineHeight: 18,
    color: palette.caption,
  },
  fills: { flex: 1 },
});

/** The list of recipes. */
const Menu = ({ onOpen }: { onOpen: (recipe: Recipe) => void }) => (
  <ScrollView contentInsetAdjustmentBehavior="automatic">
    <View style={styles.intro}>
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
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      >
        <Text style={styles.rowTitle}>{recipe.title}</Text>
        <Text style={styles.rowBlurb}>{recipe.blurb}</Text>
      </Pressable>
    ))}
  </ScrollView>
);

/** One recipe, under a header that goes back to the menu. */
const RecipeScreen = ({ recipe, onBack }: { recipe: Recipe; onBack: () => void }) => {
  const { Screen } = recipe;

  return (
    <View style={styles.fills}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.back}>
          <Text style={styles.backText}>‹ Recipes</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {recipe.title}
        </Text>
      </View>
      {recipe.fills ? (
        // Sized by `flex`, so it must not sit inside a scroll view — the
        // carousel would be handed an unbounded height and measure to nothing.
        <Screen />
      ) : (
        <ScrollView contentContainerStyle={styles.page}>
          <Text style={styles.pageBlurb}>{recipe.blurb}</Text>
          <Screen />
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
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.root}>
          {open ? (
            <RecipeScreen recipe={open} onBack={() => setOpen(null)} />
          ) : (
            <Menu onOpen={setOpen} />
          )}
        </View>
        <StatusBar style="dark" />
      </SafeAreaView>
    </SafeAreaProvider>
  );
};
